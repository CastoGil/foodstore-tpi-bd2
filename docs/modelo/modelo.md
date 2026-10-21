# Food Store — Modelo de datos y decisiones de diseño

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo Casto y Macarena Larrosa.  
**Base de datos:** `foodstore_tpi`.

## 1. Negocio y alcance

Food Store administra clientes, productos y pedidos de un comercio gastronómico. Permite mantener el catálogo, registrar compras y consultar su detalle histórico, aunque posteriormente cambien los precios o se desactiven clientes o productos.

La aplicación utiliza tres colecciones relacionadas: `clientes`, `productos` y `pedidos`. No incluye pagos, facturación, envíos ni actualización automática de stock.

## 2. Colecciones y tipos BSON

### Clientes

| Campo | Tipo BSON | Descripción y regla |
| --- | --- | --- |
| `_id` | ObjectId | Identificador del cliente |
| `nombre` | String | Nombre obligatorio |
| `email` | String | Correo normalizado a minúsculas, sin espacios externos y con índice único |
| `telefono` | String | Teléfono de contacto; se representa como texto porque no se utiliza en cálculos |
| `activo` | Boolean | `true` al crear; `false` al dar de baja |

El índice `{ email: 1 }` con la opción `unique: true` aplica a todos los clientes, incluidos los inactivos. La baja lógica no libera el correo para registrar otro cliente.

### Productos

| Campo | Tipo BSON | Descripción y regla |
| --- | --- | --- |
| `_id` | ObjectId | Identificador del producto |
| `nombre` | String | Nombre obligatorio |
| `categoria` | String | `comidas`, `bebidas` o `postres` |
| `precio` | Decimal128 | Precio positivo en pesos argentinos, ingresado con hasta dos decimales |
| `activo` | Boolean | Controla la disponibilidad operativa del producto |

Se acepta punto o coma como separador decimal, sin separadores de miles. Los productos inactivos no pueden incorporarse a nuevos pedidos.

### Pedidos

| Campo | Tipo BSON | Descripción y regla |
| --- | --- | --- |
| `_id` | ObjectId | Identificador del pedido |
| `clienteId` | ObjectId | Referencia al cliente |
| `fecha` | Date | Fecha y hora de creación |
| `items` | Array de documentos | Detalle embebido de los productos comprados |
| `total` | Decimal128 | Suma de los subtotales, calculada por la aplicación |
| `estado` | String | `pendiente`, `entregado` o `cancelado` |
| `activo` | Boolean | Controla la baja lógica del pedido |

Cada elemento de `items` tiene los siguientes campos:

| Campo | Tipo BSON | Descripción |
| --- | --- | --- |
| `productoId` | ObjectId | Referencia al producto del catálogo |
| `nombreProducto` | String | Copia del nombre al registrar la compra |
| `precioUnitario` | Decimal128 | Copia del precio utilizado en la compra |
| `cantidad` | Int32 | Entero positivo, entre 1 y 2147483647 |
| `subtotal` | Decimal128 | Resultado de multiplicar precio unitario por cantidad |

Estas tablas describen el modelo utilizado por la aplicación. No implican que se haya configurado un validador de esquema `$jsonSchema` en Atlas.

## 3. Relaciones y justificación de linking

| Relación | Implementación |
| --- | --- |
| Un cliente puede tener muchos pedidos | `pedidos.clienteId` referencia `clientes._id` |
| Un producto puede aparecer en muchos pedidos | `pedidos.items[].productoId` referencia `productos._id` |
| Un pedido contiene uno o más ítems | Los documentos de detalle se almacenan en `items` |

Se utiliza **linking** para clientes y productos porque tienen un ciclo de vida independiente del pedido. Un cliente puede actualizar sus datos y un producto puede cambiar de precio o categoría sin tener que modificar todos los pedidos relacionados.

Mantener estas entidades en colecciones separadas evita duplicar el perfil completo del cliente y el catálogo en cada pedido. Las referencias permiten identificar qué cliente realizó la compra y qué productos participaron.

MongoDB no impone estas referencias como claves foráneas. La aplicación comprueba que los documentos referenciados existan y estén activos al crear el pedido.

## 4. Justificación de embedding e historial

Se utiliza **embedding** para los ítems porque forman parte del pedido y se consultan junto con él. El detalle se almacena como un arreglo de documentos dentro de `pedidos`, sin una colección adicional de líneas de pedido.

Esta decisión permite guardar el pedido completo mediante una inserción y consultar su detalle sin recuperar por separado cada línea. Es adecuada para el alcance de pedidos de un comercio gastronómico; no se plantea almacenar un historial ilimitado dentro de un único documento.

Cada ítem conserva tanto `productoId` como una copia de `nombreProducto` y `precioUnitario`. La referencia identifica el producto; las copias mantienen los valores utilizados en la compra. Esta duplicación es intencional: consultar siempre el precio actual del catálogo alteraría la interpretación de pedidos anteriores.

Por ejemplo, si un producto se compró a ARS 1250,50 y luego aumenta a ARS 1400,00, el pedido anterior conserva ARS 1250,50 como precio unitario.

El pedido no guarda una copia del nombre, correo o teléfono del cliente. La conservación histórica implementada corresponde al detalle de los productos y sus importes; los datos de contacto permanecen en `clientes`.

## 5. Importes y cantidades

Los precios, subtotales y totales se almacenan como `Decimal128`. La aplicación realiza los cálculos con `decimal.js` y convierte los resultados mediante cadenas decimales, evitando utilizar aritmética binaria de punto flotante para calcular los importes monetarios.

Las cantidades se almacenan explícitamente como `Int32` y deben ser enteros positivos dentro de su rango. El operador selecciona productos y cantidades; no introduce subtotales ni el total.

- `subtotal = precioUnitario × cantidad`.
- `total = suma de los subtotales`.

La moneda acordada para todos los importes es el peso argentino (ARS). No se incorpora un campo de moneda porque el alcance utiliza una única moneda.

## 6. Operaciones CRUD y baja lógica

| Operación | Implementación | Regla |
| --- | --- | --- |
| CREATE | `insertOne` | Los documentos nuevos se crean con `activo: true` |
| READ | `find` y `findOne` | Las consultas habituales incluyen `activo: true`, también al buscar por ID |
| UPDATE | `updateOne` con `$set` | Se modifican únicamente los campos permitidos por el menú |
| DELETE lógico | `updateOne` con `$set: { activo: false }` | El documento se conserva en la base |

No se utilizan operaciones de eliminación física. Desactivar un cliente o producto no modifica ni desactiva automáticamente sus pedidos anteriores. Esto conserva las referencias y el detalle histórico.

Al desactivar un pedido, se conserva el documento con sus ítems, importes, fecha y estado. Deja de aparecer en las consultas habituales de pedidos activos.

El campo `activo` se aplica a las tres colecciones. El script de respaldo no filtra por ese campo y solicita el respaldo de la base completa.

## 7. Estados de los pedidos

Todo pedido nuevo se crea con `estado: "pendiente"`. Se admiten únicamente estas transiciones:

| Estado actual | Nuevo estado permitido |
| --- | --- |
| `pendiente` | `entregado` |
| `pendiente` | `cancelado` |
| `entregado` | Ninguno |
| `cancelado` | Ninguno |

El cambio de estado conserva el detalle original y el total. La aplicación no permite editar los ítems de un pedido ya registrado.

`estado` representa la situación comercial y `activo` controla la baja lógica. Por lo tanto, un pedido cancelado puede continuar activo y visible. Cancelar un pedido no equivale a desactivarlo.

## 8. Validaciones y límites del alcance

La aplicación incorpora controles sobre nombres obligatorios, formato básico del correo, identificadores hexadecimales de 24 caracteres, categorías, precios, cantidades y referencias activas. El índice único de correo añade una restricción en la base de datos.

Las comprobaciones de clientes y productos, y la inserción del pedido, no están agrupadas en una transacción entre colecciones. Por ello, no se garantiza que otro proceso no modifique un documento entre una comprobación y la inserción. Esta limitación corresponde al alcance de la consola académica y no debe presentarse como una garantía de integridad frente a operaciones concurrentes.

La descripción de una validación indica su implementación; los ensayos realizados y su evidencia se documentan por separado en el [registro de ejecución](../pruebas/registro-ejecucion.md).

## 9. Ejemplos de documentos

Los ejemplos utilizan Extended JSON para representar explícitamente los tipos BSON:

- [Cliente](../datos-ejemplo/clientes.json).
- [Producto](../datos-ejemplo/productos.json).
- [Pedido](../datos-ejemplo/pedidos.json).

Son ejemplos ilustrativos con datos ficticios y referencias relacionadas entre sí. No representan un volcado de la base ni sustituyen el respaldo generado por `mongodump`.
