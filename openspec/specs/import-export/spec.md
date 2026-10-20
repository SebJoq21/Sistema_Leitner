# import-export

## Propósito

Permite exportar el listado de tarjetas a CSV e importar tarjetas desde un archivo CSV, con validación por fila y sin imponer unicidad de contenido.

## Requirements

### Requirement: Exportación CSV

El sistema SHALL exportar a CSV las tarjetas actualmente visibles en la página de Tarjetas, incluyendo las columnas exactas `Pregunta`, `Respuesta`, `Pista`, `Notas`, `Tags` y `Caja`.

#### Scenario: Exportar una lista filtrada

- GIVEN una lista de tarjetas visible con filtros de mazo, caja o búsqueda
- WHEN el usuario pulsa “Exportar CSV”
- THEN el archivo contiene solo las tarjetas visibles
- AND la primera fila contiene las seis columnas en el orden indicado

#### Scenario: Exportar sin tarjetas visibles

- GIVEN un filtro que no devuelve tarjetas
- WHEN el usuario observa el botón de exportación
- THEN el botón está deshabilitado

#### Scenario: Contenido de una fila

- GIVEN una tarjeta con pista, notas, dos etiquetas y Caja 3
- WHEN se exporta
- THEN la fila incluye `Pista`, `Notas`, las etiquetas unidas por `|` y `3` en la columna `Caja`
- AND los campos vacíos se exportan como celdas vacías

#### Scenario: Nombre del archivo

- GIVEN una exportación con filtro de mazo
- WHEN se descarga el archivo
- THEN el nombre usa el nombre del mazo, reemplazando los caracteres no alfanuméricos por `_`
- AND si no hay mazo seleccionado, el nombre base es `tarjetas.csv`

### Requirement: Formato del archivo CSV

El sistema SHALL generar y aceptar CSV separado por comas, con soporte para comillas dobles, comillas escapadas, saltos de línea dentro de comillas, finales de línea `CRLF` o `LF` y BOM UTF-8.

#### Scenario: Exportar texto con comas y comillas

- GIVEN una tarjeta cuyo frente contiene una coma y una comilla doble
- WHEN se exporta
- THEN la celda se encierra entre comillas
- AND las comillas internas se duplican

#### Scenario: Importar un archivo con BOM

- GIVEN un archivo CSV con BOM UTF-8
- WHEN se analiza
- THEN el BOM se elimina antes de leer el encabezado
- AND la primera columna se reconoce correctamente

#### Scenario: Importar un archivo con CRLF

- GIVEN un archivo con finales de línea `\r\n`
- WHEN se analiza
- THEN las filas se separan correctamente
- AND no se generan celdas con `\r` residual

#### Scenario: Filas vacías

- GIVEN un archivo con líneas en blanco entre filas
- WHEN se analiza
- THEN las filas sin contenido se descartan

### Requirement: Importación desde CSV

El sistema SHALL importar tarjetas desde un archivo CSV, crear cada fila válida y omitir las filas que no cumplan las validaciones.

#### Scenario: Importación completa

- GIVEN un archivo con cinco filas válidas y un mazo de destino disponible
- WHEN el usuario importa el archivo
- THEN se crean cinco tarjetas
- AND se muestra un aviso con la cantidad importada

#### Scenario: Archivo vacío

- GIVEN un archivo sin filas de datos
- WHEN el usuario intenta importarlo
- THEN se muestra un error indicando que el archivo está vacío
- AND no se crea ninguna tarjeta

#### Scenario: Columnas obligatorias ausentes

- GIVEN un archivo sin columnas de pregunta o respuesta
- WHEN se analiza
- THEN se muestra un error indicando que faltan esas columnas
- AND no se procesa ninguna fila

#### Scenario: Importación parcial

- GIVEN un archivo con tres filas válidas y dos inválidas
- WHEN se importa
- THEN se crean las tres filas válidas
- AND se informa la cantidad de filas omitidas
- AND no se revierte lo ya importado

### Requirement: Validación por fila

El sistema SHALL validar cada fila de forma independiente: frente y reverso no vacíos, mazo de destino existente, caja entre 1 y 5 y campos opcionales dentro de los límites del DTO de tarjetas.

#### Scenario: Fila sin frente o sin reverso

- GIVEN una fila con la pregunta vacía o la respuesta vacía
- WHEN se procesa
- THEN la fila se omite
- AND se incrementa el contador de filas omitidas

#### Scenario: Caja fuera de rango

- GIVEN una fila con Caja `0` o `9`
- WHEN se procesa
- THEN la caja se ajusta a 1 o a 5 respectivamente
- AND la fila se importa con la caja ajustada

#### Scenario: Caja no numérica

- GIVEN una fila con Caja vacía o con texto no numérico
- WHEN se procesa
- THEN se usa la caja por defecto de la creación
- AND la fila puede importarse si el resto es válido

#### Scenario: Texto demasiado largo

- GIVEN una fila cuyo frente supera 2000 caracteres
- WHEN el backend rechaza la creación
- THEN la fila se omite
- AND no se muestra el detalle del error por fila

#### Scenario: Demasiadas etiquetas

- GIVEN una fila con más de 10 etiquetas o una etiqueta de más de 30 caracteres
- WHEN el backend rechaza la creación
- THEN la fila se omite
- AND las demás filas continúan procesándose

### Requirement: Mazos de destino

El sistema SHALL determinar el mazo de destino por la columna `Mazo` si existe, comparando el nombre sin distinguir mayúsculas, o por el mazo seleccionado en la interfaz si la columna no existe. Si no encuentra un mazo, SHALL omitir la fila.

#### Scenario: Mazo indicado por nombre

- GIVEN un archivo con una columna `Mazo` y una fila con el nombre de un mazo propio
- WHEN se importa
- THEN la tarjeta se crea en ese mazo

#### Scenario: Mazo indicado por nombre inexistente

- GIVEN una fila con un nombre de mazo que no existe o pertenece a otro usuario
- WHEN se importa
- THEN la fila se omite
- AND no se crea la tarjeta

#### Scenario: Sin columna de mazo

- GIVEN un archivo sin columna `Mazo` y un mazo seleccionado en la página
- WHEN se importa
- THEN todas las filas válidas se crean en el mazo seleccionado

#### Scenario: Sin mazo de destino

- GIVEN un archivo sin columna `Mazo` y sin mazo seleccionado
- WHEN se importa
- THEN todas las filas se omiten
- AND se muestra un aviso de que no se pudo importar ninguna tarjeta

### Requirement: Manejo de duplicados

El sistema SHALL permitir importar tarjetas cuyo frente ya existe. En el estado actual la importación no SHALL comparar contra tarjetas existentes ni contra otras filas del mismo archivo.

#### Scenario: Frente duplicado en el archivo

- GIVEN un archivo con dos filas con el mismo frente en el mismo mazo
- WHEN se importa
- THEN se crean las dos tarjetas
- AND no se advierte el duplicado

#### Scenario: Frente ya existente en el mazo

- GIVEN un mazo con una tarjeta cuyo frente aparece en el archivo
- WHEN se importa
- THEN se crea una segunda tarjeta con ese frente
- AND no se bloquea la importación

## Preguntas abiertas

- La importación no tiene transacción global ni rollback: si falla a mitad, las tarjetas anteriores quedan creadas.
- Los errores por fila se descartan con `catch {}`; el usuario solo ve un total de omitidas, no el motivo ni la fila.
- No se valida el tamaño del archivo, la codificación distinta de UTF-8 ni la presencia de celdas con más columnas que el encabezado.
- La exportación no incluye el nombre del mazo. Al reimportar, si no se agrega manualmente una columna `Mazo`, todo se crea en el mazo seleccionado.
- La exportación incluye la caja, pero la importación la usa como `cajaInicial`; la tarjeta importada queda vencida de inmediato aunque se cree en Caja 5.
- No se conservan `proximaRevision`, fechas de creación ni historial de repasos al exportar e importar.
- El encabezado se detecta si alguna celda coincide con una lista de nombres aceptados; si el archivo no tiene encabezado, se asume que las dos primeras columnas son frente y reverso.
- La columna `Mazo` no está documentada en la interfaz; solo funciona si el usuario la agrega manualmente.
- No hay vista previa ni confirmación antes de importar.
- Los duplicados no están cubiertos por una restricción de base de datos; el formulario de creación los bloquea solo en el cliente.

## Referencias de código

- `frontend/src/lib/csv.ts`
- `frontend/src/pages/Cards.tsx`
- `frontend/src/features/decks/CardForm.tsx`
- `frontend/src/lib/api.ts`
- `backend/src/modules/cards/card.dto.ts`
