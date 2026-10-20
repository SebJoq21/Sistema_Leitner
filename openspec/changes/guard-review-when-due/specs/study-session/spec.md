## MODIFIED Requirements

### Requirement: Persistencia del repaso y avance

El sistema SHALL enviar cada respuesta al backend antes de avanzar a la siguiente tarjeta. Si el backend indica que la tarjeta ya no está pendiente (`409`) o que ya no existe (`404`), SHALL mostrar un aviso, quitarla de la cola local y avanzar. Si el envío falla por red o por un error del servidor, SHALL mostrar un error y SHALL mantener al usuario en la tarjeta actual.

#### Scenario: Repaso guardado

- GIVEN una tarjeta visible y el backend disponible
- WHEN el usuario marca un resultado
- THEN se envía `POST /api/v1/cards/:id/review` con `{ acierto }`
- AND se muestra un aviso con el resultado
- AND se avanza a la siguiente tarjeta

#### Scenario: Tarjeta que ya no está pendiente

- GIVEN una tarjeta visible que fue reprogramada desde otra pestaña
- WHEN el backend responde `409` con `code = CARD_NOT_DUE`
- THEN se muestra el aviso “Esta tarjeta ya no está pendiente”
- AND la tarjeta se quita de la cola local
- AND se avanza a la siguiente tarjeta
- AND no se reintenta el repaso

#### Scenario: Tarjeta que ya no existe

- GIVEN una tarjeta visible que fue borrada desde otra pestaña
- WHEN el backend responde `404`
- THEN se muestra el aviso “La tarjeta ya no existe”
- AND la tarjeta se quita de la cola local
- AND se avanza a la siguiente tarjeta

#### Scenario: Error de red o del servidor

- GIVEN una tarjeta visible y el backend no disponible o respondiendo `500`
- WHEN el usuario marca un resultado
- THEN se muestra un aviso de error
- AND la tarjeta actual no cambia
- AND no se avanza a la siguiente tarjeta

#### Scenario: Envío en curso

- GIVEN un repaso en proceso de envío
- WHEN el usuario intenta marcar otro resultado
- THEN el segundo intento se ignora mientras el primero sigue en curso

#### Scenario: Última tarjeta rechazada por no estar pendiente

- GIVEN una sesión con una sola tarjeta que ya fue reprogramada
- WHEN el usuario marca un resultado y el backend responde `409`
- THEN se muestra el aviso
- AND se pasa al resumen de la sesión
- AND el resumen no cuenta ese intento como acierto ni como fallo
