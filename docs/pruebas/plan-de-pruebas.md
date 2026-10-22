# Food Store — Plan de pruebas funcionales y de integración

**Trabajo Práctico Integrador — Bases de Datos II**

**Integrantes:** Ricardo Casto y Macarena Larrosa.

**Base principal:** `foodstore_tpi`.

**Base de recuperación de prueba:** `foodstore_tpi_restore_test`.


## 1. Objetivo y alcance

Comprobar el funcionamiento de la aplicación de consola Food Store conectada a MongoDB Atlas, incluyendo operaciones de creación, consulta, modificación y baja lógica de clientes, productos y pedidos; validaciones de negocio; conservación del detalle histórico de los pedidos; respaldo de datos con `mongodump`; y recuperación de una copia independiente mediante `mongorestore`.

El plan reúne los casos principales del TPI y conserva los identificadores utilizados en las capturas. Procede de un catálogo inicial más amplio de 41 casos; los saltos de numeración no significan necesariamente que existan obligaciones pendientes.

Este documento describe qué se pretende comprobar, el resultado esperado y el alcance de la evidencia disponible. Los resultados detallados, las fechas y las limitaciones se registran en el [registro de ejecución](registro-ejecucion.md). No se presenta una prueba como aprobada por el solo hecho de que una función exista en el código.

## 2. Criterios de evaluación

- **Comprobado:** existe evidencia de ejecución que respalda el resultado indicado, dentro de las condiciones ensayadas.
- **Parcial:** se observó parte del comportamiento, pero falta una comprobación específica o existe una diferencia que necesita aclararse.
- **No ejecutado:** no se dispone de una ejecución demostrada. No se registra como aprobado.
- **Revisión del código:** describe la implementación y complementa, pero no reemplaza, una prueba ejecutada contra Atlas.

Las pruebas de consulta se realizan sin alterar documentos. Las pruebas de modificación y baja lógica afectan únicamente los documentos de ensayo correspondientes. Los casos no ejecutados se mantienen como posibles pruebas complementarias, sin inventar resultados.

## 3. Entorno y preparación

- Aplicación Node.js iniciada con `npm start`, con módulos para clientes, productos y pedidos.
- Base `foodstore_tpi` en MongoDB Atlas y conexión mediante `MONGODB_URI` y `MONGODB_DB`, definidas en el archivo privado `.env`.
- Datos de ejemplo de clientes, productos y pedidos; identificadores de MongoDB preservados.
- Herramientas MongoDB Database Tools (`mongodump` y `mongorestore`) y consola `mongosh`.
- Capturas guardadas en `docs/capturas/aplicacion/`, `docs/capturas/atlas/` y `docs/capturas/backup/`.
- Base independiente `foodstore_tpi_restore_test` para comprobar la recuperación sin sobrescribir la base principal.

Para comprobar el cálculo de pedidos se utilizó un caso con dos unidades a ARS 1.250,50 y una unidad a ARS 750,25: subtotal ARS 2.501,00 más ARS 750,25, total esperado ARS 3.251,25.

Las bajas se realizan lógicamente mediante el campo `activo`. No se requiere eliminar físicamente documentos como parte de las pruebas.

## 4. Casos funcionales y de integración

| Área / casos | Resultado esperado | Estado y alcance de la evidencia |
| --- | --- | --- |
| Aplicación — APP-01 a APP-03 | Iniciar, navegar entre menús, salir y manejar una opción inválida o falta de URI | **Comprobado** para las situaciones mostradas en las capturas. |
| Conexión — ATL-01 y ATL-02 | Conectar a Atlas y ejecutar operaciones permitidas con el usuario configurado | **Comprobado** para conexión, consultas y operaciones CRUD ensayadas. No acredita privilegios mínimos. |
| Clientes — CLI-01 a CLI-03 | Crear, buscar por ID y modificar datos de un cliente | **Comprobado** con datos de prueba y consulta posterior. |
| Correo único — CLI-05 y CLI-09 | Rechazar correos duplicados, incluso asociados a clientes inactivos | **Comprobado** para los correos utilizados; no se ensayaron todas las variaciones posibles. |
| Baja de cliente — CLI-08 | Cambiar `activo` a `false` y excluirlo de listados y búsquedas de activos | **Comprobado** mediante baja, listado y búsqueda posterior. |
| Productos — PRO-01 a PRO-03 | Crear, buscar y modificar productos | **Comprobado** para los registros utilizados. |
| Validaciones — PRO-04 a PRO-06 | Rechazar categoría inválida y precios inválidos; admitir coma decimal | **Comprobado** para categoría `limpieza`, precios cero, negativos, con tres decimales y entrada `1500,50`. |
| Baja de producto — PRO-07 | Permitir cancelar o confirmar la baja; excluir el producto desactivado de consultas de activos | **Comprobado** con cancelación, confirmación y búsqueda posterior. |
| Pedidos — PED-01 y PED-02 | Crear y consultar pedidos con subtotales y total calculados correctamente | **Comprobado**, incluido el pedido de ARS 3.251,25. |
| Historial — PED-08 y PED-09 | Mantener en el pedido el nombre y precio históricos tras modificar o desactivar un producto | **Comprobado** para cambios y baja de producto; no se extiende a baja de cliente vinculado. |
| Estados — PED-10 a PED-12 | Cambiar de `pendiente` a `entregado` o `cancelado` y rechazar transiciones no admitidas | **Comprobado** para las transiciones y el bloqueo observados. |
| Baja de pedido — PED-13 | Desactivar el pedido, conservarlo en Atlas y omitirlo de consultas de activos | **Comprobado:** el pedido permanece en la base principal con `activo: false` y no figura entre los cuatro pedidos activos listados desde la aplicación. |
| Integridad de importes — INT-01 | Para cada ítem: precio unitario × cantidad = subtotal; suma de subtotales = total del pedido | **Comprobado** en la base principal el 21/10/2026: cinco pedidos revisados, cinco correctos y cero inconsistencias después de corregir un dato de ejemplo. |

El código utiliza `updateOne` con `$set` para bajas lógicas y filtra las consultas habituales por `activo: true`. La verificación de esas instrucciones es una observación de implementación; los resultados de ejecución están delimitados en la tabla.

### 4.1. Observación específica sobre PED-13

Una consulta de solo lectura del 21/10/2026 verificó el pedido `6ad8177af44effa3cac4d7f5` en ambas bases: en `foodstore_tpi` tiene `activo: false`, mientras que en `foodstore_tpi_restore_test` conserva `activo: true`. En las dos figura `estado: cancelado`. **La baja está persistida en la base principal**; la diferencia con la base restaurada es compatible con que el respaldo corresponda a un estado anterior. La consulta no permite establecer por sí sola el momento exacto de la baja.

El campo comercial `estado` es independiente de `activo`. Una prueba posterior con `npm start`, opción **Gestionar pedidos → Listar pedidos activos**, mostró cuatro pedidos y excluyó el ID `6ad8177af44effa3cac4d7f5`. Así se verificó la baja lógica de extremo a extremo para este caso.

### 4.2. Corrección de datos e integridad aritmética

Se encontró un dato de ejemplo inconsistente en el pedido terminado en `f60021`: Pizza Muzzarella tenía precio unitario ARS 1.200,00, cantidad 1 y subtotal ARS 12.000,00. El catálogo consultado mostraba ARS 12.000,00.

Se actualizó únicamente el precio unitario del ítem a ARS 12.000,00, primero en la base de recuperación y luego en la base principal. El subtotal del ítem y el total del pedido (ARS 27.000,00) se conservaron.

Posteriormente, una consulta de solo lectura analizó los cinco pedidos de `foodstore_tpi` usando cálculos exactos en centavos. Resultado: **cinco pedidos correctos y cero inconsistencias aritméticas**. Esta validación no equivale a comprobar todas las reglas de negocio ni todas las condiciones concurrentes.

## 5. Respaldo y recuperación

| Caso | Resultado esperado | Estado y evidencia |
| --- | --- | --- |
| BAK-01 | Informar error controlado ante la falta de `MONGODB_URI` | **Comprobado**: mensaje de error y código de salida 1. |
| BAK-02 | Ejecutar `mongodump` sobre Atlas y finalizar sin errores | **Comprobado**: respaldo inicial, código 0, tres BSON y 18 documentos. |
| BAK-03 | Generar BSON y metadatos de clientes, productos y pedidos | **Comprobado**: archivos encontrados en el respaldo. |
| BAK-06 | Registrar la duración del respaldo | **Comprobado**: 8,21 segundos en la primera ejecución. |
| BAK-07 | Crear respaldos separados por fecha y hora, sin sustituir el anterior | **Comprobado**: ejecución del 21/10/2026 a las 00:50:20, 1,93 segundos y código 0. |
| BAK-08 | Respaldar nuevamente la base después de la corrección del pedido | **Comprobado**: ejecución del 21/10/2026 a las 01:22:18, 2,02 segundos y código 0. |
| BKP-02 | Restaurar en una base independiente sin sobrescribir la original | **Comprobado**: 18 documentos, 0 fallidos, código 0; `mongorestore` duró 2,43 segundos. |
| BKP-03 | Verificar colecciones, cantidades e índice único | **Comprobado**: 5 clientes, 8 productos, 5 pedidos y `email_1` único. |
| BKP-04 a BKP-06 | Consultar clientes, productos y pedidos desde la aplicación conectada a la base restaurada | **Comprobado**: 4 clientes activos, 6 productos activos y 5 pedidos activos. |

### 5.1. Resultados de los respaldos

| Fecha y destino relativo | Duración | Resultado |
| --- | ---: | --- |
| 20/10/2026 — `resguardos_tpi/2026-10-20/` | 8,21 s | 18 documentos; 3 archivos BSON; código 0; tamaño de archivos de datos: 3.904 bytes (3,81 KB). |
| 21/10/2026 — `resguardos_tpi/2026-10-21/00-50-20/` | 1,93 s | 18 documentos; 3 archivos BSON; código 0. |
| 21/10/2026 — `resguardos_tpi/2026-10-21/01-22-18/` | 2,02 s | 18 documentos; 3 archivos BSON; código 0; posterior a la corrección del pedido. |

La versión mejorada de `scripts/backup.ps1` organiza las nuevas copias en `resguardos_tpi/AAAA-MM-DD/HH-mm-ss/`. El respaldo del 20/10 conserva su organización anterior. El script respalda la base sin filtrar por `activo`, por lo que incluye registros activos e inactivos.

### 5.2. Restauración y consultas de comprobación

La restauración real del 21/10/2026 utilizó la copia del 20/10/2026. Antes de ejecutarla se verificó con `mongorestore --dryRun` que los nombres de las tres colecciones se traducirían al namespace `foodstore_tpi_restore_test`.

Se recuperaron **18 documentos, sin fallos**, y se procesaron los metadatos del índice `email_1` de clientes. Con `mongosh` se comprobaron las cantidades y la unicidad del índice. A continuación se ejecutó Food Store apuntando temporalmente a la base recuperada, sin modificar `.env`, y se consultaron los tres módulos con éxito.

Los **2,43 segundos** corresponden exclusivamente a la duración medida del comando `mongorestore`, no al tiempo total de restablecimiento del servicio. La copia más reciente del 21/10/2026, generada tras corregir los datos, **todavía no fue restaurada de forma independiente**.

### 5.3. Objetivos RTO y RPO

- **RPO propuesto: 24 horas.** Es la pérdida máxima de información tolerable, expresada en tiempo. El script se ejecuta manualmente y no existe una tarea periódica supervisada, por lo que el objetivo no está garantizado.
- **RTO propuesto: 60 minutos.** Es la meta para recuperar el servicio completo. No se midió integralmente el proceso desde la detección del incidente hasta la recuperación del uso de la aplicación; por eso el objetivo sigue pendiente de validación completa.

El tiempo de generación de una copia y el tiempo de ejecución de `mongorestore` son mediciones útiles, pero ninguno equivale por sí solo al RTO integral. La consigna revisada requiere un script ejecutable y un informe RTO/RPO; no se identificó una obligación expresa de programar respaldos cada 24 horas.

Para ampliar el fundamento y las limitaciones, consultar el [informe RTO/RPO](../informe/rto-rpo.md).

## 6. Evidencias disponibles

Las capturas están organizadas en [Aplicación](../capturas/aplicacion/), [Atlas](../capturas/atlas/) y [Backup y recuperación](../capturas/backup/).

| Evidencia | Archivo |
| --- | --- |
| Menú principal | [APP-01](../capturas/aplicacion/APP-01-menu-principal.png) |
| Conexión y consulta de clientes en Atlas | [APP-02](../capturas/aplicacion/APP-02-clientes-atlas.png) |
| Modificación de cliente | [CLI-03](../capturas/aplicacion/CLI-03-cliente-modificado.png) |
| Baja y búsqueda posterior de cliente | [CLI-08](../capturas/aplicacion/CLI-08-listado-tras-baja-y-busqueda.png) |
| Correo de cliente inactivo | [CLI-09](../capturas/aplicacion/CLI-09-email-cliente-inactivo.png) |
| Baja de producto | [PRO-07](../capturas/aplicacion/PRO-07-baja-cancelada-confirmada-busqueda.png) |
| Pedido y cálculo del total | [PED-02](../capturas/aplicacion/PED-02-pedido-creado-detalle.png) |
| Conservación del historial | [PED-08](../capturas/aplicacion/PED-08-pedido-conserva-historial.png) |
| Historial tras baja de producto | [PED-09](../capturas/aplicacion/PED-09-historial-tras-baja-producto.png) |
| Pedido entregado | [PED-10](../capturas/aplicacion/PED-10-pedido-entregado.png) |
| Transición bloqueada | [PED-12](../capturas/aplicacion/PED-12-transicion-bloqueada.png) |
| Baja lógica de pedido (persistencia) | [PED-13](../capturas/aplicacion/PED-13-baja-logica-pedido.png) |
| Exclusión de pedido desactivado del listado de activos | [PED-13 listado](../capturas/aplicacion/PED-13-listado-tras-baja.png) |
| Respaldo exitoso | [BAK-02](../capturas/backup/BAK-02-respaldo-exitoso.png) |
| Archivos del respaldo | [BAK-03](../capturas/backup/BAK-03-archivos-respaldo.png) |
| Restauración de 18 documentos | [BKP-02](../capturas/backup/BKP-02-restauracion-exitosa.png) |
| Validación de cantidades e índice | [BKP-03](../capturas/backup/BKP-03-verificacion-datos-restaurados.png) |
| Consultas de clientes recuperados | [BKP-04](../capturas/backup/BKP-04-validacion-clientes.png) |
| Consultas de productos recuperados | [BKP-05](../capturas/backup/BKP-05-validacion-productos.png) |
| Consultas de pedidos recuperados | [BKP-06](../capturas/backup/BKP-06-validacion-pedidos.png) |

Las ejecuciones posteriores del backup y la verificación aritmética de los pedidos constan en salidas de consola y se registran en [Registro de ejecución](registro-ejecucion.md); no se afirma que exista una captura independiente para cada una de esas acciones.

## 7. Ensayos complementarios y límites

No se presenta el catálogo completo original de 41 casos como una batería íntegramente ejecutada. Entre las variantes sin comprobación específica permanecen cantidades fuera de rango, todas las combinaciones de referencias inválidas, concurrencia entre modificaciones de productos y creación de pedidos, y una nueva restauración de la copia posterior a la corrección.

Tampoco se verificó un RTO integral ni el cumplimiento sostenido del RPO, y no se incluye una suite automatizada de pruebas. Estas limitaciones no anulan los casos manuales que sí tienen resultados observados.

La comparación del caso PED-13 confirmó la persistencia de la baja en `foodstore_tpi`, y el listado posterior de cuatro pedidos activos desde la aplicación confirmó la exclusión del pedido desactivado. El valor `activo: true` en la base restaurada es compatible con el estado de la copia anterior; no se modificó ese respaldo histórico.

## 8. Cierre y preparación de la entrega

Las operaciones principales del sistema, el respaldo y la recuperación cuentan con evidencias de ejecución. Se confirmó una corrección de datos de ejemplo y se verificó la integridad aritmética de los cinco pedidos de la base principal.

El [informe final en PDF](../informe/informe.pdf) ya incorpora los resultados, las evidencias y anexos del proyecto.

Antes de la entrega integral resta:

1. Generar y validar un ZIP con codigo, scripts y documentacion, excluyendo `.env`, `node_modules/`, `.git/` y los respaldos privados.
2. Comprobar los entregables, coordinar el acceso para correccion por canal privado y preparar la defensa oral.

El ZIP de trabajo utilizado para la auditoría incluía archivos privados y dependencias instaladas; debe prepararse un paquete separado para la entrega. Las credenciales de acceso para corrección no deben publicarse en el repositorio ni incorporarse al ZIP compartido.
