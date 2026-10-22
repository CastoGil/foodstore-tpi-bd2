# Food Store — Guía técnica de integración y evidencias

**Trabajo Práctico Integrador — Bases de Datos II**

**Integrantes:** Ricardo Casto y Macarena Larrosa.

**Estado:** integracion funcional, respaldo, restauracion de prueba e informe final en PDF completados; ZIP y defensa oral pendientes de cierre.

Esta guía complementa el [README](../../README.md), el documento [Aplicación y respaldo](aplicacion-y-respaldo.md), el [informe RTO/RPO](rto-rpo.md), el [modelo NoSQL](../modelo/modelo.md) y los documentos de [planificación](../pruebas/plan-de-pruebas.md) y [ejecución de pruebas](../pruebas/registro-ejecucion.md). No reemplaza las evidencias ni el informe final.

## 1. Propósito y alcance

Food Store es una aplicación de consola desarrollada con Node.js que administra **clientes**, **productos** y **pedidos** sobre la base de datos `foodstore_tpi`, alojada en MongoDB Atlas. Su propósito académico es demostrar el modelado NoSQL, la persistencia en la nube, las operaciones CRUD mediante código, el uso de relaciones por referencia y documentos embebidos, la baja lógica y un mecanismo reproducible de respaldo.

El proyecto no implementa pagos, facturación, envíos ni descuento automático de stock. No requiere una arquitectura de frontend para demostrar el flujo pedido en esta consigna.

Las pruebas de conexión, CRUD, validaciones principales, respaldo y recuperación **ya se realizaron**. Su alcance concreto se describe en el [registro de ejecución](../pruebas/registro-ejecucion.md); no significa que se hayan ejecutado todos los casos o variantes imaginables.

## 2. Arquitectura implementada

| Componente | Archivo | Responsabilidad |
| --- | --- | --- |
| Menú principal | `src/app.js` | Permite acceder a los tres módulos y cerrar la aplicación. |
| Conexión compartida | `src/config/conexion.js` | Lee el entorno, crea `MongoClient`, realiza `ping`, reutiliza y cierra la conexión. |
| Entrada por consola | `src/consola/entrada.js` | Solicita y procesa la entrada mediante `readline/promises`. |
| Clientes | `src/operaciones/clientes.js` | CRUD, validaciones, índice de correo y baja lógica. |
| Productos | `src/operaciones/productos.js` | CRUD, categorías, precios y baja lógica. |
| Pedidos | `src/operaciones/pedidos.js` | Referencias, detalle embebido, cálculos, estados y baja lógica. |
| Respaldo | `scripts/backup.ps1` | Ejecuta `mongodump`, valida la salida y registra resultados. |

**Tecnologías y dependencias principales:** Node.js, `mongodb` (driver nativo), `dotenv`, `decimal.js`, PowerShell y MongoDB Database Tools. La instalación de dependencias se realiza mediante `npm ci` y la aplicación se inicia con `npm start`.

### Comunicación cliente-servidor

El usuario selecciona una acción en la consola. Node.js valida la entrada y, mediante el driver de MongoDB, envía una consulta o escritura al clúster de Atlas. Atlas procesa la operación y devuelve documentos o información sobre la escritura. La aplicación espera el resultado utilizando `async` y `await` y lo presenta en consola.

Se utilizan `insertOne` para altas, `find` y `findOne` para consultas, y `updateOne` con `$set` para modificaciones y bajas lógicas. La conexión se establece cuando una operación la requiere; ingresar al menú principal sin consultar datos **no demuestra** por sí solo conectividad con Atlas.

## 3. Modelo NoSQL y reglas de negocio

| Colección | Campos principales |
| --- | --- |
| `clientes` | `_id`, `nombre`, `email`, `telefono`, `activo` |
| `productos` | `_id`, `nombre`, `categoria`, `precio`, `activo` |
| `pedidos` | `_id`, `clienteId`, `fecha`, `items`, `total`, `estado`, `activo` |
| `pedidos.items[]` | `productoId`, `nombreProducto`, `precioUnitario`, `cantidad`, `subtotal` |

Se utilizan identificadores y referencias `ObjectId`, fechas `Date`, precios y totales `Decimal128`, cantidades `Int32` y valores booleanos en `activo`.

**Linking:** `pedidos.clienteId` referencia un cliente y cada `items.productoId` referencia un producto. Las colecciones de clientes y productos tienen ciclos de vida independientes y pueden ser referenciadas desde distintos pedidos. La aplicación verifica la existencia y condición activa al registrar pedidos; MongoDB no impone claves foráneas relacionales.

**Embedding:** el arreglo `items` pertenece al documento `pedidos`. Guarda el nombre, precio unitario, cantidad y subtotal de cada artículo en el momento de la compra, preservando el detalle histórico aunque posteriormente se modifique o desactive el producto.

**Baja lógica:** los documentos nuevos tienen `activo: true`; desactivar cambia ese valor a `false`, sin eliminar el documento. Los listados y búsquedas habituales excluyen los registros inactivos. `estado: cancelado` es un estado comercial del pedido y **no** equivale a `activo: false`.

**Validaciones implementadas:** campos obligatorios, correo electrónico y unicidad incluso entre clientes inactivos, identificadores válidos, categorías `comidas`/`bebidas`/`postres`, precios positivos con hasta dos decimales, cantidades enteras positivas en el rango de `Int32`, referencias activas y transiciones de `pendiente` a `entregado` o `cancelado`. Los importes se calculan con `decimal.js` antes de almacenarse como `Decimal128`.

La revisión del código respalda estas decisiones. Las pruebas ejecutadas cubren ejemplos específicos de ellas; no se sostiene que todas las variaciones posibles estén verificadas ni que las escrituras entre colecciones formen una transacción conjunta.

## 4. Configuración e inicio con MongoDB Atlas

**Infraestructura:** se configuró un clúster de Atlas, acceso de usuario a la base, acceso de red, las tres colecciones y el índice único `email_1` en `clientes`. Las capturas correspondientes están en [Atlas](../capturas/atlas/). Las conexiones y operaciones ejecutadas demuestran acceso funcional, pero no constituyen una auditoría de permisos mínimos.

**Aplicación:** desde la raíz del proyecto, con Node.js y npm disponibles:

```powershell
npm ci
```

Si todavía no existe `.env`, copiar la plantilla y completar localmente las variables:

```powershell
Copy-Item .env.example .env
```

```dotenv
MONGODB_URI=<cadena-privada-de-conexion>
MONGODB_DB=foodstore_tpi
```

Iniciar la aplicación:

```powershell
npm start
```

Al ejecutar la primera consulta u operación, una conexión correcta muestra `Conexión con MongoDB establecida.`. Al elegir salir, el programa cierra la conexión y la consola.

**Protección de datos:** mantener `.env`, contraseñas, cadenas de conexión y respaldos locales fuera del repositorio público y del ZIP de entrega. El archivo `.gitignore` excluye `.env` y `resguardos_tpi/`, pero **no** elimina esos archivos de un ZIP creado manualmente. Entregar credenciales para corrección solo mediante el canal privado indicado por la cátedra.

## 5. Validación funcional y evidencias

El [plan de pruebas](../pruebas/plan-de-pruebas.md) define los casos principales y el [registro de ejecución](../pruebas/registro-ejecucion.md) diferencia resultados **comprobados**, **parciales** y **no ejecutados**. Las siguientes pruebas tienen evidencia de ejecución en el alcance señalado:

| Área | Casos y resultado observado |
| --- | --- |
| Inicio, menús y errores | APP-01 a APP-03: navegación, salida, opción inválida y falta de URI. |
| Conexión a Atlas | ATL-01 y ATL-02: consultas y operaciones con persistencia. |
| Clientes | CLI-01 a CLI-03, CLI-05, CLI-08 y CLI-09: altas, búsquedas, modificación, correo duplicado y baja lógica. |
| Productos | PRO-01 a PRO-07: altas, consultas, modificación, validaciones de categoría/precio y baja lógica. |
| Pedidos | PED-01, PED-02 y PED-08 a PED-13: creación, cálculos, conservación de historial, estados, bloqueo de transición y baja lógica. |
| Integridad aritmética | INT-01: los cinco pedidos de la base principal verificaron sus subtotales y totales, sin inconsistencias, tras corregir un dato de ejemplo. |
| Respaldo | BAK-01 a BAK-03 y ejecuciones posteriores: error controlado, generación de BSON y respaldos exitosos. |
| Recuperación | BKP-02 a BKP-06: restauración de 18 documentos, verificación de índice y consultas desde los tres módulos contra la copia recuperada. |

Las pruebas están documentadas con salidas de consola y capturas. No existe una suite automatizada de pruebas que cubra íntegramente todas las validaciones, combinaciones de entradas o escenarios de concurrencia.

### Evidencia particular de baja lógica de pedidos (PED-13)

Se comprobó mediante `mongosh` que el pedido `6ad8177af44effa3cac4d7f5` tiene `activo: false` y `estado: cancelado` en la base principal `foodstore_tpi`. En `foodstore_tpi_restore_test`, ese mismo pedido aparece con `activo: true` y estado `cancelado`, situación compatible con el estado anterior preservado por el respaldo usado para restaurar.

La posterior opción **Listar pedidos activos** de la aplicación, conectada a la base principal, mostró **cuatro pedidos activos** y excluyó el pedido desactivado. La baja lógica y su efecto sobre esa consulta quedaron comprobados. Evidencias: [baja](../capturas/aplicacion/PED-13-baja-logica-pedido.png) y [listado posterior](../capturas/aplicacion/PED-13-listado-tras-baja.png).

### Corrección del dato de Pizza Muzzarella

En un pedido de ejemplo se detectó un ítem con precio unitario ARS 1.200,00, cantidad 1 y subtotal ARS 12.000,00. Tras contrastarlo con el producto del catálogo, se corrigió **solo el precio unitario** a ARS 12.000,00, primero en la base de pruebas y luego en la principal. El subtotal de ese ítem y el total del pedido de ARS 27.000,00 no cambiaron.

Una consulta posterior analizó los cinco pedidos de la base principal y verificó, mediante operaciones exactas en centavos, `precioUnitario × cantidad = subtotal` y `suma de subtotales = total`. Resultado: **5 pedidos correctos, 0 inconsistencias aritméticas**. Esto no constituye una prueba de todas las reglas de negocio.

## 6. Respaldo con `mongodump`

Desde la raíz del proyecto y con MongoDB Database Tools disponible en `PATH`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

El script lee `.env`, utiliza rutas relativas a su ubicación, valida la disponibilidad de `mongodump`, ejecuta el respaldo completo de `foodstore_tpi` sin filtrar por `activo`, comprueba el código de salida y la generación de archivos BSON, y escribe `resultado_backup.txt` sin credenciales.

La versión mejorada guarda cada ejecución en una carpeta independiente:

```text
resguardos_tpi/
  AAAA-MM-DD/
    HH-mm-ss/
      foodstore_tpi/
        clientes.bson
        pedidos.bson
        productos.bson
        ... metadatos ...
      resultado_backup.txt
```

La copia del 20/10/2026 conserva el formato anterior, con una carpeta por día. No se modificaron ni sobrescribieron los respaldos previos.

| Fecha y hora de ejecución | Documentos respaldados | Archivos BSON | Duración | Código de salida |
| --- | ---: | ---: | ---: | ---: |
| 20/10/2026, 22:48 | 18 | 3 | **8,21 s** | 0 |
| 21/10/2026, 00:50 | 18 | 3 | **1,93 s** | 0 |
| 21/10/2026, 01:22 | 18 | 3 | **2,02 s** | 0 |

En todas estas ejecuciones se informaron 5 clientes, 8 productos y 5 pedidos. El primer respaldo ocupó **3.904 bytes (3,81 KB)** en sus siete archivos internos de datos y metadatos, sin contar `resultado_backup.txt`. El último se generó después de la corrección del dato de Pizza Muzzarella.

Evidencias: [ejecución del backup](../capturas/backup/BAK-02-respaldo-exitoso.png) y [archivos generados](../capturas/backup/BAK-03-archivos-respaldo.png). Las duraciones posteriores provienen de los registros de consola y del propio script; no se afirma que existan capturas independientes para cada una.

## 7. Restauración efectuada y objetivos de recuperación

### Restauración de prueba

El 21/10/2026 se utilizó el respaldo del **20/10/2026** para una recuperación real mediante `mongorestore` en la base independiente `foodstore_tpi_restore_test`. Antes se ejecutó un `--dryRun` y se verificó el remapeo de namespaces mediante `--nsFrom`/`--nsTo`, sin sobrescribir la base principal.

Resultados observados:

| Comprobación | Resultado |
| --- | --- |
| Documentos restaurados | **18** (5 clientes, 8 productos, 5 pedidos) |
| Documentos fallidos | **0** |
| Código de salida de `mongorestore` | **0** |
| Tiempo de ejecución de `mongorestore` | **2,43 segundos** |
| Índice `clientes.email_1` único | Restaurado y comprobado |
| Consultas desde Food Store a la base restaurada | 4 clientes activos, 6 productos activos y 5 pedidos activos, en ese momento |

La conexión temporal a `foodstore_tpi_restore_test` se realizó sin modificar permanentemente `.env`. Se verificaron las colecciones e índice con `mongosh` y luego se consultaron las tres colecciones desde los menús de la aplicación. Evidencias: [restauración](../capturas/backup/BKP-02-restauracion-exitosa.png), [verificación de BSON e índice](../capturas/backup/BKP-03-verificacion-datos-restaurados.png), [clientes](../capturas/backup/BKP-04-validacion-clientes.png), [productos](../capturas/backup/BKP-05-validacion-productos.png) y [pedidos](../capturas/backup/BKP-06-validacion-pedidos.png).

La copia generada **el 21/10/2026 a las 01:22**, posterior a la corrección del pedido, todavía no fue restaurada en una prueba independiente. Su ejecución de backup fue exitosa, pero no equivale a validar su recuperación.

### RTO y RPO

- **RPO propuesto: 24 horas.** Corresponde a la pérdida máxima de información tolerable, expresada en tiempo. El respaldo se ejecuta actualmente **bajo demanda**, sin una tarea periódica supervisada; por eso ese objetivo **no está garantizado**.
- **RTO propuesto: 60 minutos.** Es la meta de recuperación completa del servicio. No se cronometró integralmente el tiempo desde la detección del incidente hasta el restablecimiento del uso de la aplicación; el objetivo sigue pendiente de una validación integral.

La duración del backup (8,21 s, 1,93 s o 2,02 s) y el tiempo de `mongorestore` (2,43 s) **son mediciones de etapas distintas y no equivalen al RTO completo**. Para más detalles consultar [RTO/RPO](rto-rpo.md).

## 8. Organización de las evidencias

| Categoría | Carpeta | Ejemplos |
| --- | --- | --- |
| Aplicación y CRUD | [Aplicación](../capturas/aplicacion/) | `CLI-03-cliente-modificado.png`, `PRO-07-baja-cancelada-confirmada-busqueda.png`, `PED-13-listado-tras-baja.png` |
| Infraestructura, datos e índices | [Atlas](../capturas/atlas/) | `cluster_overview.png`, `database_access.png`, `indice_email_unique.png` |
| Respaldo y recuperación | [Backup](../capturas/backup/) | `BAK-02-respaldo-exitoso.png`, `BKP-02-restauracion-exitosa.png`, `BKP-03-verificacion-datos-restaurados.png` |

El nombre de cada captura se mantiene alineado con su identificador en el registro de pruebas. La secuencia `BAK` corresponde a las pruebas del respaldo; `BKP`, a las evidencias posteriores de restauración y recuperación. Se conservan ambas convenciones sin renombrar los archivos existentes.

Al seleccionar capturas para el informe se debe comprobar que sean legibles, que respalden la conclusión indicada y que no expongan credenciales ni datos personales reales. Las capturas históricas pueden mostrar cantidades de documentos diferentes si corresponden a momentos distintos del proyecto; se debe aclarar la fecha cuando sea necesario.

## 9. Responsabilidades y preparación de la entrega

| Integrante | Responsabilidades documentadas |
| --- | --- |
| Maca | Definición del negocio y del modelo, ejemplos JSON, configuración de Atlas, índices y documentación de infraestructura. |
| Ricardo | Implementación Node.js, conexión, menús, operaciones CRUD, validaciones, respaldo, pruebas y evidencias de aplicación. |
| Ambos | Revisión del modelo, integración, informe final y defensa oral de la totalidad del proyecto. |

Para la entrega, la consigna solicita un **informe PDF** y un **ZIP de código y scripts**. Deben incluirse los documentos de esquema JSON, capturas, mecanismos de backup y explicación de RTO/RPO, y una conclusión sobre la comunicación cliente-servidor y el trabajo realizado.

El paquete final debe conservar código fuente, `scripts/backup.ps1`, documentación, `package.json`, `package-lock.json` y `.env.example`, pero **excluir** `.env`, `node_modules/`, `.git/` y `resguardos_tpi/`. Las credenciales necesarias para la corrección se comparten únicamente por el canal privado dispuesto por la cátedra.

**Cierre documental:** el [PDF final](informe.pdf) se encuentra incorporado al proyecto. Resta preparar y verificar el ZIP limpio, coordinar el acceso privado para correccion y organizar la defensa oral. Los objetivos RTO/RPO siguen pendientes de una validacion operativa integral.

**Fecha de cierre consignada en el proyecto:** 31/10/2026 a las 23:59 (verificarla con la publicación vigente de la cátedra antes de entregar).
