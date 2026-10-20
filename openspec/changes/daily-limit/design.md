# Diseño: Aplicar un límite diario por mazo y total

## Decisiones

### 1. Dos límites opcionales

- `Deck.metaDiaria` (ya existe) es el límite diario del mazo. Rango `1..1000` o `null`.
- `UserSettings.limiteDiarioTotal` es el límite diario de todas las tarjetas del usuario. Rango `1..1000` o `null`.
- `null` significa sin límite. `0` no se usa; para pausar un mazo habría que agregar otro campo.
- Si ambos tienen valor, se aplica el más restrictivo en cada momento: una tarjeta consume un cupo del mazo y un cupo total.

El límite total es global, incluso si la sesión está filtrada por un mazo o una caja. Estudiar la Caja 3 de un mazo consume el mismo cupo total que estudiar la Caja 1 de otro.

### 2. Se cuentan tarjetas distintas, no respuestas

La unidad es “tarjeta distinta repasada hoy”. Se obtiene de `Review`:

1. Traer los repasos del usuario en una ventana de 48 horas alrededor de ahora.
2. Filtrar por `dayKeyInTimeZone(fechaRevision, timezone) === hoy`.
3. Agrupar por `cardId` en un `Set`.
4. Para el total, contar el `Set` completo.
5. Para un mazo, contar los `cardId` cuyo `card.deckId` actual es ese mazo.

Contar tarjetas distintas evita que un `Review` duplicado por una carrera consuma dos cupos. Con `guard-review-when-due` no debería haber duplicados, pero el conteo no depende de esa suposición.

La ventana de 48 horas cubre cualquier zona horaria y cualquier día con cambio de horario sin calcular rangos UTC complejos. Si el volumen crece, se puede reemplazar por un rango `[inicioDiaUtc, inicioDiaSiguienteUtc)` con un índice.

**Limitación conocida:** si una tarjeta se mueve de mazo después de haber sido repasada hoy, su cupo se atribuye al mazo actual, no al mazo en el que se repasó. Si se borra una tarjeta, sus `Review` se borran en cascada y el cupo se libera. Para corregirlo habría que guardar un `deckId` histórico en `Review`, fuera de este change.

### 3. La cola se recorta con los cupos restantes

Al construir la cola:

1. Calcular `usadasTotal` y `usadasPorMazo`.
2. Calcular `restantesTotal = limiteTotal - usadasTotal` y `restantesMazo = metaDiaria - usadasMazo`, con `null` si no hay límite.
3. Cargar las tarjetas vencidas ordenadas por `proximaRevision` ascendente.
4. Recorrerlas y tomar una tarjeta solo si su mazo tiene cupo y el total tiene cupo.
5. Descontar un cupo de ambos al tomarla.
6. Si el cupo total llega a cero, detenerse; si un mazo llega a cero, saltar sus tarjetas y seguir con los demás.

El orden por vencimiento es el mismo que ya usa la cola. No se hace round-robin: un mazo con tarjetas más antiguas puede consumir el cupo total antes que otro. Es determinista y prioriza lo más atrasado.

El recorte se aplica a `findDueByUser` y a la nueva consulta de cola. Un cliente que llame directo a `/cards/due` tampoco recibe más tarjetas de las permitidas, aunque el límite real se valida otra vez en el repaso.

### 4. El repaso se valida dentro de la transacción con un lock por usuario

El recorte de la cola es una optimización, no la garantía. Dos pestañas pueden cargar la misma cola antes de que una gaste el cupo. Por eso `reviewForUser` vuelve a contar dentro de la transacción:

1. Abrir la transacción.
2. Adquirir `pg_advisory_xact_lock(hashtextextended(userId, 0))`. Serializa los repasos de un mismo usuario entre peticiones e instancias.
3. Buscar la tarjeta y validar pertenencia y vencimiento, como en `guard-review-when-due`.
4. Contar las tarjetas distintas repasadas hoy con el mismo helper.
5. Si el mazo ya alcanzó `metaDiaria`, lanzar `409 DAILY_LIMIT_REACHED` con `scope = "deck"`.
6. Si el total ya alcanzó `limiteDiarioTotal`, lanzar `409 DAILY_LIMIT_REACHED` con `scope = "total"`.
7. Si hay cupo, actualizar la tarjeta, crear el `Review` y confirmar.

El lock es por usuario porque el límite total cruza mazos. Si solo se bloqueara por mazo, dos mazos podrían pasarse del total.

`hashtextextended` es una función de PostgreSQL 10+; el proyecto ya usa PostgreSQL. Si se quisiera evitar SQL específico, se podría usar una tabla de contadores con un `UPSERT` condicional, pero agrega escritura y mantenimiento.

### 5. Contrato de la cola

Se agrega `GET /api/v1/cards/study-queue` (antes de `/:id` en el router):

```json
{
  "cards": [],
  "limits": {
    "total": { "limite": 50, "usadas": 12, "restantes": 38 },
    "decks": [
      { "deckId": "…", "nombre": "Inglés", "limite": 10, "usadas": 3, "restantes": 7 }
    ]
  }
}
```

- `limite` y `restantes` son `null` cuando no hay límite.
- `usadas` siempre se calcula, aunque no haya límite, para que la interfaz pueda mostrar el consumo.
- `decks` incluye todos los mazos del usuario; si la consulta tiene `deckId`, se puede devolver solo ese mazo, pero el total sigue siendo global.
- `cards` ya viene recortado.
- `GET /api/v1/cards/due` se mantiene por compatibilidad y también devuelve la lista recortada, sin metadata.

El error de límite usa el mismo formato que el guard:

```json
{
  "error": "Límite diario alcanzado",
  "code": "DAILY_LIMIT_REACHED",
  "details": {
    "scope": "total",
    "limite": 50,
    "usadas": 50,
    "restantes": 0
  }
}
```

Se usa `409` porque la tarjeta está vencida pero el estado del usuario impide repasarla. `429` se reserva para rate limiting real.

### 6. Interfaz

- `DeckForm` cambia el label a “Límite diario del mazo” y el helper a “Máximo de tarjetas de este mazo por día; vacío = sin límite”. Deja de decir “nuevas”.
- El modal de intervalos de `Boxes.tsx` agrega “Límite diario total” con un input numérico opcional. `updateSettings` acepta `limiteDiarioTotal`.
- `StudySession` usa `api.studyQueue` y muestra “N restantes hoy” en el encabezado. Si hay filtro por mazo, puede mostrar el restante de ese mazo y el total.
- Si la cola está vacía:
  - con `restantesTotal === 0`, muestra “Límite diario alcanzado” y la hora del próximo reinicio local;
  - con el mazo filtrado sin cupo, muestra “Límite de este mazo alcanzado”;
  - en otro caso, muestra “Todo al día” como hoy.
- Si un repaso devuelve `409 DAILY_LIMIT_REACHED`:
  - se muestra un aviso;
  - si `scope = "deck"`, se quitan de la cola local las tarjetas de ese mazo;
  - si `scope = "total"`, se termina la sesión;
  - el intento no cuenta como acierto ni fallo en el resumen.
- El resumen no cambia de campos; simplemente puede tener menos respuestas porque la sesión se cortó por límite.

### 7. Zona horaria y reinicio

El “hoy” y el reinicio del límite usan la zona del usuario (`fix-timezone-scheduling`). A las 00:00 locales, `usadas` vuelve a cero. Si el usuario cambia de zona, el día cambia y el conteo puede reiniciarse o saltar; es el mismo comportamiento que las estadísticas.

### 8. Migración e índices

```sql
ALTER TABLE "user_settings"
  ADD COLUMN "limiteDiarioTotal" INTEGER;

CREATE INDEX "reviews_fechaRevision_idx"
  ON "reviews" ("fechaRevision");
```

No se modifica `Deck.metaDiaria`; los valores existentes pasan a aplicarse. Si un mazo tenía `metaDiaria = 10` solo como dato informativo, desde este change empieza a limitar. Hay que avisarlo en la release.

## Alternativas descartadas

- **Limitar solo la cola:** dos pestañas o un cliente directo pueden saltarse el límite.
- **Contar `Review` en lugar de tarjetas distintas:** un duplicado consume dos cupos y castiga al usuario.
- **Contar reintentos locales:** no crean `Review` y no representan una tarjeta nueva del día; además inflarían el límite sin cambiar la programación.
- **Un lock por mazo:** no protege el límite total.
- **Tabla de contadores diarios:** más eficiente para volúmenes altos, pero agrega escrituras, limpieza y consistencia con `Review`; no se justifica con el volumen actual.
- **`429 Too Many Requests`:** el límite no es una tasa por segundo; `409` describe mejor el conflicto con el estado diario.
- **Un límite global solamente:** no permite metas por mazo.
- **Un límite por mazo solamente:** no evita que veinte mazos sumen una sesión enorme.

## Riesgos

- **`metaDiaria` existente se activa:** usuarios que tenían un valor guardado verán un límite nuevo. Mitigación: comunicarlo y revisar los valores antes de desplegar.
- **Atribución al mover o borrar tarjetas:** el cupo sigue al mazo actual y se libera al borrar. Es una limitación aceptada; se puede resolver con un `Review.deckId` histórico.
- **Lock por usuario:** serializa los repasos de un usuario. Es aceptable porque un usuario no repasa en paralelo de forma legítima; si se vuelve cuello de botella, se puede migrar a contadores.
- **SQL específico de PostgreSQL:** `pg_advisory_xact_lock` y `hashtextextended` no existen en otros motores. El proyecto ya está fijado a PostgreSQL.
- **Ventana de 48 horas:** si el reloj o la zona están muy desfasados, el conteo podría quedar corto. Se puede reemplazar por rangos UTC exactos.
- **Confusión con el guard:** ambos responden `409`; el `code` distingue `CARD_NOT_DUE` de `DAILY_LIMIT_REACHED`.
- **Cola obsoleta:** una pestaña puede mostrar tarjetas que ya no tienen cupo. El backend las rechaza y la UI las quita.
- **Dependencia de zona horaria:** sin `fix-timezone-scheduling`, el límite se reinicia con el día del servidor y el problema de medianoche persiste.
- **Rendimiento:** cada cola y cada repaso cuenta repasos recientes; el índice de `fechaRevision` ayuda. Si crece, se debe agregar un contador agregado.

## Estrategia de pruebas

- **Conteo:** dos repasos de la misma tarjeta hoy cuentan una vez; dos tarjetas distintas cuentan dos.
- **Por mazo:** 3 tarjetas del mazo A y 2 del B; `usadas` de A es 3, de B es 2, total 5.
- **Retries locales:** no crean `Review` y no aumentan `usadas`.
- **Cola con límite por mazo:** mazo A con meta 2 y 5 vencidas; la cola incluye 2 de A y las de B según el total.
- **Cola con límite total:** 3 mazos con 10 vencidas cada uno y total 12; la cola incluye 12 respetando el orden por vencimiento.
- **Límite nulo:** sin meta ni total, la cola incluye todas las vencidas, igual que antes.
- **Filtro por mazo o caja:** el total sigue contando todos los repasos del día, no solo los del filtro.
- **Medianoche local:** a las 23:59 el cupo está agotado; a las 00:01 se reinicia en Lima.
- **Repaso que excede el límite:** responde `409 DAILY_LIMIT_REACHED`, no crea `Review` ni mueve la caja.
- **Concurrencia:** dos repasos simultáneos con un cupo restante; uno pasa y el otro recibe `409`; el total no se excede.
- **Configuración:** `limiteDiarioTotal` acepta `null` y `1..1000`; rechaza `0`, negativos y decimales.
- **UI:** cola vacía por límite muestra “Límite diario alcanzado”, no “Todo al día”; un `409` de alcance total termina la sesión.
- **Regresión:** con ambos límites en `null`, la cola y el repaso se comportan como antes.

## Preguntas abiertas

- ¿El límite debe contar tarjetas distintas o respuestas? La propuesta es tarjetas distintas.
- ¿Un reintento local debe consumir cupo? La propuesta es no, porque no crea `Review`.
- ¿El límite debe contar tarjetas falladas? La propuesta es sí: cualquier repaso original consume cupo.
- ¿Qué pasa si se baja el límite por debajo de lo ya usado? `restantes = 0`; no se borran repasos ni se revierten cajas.
- ¿Borrar una tarjeta debe liberar su cupo? Con la cascada actual, sí. Si se quiere conservar el consumo, hace falta un histórico.
- ¿Mover una tarjeta debe conservar el cupo en el mazo original? Hoy no; se atribuye al mazo actual.
- ¿Se debe poder configurar el límite total desde una pantalla de ajustes dedicada? La propuesta es reutilizar el modal de `Boxes.tsx`.
- ¿`409` o `429` para el límite? La propuesta es `409`.
- ¿La cola debe ser round-robin entre mazos para no favorecer a los más atrasados? La propuesta es orden por vencimiento.
- ¿El límite total debe ser por usuario o por dispositivo? Por usuario, en `UserSettings`.
