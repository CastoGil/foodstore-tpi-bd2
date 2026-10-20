# Food Store — Borrador unificado del informe final

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo y Maca  
**Fecha del borrador:** 18/10/2026  
**Estado:** borrador integrador; faltan los apartados de Maca, resultados de MongoDB Atlas y evidencias reales. **No entregar como informe final sin completar y revisar.**

> Este documento reúne información ya registrada en el proyecto y funciona como base para el PDF final. No reemplaza `README.md`, `docs/informe/aplicacion-y-respaldo.md`, `docs/informe/rto-rpo.md`, `docs/informe/guia-integracion-y-evidencias.md` ni `docs/pruebas/plan-de-pruebas.md`.

## 1. Introducción

Food Store es una aplicación académica de gestión de pedidos desarrollada en Node.js, orientada a administrar clientes, productos y pedidos mediante una base de datos documental MongoDB alojada en Atlas. El proyecto aplica operaciones CRUD realizadas desde código, referencias entre colecciones, documentos embebidos, baja lógica y un mecanismo de respaldo.

Se optó por una aplicación de consola para concentrar el trabajo en el modelado de datos, la persistencia y su verificación. El alcance no incluye pagos, facturación, envíos ni actualización automática del stock.

## 1. Descripción del Negocio 

##Contexto y propósito del Sistema 

El proyecto Food Store surge como una solución orientada a la gestión operativa integral de un comercio gastronómico de comidas rápidas y cafetería. La plataforma centraliza el registro, control y seguimiento de las tres entidades fundamentales del negocio: el padrón de clientes, el catálogo de productos ofrecidos y las órdenes de compra (pedidos) emitidas.  

El propósito principal del sistema radica en optimizar los flujos de atención y consulta en el punto de venta, permitiendo un manejo consistente de datos transaccionales sin depender de esquemas rígidos tradicionales, aprovechando la flexibilidad y escalabilidad que provee MongoDB Atlas como motor de base de datos no relacional alojado en la nube.  

##Entidades Principales 

El modelo de datos opera a partir de tres colecciones canónicas:  

Clientes: Almacena la información de contacto e identificación de los compradores recurrentes o eventuales. Garantiza la unicidad mediante una restricción de índice único sobre la dirección de correo electrónico.  

Productos: Define el catálogo comercial clasificado por categorías (comidas, bebidas, postres), resguardando los valores nominales vigentes mediante tipos de datos decimales de alta precisión financiera (Decimal128).  

Pedidos: Registra las transacciones comerciales que asocian a un cliente emisor con una o más líneas de productos solicitados. Para mantener la fidelidad histórica, cada orden preserva los datos de los ítems en el instante exacto de la compra mediante estructuras embebidas.  

##2. Alcance del Proyecto 

Funcionalidades Incluidas 

Gestión de Clientes: Alta de nuevos perfiles, consulta de clientes activos, búsqueda por identificador canónico (ObjectId), modificación de datos de contacto y baja lógica a través de la bandera booleana activo.  

Control de Catálogo de Productos: Registro, actualización de precios y categorización de productos, con soporte para deshabilitación lógica en lugar de borrado físico.  

Emisión y Consulta de Pedidos: Generación de órdenes de compra compuestas, cálculo de subtotales por ítem y total acumulado, seguimiento por estados operativos (pendiente, en preparación, entregado, cancelado) y vinculación directa con el cliente solicitante.  

Seguridad y Disponibilidad: Almacenamiento seguro en un clúster MongoDB Atlas M0 (AWS sa-east-1) con autenticación SCRAM, restricción de acceso por red y políticas de respaldo manual/programado mediante herramientas nativas (mongodump / mongorestore).  

 

##Límites del Sistema y Exclusiones (Fuera de Alcance) 

Para delimitar formalmente la complejidad operativa del trabajo práctico, se establecen explícitamente las siguientes exclusiones:  

Sin Pasarela de Pagos Online: El sistema no integra APIs de cobranza externa (como Mercado Pago, Stripe o redes bancarias); las operaciones se consideran abonadas o pendientes de cobro bajo mecanismos manuales en mostrador.  

Sin Facturación Electrónica: No se contempla la emisión de comprobantes fiscales legales ni la comunicación directa con organismos recaudadores (AFIP/ARCA).  

Sin Control Automático de Inventario (Stock): La plataforma no efectúa descuentos de existencias físicas de materias primas ni valida cupos mínimos de depósito al momento de confirmar un pedido.  

Sin Autenticación de Usuarios Finales (Clientes): La aplicación está concebida como una consola de administración interna para el personal del local; los clientes no cuentan con portal de autoservicio ni credenciales de acceso. 

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
![Visión General del Clúster](../capturas/atlas/cluster_overview.png)
![Configuración de Red](../capturas/atlas/network_access.png)
![Usuario Database Access](../capturas/atlas/database_access.png)
![Índice Único Email](../capturas/atlas/indice_email_unique.png)
![Datos Clientes](../capturas/atlas/datos_clientes.png)
![Datos Productos](../capturas/atlas/datos_productos.png)
![Datos Pedidos](../capturas/atlas/datos_pedidos.png)
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
