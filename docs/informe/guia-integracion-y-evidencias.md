# Food Store — Guía técnica de integración y evidencias

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo y Maca  
**Fecha de preparación:** 18/10/2026  
**Estado:** Borrador técnico, pendiente de completar con evidencias reales de MongoDB Atlas.

> Esta guía complementa `README.md`, `docs/informe/aplicacion-y-respaldo.md` y `docs/informe/rto-rpo.md`. No reemplaza la documentación del modelo NoSQL y de la infraestructura que prepara Maca.

## 1. Propósito y alcance

Food Store es una aplicación de consola desarrollada con Node.js que administra tres colecciones relacionadas de MongoDB: `clientes`, `productos` y `pedidos`, sobre la base `foodstore_tpi`, prevista para alojarse en MongoDB Atlas M0. El objetivo académico es demostrar persistencia NoSQL, operaciones CRUD desde código, relaciones mediante referencias, datos embebidos, baja lógica y respaldo recuperable.

La solución **no implementa** pagos, facturación, envíos ni descuento automático de stock. No requiere frontend ni video según el alcance documentado del proyecto.

## 2. Arquitectura implementada

| Componente | Archivo | Función |
| --- | --- | --- |
| Entrada y menú principal | `src/app.js` | Permite elegir la gestión de clientes, productos, pedidos o salir. |
| Conexión reutilizable | `src/config/conexion.js` | Lee el entorno, abre `MongoClient`, ejecuta `ping`, reutiliza la conexión y la cierra al finalizar. |
| Entrada interactiva | `src/consola/entrada.js` | Solicita y normaliza la entrada mediante `readline/promises`. |
| Módulo de clientes | `src/operaciones/clientes.js` | Alta, consulta, modificación, baja lógica e índice de correo único. |
| Módulo de productos | `src/operaciones/productos.js` | CRUD, categorías admitidas y manejo de precios `Decimal128`. |
| Módulo de pedidos | `src/operaciones/pedidos.js` | Verifica referencias activas, genera detalle embebido, calcula importes y gestiona estados. |
| Respaldo | `scripts/backup.ps1` | Ejecuta `mongodump` con configuración y rutas relativas. |

**Dependencias:** `mongodb` (driver nativo), `dotenv` y `decimal.js`. La aplicación se inicia mediante `npm start` después de ejecutar `npm ci`.

## 3. Modelo de persistencia y decisiones

**Colecciones y campos acordados:**

- **`clientes`:** `_id` (ObjectId), `nombre` (String), `email` (String), `telefono` (String), `activo` (Boolean).
- **`productos`:** `_id` (ObjectId), `nombre` (String), `categoria` (String), `precio` (Decimal128), `activo` (Boolean).
- **`pedidos`:** `_id` (ObjectId), `clienteId` (ObjectId), `fecha` (Date), `items` (Array), `total` (Decimal128), `estado` (String), `activo` (Boolean).
- **Cada elemento de `items`:** `productoId` (ObjectId), `nombreProducto` (String), `precioUnitario` (Decimal128), `cantidad` (Int32), `subtotal` (Decimal128).

**Linking (referencias).** `pedidos.clienteId` referencia un cliente y `pedidos.items.productoId` referencia un producto. El código valida la existencia y la condición activa de estas referencias al crear pedidos.

**Embedding (datos embebidos).** `items` forma parte del documento `pedidos`. Conserva nombres, precios unitarios, cantidades y subtotales correspondientes al momento de registrar la compra. Esto permite consultar el historial aunque cambien o se desactiven clientes y productos.

**Baja lógica.** Los documentos nuevos se crean con `activo: true`; desactivarlos cambia el campo a `false`. Las consultas habituales filtran por `activo: true` y no se ejecutan eliminaciones físicas.

**Reglas de negocio.** Los correos se normalizan a minúsculas y deben ser únicos, incluso entre clientes inactivos. Se admiten las categorías `comidas`, `bebidas` y `postres`; precios positivos con un máximo de dos decimales; cantidades enteras positivas hasta 2.147.483.647; y transiciones del pedido desde `pendiente` hacia `entregado` o `cancelado`, sin nuevas transiciones posteriores.

La integridad entre colecciones está controlada por la aplicación, no por claves foráneas relacionales. Estos controles deben verificarse mediante pruebas de integración.

## 4. Preparación para conectar Atlas

**Maca — infraestructura.** Preparar el clúster M0; configurar `Database Access` con permisos sobre la base de trabajo y `Network Access` con el acceso de red necesario; revisar las tres colecciones, los datos de prueba y el índice único `clientes.email`. Evitar contraseñas o cadenas URI completas en las capturas.

**Ricardo — aplicación.** Desde la raíz del proyecto:

```powershell
npm ci
Copy-Item .env.example .env
```

Editar `.env` en el equipo local (**no** en GitHub):

```dotenv
MONGODB_URI=<cadena-privada-de-conexion>
MONGODB_DB=foodstore_tpi
```

Luego ejecutar:

```powershell
npm start
```

La conexión se crea de forma diferida cuando se solicita una operación sobre una colección. El mensaje `Conexión con MongoDB establecida.` debe aparecer tras el primer acceso correcto. **Entrar al menú, por sí solo, no demuestra conectividad.**

**Precaución de seguridad:** no subir `.env`, credenciales, respaldos con datos reales ni capturas que revelen contraseñas. `.gitignore` ya excluye `.env` y `resguardos_tpi/`.

## 5. Método de validación y evidencias

Las pruebas se registrarán en `docs/pruebas/plan-de-pruebas.md`. Para cada caso se debe consignar: **identificador, fecha y hora, responsable, datos de entrada, resultado observado, estado y evidencia**. Los estados admitidos son `Pendiente`, `Aprobado`, `Falló` y `Bloqueado`.

**Ubicaciones acordadas para las capturas:**

| Evidencia | Carpeta |
| --- | --- |
| Navegación, validaciones y CRUD en consola | `docs/capturas/aplicacion/` |
| Clúster, colecciones, tipos e índices en Atlas | `docs/capturas/atlas/` |
| Ejecución y resultado del respaldo | `docs/capturas/backup/` |

**Ejemplos de nombres:** `CLI-01-alta-cliente.png`, `PED-02-total-decimales.png` y `BAK-02-bson-generados.png`. El código del nombre de archivo debe coincidir con el identificador del caso de prueba. No incluir datos sensibles visibles.

**Orden mínimo de ejecución:** conexión → cliente y productos de prueba → creación de pedidos → transiciones de estado e historial → bajas lógicas → respaldo → verificación y, si se realiza, restauración en una base de ensayo.

## 6. Respaldo y recuperación

**Comando de respaldo en Windows**, desde la raíz del proyecto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

El script requiere `mongodump` en `PATH`, un `.env` válido y la base `foodstore_tpi`. Al finalizar correctamente, genera `resguardos_tpi/AAAA-MM-DD/` con archivos BSON, metadatos y `resultado_backup.txt`. Rechaza un segundo respaldo con la misma carpeta de fecha para evitar sobrescrituras. No filtra por `activo`, por lo que incluye documentos desactivados.

El documento `docs/informe/rto-rpo.md` propone un **RPO de 24 horas** y un **RTO de 60 minutos**, ambos **pendientes de validación**. El respaldo se ejecuta bajo demanda; sin programación periódica, el RPO no está garantizado. La duración del respaldo no debe confundirse con el RTO.

Una prueba de recuperación debe restaurar sobre una **base de ensayo diferente** y comparar colecciones, documentos e índices, sin reemplazar los datos de trabajo. Registrar el tiempo hasta que puedan efectuarse consultas y operaciones desde la aplicación configurada contra la base recuperada.

## 7. Estado y criterios de cierre

**Ya reportado en el README:** comprobaciones locales de sintaxis, navegación, manejo de URI ausente y 26 comprobaciones con datos simulados; disponibilidad de MongoDB Database Tools y comprobación del error del script sin URI.

**Todavía por demostrar con Atlas:** conexión real y persistencia, índice único de correo, operaciones sobre las tres colecciones, bajas lógicas e historial, tipos BSON, respaldo válido, prueba de recuperación y evidencias.

La integración estará lista para documentarse como validada cuando los casos críticos del plan de pruebas estén aprobados y respaldados por capturas y registros. Hasta entonces, **código implementado no equivale a funcionalidad verificada en Atlas**.

## 8. Preparación de la entrega

La documentación final se consolidará en un PDF con el modelo e infraestructura de Maca, la implementación y el respaldo de Ricardo, y los resultados reales de ambos. El ZIP debe incluir código fuente, `package.json`, `package-lock.json`, documentación, scripts y `.env.example`; debe excluir `.env`, `node_modules` y los respaldos privados.

**Fecha de entrega registrada:** 31/10/2026 a las 23:59. Revisar la consigna final antes de cerrar el envío.
