# Food Store — Trabajo Práctico Integrador de Bases de Datos II

**Integrantes:** Ricardo y Maca  
**Repositorio:** [CastoGil/foodstore-tpi-bd2](https://github.com/CastoGil/foodstore-tpi-bd2)  
**Base de datos:** `foodstore_tpi`  
**Estado del proyecto (18/10/2026):** implementación incorporada; integración y pruebas reales con MongoDB Atlas pendientes.

## 1. Descripción y objetivo

Food Store es una aplicación de consola desarrollada con **Node.js** y el driver nativo de **MongoDB** para administrar clientes, productos y pedidos almacenados en MongoDB Atlas.

El objetivo del TPI es aplicar modelado NoSQL, persistencia en la nube, operaciones CRUD desde código, relaciones mediante referencias y documentos embebidos, baja lógica y generación de respaldos mediante un script.

Se mantiene una estructura sencilla, acorde con el alcance del trabajo. **No se implementan** pagos, facturación, envíos, actualización automática de stock, frontend ni video demostrativo.

## 2. Tecnologías

| Tecnología | Uso |
| --- | --- |
| Node.js 24.x y npm | Ejecución y gestión de dependencias |
| MongoDB (driver nativo) | Acceso a las colecciones |
| MongoDB Atlas M0 | Alojamiento de la base de datos |
| `dotenv` | Lectura de configuración desde `.env` |
| `decimal.js` | Cálculo preciso de importes |
| PowerShell y `mongodump` | Respaldo bajo demanda |
| Git y GitHub | Control de versiones y trabajo compartido |

## 3. Funcionalidades y alcance

- **Clientes:** alta, consulta, modificación y baja lógica.
- **Productos:** alta, consulta, modificación y baja lógica.
- **Pedidos:** alta, consulta, cambio de estado y baja lógica.
- **Respaldo:** exportación de la base mediante `scripts/backup.ps1`.

Las operaciones sobre MongoDB ya están programadas, pero **deben validarse con una conexión real a Atlas** antes de considerarlas funcionalmente aprobadas.

## 4. Estructura del proyecto

```text
foodstore-tpi-bd2/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── config/
│   │   └── conexion.js
│   ├── consola/
│   │   └── entrada.js
│   └── operaciones/
│       ├── clientes.js
│       ├── productos.js
│       └── pedidos.js
├── scripts/
│   └── backup.ps1
└── docs/
    ├── capturas/
    │   ├── aplicacion/
    │   ├── atlas/
    │   └── backup/
    ├── datos-ejemplo/
    ├── modelo/
    ├── informe/
    │   ├── aplicacion-y-respaldo.md
    │   ├── guia-integracion-y-evidencias.md
    │   └── rto-rpo.md
    └── pruebas/
        └── plan-de-pruebas.md
```

Los módulos de `src/operaciones/` contienen tanto sus menús como las funciones de acceso a datos. No se agregaron capas separadas de controladores, servicios ni repositorios.

## 5. Modelo de datos

**Base:** `foodstore_tpi`  
**Colecciones:** `clientes`, `productos` y `pedidos`.

| Colección | Campos principales |
| --- | --- |
| `clientes` | `_id`, `nombre`, `email`, `telefono`, `activo` |
| `productos` | `_id`, `nombre`, `categoria`, `precio`, `activo` |
| `pedidos` | `_id`, `clienteId`, `fecha`, `items`, `total`, `estado`, `activo` |
| `pedidos.items[]` | `productoId`, `nombreProducto`, `precioUnitario`, `cantidad`, `subtotal` |

**Tipos BSON acordados:** `ObjectId` para identificadores y referencias; `Date` para fechas; `Decimal128` para importes; `Int32` para cantidades; `Boolean` para `activo`.

### Relaciones y almacenamiento del historial

- **Linking:** `pedidos.clienteId` referencia a `clientes` y cada `items.productoId` referencia a `productos`.
- **Embedding:** los ítems se guardan dentro del pedido junto con el nombre, precio unitario, cantidad y subtotal del momento de compra.
- **Historial:** la modificación o desactivación posterior de un cliente o producto no modifica los pedidos ya registrados.
- **Integridad:** la aplicación verifica que el cliente y los productos existan y estén activos al crear un pedido.

### Reglas de negocio

- **Baja lógica:** todos los registros nuevos tienen `activo: true`; la desactivación establece `activo: false`, sin eliminar físicamente documentos. Las consultas habituales excluyen inactivos.
- **Correo único:** se guarda en minúsculas y sin espacios externos. El módulo de clientes solicita el índice `{ email: 1 }` con `unique: true`, incluso para clientes inactivos. La creación efectiva del índice está pendiente de verificarse en Atlas.
- **Categorías:** `comidas`, `bebidas` y `postres`.
- **Precios:** pesos argentinos (ARS), valores positivos con hasta dos decimales; se acepta punto o coma como separador decimal, sin separadores de miles.
- **Cantidades:** enteros positivos dentro del rango de `Int32` (`1` a `2147483647`).
- **Importes:** se calculan con `decimal.js` y se almacenan como `Decimal128` mediante cadenas decimales.
- **Estados de pedidos:** `pendiente` → `entregado` o `cancelado`. No se permiten otras transiciones posteriores. El estado comercial es independiente del campo `activo`.

## 6. Instalación, configuración y ejecución

### Requisitos

- Node.js 24.x y npm.
- MongoDB Atlas configurado, con permisos y acceso de red adecuados.
- Git (si se clona el repositorio).
- MongoDB Database Tools (`mongodump` y `mongorestore`) para respaldo y restauración.

### Pasos

Desde la raíz del proyecto:

```powershell
npm ci
Copy-Item .env.example .env
```

Configurar **únicamente en el equipo local** el archivo `.env`:

```dotenv
MONGODB_URI=<cadena-privada-de-conexion>
MONGODB_DB=foodstore_tpi
```

Iniciar la aplicación:

```powershell
npm start
```

El menú principal ofrece gestión de clientes, productos, pedidos y salida. La conexión a MongoDB se abre cuando una operación la necesita; ingresar al menú **no prueba la conexión**. Una vez conectado, el programa informa `Conexión con MongoDB establecida.`.

**Seguridad:** no publicar `.env`, contraseñas ni URIs reales en GitHub, documentación o capturas. `.gitignore` excluye `.env`, `node_modules/` y `resguardos_tpi/`.

## 7. Respaldo y recuperación

El script `scripts/backup.ps1` está implementado para ejecutar `mongodump` **bajo demanda** desde Windows. Usa rutas relativas, lee `.env` y crea respaldos en `resguardos_tpi/AAAA-MM-DD/`, con archivos BSON, metadatos y `resultado_backup.txt` cuando el proceso finaliza correctamente.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

El script no filtra por `activo`: debe incluir documentos activos e inactivos. No sobrescribe otro respaldo almacenado en la carpeta correspondiente al mismo día. **Aún falta comprobar su ejecución exitosa contra Atlas**.

El procedimiento de recuperación propuesto utiliza `mongorestore` sobre una base de ensayo separada. Los objetivos documentados son **RPO de 24 horas** y **RTO de 60 minutos**, ambos **propuestos y no verificados**. No hay una tarea periódica de respaldo instalada; por eso todavía no se garantiza el RPO.

Más detalles: [Aplicación y respaldo](docs/informe/aplicacion-y-respaldo.md) y [RTO/RPO](docs/informe/rto-rpo.md).

## 8. Documentación y plan de pruebas

Se incorporaron al repositorio los siguientes documentos:

- [Guía técnica de integración y evidencias](docs/informe/guia-integracion-y-evidencias.md): arquitectura, conexión, integración con Atlas, respaldo, recuperación y evidencias.
- [Plan de pruebas funcionales y de integración](docs/pruebas/plan-de-pruebas.md): **41 casos de prueba** con acciones, resultados esperados y estados de seguimiento.
- [Aplicación y mecanismo de respaldo](docs/informe/aplicacion-y-respaldo.md).
- [Objetivos de recuperación RTO/RPO](docs/informe/rto-rpo.md).
- [Registro de ejecución y evidencias](docs/pruebas/registro-ejecucion.md): estado real de pruebas locales, capturas faltantes y próximos pasos.
- [Borrador unificado del informe final](docs/informe/borrador-informe-final.md): base redactada para integrar el modelo de Maca y las pruebas contra Atlas.

**Evidencias locales incorporadas (18/10/2026):** siete capturas de navegación/validaciones, incluida la salida APP-01, en `docs/capturas/aplicacion/`, y una de BAK-01 en `docs/capturas/backup/`. Las capturas reales de Atlas siguen pendientes. Ver [registro de ejecución](docs/pruebas/registro-ejecucion.md) para el estado por caso.

## 9. Responsabilidades del equipo

| Responsable | Actividades principales |
| --- | --- |
| **Maca** | Descripción del negocio; modelo NoSQL; ejemplos JSON; configuración de Atlas, usuarios, acceso de red, colecciones e índice de correo; documentación y capturas de infraestructura. |
| **Ricardo** | Proyecto Node.js; conexión; menús y CRUD; validaciones; baja lógica; script de respaldo; RTO/RPO; evidencias de aplicación y backup; instrucciones y ZIP. |
| **Ambos** | Acordar cambios de modelo; integrar y probar con Atlas; verificar historial y respaldo; reunir evidencias; consolidar PDF y ZIP; preparar defensa oral. |

## 10. Estado del proyecto al 18/10/2026

### Comprobaciones locales reportadas

- Disponibilidad de Node.js, npm y dependencias.
- Revisión de sintaxis de los seis archivos JavaScript.
- Navegación de los tres menús y manejo de opciones inválidas; cierre correcto del programa confirmado con captura. APP-01 aprobada.
- Manejo de `MONGODB_URI` vacía sin cierre abrupto de la aplicación.
- **26 comprobaciones de lógica con datos simulados**, según el registro previo del proyecto.
- Disponibilidad de `mongodump` y `mongorestore` (versión reportada: `100.19.1`).
- Ejecución de `backup.ps1` sin URI: mensaje explicativo y código de salida `1`; evidencia BAK-01 publicada.
- Guía técnica, plan de 41 pruebas y registro de ejecución publicados. Capturas locales APP-01 (aprobada), APP-02, APP-03 y BAK-01 incorporadas al repositorio.

Estas comprobaciones locales **no equivalen** a una validación de persistencia real.

### Pendiente de integración y evidencias

- [ ] Finalizar configuración de Atlas e incorporar la URI localmente.
- [ ] Comprobar conectividad, permisos y acceso de red.
- [ ] Ejecutar CRUD de clientes, productos y pedidos contra Atlas.
- [ ] Verificar el índice único de correo y el rechazo de duplicados.
- [ ] Comprobar baja lógica, integridad de referencias, tipos BSON y conservación del historial.
- [ ] Validar subtotales, total, estados de pedidos y consultas de activos.
- [ ] Ejecutar un respaldo real; comprobar BSON, metadatos y registro.
- [ ] Ensayar recuperación en una base independiente, si se incluye esa prueba.
- [ ] Completar capturas, resultados de pruebas y mediciones reales de recuperación.
- [ ] Incorporar documentación de Maca y unificar el informe PDF.
- [ ] Preparar ZIP final y defensa oral.

**Criterio de avance:** una funcionalidad implementada solo se declarará probada cuando exista un resultado real y verificable.

## 11. Entrega

La entrega prevista comprende:

- Informe final en **PDF**.
- **ZIP** con código fuente, `package.json`, `package-lock.json`, documentación, scripts y `.env.example`, sin `node_modules/`, `.env` ni respaldos privados.
- Información de conexión para corrección, por el canal privado que indique la cátedra.
- Defensa oral de ambos integrantes.


**Fecha de cierre registrada:** **31 de octubre de 2026 a las 23:59**.
