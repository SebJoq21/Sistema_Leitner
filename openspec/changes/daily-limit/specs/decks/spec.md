## MODIFIED Requirements

### Requirement: Meta diaria

El sistema SHALL almacenar `metaDiaria` como el límite diario opcional del mazo, con valores enteros entre 1 y 1000 o `null`. El límite SHALL contar tarjetas distintas repasadas hoy en la zona del usuario, SHALL aplicarse tanto a la cola como al repaso y SHALL reiniciarse a las 00:00 locales. `null` SHALL significar sin límite.

#### Scenario: Mazo con límite diario

- GIVEN un mazo con `metaDiaria = 10` y veinte tarjetas vencidas
- WHEN el usuario abre la sesión sin otros límites
- THEN la cola incluye como máximo diez tarjetas de ese mazo
- AND el repaso de una tarjeta adicional responde `409 DAILY_LIMIT_REACHED`

#### Scenario: Mazo sin límite diario

- GIVEN un mazo con `metaDiaria = null`
- WHEN se guarda el mazo
- THEN el campo queda vacío
- AND no se aplica ningún límite por mazo

#### Scenario: Límite ya consumido

- GIVEN un mazo con `metaDiaria = 5` y cinco tarjetas repasadas hoy
- WHEN el usuario abre la sesión
- THEN no se incluyen tarjetas de ese mazo
- AND las tarjetas de otros mazos siguen disponibles según el límite total

#### Scenario: Límite reducido por debajo de lo usado

- GIVEN un mazo con diez tarjetas repasadas hoy
- WHEN el usuario cambia `metaDiaria` a 5
- THEN el cupo restante es cero
- AND no se borran repasos ni se revierten cajas

#### Scenario: Activación de un valor existente

- GIVEN un mazo con `metaDiaria = 8` guardado antes de este change
- WHEN el usuario abre la sesión después del despliegue
- THEN el valor se aplica como límite diario
- AND la interfaz lo describe como “Límite diario del mazo”, no como “tarjetas nuevas”

#### Scenario: Valor inválido

- GIVEN una `metaDiaria` de 0, 1001 o un número decimal
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se guarda el mazo
