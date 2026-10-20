# Reencolar tarjetas falladas dentro de la sesión

## Por qué

La cola de estudio es fija: cuando una tarjeta falla, se envía el repaso, vuelve a Caja 1 y desaparece de la sesión hasta el día siguiente (`frontend/src/features/study/StudySessionView.tsx:30`). El usuario no puede volver a intentarla en el mismo momento, aunque el fallo haya sido un lapsus.

La única acción parecida es “Repasar de nuevo” (`StudySessionView.tsx:176`), que reinicia **toda** la cola y vuelve a llamar a `/review` para cada tarjeta. Eso tiene dos problemas:

- Duplica repasos y hace avanzar cajas que ya fueron programadas.
- Con `guard-review-when-due`, las tarjetas ya no están vencidas y el backend las rechaza con `409`.

Se necesita un reintento acotado, explícito y sin efectos secundarios sobre la programación ni el historial.

## Qué cambia

- Cuando un repaso falla y el backend lo confirma, la tarjeta se agrega al **final de la cola local** como reintento.
- El reintento SHALL ser una repetición de práctica: no SHALL llamar a `/review`, no SHALL crear un `Review`, no SHALL cambiar la caja ni `proximaRevision`.
- Cada tarjeta SHALL poder reintentarse como máximo una vez por sesión. Si el reintento también falla, no se vuelve a encolar.
- El reintento SHALL mostrar una marca visual de “Reintento” para que el usuario sepa que no está moviendo la tarjeta.
- El resumen SHALL distinguir los intentos originales de los reintentos y SHALL mostrar cuántos reintentos hubo.
- La acción “Repasar de nuevo” se reemplaza por “Repasar falladas”, que reutiliza solo los reintentos locales de la sesión y tampoco llama al backend.
- Si el usuario actualiza la página o cambia de filtro, los reintentos locales se pierden; el repaso original ya quedó guardado.
- Un `409` o un `404` al repasar la tarjeta original no genera reintento, porque la tarjeta ya no está disponible o ya no existe.

## Impacto

- **Specs afectados:** `study-session` (nuevo requirement de reintento, cola, resumen y repetición manual). No cambia `leitner-scheduling` porque el reintento no toca el motor.
- **Código afectado:** `frontend/src/features/study/StudySessionView.tsx`, `frontend/src/features/study/Flashcard.tsx` si muestra la marca, y los tipos de la cola local. No hay cambios de backend, esquema ni migración.
- **Dependencia:** se apoya en `guard-review-when-due` para no reenviar tarjetas ya programadas. Si el guard no existe, el reintento sigue siendo local y no duplica `Review`, pero el backend permitiría otros abusos.
- **Compatibilidad:** “Repasar de nuevo” desaparece de la interfaz. Si algún usuario dependía de reiniciar toda la cola, pierde esa acción; se puede recuperar recargando la sesión, que trae solo las vencidas.

## Fuera de alcance

- Crear un modelo de sesión persistente en el backend.
- Guardar los reintentos en `Review` o en una tabla nueva.
- Cambiar la programación de la tarjeta según el resultado del reintento.
- Repetición ilimitada o modo de práctica libre.
- Repaso offline.
- Cambiar el algoritmo de cajas.
