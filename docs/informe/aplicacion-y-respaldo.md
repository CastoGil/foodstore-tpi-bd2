# Aplicación y mecanismo de respaldo

**Proyecto:** Food Store — Trabajo Práctico Integrador de Bases de Datos II

**Responsable de implementación y pruebas de la aplicación:** Ricardo.

**Configuración de Atlas y revisión del modelo:** trabajo coordinado con Maca.

**Estado del documento:** implementación y pruebas principales verificadas; objetivos RTO/RPO propuestos, sin validación integral de su cumplimiento.

## 1. Aplicación por consola

Food Store es una aplicación de consola desarrollada con Node.js y el driver nativo de MongoDB. Se comunica con una base de datos alojada en MongoDB Atlas y permite gestionar clientes, productos y pedidos de un comercio gastronómico.

El archivo `src/app.js` presenta un menú principal para acceder a los tres módulos. El proyecto separa el punto de entrada, la conexión compartida, la lectura de datos por consola y las operaciones de cada colección:

- `src/app.js`: menú principal, ejecución y cierre de la aplicación.
- `src/config/conexion.js`: conexión y selección de la base de datos.
- `src/consola/entrada.js`: entrada de datos por consola.
- `src/operaciones/clientes.js`: gestión de clientes.
- `src/operaciones/productos.js`: gestión de productos.
- `src/operaciones/pedidos.js`: gestión de pedidos.

Se comprobó el inicio con `npm start`, la navegación entre menús, el manejo de una opción inválida y el cierre de la aplicación. También se realizaron consultas y operaciones reales contra MongoDB Atlas, según el alcance documentado en el [registro de ejecución](../pruebas/registro-ejecucion.md).

## 2. Configuración de la conexión

La configuración se obtiene del archivo local `.env` mediante `dotenv`:

- `MONGODB_URI`: cadena de conexión a MongoDB Atlas.
- `MONGODB_DB`: nombre de la base de datos, normalmente `foodstore_tpi`.

El archivo `.env.example` sirve como plantilla y no contiene credenciales reales. La aplicación abre la conexión cuando una operación la necesita, la reutiliza durante la ejecución y la cierra al salir. Se comprobó la conexión real con Atlas y se ensayó el mensaje de error controlado al faltar `MONGODB_URI`.

El archivo `.env` no debe publicarse en GitHub ni incluirse en el ZIP de código de entrega. Las credenciales que solicite la cátedra deben compartirse por su canal privado.

## 3. Comunicación cliente-servidor

La aplicación Node.js actúa como **cliente** y MongoDB Atlas aloja el **servidor de base de datos**. El usuario selecciona una opción del menú e ingresa datos; la aplicación los valida y envía la operación a Atlas mediante el driver oficial de MongoDB.

Atlas procesa la solicitud y devuelve documentos o un resultado de escritura. El programa interpreta la respuesta y la presenta en consola. Las funciones asíncronas utilizan `async` y `await` para esperar el resultado de las operaciones.

La persistencia se demostró con operaciones y consultas reales. La arquitectura no requiere un servidor HTTP propio: la aplicación de consola se conecta directamente al servicio de base de datos en la nube.

## 4. Operaciones CRUD y baja lógica

| Operación | Implementación | Comportamiento observado |
| --- | --- | --- |
| **CREATE** | `insertOne` | Creación de clientes, productos y pedidos; documentos nuevos con `activo: true`. |
| **READ** | `find` y `findOne` | Listados y búsquedas por ID, filtrando habitualmente por `activo: true`. |
| **UPDATE** | `updateOne` con `$set` | Modificación de datos; en pedidos, transición de `pendiente` a `entregado` o `cancelado`. |
| **DELETE lógico** | `updateOne` con `$set: { activo: false }` | El documento permanece almacenado, pero deja de aparecer en las consultas habituales de activos. |

No se utilizan operaciones de eliminación física como parte del CRUD implementado. El estado comercial de un pedido (`pendiente`, `entregado` o `cancelado`) es distinto de su indicador de baja lógica (`activo`).

**Caso PED-13:** la baja lógica del pedido identificado como `6ad8177af44effa3cac4d7f5` se corroboró consultando `foodstore_tpi` con `mongosh`: el documento permanecía en la colección con `activo: false`. Una consulta posterior desde la aplicación sobre la base principal mostró **cuatro pedidos activos** y excluyó ese ID. La copia de restauración conservaba `activo: true`, una diferencia compatible con el estado anterior respaldado.

Evidencia: [baja del pedido](../capturas/aplicacion/PED-13-baja-logica-pedido.png) y [listado posterior](../capturas/aplicacion/PED-13-listado-tras-baja.png).

## 5. Modelo NoSQL y conservación del historial

La base `foodstore_tpi` se organiza en las colecciones `clientes`, `productos` y `pedidos`.

Se utiliza **linking** mediante `clienteId` y `items.productoId`, que referencian documentos de clientes y productos por `ObjectId`. El arreglo `items` está **embebido** dentro de cada pedido y conserva `nombreProducto`, `precioUnitario`, `cantidad` y `subtotal` correspondientes a ese registro.

Así, modificar o desactivar un producto no cambia el detalle ya guardado en pedidos anteriores. Los pedidos también permanecen almacenados cuando se desactiva un cliente, aunque la creación de nuevos pedidos exige referencias activas.

El diseño y sus justificaciones se desarrollan en el [modelo de datos](../modelo/modelo.md).

## 6. Validaciones y resultados funcionales

La implementación incluye controles para:

- Campos obligatorios, formato básico de correo y correo único, incluso para clientes desactivados.
- Identificadores MongoDB válidos y existencia de clientes y productos activos al crear pedidos.
- Categorías permitidas: `comidas`, `bebidas` y `postres`.
- Precios positivos con hasta dos decimales y entradas con punto o coma decimal.
- Cantidades enteras positivas dentro del rango de `Int32`.
- Transiciones admitidas de estado de pedidos.

Para los importes se usa `decimal.js` y se almacenan valores `Decimal128`. Los identificadores y las referencias se manejan como `ObjectId`.

Las pruebas documentadas comprobaron las operaciones CRUD principales, el rechazo de un correo duplicado, valores inválidos en productos, cambios de estado y conservación del historial. Esto **no significa que se hayan probado todas las entradas posibles**. Ver [plan](../pruebas/plan-de-pruebas.md) y [registro de ejecución](../pruebas/registro-ejecucion.md).

### 6.1. Control de integridad de los pedidos

Se identificó una inconsistencia en los datos de ejemplo de un pedido: el precio unitario de Pizza Muzzarella figuraba como ARS 1.200,00, pero con cantidad 1 y subtotal ARS 12.000,00. Se corrigió el precio unitario a ARS 12.000,00 en la base de pruebas y en la base principal, conservando el subtotal y el total del pedido.

Luego se revisaron con cálculos exactos en centavos los **cinco pedidos** de `foodstore_tpi`: cinco correctos y cero inconsistencias aritméticas entre precios, cantidades, subtotales y totales. Se trata de una comprobación de los datos almacenados, no de una prueba exhaustiva de todas las reglas de negocio.

## 7. Mecanismo de respaldo con `mongodump`

El script `scripts/backup.ps1` utiliza las variables de `.env`, comprueba la disponibilidad de `mongodump` y resuelve los destinos de forma relativa a la ubicación del proyecto. Respaldar la base completa permite incluir documentos activos e inactivos.

Los respaldos nuevos se organizan así:

```text
resguardos_tpi/
└── AAAA-MM-DD/
    └── HH-mm-ss/
        ├── foodstore_tpi/
        │   ├── clientes.bson
        │   ├── clientes.metadata.json
        │   ├── productos.bson
        │   ├── productos.metadata.json
        │   ├── pedidos.bson
        │   └── pedidos.metadata.json
        └── resultado_backup.txt
```

La carpeta de datos puede contener además otros archivos generados por `mongodump`, como `prelude.json`. El script mantiene respaldos separados, comprueba el código de salida y la presencia de archivos BSON y genera `resultado_backup.txt` con tiempos y resultado, sin incluir credenciales. Si la ejecución falla, cualquier salida parcial no debe considerarse una copia válida.

El primer respaldo conserva la estructura antigua por fecha (`resguardos_tpi/2026-10-20/`); no fue renombrado. La mejora posterior agregó una subcarpeta por hora para permitir más de una ejecución en un mismo día sin sobrescribir copias anteriores.

### 7.1. Ejecuciones verificadas

| Fecha y destino | Documentos | Duración registrada | Resultado |
| --- | ---: | ---: | --- |
| 20/10/2026 — `resguardos_tpi/2026-10-20/` | 18 | 8,21 s | 3 BSON, código 0. |
| 21/10/2026 — `resguardos_tpi/2026-10-21/00-50-20/` | 18 | 1,93 s | 3 BSON, código 0. |
| 21/10/2026 — `resguardos_tpi/2026-10-21/01-22-18/` | 18 | 2,02 s | 3 BSON, código 0; realizado tras corregir el dato del pedido. |

La primera copia contiene 5 clientes, 8 productos y 5 pedidos, con un tamaño de **3.904 bytes (3,81 KB)** para los siete archivos de la carpeta de datos. Los tiempos son mediciones de ejecuciones concretas, no compromisos de rendimiento.

Evidencias: [respaldo inicial exitoso](../capturas/backup/BAK-02-respaldo-exitoso.png) y [archivos del respaldo](../capturas/backup/BAK-03-archivos-respaldo.png).

**El script realiza los pasos del respaldo automáticamente cuando se lo ejecuta, pero su inicio sigue siendo manual.** No existe una tarea periódica configurada que garantice una frecuencia determinada.

## 8. Restauración comprobada con `mongorestore`

Se restauró el respaldo del **20/10/2026** en una base independiente llamada `foodstore_tpi_restore_test`, sin sobrescribir la base principal. Antes de la ejecución real se utilizó `mongorestore --dryRun` para comprobar el mapeo de los namespaces.

El resultado efectivo fue:

| Comprobación | Resultado |
| --- | --- |
| Documentos restaurados | 18 (5 clientes, 8 productos, 5 pedidos). |
| Documentos fallidos | 0. |
| Código de salida | 0. |
| Tiempo medido de `mongorestore` | **2,43 segundos**. |
| Índice verificado | `clientes.email_1`, único. |
| Consultas desde Food Store sobre la base restaurada | 4 clientes activos, 6 productos activos y 5 pedidos activos. |

La aplicación se ejecutó utilizando temporalmente `MONGODB_DB=foodstore_tpi_restore_test`, sin modificar permanentemente el archivo `.env`. Al cerrar el programa se verificó que la variable temporal no quedara configurada.

La copia restaurada reproduce el estado que tenía el respaldo elegido. No se actualiza automáticamente cuando cambian los documentos en `foodstore_tpi`. **La copia más reciente, creada el 21/10/2026 después de la corrección del pedido, no fue sometida a una restauración independiente.**

Evidencias: [restauración exitosa](../capturas/backup/BKP-02-restauracion-exitosa.png), [comprobación de documentos e índice](../capturas/backup/BKP-03-verificacion-datos-restaurados.png), [clientes](../capturas/backup/BKP-04-validacion-clientes.png), [productos](../capturas/backup/BKP-05-validacion-productos.png) y [pedidos](../capturas/backup/BKP-06-validacion-pedidos.png).

## 9. Objetivos RTO y RPO

- **RPO propuesto: 24 horas.** Es la pérdida máxima de información tolerable medida en tiempo. No está garantizado: aunque existen respaldos exitosos, no hay una periodicidad comprobada y supervisada.
- **RTO propuesto: 60 minutos.** Es el objetivo para volver a poner el servicio en funcionamiento. **No se midió el RTO integral** desde la identificación de un incidente hasta el restablecimiento de la aplicación.

Los **2,43 segundos** son únicamente el tiempo medido de `mongorestore`. No incluyen todo el procedimiento necesario para recuperar el servicio y, por tanto, no equivalen al RTO.

Para el detalle del procedimiento, las mediciones y las limitaciones, consultar [Objetivos de recuperación RTO/RPO](rto-rpo.md).

## 10. Estado de las pruebas y limitaciones

Quedaron comprobadas las operaciones principales de la aplicación, consultas reales a Atlas, bajas lógicas, conservación del historial de productos, tres ejecuciones de backup y una restauración con consultas funcionales sobre la base recuperada.

No se declara una suite automatizada ni cobertura completa de todas las combinaciones de datos. El RPO de 24 horas y el RTO de 60 minutos siguen siendo objetivos de planificación; tampoco se ha restaurado de forma independiente el respaldo más reciente del 21/10/2026.

Para la entrega se deben integrar las evidencias en el informe final, generar el PDF solicitado y preparar un ZIP sin `.env`, `.git/`, `node_modules/` ni copias locales de `resguardos_tpi/`. El código, los scripts, los documentos y `.env.example` se conservan. Los accesos de corrección deben compartirse de manera privada.

**Conclusión:** se comprobó la comunicación entre la aplicación Node.js y MongoDB Atlas, la persistencia de las operaciones principales y la posibilidad de restaurar un respaldo y consultar los datos recuperados. Se distinguen esos resultados observados de las pruebas y garantías que todavía no se realizaron.
