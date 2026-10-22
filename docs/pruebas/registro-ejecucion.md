# Food Store — Registro de ejecución de pruebas

**Trabajo Práctico Integrador — Bases de Datos II**
**Integrantes:** Ricardo Casto y Macarena Larrosa.
**Ejecución de la aplicación, pruebas y backups:** Ricardo.
**Configuración de Atlas y documentación del modelo:** coordinada con Maca.
**Bases utilizadas:** `foodstore_tpi` (principal) y `foodstore_tpi_restore_test` (recuperación de prueba).

Este registro complementa el [plan de pruebas](plan-de-pruebas.md). Reúne resultados observados en salidas de consola, capturas y verificaciones realizadas durante el desarrollo de Food Store. Distingue pruebas ejecutadas, revisión del código, limitaciones y tareas pendientes.

Las primeras pruebas de aplicación corresponden al 18/10/2026; otras verificaciones funcionales y el primer respaldo se documentaron el 20/10/2026. La restauración, sus consultas de validación, los respaldos posteriores y la corrección de un dato de ejemplo se realizaron el 21/10/2026. Las fechas terminadas en `Z` corresponden a UTC y pueden diferir de la fecha local argentina.

## 1. Criterio utilizado

**Comprobado** significa que se observó el resultado para los datos y condiciones utilizados. No significa que se hayan ensayado todas las variantes de un caso. Cuando una evidencia solo cubre parte de una prueba se indica su alcance.

Se distingue entre operaciones realmente ejecutadas, comportamiento observado en las capturas y funcionalidades identificadas mediante revisión del código. La sola existencia de una función no implica que su prueba haya sido aprobada.

## 2. Aplicación y conexión

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| APP-01 | Inicio con `npm start`, navegación por los tres menús y salida con la opción 0 | Comprobado | [Menú principal](../capturas/aplicacion/APP-01-menu-principal.png), [navegación](../capturas/aplicacion/APP-01-navegacion-completa.png), [salida](../capturas/aplicacion/APP-01-salida-programa.png) |
| APP-02 | Una opción inválida muestra un mensaje y permite continuar | Comprobado | [Opción inválida](../capturas/aplicacion/APP-02-opcion-invalida.png) |
| APP-03 | La ausencia de URI genera un error controlado al intentar operar sobre la base | Comprobado | [Sin URI](../capturas/aplicacion/APP-03-sin-uri.png) |
| ATL-01 | Conexión real a MongoDB Atlas y lectura de clientes almacenados | Comprobado | [Clientes en Atlas](../capturas/aplicacion/APP-02-clientes-atlas.png) |
| ATL-02 | El usuario configurado permitió realizar consultas, inserciones y modificaciones ensayadas | Comprobado para esas operaciones | [Database Access](../capturas/atlas/database_access.png) y capturas CRUD de las secciones siguientes |

La configuración del entorno se documenta en las capturas del [clúster](../capturas/atlas/cluster_overview.png) y de [Network Access](../capturas/atlas/network_access.png). El acceso funcional no acredita por sí mismo el principio de privilegios mínimos.

## 3. Clientes

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| CLI-01 | Creación de cliente y persistencia | Comprobado | [Cliente persistido](../capturas/aplicacion/CLI-01-cliente-persistido.png) |
| CLI-02 | Consulta de cliente activo por ID | Comprobado | [Búsqueda](../capturas/aplicacion/CLI-02-busqueda-cliente.png) |
| CLI-03 | Modificación y lectura posterior de valores actualizados | Comprobado | [Cliente modificado](../capturas/aplicacion/CLI-03-cliente-modificado.png) |
| CLI-05 | Rechazo de correo ya registrado | Comprobado para el correo utilizado | [Correo duplicado](../capturas/aplicacion/CLI-05-email-duplicado.png) |
| CLI-08 | Baja lógica, exclusión del listado de activos y búsqueda posterior sin resultado | Comprobado | [Baja](../capturas/aplicacion/CLI-08-baja-cliente.png), [listado y búsqueda](../capturas/aplicacion/CLI-08-listado-tras-baja-y-busqueda.png) |
| CLI-09 | Rechazo de correo asociado a un cliente inactivo | Comprobado | [Correo de cliente inactivo](../capturas/aplicacion/CLI-09-email-cliente-inactivo.png) |

La captura del [índice único sobre email](../capturas/atlas/indice_email_unique.png) documenta su configuración. No se declaran probadas todas las combinaciones de mayúsculas, espacios ni formatos de correo.

## 4. Productos

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| PRO-01 | Creación de productos con categorías e importes válidos | Comprobado | [Productos creados](../capturas/aplicacion/PRO-01-productos-creados.png) |
| PRO-02 | Búsqueda de producto activo por ID | Comprobado | [Búsqueda](../capturas/aplicacion/PRO-02-busqueda-producto.png) |
| PRO-03 | Modificación de un producto | Comprobado | [Producto modificado](../capturas/aplicacion/PRO-03-producto-modificado.png) |
| PRO-04 | Rechazo de la categoría `limpieza` | Comprobado | [Categoría inválida](../capturas/aplicacion/PRO-04-categoria-invalida.png) |
| PRO-05 | Rechazo de precios cero, negativos y de tres decimales | Comprobado para los valores utilizados | [Precios inválidos](../capturas/aplicacion/PRO-05-precio-cero-negativo-tresdecimales.png) |
| PRO-06 | Aceptación de `1500,50` y representación como `1500.50` | Comprobado | [Coma decimal](../capturas/aplicacion/PRO-06-precio-coma.png) |
| PRO-07 | Cancelación de la baja, consulta de producto activo, confirmación posterior y búsqueda sin resultado | Comprobado | [Cancelación y confirmación](../capturas/aplicacion/PRO-07-baja-cancelada-confirmada-busqueda.png) |

## 5. Pedidos e historial

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| PED-01 | Creación de pedido con un producto | Comprobado | [Pedido de un producto](../capturas/aplicacion/PED-01-pedido-un-producto.png) |
| PED-02 | Creación y consulta de pedido con total ARS 3.251,25 | Comprobado | [Pedido y detalle](../capturas/aplicacion/PED-02-pedido-creado-detalle.png) |
| PED-08 | El pedido conserva nombre y precio originales después de modificar un producto | Comprobado | [Producto actualizado](../capturas/aplicacion/PED-08-producto-actualizado.png), [historial conservado](../capturas/aplicacion/PED-08-pedido-conserva-historial.png) |
| PED-09 | El detalle del pedido permanece consultable después de desactivar el producto relacionado | Comprobado para baja del producto | [Historial tras baja](../capturas/aplicacion/PED-09-historial-tras-baja-producto.png) |
| PED-10 | Cambio de estado de pendiente a entregado | Comprobado | [Pedido entregado](../capturas/aplicacion/PED-10-pedido-entregado.png) |
| PED-11 | Cambio de otro pedido de pendiente a cancelado | Comprobado por salida de consola compartida | Se observó `Estado actualizado a cancelado.`; también figura un estado cancelado en [PED-13](../capturas/aplicacion/PED-13-baja-logica-pedido.png) |
| PED-12 | Rechazo de nueva transición para un pedido que ya no está pendiente | Comprobado para el pedido utilizado | [Transición bloqueada](../capturas/aplicacion/PED-12-transicion-bloqueada.png) |
| PED-13 | Baja lógica persistida y exclusión del listado de activos desde la aplicación | **Comprobado**: `activo: false` en la base principal y cuatro pedidos activos visibles, sin el ID desactivado | [Baja de pedido](../capturas/aplicacion/PED-13-baja-logica-pedido.png), [listado tras baja](../capturas/aplicacion/PED-13-listado-tras-baja.png) y consulta de `mongosh` del 21/10/2026 |

En PED-02 se utilizaron dos unidades a ARS 1.250,50 y una a ARS 750,25. Los subtotales fueron ARS 2.501,00 y ARS 750,25, con total ARS 3.251,25.

**Comprobación posterior de PED-13 (21/10/2026):** una consulta con `mongosh` del pedido `6ad8177af44effa3cac4d7f5` mostró `activo: false` y `estado: cancelado` en `foodstore_tpi`; en `foodstore_tpi_restore_test` mostró `activo: true` y `estado: cancelado`. Por tanto, **se verificó que la baja lógica está persistida en la base principal**. La diferencia con la copia restaurada es compatible con un respaldo del estado anterior y no demuestra, por sí sola, un defecto del CRUD. No se determinó la hora exacta de la baja. En una verificación posterior con la aplicación conectada a la base principal, la opción **Listar pedidos activos** mostró cuatro registros y no incluyó ese ID. Con ello quedó comprobada también la exclusión desde el menú para el caso ensayado.

La prueba de conservación de historial tras baja se refiere a un producto, no a un cliente vinculado.

### 5.1. Corrección de un dato y control de cálculos (21/10/2026)

Se detectó un dato de ejemplo inconsistente en el pedido `6713dc03a1b2c3d4e5f60021`: el ítem Pizza Muzzarella tenía `precioUnitario: 1200.00`, `cantidad: 1` y `subtotal: 12000.00`. El precio del producto consultado en ambas bases era `12000.00`.

La corrección controlada cambió solamente `precioUnitario` a `12000.00`, primero en `foodstore_tpi_restore_test` y luego en `foodstore_tpi`. En cada base se informó `matchedCount: 1` y `modifiedCount: 1`. Se conservaron el subtotal de ARS 12.000,00 del ítem y el total de ARS 27.000,00 del pedido.

Una verificación posterior, de solo lectura, recorrió los cinco pedidos de `foodstore_tpi` y comparó cada subtotal con el producto de precio unitario por cantidad, y cada total con la suma de subtotales, mediante aritmética entera en centavos. Resultado: **5 pedidos correctos y 0 inconsistencias**. Esta comprobación cubre integridad aritmética de los importes, no todas las reglas posibles de negocio.

## 6. Respaldo con `mongodump`

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| BAK-01 | Sin URI, el script informó la falta de configuración y devolvió código 1 | Comprobado | [Error controlado](../capturas/backup/BAK-01-error-backup.png) |
| BAK-02 | `mongodump` respaldó la base y el script finalizó con código 0 | Comprobado | [Respaldo exitoso](../capturas/backup/BAK-02-respaldo-exitoso.png) |
| BAK-03 | Se generaron BSON y metadatos de las tres colecciones | Comprobado | [Archivos del respaldo](../capturas/backup/BAK-03-archivos-respaldo.png) |
| BAK-06 | Duración del respaldo inicial: 8,21 segundos | Comprobado para esa ejecución | Captura BAK-02 y `resultado_backup.txt` |
| BAK-07 | Script mejorado con carpetas por fecha y hora; nuevo respaldo de 18 documentos con código 0 | Comprobado por salida de consola | Registro local del 21/10/2026 a las 00:50:20 |
| BAK-08 | Nuevo respaldo posterior a la corrección de datos, con código 0 | Comprobado por salida de consola | Registro local del 21/10/2026 a las 01:22:18 |

**Respaldo inicial (20/10/2026):**

| Dato | Resultado |
| --- | --- |
| Base | `foodstore_tpi` |
| Destino | `resguardos_tpi/2026-10-20/` |
| Inicio | 22:48:24 |
| Fin | 22:48:33 |
| Duración registrada | 8,21 segundos |
| Clientes / productos / pedidos | 5 / 8 / 5 |
| Documentos totales | 18 |
| Archivos BSON | 3 |
| Archivos del respaldo de datos | 7 |
| Tamaño del respaldo de datos | 3.904 bytes (3,81 KB) |
| Código de salida | 0 |

**Respaldos posteriores (21/10/2026):**

| Inicio / carpeta | Duración | Resultado |
| --- | --- | --- |
| `00-50-20` | 1,93 segundos | 18 documentos; código 0 |
| `01-22-18` | 2,02 segundos | 18 documentos; código 0; posterior a la corrección del pedido |

El script actualizado organiza los backups en `resguardos_tpi/AAAA-MM-DD/HH-mm-ss/`, de modo que un nuevo respaldo del mismo día no sobrescribe el anterior. Los respaldos son manuales y no existe una tarea periódica configurada. El script no filtra por `activo`, por lo que solicita también documentos inactivos.

Los respaldos anteriores conservan el estado de los datos en el momento en que se generaron. El backup de las 01:22:18 se efectuó después de corregir la inconsistencia, pero **no se realizó una restauración independiente de esa última copia**.

## 7. Recuperación con `mongorestore` y validación funcional

| Caso | Resultado observado | Estado | Evidencia |
| --- | --- | --- | --- |
| BKP-02 | Restauración real del respaldo del 20/10 a `foodstore_tpi_restore_test`: 18 documentos, 0 fallidos, código 0 | Comprobado | [Restauración exitosa](../capturas/backup/BKP-02-restauracion-exitosa.png) |
| BKP-03 | Verificación mediante `mongosh`: 5 clientes, 8 productos, 5 pedidos e índice `email_1` con `unique: true` | Comprobado | [Verificación de datos](../capturas/backup/BKP-03-verificacion-datos-restaurados.png) |
| BKP-04 | Food Store, conectada temporalmente a la base restaurada, listó cuatro clientes activos | Comprobado | [Consulta de clientes](../capturas/backup/BKP-04-validacion-clientes.png) |
| BKP-05 | La aplicación listó seis productos activos | Comprobado | [Consulta de productos](../capturas/backup/BKP-05-validacion-productos.png) |
| BKP-06 | La aplicación listó cinco pedidos activos | Comprobado | [Consulta de pedidos](../capturas/backup/BKP-06-validacion-pedidos.png) |

**Datos de la restauración (21/10/2026):**

- **Respaldo de origen:** `resguardos_tpi/2026-10-20/foodstore_tpi/`.
- **Base de destino:** `foodstore_tpi_restore_test`, separada de la principal.
- **Simulación previa:** `mongorestore --dryRun` reconoció las tres colecciones y el cambio de namespace.
- **Ejecución real:** inició aproximadamente a las 00:06:38 y finalizó a las 00:06:41 (hora argentina).
- **Duración medida del comando:** **2,43 segundos**.
- **Resultados:** 5 clientes, 8 productos y 5 pedidos; **18 documentos restaurados, 0 fallidos**.
- **Metadatos:** se restauró el índice único `email_1` sobre `clientes.email`.
- **Consulta desde la aplicación:** ejecución temporal con `MONGODB_DB=foodstore_tpi_restore_test`, sin modificar `.env`. Se consultaron clientes, productos y pedidos.
- **Cierre:** la aplicación finalizó y la variable temporal se retiró del entorno de PowerShell.

La cantidad de documentos activos mostrados por la aplicación puede ser inferior al total restaurado, ya que los listados filtran por `activo: true`. Durante la validación se observaron cuatro clientes, seis productos y cinco pedidos activos.

### 7.1. Interpretación de RTO y RPO

Se propone un **RPO de 24 horas** y un **RTO de 60 minutos** como objetivos académicos.

Los **2,43 segundos** miden únicamente la ejecución de `mongorestore`; no representan el RTO integral. No se cronometraron conjuntamente la detección del incidente, selección del respaldo, configuración, restauración y comprobación final de funcionamiento. Por ello, **el RTO objetivo no se considera validado integralmente**.

El backup se ejecuta bajo demanda. Al no existir una tarea periódica verificada ni supervisión de fallos, **no se garantiza todavía el RPO de 24 horas**. El tiempo de generación del backup tampoco equivale al RTO.

## 8. Revisión del código y alcance de las evidencias

La revisión de sintaxis de los seis archivos JavaScript finalizó sin errores. La lectura del código mostró:

- Creación de documentos con `activo: true`.
- Consultas habituales y búsquedas por ID con filtro `activo: true`.
- Bajas lógicas mediante `updateOne`, sin eliminación física dentro de los módulos CRUD revisados.
- Referencias con `ObjectId`, fechas con `Date`, precios y totales con `Decimal128`, cantidades con `Int32`.
- Cálculos con `decimal.js` y conservación de nombre y precio unitario en los ítems embebidos del pedido.

Estas observaciones describen la implementación y las pruebas mencionadas; no acreditan ejecución de todos los casos límite ni sustituyen las verificaciones de datos. No existe una batería automatizada de pruebas incluida en el proyecto auditado.

## 9. SEG-01 — Empaquetado y datos de acceso

**Estado: pendiente de cierre del ZIP final.**

El archivo `.gitignore` excluye `.env`, `node_modules/` y `resguardos_tpi/` del seguimiento ordinario de Git. El ZIP de trabajo revisado durante la auditoría sí contenía `.env`, `.git/`, `node_modules/` y respaldos locales, porque comprimir una carpeta no aplica automáticamente las reglas de `.gitignore`.

Para la entrega se debe preparar un ZIP separado sin credenciales, respaldos privados, dependencias instaladas ni historial Git. Deben mantenerse `.env.example`, `package.json`, `package-lock.json`, código fuente y documentación pertinente. Si la cátedra precisa acceso a una base remota, sus credenciales deberán compartirse únicamente por un canal privado autorizado.

## 10. Cierre y pendientes

Se cuenta con evidencias de conexión a MongoDB Atlas, operaciones principales sobre clientes, productos y pedidos, manejo de bajas lógicas, conservación del historial, respaldos exitosos y restauración funcional de una copia independiente.

Se corrigió una inconsistencia de precio unitario en un pedido de ejemplo y se verificó la aritmética de los cinco pedidos de la base principal. Los respaldos del 20/10 y del 21/10 conservan sus resultados históricos sin mezclarse.

**Estado de entrega:** los resultados funcionales y la recuperacion estan documentados, y el [PDF final](../informe/informe.pdf) se encuentra preparado. Resta validar el ZIP limpio, coordinar la defensa oral y acordar el acceso privado para evaluacion. Los RTO/RPO siguen siendo objetivos propuestos, no garantias operativas.
