# Food Store — Borrador unificado del informe final

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo y Maca  
**Fecha del borrador:** 18/10/2026  
**Estado:** borrador integrador; faltan los apartados de Maca, resultados de MongoDB Atlas y evidencias reales. **No entregar como informe final sin completar y revisar.**

> Este documento reúne información ya registrada en el proyecto y funciona como base para el PDF final. No reemplaza `README.md`, `docs/informe/aplicacion-y-respaldo.md`, `docs/informe/rto-rpo.md`, `docs/informe/guia-integracion-y-evidencias.md` ni `docs/pruebas/plan-de-pruebas.md`.

## 1. Introducción

Food Store es una aplicación académica de gestión de pedidos desarrollada en Node.js, orientada a administrar clientes, productos y pedidos mediante una base de datos documental MongoDB alojada en Atlas. El proyecto aplica operaciones CRUD realizadas desde código, referencias entre colecciones, documentos embebidos, baja lógica y un mecanismo de respaldo.

Se optó por una aplicación de consola para concentrar el trabajo en el modelado de datos, la persistencia y su verificación. El alcance no incluye pagos, facturación, envíos ni actualización automática del stock.

**Pendiente de Maca:** incorporar una descripción concreta del negocio, el problema que resuelve y sus usuarios, coherente con las funcionalidades implementadas.

## 2. Objetivos

**Objetivo general:** implementar y comprobar una solución de persistencia NoSQL para la administración de clientes, productos y pedidos.

**Objetivos específicos:**

- Diseñar colecciones y relaciones mediante referencias y datos embebidos.
- Implementar altas, consultas, modificaciones y desactivación lógica desde Node.js.
- Aplicar reglas de validación e integridad acordadas.
- Conservar el detalle histórico de los pedidos.
- Integrar la aplicación con MongoDB Atlas.
- Preparar y verificar un mecanismo de respaldo y recuperación.
- Documentar casos de prueba, resultados observados y evidencias.

## 3. Tecnologías y estructura

| Tecnología o componente | Uso en Food Store |
|---|---|
| Node.js y npm | Ejecución del programa de consola y gestión de dependencias |
| Driver nativo `mongodb` | Comunicación desde la aplicación con MongoDB |
| MongoDB Atlas (M0) | Base documental en la nube, pendiente de integración real |
| `dotenv` | Lectura de variables desde `.env` local |
| `decimal.js` | Cálculo preciso de importes |
| BSON `Decimal128` e `Int32` | Almacenamiento de importes y cantidades |
| PowerShell y `mongodump` | Respaldo de la base de datos |
| Git y GitHub | Control de versiones y repositorio de trabajo |

Archivos principales:

- `src/app.js`: menú y ciclo principal.
- `src/config/conexion.js`: conexión reutilizable con `MongoClient`.
- `src/consola/entrada.js`: entrada interactiva con `readline/promises`.
- `src/operaciones/clientes.js`: CRUD, baja lógica e índice único de correo.
- `src/operaciones/productos.js`: CRUD, categorías y precios.
- `src/operaciones/pedidos.js`: pedidos, validaciones, cálculos y estados.
- `scripts/backup.ps1`: respaldo con `mongodump`.

**Evidencia pendiente:** captura de estructura de carpetas y capturas de la aplicación ejecutándose.

## 4. Modelo documental

**Base prevista:** `foodstore_tpi`.  
**Colecciones:** `clientes`, `productos` y `pedidos`.

| Colección | Campos principales |
|---|---|
| `clientes` | `_id`, `nombre`, `email`, `telefono`, `activo` |
| `productos` | `_id`, `nombre`, `categoria`, `precio`, `activo` |
| `pedidos` | `_id`, `clienteId`, `fecha`, `items`, `total`, `estado`, `activo` |

Cada objeto embebido de `pedidos.items` incluye `productoId`, `nombreProducto`, `precioUnitario`, `cantidad` y `subtotal`.

### 4.1. Relaciones mediante linking

`pedidos.clienteId` almacena una referencia `ObjectId` al cliente y `pedidos.items.productoId` identifica los productos correspondientes. La aplicación verifica que el cliente y los productos existan y estén activos antes de registrar un pedido. MongoDB no impone aquí claves foráneas relacionales.

### 4.2. Embedding e historial

El arreglo `items` se almacena dentro del pedido. En cada ítem se conservan el nombre del producto, precio unitario, cantidad y subtotal vigentes en la creación. Así, cambios posteriores en productos o clientes no modifican el detalle histórico guardado.

### 4.3. Tipos BSON y reglas

Los identificadores y referencias utilizan `ObjectId`; las fechas, `Date`; los precios y totales, `Decimal128`; las cantidades, `Int32`; y la disponibilidad lógica, `Boolean`.

Reglas incorporadas en el código:

- Correos normalizados a minúsculas y sujetos a un índice único en `clientes.email`, incluso para clientes desactivados.
- Categorías de productos limitadas a `comidas`, `bebidas` y `postres`.
- Precios positivos en ARS con hasta dos decimales.
- Cantidades enteras positivas entre 1 y 2.147.483.647.
- Estados de pedidos: `pendiente` puede pasar a `entregado` o `cancelado`; no se permiten transiciones posteriores.
- Baja lógica con `activo: false` y consultas habituales filtradas por `activo: true`.

**Pendiente de Maca:** diagramas, explicación completa de criterios del modelo, ejemplos JSON y capturas de colecciones e índices en Atlas. **Pendiente de ambos:** verificar los tipos realmente persistidos y el índice único.

## 5. Implementación de operaciones CRUD

La aplicación inicia en `src/app.js` y ofrece tres menús para gestionar clientes, productos y pedidos. Las inserciones utilizan `insertOne`; las consultas, `find` o `findOne`; y las modificaciones, `updateOne` con `$set`.

La eliminación solicitada al usuario es **lógica**: no se utiliza una operación de borrado físico, sino una actualización de `activo` de `true` a `false`. La lectura habitual solo muestra documentos activos. En pedidos, el detalle se consulta junto con el documento, y el cambio de estado modifica únicamente `estado`.

La aplicación calcula subtotales y total con `decimal.js`, convirtiendo los importes calculados a `Decimal128` mediante cadenas decimales. Los pedidos se crean únicamente si las referencias cumplen las validaciones vigentes.

**Pendiente:** respaldar las operaciones sobre las tres colecciones con capturas de consola y comprobaciones en Atlas.

## 6. Conexión y seguridad de configuración

La conexión lee `MONGODB_URI` y `MONGODB_DB` desde `.env`, sin colocar credenciales en el código. `MongoClient` abre la conexión cuando una operación la requiere y comprueba el acceso mediante `ping`. La conexión se reutiliza y se cierra al finalizar el programa.

La plantilla `.env.example` contiene el nombre de la base y una URI vacía; `.gitignore` excluye `.env`, `node_modules/` y `resguardos_tpi/`.

**Pendiente de Maca:** documentar clúster, usuario con permisos adecuados, Network Access y creación o verificación del índice.  
**Pendiente de ambos:** confirmar conexión real, permisos y funcionamiento con Atlas. Nunca incluir URI completa ni contraseña en el informe, capturas o ZIP.

## 7. Pruebas y resultados

El plan `docs/pruebas/plan-de-pruebas.md` define **41 casos** sobre aplicación, conexión, clientes, productos, pedidos, respaldo y seguridad. Su seguimiento se documenta en `docs/pruebas/registro-ejecucion.md`.

| Grupo | Situación al preparar el borrador |
|---|---|
| Navegación y menús | Capturas compartidas en la conversación; falta confirmar evidencia de salida definitiva |
| Opción inválida | Ricardo informó resultado correcto; captura aún no incorporada |
| URI vacía | Ricardo informó resultado correcto; captura aún no incorporada |
| Respaldo sin URI | Prueba local previa registrada en README; repetir y adjuntar evidencia |
| Conexión y CRUD con Atlas | Pendientes de ejecución |
| Historial, tipos BSON e índices | Pendientes de ejecución real |
| Respaldo y restauración | Pendientes de prueba contra Atlas |

No debe informarse como «aprobada» una prueba cuya ejecución o resultado no haya sido documentado. Los casos dependientes de Atlas permanecen pendientes hasta que esté disponible.

**Datos de ensayo acordados para comprobación de importes:** dos unidades de un producto de ARS 1250,50 y una unidad de otro de ARS 750,25 deben producir subtotales de ARS 2501,00 y ARS 750,25, con total **ARS 3251,25**. Este es el **resultado esperado**, no un resultado ya medido en Atlas.

## 8. Respaldo y recuperación

El script `scripts/backup.ps1` está implementado para leer el archivo `.env` y ejecutar `mongodump` sobre `foodstore_tpi`. Trabaja con rutas relativas y, ante una ejecución correcta, genera una carpeta `resguardos_tpi/AAAA-MM-DD/`, archivos BSON y metadatos, y un registro `resultado_backup.txt`. El respaldo no filtra documentos por `activo`, por lo que debe incluir los desactivados.

El script rechaza un segundo respaldo en una carpeta de la misma fecha para evitar sobrescrituras. Su funcionamiento completo aún debe comprobarse contra una base Atlas con datos.

### 8.1. Objetivos de recuperación

Se propusieron **RPO de 24 horas** y **RTO de 60 minutos** para el entorno académico. Se trata de objetivos, no de resultados verificados. Como el respaldo es manual y no existe una tarea periódica instalada, el RPO de 24 horas **no está garantizado**.

Una eventual recuperación debe ensayarse sobre una **base de datos diferente** y controlada. Se medirán la duración del respaldo y el tiempo necesario para restaurar, verificar los datos y volver a consultar desde la aplicación. El tiempo que tarda `mongodump` no equivale al RTO.

**Pendiente:** ejecutar respaldo real, inspeccionar archivos BSON y metadatos, restaurar en base de ensayo si corresponde y registrar mediciones reales.

## 9. Evidencias requeridas

| Evidencia | Ubicación prevista |
|---|---|
| Navegación, entradas inválidas y CRUD | `docs/capturas/aplicacion/` |
| Clúster, colecciones, tipos e índices | `docs/capturas/atlas/` |
| Ejecución y contenido del backup | `docs/capturas/backup/` |
| Resultados y estados de pruebas | `docs/pruebas/registro-ejecucion.md` |

Se utilizarán nombres relacionados con el ID del caso y se omitirán datos sensibles. Aún no hay archivos PNG de evidencias incorporados al repositorio en el momento de redacción de este borrador.

## 10. Conclusión provisional

Food Store cuenta con una estructura de aplicación de consola y con la implementación de los módulos de clientes, productos y pedidos, validaciones, baja lógica y un script de respaldo. Las comprobaciones locales permiten revisar navegación y comportamiento ante ausencia de configuración.

La evaluación final de la solución dependerá de completar la integración real con MongoDB Atlas, ejecutar los casos de prueba, adjuntar evidencias y comprobar la persistencia de los datos y el respaldo. **Esta conclusión se actualizará con resultados reales**, sin dar por probado aquello que todavía depende de Atlas.

## 11. Entrega y revisión final

- [ ] Integrar descripción del negocio y modelo de Maca.
- [ ] Agregar capturas de Atlas, consola e índice de correo.
- [ ] Ejecutar y registrar las pruebas de persistencia e historial.
- [ ] Ejecutar respaldo y, si se realiza, recuperación controlada.
- [ ] Completar mediciones de RTO/RPO según lo efectivamente observado.
- [ ] Revisar que no se incluyan contraseñas ni `.env`.
- [ ] Exportar el informe completo a PDF.
- [ ] Preparar ZIP con `src/`, `scripts/`, `docs/`, `package.json`, `package-lock.json`, `README.md` y `.env.example`; excluir `node_modules/` y `resguardos_tpi/`.
- [ ] Revisar consigna oficial y preparar defensa oral.

**Fecha de entrega registrada:** 31/10/2026, 23:59.
