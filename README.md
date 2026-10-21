# Food Store — Trabajo Práctico Integrador de Bases de Datos II

**Integrantes:** Ricardo Casto y Macarena Larrosa.

**Repositorio:** [CastoGil/foodstore-tpi-bd2](https://github.com/CastoGil/foodstore-tpi-bd2).

**Base de datos:** `foodstore_tpi`.

Food Store es una aplicación de consola desarrollada con Node.js y el driver nativo de MongoDB para gestionar clientes, productos y pedidos de un comercio gastronómico. La información persiste en MongoDB Atlas.

El proyecto implementa un modelo NoSQL con tres colecciones relacionadas, operaciones CRUD, baja lógica, conservación del historial de los pedidos y un mecanismo de respaldo mediante un script de PowerShell. El alcance académico no incluye pagos, facturación, envíos ni actualización automática de stock.

## 1. Tecnologías

| Tecnología | Uso |
| --- | --- |
| Node.js 24.x y npm | Ejecución de la aplicación y gestión de dependencias |
| Driver oficial `mongodb` | Conexión y operaciones sobre MongoDB Atlas |
| MongoDB Atlas (clúster M0) | Persistencia de datos en la nube |
| `dotenv` | Configuración local mediante variables de entorno |
| `decimal.js` | Cálculos de importes sin aritmética binaria de punto flotante |
| MongoDB Database Tools (`mongodump`, `mongorestore`) | Respaldo y recuperación |
| PowerShell | Script CLI de respaldo y comprobaciones |
| Git y GitHub | Control de versiones y colaboración |

## 2. Funcionalidades

| Módulo | Operaciones disponibles |
| --- | --- |
| Clientes | Crear, listar activos, buscar activo por ID, modificar y desactivar |
| Productos | Crear, listar activos, buscar activo por ID, modificar y desactivar |
| Pedidos | Crear, listar activos, buscar activo por ID y consultar su detalle, cambiar de estado y desactivar |
| Respaldo | Descargar una copia de la base mediante `scripts/backup.ps1` |

La aplicación valida entradas y reglas de negocio, calcula subtotales y totales, y conserva los datos históricos del detalle de cada pedido.

## 3. Estructura del proyecto

| Ruta | Contenido |
| --- | --- |
| `src/app.js` | Inicio, menú principal y cierre |
| `src/config/conexion.js` | Conexión compartida con MongoDB Atlas |
| `src/consola/entrada.js` | Entrada de datos por consola |
| `src/operaciones/clientes.js` | Menú y CRUD de clientes |
| `src/operaciones/productos.js` | Menú y CRUD de productos |
| `src/operaciones/pedidos.js` | Menú y CRUD de pedidos |
| `scripts/backup.ps1` | Script de respaldo con `mongodump` |
| `docs/modelo/` | Descripción del modelo y decisiones de diseño |
| `docs/datos-ejemplo/` | Ejemplos Extended JSON de las colecciones |
| `docs/capturas/` | Evidencias de Atlas, aplicación, respaldo y recuperación |
| `docs/informe/` | Documentación técnica y objetivos RTO/RPO |
| `docs/pruebas/` | Plan de pruebas y registro de ejecuciones |
| `.env.example` | Plantilla de configuración, sin credenciales |
| `package.json`, `package-lock.json` | Dependencias y comandos de ejecución |

La carpeta local `resguardos_tpi/` se genera al ejecutar los backups y **no debe publicarse en el repositorio ni incorporarse al ZIP de código**.

## 4. Modelo de datos NoSQL

La base `foodstore_tpi` contiene tres colecciones relacionadas:

| Colección | Campos principales |
| --- | --- |
| `clientes` | `_id`, `nombre`, `email`, `telefono`, `activo` |
| `productos` | `_id`, `nombre`, `categoria`, `precio`, `activo` |
| `pedidos` | `_id`, `clienteId`, `fecha`, `items`, `total`, `estado`, `activo` |
| Elementos de `pedidos.items` | `productoId`, `nombreProducto`, `precioUnitario`, `cantidad`, `subtotal` |

Se utilizan `ObjectId` para identificadores y referencias, `Date` para fechas, `Decimal128` para importes, `Int32` para cantidades y `Boolean` para la baja lógica.

### Linking y embedding

- **Linking:** `pedidos.clienteId` referencia a `clientes._id` y `pedidos.items[].productoId` referencia a `productos._id`. Clientes y productos tienen un ciclo de vida independiente y pueden participar en varios pedidos.
- **Embedding:** el arreglo `pedidos.items` almacena el detalle de cada pedido. Se conservan copias de `nombreProducto` y `precioUnitario` para preservar los valores usados al registrar la compra, incluso si el catálogo se modifica después.

MongoDB no impone estas referencias como claves foráneas. La aplicación comprueba que el cliente y los productos existan y estén activos antes de crear el pedido. Estas comprobaciones y la inserción no forman una transacción entre colecciones.

### Reglas de negocio

- **Baja lógica:** los documentos se crean con `activo: true` y se desactivan mediante `updateOne` con `$set: { activo: false }`. Las consultas habituales de la aplicación excluyen los inactivos. No se utilizan eliminaciones físicas en los módulos CRUD.
- **Correo único:** la aplicación normaliza el correo a minúsculas y elimina espacios exteriores. El índice único `{ email: 1 }` aplica también a los clientes inactivos.
- **Categorías de productos:** `comidas`, `bebidas` y `postres`.
- **Precios:** importes positivos en pesos argentinos (ARS) con hasta dos decimales; se admite punto o coma decimal sin separadores de miles.
- **Cantidades:** enteros positivos dentro del rango de `Int32`.
- **Cálculos:** `decimal.js` realiza las operaciones y los resultados se almacenan como `Decimal128`.
- **Estados de pedidos:** un pedido pasa de `pendiente` a `entregado` o `cancelado`; después no se permiten nuevas transiciones. `estado: cancelado` no equivale a `activo: false`.
- **Historial:** modificar o desactivar un cliente o producto no altera los ítems ya registrados de pedidos anteriores.

Más información: [modelo y decisiones de diseño](docs/modelo/modelo.md).

Ejemplos ilustrativos en Extended JSON: [clientes](docs/datos-ejemplo/clientes.json), [productos](docs/datos-ejemplo/productos.json) y [pedidos](docs/datos-ejemplo/pedidos.json). Estos archivos describen el modelo y **no son un backup**.

## 5. Instalación y ejecución

### Requisitos previos

- Node.js 24.x y npm.
- Un clúster de MongoDB Atlas accesible y un usuario de base de datos con permisos apropiados para las operaciones requeridas. El módulo de clientes intenta crear/verificar el índice de correo al acceder a él, por lo que se necesitan también los permisos correspondientes si dicho índice se administra desde la aplicación.
- Acceso de red configurado en Atlas para el equipo que realiza la conexión.
- MongoDB Database Tools disponibles en `PATH` para ejecutar los respaldos y las restauraciones.
- Git si se descargará mediante clonación.

### Descargar el proyecto

```powershell
git clone https://github.com/CastoGil/foodstore-tpi-bd2.git
cd foodstore-tpi-bd2
```

También se puede descomprimir el ZIP de código y abrir una terminal en la carpeta que contiene `package.json`.

### Instalar dependencias

```powershell
npm ci
```

### Configurar Atlas

Crear el archivo `.env` solamente si todavía no existe:

```powershell
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Completar las variables con la conexión suministrada por el equipo o por la cátedra a través de un canal privado:

```dotenv
MONGODB_URI=<CADENA_DE_CONEXION_PRIVADA>
MONGODB_DB=foodstore_tpi
```

No subir `.env`, contraseñas ni URI reales al repositorio ni incluirlos en capturas públicas o en el ZIP de código. La plantilla `.env.example` no debe contener credenciales.

### Iniciar Food Store

```powershell
npm start
```

El menú permite gestionar clientes, productos y pedidos. La conexión a MongoDB se abre cuando una operación la necesita, se reutiliza durante la sesión y se cierra al finalizar.

Si aparece un error de configuración o de conexión, revisar `.env`, los permisos del usuario, Network Access en Atlas y la conexión a Internet. Mostrar el menú principal sin consultar documentos **no demuestra** por sí solo conectividad con Atlas.

## 6. Comunicación cliente-servidor y CRUD

La aplicación Node.js actúa como cliente de MongoDB Atlas. El operador selecciona una opción en la consola; el programa solicita y valida los datos, envía la operación mediante el driver oficial, espera el resultado con `async`/`await` y muestra la respuesta.

| Operación | Implementación |
| --- | --- |
| CREATE | `insertOne` |
| READ | `find`, `findOne` |
| UPDATE | `updateOne` con `$set` |
| DELETE lógico | `updateOne` con `$set: { activo: false }` |

El detalle del pedido se almacena en un único documento mediante embedding, mientras que las relaciones con clientes y productos se expresan mediante referencias `ObjectId`.

## 7. Respaldos y recuperación

### Ejecutar un respaldo manual

Desde la raíz del proyecto, en PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

El script lee `MONGODB_URI` y `MONGODB_DB` desde `.env`, utiliza rutas relativas a la ubicación del proyecto y ejecuta `mongodump` sin filtrar por `activo`, por lo que solicita también los documentos desactivados.

Los respaldos nuevos se organizan en carpetas independientes por **fecha y hora**:

```text
resguardos_tpi/
  AAAA-MM-DD/
    HH-mm-ss/
      foodstore_tpi/
        clientes.bson
        clientes.metadata.json
        productos.bson
        productos.metadata.json
        pedidos.bson
        pedidos.metadata.json
      resultado_backup.txt
```

`mongodump` puede incluir archivos auxiliares adicionales. El script comprueba el código de salida y que se hayan generado archivos BSON; si la ejecución es exitosa, registra la fecha, la duración y el resultado en `resultado_backup.txt`. Los respaldos anteriores no se sobrescriben. La copia inicial del 20/10/2026 conserva la estructura anterior, con carpeta por día.

### Ejecuciones de respaldo comprobadas

| Ejecución | Documentos | Archivos BSON | Duración registrada | Resultado |
| --- | ---: | ---: | ---: | --- |
| 20/10/2026, 22:48 | 18 | 3 | **8,21 s** | Código 0 |
| 21/10/2026, 00:50 | 18 | 3 | **1,93 s** | Código 0 |
| 21/10/2026, 01:22 | 18 | 3 | **2,02 s** | Código 0 |

En las tres ejecuciones se respaldaron cinco clientes, ocho productos y cinco pedidos. El último respaldo se realizó después de corregir una inconsistencia de precio unitario en un pedido de ejemplo. Los respaldos anteriores se conservan como evidencia histórica; sus contenidos no se modificaron.

El primer respaldo tuvo un tamaño de **3.904 bytes (3,81 KB)** sumando sus siete archivos internos de datos y metadatos, sin el registro `resultado_backup.txt`.

Evidencias: [respaldo exitoso](docs/capturas/backup/BAK-02-respaldo-exitoso.png) y [archivos generados](docs/capturas/backup/BAK-03-archivos-respaldo.png).

### Restauración de prueba realizada

El 21/10/2026 se restauró la copia del **20/10/2026** en una base separada, `foodstore_tpi_restore_test`, usando `mongorestore`, con una simulación previa mediante `--dryRun` y remapeo de namespaces `--nsFrom`/`--nsTo`. No se sobrescribió la base principal.

| Verificación | Resultado observado |
| --- | --- |
| Documentos restaurados | **18** |
| Documentos fallidos | **0** |
| Duración medida de `mongorestore` | **2,43 s** |
| Código de salida | **0** |
| Colección `clientes` | 5 documentos |
| Colección `productos` | 8 documentos |
| Colección `pedidos` | 5 documentos |
| Índice `email_1` único | Verificado |

A continuación, se ejecutó temporalmente Food Store utilizando `MONGODB_DB=foodstore_tpi_restore_test`, sin modificar el archivo `.env`, y se comprobaron consultas desde los tres menús: **4 clientes activos, 6 productos activos y 5 pedidos activos** en esa copia y en aquel momento.

Las evidencias se encuentran en [restauración exitosa](docs/capturas/backup/BKP-02-restauracion-exitosa.png), [verificación con mongosh](docs/capturas/backup/BKP-03-verificacion-datos-restaurados.png), [clientes](docs/capturas/backup/BKP-04-validacion-clientes.png), [productos](docs/capturas/backup/BKP-05-validacion-productos.png) y [pedidos](docs/capturas/backup/BKP-06-validacion-pedidos.png).

La copia del 21/10/2026 a las 01:22, creada después de la corrección del pedido, **no se restauró de manera independiente**. No debe confundirse su respaldo exitoso con una prueba de restauración de ese archivo concreto.

### Objetivos RTO y RPO

- **RPO propuesto: 24 horas.** Es la antigüedad máxima tolerable de datos perdidos, expresada en tiempo. El respaldo actualmente se inicia manualmente y no existe una tarea periódica supervisada: **el RPO no está garantizado**.
- **RTO propuesto: 60 minutos.** Es la meta para recuperar el servicio completo. El tiempo de ejecución de `mongorestore` (2,43 s) **no es el RTO integral**; no se cronometró conjuntamente la detección del incidente, preparación, restauración y recuperación de uso de la aplicación.

Detalles y limitaciones: [informe RTO/RPO](docs/informe/rto-rpo.md).

## 8. Pruebas funcionales y evidencias

Se realizaron pruebas manuales de conexión, operaciones CRUD, validaciones, bajas lógicas, estados de pedidos, conservación del detalle histórico, respaldo y recuperación. El [plan de pruebas](docs/pruebas/plan-de-pruebas.md) distingue las verificaciones realizadas de los casos complementarios; el [registro de ejecución](docs/pruebas/registro-ejecucion.md) conserva resultados y evidencias.

Entre las comprobaciones observadas se incluyen:

- Alta y consulta de clientes y productos; rechazo de correo duplicado y de determinados valores inválidos.
- Modificación y baja lógica de clientes y productos, con exclusión de las consultas habituales.
- Creación de pedidos, cálculo de sus importes y conservación del detalle ante cambios de productos.
- Cambios válidos de estado y rechazo de transiciones posteriores no admitidas.
- **PED-13:** el pedido terminado en `d7f5` permanece almacenado en `foodstore_tpi` con `activo: false`, y el menú de pedidos activos muestra cuatro pedidos sin incluirlo. La base restaurada conserva `activo: true` para ese mismo documento, compatible con el estado de la copia anterior.
- **Integridad de importes:** el 21/10/2026 se corrigió un dato de ejemplo del precio unitario de Pizza Muzzarella en un pedido; luego se analizaron los cinco pedidos de la base principal, con **cinco correctos y cero inconsistencias aritméticas**.

Capturas destacadas: [baja de pedido](docs/capturas/aplicacion/PED-13-baja-logica-pedido.png), [listado posterior a la baja](docs/capturas/aplicacion/PED-13-listado-tras-baja.png), [conexión y clientes en Atlas](docs/capturas/aplicacion/APP-02-clientes-atlas.png) e [índice único de correo](docs/capturas/atlas/indice_email_unique.png).

Las demás capturas se encuentran en [Atlas](docs/capturas/atlas/), [Aplicación](docs/capturas/aplicacion/) y [Backup y recuperación](docs/capturas/backup/). La existencia de capturas no sustituye la interpretación de su alcance documentado en el registro de ejecución.

## 9. Estado documental y alcance pendiente

Están implementados y tienen comprobaciones reales los tres módulos CRUD, la baja lógica, la conexión a Atlas, el respaldo y la recuperación de una copia de prueba. El RPO y el RTO se mantienen como objetivos académicos, sin garantía operativa integral.

Para cerrar la entrega todavía resta:

1. Revisar y unificar los documentos auxiliares que describen estados anteriores del proyecto.
2. Terminar el informe general con descripción del negocio, modelo, JSON, evidencias, CRUD, respaldo, RTO/RPO y conclusión sobre la comunicación cliente-servidor y el trabajo realizado; exportarlo a PDF.
3. Revisar y publicar de manera consciente los cambios locales pendientes del repositorio.
4. Construir y validar un ZIP limpio de código y documentación, excluyendo `.env`, `node_modules/`, `.git/` y `resguardos_tpi/`.
5. Organizar las credenciales de corrección a través del canal privado indicado por la cátedra y preparar la defensa oral de ambos integrantes.

No se incluye una suite de pruebas automáticas; las verificaciones documentadas son principalmente manuales. El proyecto tampoco garantiza transacciones entre colecciones ni automatización periódica de respaldos.

## 10. Responsabilidades del equipo

| Integrante | Trabajo principal |
| --- | --- |
| Maca | Negocio, modelo, ejemplos JSON, configuración de Atlas, usuarios, red, índice de correo y documentación de infraestructura |
| Ricardo | Aplicación Node.js, conexión, menús, CRUD, validaciones, baja lógica, script de respaldo, evidencias y preparación del empaquetado |
| Ambos | Acuerdos de diseño, integración, revisión, informe final y defensa oral integral |

La división de tareas es organizativa: ambos integrantes deben comprender y poder explicar la totalidad del proyecto durante el coloquio.

## 11. Entrega

La consigna solicita:

- **Informe final PDF:** descripción del negocio, modelo y justificación de embedding/linking, ejemplos JSON, capturas, operaciones CRUD, backup, objetivos RTO/RPO y conclusión sobre comunicación cliente-servidor y realización del trabajo.
- **ZIP de código y scripts:** `src/`, `scripts/`, documentación, `package.json`, `package-lock.json` y `.env.example`, sin dependencias instaladas, historial interno de Git, credenciales ni copias locales de datos.
- **Acceso para corrección:** credenciales o cadena de conexión por un canal privado habilitado por la cátedra, sin publicar secretos en GitHub.
- **Coloquio:** los dos integrantes deben poder defender el proyecto completo.

**Fecha de cierre informada:** 31 de octubre de 2026, 23:59.

> **Nota de entrega:** `.gitignore` impide incluir ciertos archivos en commits normales, pero no evita que entren en un ZIP comprimido manualmente. El ZIP definitivo debe comprobarse antes de enviarlo.
