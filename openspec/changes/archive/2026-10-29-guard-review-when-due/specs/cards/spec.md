## MODIFIED Requirements

### Requirement: Aislamiento en tarjetas ajenas

El sistema SHALL tratar cualquier tarjeta o mazo ajeno como no accesible: no SHALL devolver, modificar, borrar ni repasar datos de otro usuario. El repaso de una tarjeta ajena o inexistente SHALL responder `404` sin crear un `Review`; las demás operaciones SHALL fallar sin modificar la tarjeta ajena.

#### Scenario: Actualizar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta actualizarla
- THEN la operación falla
- AND la tarjeta ajena no se modifica
- AND no se devuelven sus datos

#### Scenario: Borrar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta borrarla
- THEN la operación falla
- AND la tarjeta ajena sigue existiendo

#### Scenario: Repasar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta repasarla
- THEN el backend responde `404`
- AND no se crea un `Review` para esa tarjeta
- AND no se revela si la tarjeta existe

#### Scenario: Repasar una tarjeta inexistente

- GIVEN un identificador de tarjeta que no existe
- WHEN el usuario autenticado intenta repasarla
- THEN el backend responde `404`
- AND no se crea un `Review`

#### Scenario: Aislamiento en la cola

- GIVEN tarjetas de dos usuarios
- WHEN uno abre su cola de estudio
- THEN la cola solo contiene tarjetas de mazos propios
- AND no se incluyen tarjetas del otro usuario
