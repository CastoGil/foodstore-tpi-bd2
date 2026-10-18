# Food Store — Plan de pruebas funcionales y de integración

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo y Maca  
**Fecha de preparación:** 18/10/2026  
**Repositorio:** `CastoGil/foodstore-tpi-bd2`  
**Base de datos:** `foodstore_tpi`  
**Estado general:** plan organizado; la integración real permanece pendiente de MongoDB Atlas.

## 1. Objetivo

Comprobar que la aplicación por consola desarrollada en Node.js ejecute las operaciones previstas sobre MongoDB Atlas, respete las validaciones del modelo, conserve el historial mediante baja lógica y genere un respaldo verificable. Las pruebas que todavía no fueron ejecutadas no se registran como aprobadas.

### Estados de las pruebas

- **Pendiente:** todavía no fue ejecutada.
- **Aprobado:** se observó el resultado esperado y se registró evidencia.
- **Falló:** el comportamiento fue diferente al esperado.
- **Bloqueado:** no puede ejecutarse hasta cumplir un requisito previo, por ejemplo, configurar Atlas.
- **Verificación local informada:** el README registra un ensayo anterior, pero falta adjuntar evidencia a este plan.

## 2. Orden recomendado de trabajo

1. **Antes de Atlas:** recopilar capturas de los menús, opciones inválidas y errores de configuración; revisar `.gitignore`, `.env.example` y la ausencia de credenciales publicadas.
2. **Con Atlas listo:** verificar URI, credenciales, acceso de red, `ping` y permisos.
3. **Clientes:** alta, consultas, modificación, índice único de correo y baja lógica.
4. **Productos:** alta, consultas, modificación, categorías, importes `Decimal128` y baja lógica.
5. **Pedidos:** referencias, cálculos, estados, validaciones e historial.
6. **Respaldo:** generar `mongodump`, revisar archivos, ensayo de recuperación en una base distinta y registro de tiempos.
7. **Cierre:** completar estados y evidencias, actualizar el README e integrar el informe final.

## 3. Preparación y datos de prueba

1. Configurar Atlas M0, el usuario con permisos y Network Access. Completar las variables privadas en `.env`, ejecutar `npm ci` y luego `npm start`.
2. Acordar con Maca los datos ficticios y utilizar una base o un conjunto de documentos destinados a las pruebas. No eliminar físicamente registros para limpiar los datos.
3. Preparar **cliente A** (activo), **producto P1** (`comidas`, ARS `1250.50`) y **producto P2** (`bebidas`, ARS `750.25`). El pedido de **2 × P1 + 1 × P2** debe dar **ARS 3251.25**.
4. Conservar los `ObjectId` obtenidos e ingresar correos ficticios exclusivos de cada corrida, por ejemplo `qa.foodstore.20261018.01@example.com`.
5. Reservar un cliente y un producto adicionales para pruebas de baja; no desactivar los datos principales antes de terminar las pruebas de pedidos.
6. Corroborar los documentos y tipos BSON en Atlas o MongoDB Compass; no basarse solo en la pantalla de consola.

## 4. Casos de prueba

**Total: 41 casos.** Los casos que requieren Atlas se mantienen como pendientes hasta ejecutarlos. APP-02 y APP-03 cuentan con resultados correctos informados por Ricardo y archivos de evidencia subidos; BAK-01 se observó en la consola y su captura está publicada. APP-01 ya cuenta con navegación y salida final verificadas; SEG-01 requiere completar la auditoría final. Ver [registro de ejecución](registro-ejecucion.md).

### A. Aplicación y conexión

| ID | Procedimiento | Resultado esperado | Atlas | Estado / evidencia |
|---|---|---|:---:|---|
| APP-01 | Ejecutar `npm start` y recorrer los menús 1, 2, 3 y volver con 0. | Navegación correcta y salida ordenada. | No | **Aprobado:** navegación y cierre del programa verificados; evidencia `APP-01-salida-programa.png` publicada junto con las capturas de los menús |
| APP-02 | Ingresar una opción inválida. | Mensaje explicativo y continuidad del menú. | No | **Aprobado (informado por Ricardo):** evidencia `APP-02-opcion-invalida.png` publicada |
| APP-03 | Ejecutar una operación con `MONGODB_URI` vacía. | Informa falta de URI sin mostrar credenciales ni cerrar abruptamente el menú. | No | **Aprobado (informado por Ricardo):** evidencia `APP-03-sin-uri.png` publicada |
| ATL-01 | Configurar URI válida y ejecutar una consulta. | Se conecta, completa `ping` y consulta la base `foodstore_tpi`. | Sí | Pendiente |
| ATL-02 | Verificar el usuario de Atlas y sus permisos de trabajo. | Inserción y consulta permitidas en la base asignada. | Sí | Pendiente |

### B. Clientes

| ID | Procedimiento | Resultado esperado | Atlas | Estado / evidencia |
|---|---|---|:---:|---|
| CLI-01 | Crear cliente con nombre, email y teléfono válidos. | Se obtiene ObjectId; documento persistido con `activo: true`. | Sí | Pendiente |
| CLI-02 | Listar y buscar por ID un cliente activo. | Aparece el cliente correcto en consola. | Sí | Pendiente |
| CLI-03 | Modificar nombre o teléfono, dejando en blanco campos a conservar. | Solo se actualizan los campos ingresados. | Sí | Pendiente |
| CLI-04 | Crear un cliente con nombre vacío o correo mal formado. | Se rechaza sin crear el documento. | Sí | Pendiente |
| CLI-05 | Reutilizar un correo ya registrado, también cambiando mayúsculas. | Se rechaza por índice único `email`; correo normalizado a minúsculas. | Sí | Pendiente |
| CLI-06 | Buscar o modificar con ID no hexadecimal de 24 caracteres. | Se indica formato de ID inválido; no se opera sobre la base. | Sí | Pendiente |
| CLI-07 | Solicitar la baja y responder `n`. | Cancelación sin cambiar `activo`. | Sí | Pendiente |
| CLI-08 | Desactivar un cliente con confirmación `s`. | `activo: false`; deja de verse en consultas habituales, pero permanece en Atlas. | Sí | Pendiente |
| CLI-09 | Intentar reutilizar el email de un cliente ya inactivo. | Se rechaza por unicidad; el índice aplica también a documentos desactivados. | Sí | Pendiente |

**Control previo a CLI-05:** verificar que exista el índice `createIndex({ email: 1 }, { unique: true })`. Si los datos iniciales contienen correos duplicados, coordinar la resolución con Maca antes de crear el índice.

### C. Productos

| ID | Procedimiento | Resultado esperado | Atlas | Estado / evidencia |
|---|---|---|:---:|---|
| PRO-01 | Crear P1 y P2 con categorías válidas y precios decimales. | Documentos activos; precios persistidos como BSON `Decimal128`. | Sí | Pendiente |
| PRO-02 | Listar y buscar por ID productos activos. | Coinciden registros, categoría e importe. | Sí | Pendiente |
| PRO-03 | Modificar nombre, categoría o precio. | Se actualizan solo los campos indicados. | Sí | Pendiente |
| PRO-04 | Crear producto con categoría distinta de `comidas`, `bebidas` y `postres`. | Rechazo con explicación. | Sí | Pendiente |
| PRO-05 | Intentar precio 0, negativo o con más de dos decimales. | Rechazo sin persistencia. | Sí | Pendiente |
| PRO-06 | Crear precio con coma decimal, p. ej. `1500,50`. | Se acepta y persiste como `1500.50` Decimal128. | Sí | Pendiente |
| PRO-07 | Cancelar la baja de un producto y luego confirmarla. | Con `n` sigue activo; con `s` queda `activo:false`, sin eliminación física. | Sí | Pendiente |

### D. Pedidos, validaciones e historial

| ID | Procedimiento | Resultado esperado | Atlas | Estado / evidencia |
|---|---|---|:---:|---|
| PED-01 | Crear pedido con cliente activo y un producto activo. | Documento insertado, estado `pendiente`, `activo:true` y `items` embebido. | Sí | Pendiente |
| PED-02 | Crear pedido de 2 P1 a 1250.50 y 1 P2 a 750.25. | Subtotales `2501.00` y `750.25`; total `3251.25`, importes `Decimal128`, cantidades `Int32`. | Sí | Pendiente |
| PED-03 | Intentar incluir dos veces el mismo producto en un pedido. | Se impide el duplicado y se solicita otro producto. | Sí | Pendiente |
| PED-04 | Ingresar cantidad 0, negativa, decimal o mayor que 2147483647. | Se rechaza la cantidad inválida. | Sí | Pendiente |
| PED-05 | Intentar crear pedido con cliente inexistente o inactivo. | No se inserta el pedido. | Sí | Pendiente |
| PED-06 | Intentar crear pedido con producto inexistente o inactivo. | No se inserta el pedido. | Sí | Pendiente |
| PED-07 | Responder `n` a la confirmación final del pedido. | No se inserta el pedido. | Sí | Pendiente |
| PED-08 | Modificar nombre y precio de un producto después de crear un pedido. | El `nombreProducto` y `precioUnitario` del pedido anterior permanecen iguales. | Sí | Pendiente |
| PED-09 | Desactivar cliente o producto vinculado a un pedido anterior. | El pedido preexistente se conserva; la referencia histórica sigue disponible. | Sí | Pendiente |
| PED-10 | Cambiar un pedido pendiente a `entregado`. | Actualiza solo el estado; mantiene `items` y total. | Sí | Pendiente |
| PED-11 | Cambiar otro pedido pendiente a `cancelado`. | Transición correcta sin borrar su detalle. | Sí | Pendiente |
| PED-12 | Intentar cambiar estado de un pedido `entregado` o `cancelado`. | Se bloquea la nueva transición. | Sí | Pendiente |
| PED-13 | Desactivar un pedido con confirmación. | Queda `activo:false`, no aparece en consultas habituales y continúa en Atlas con su detalle. | Sí | Pendiente |

### E. Respaldo, recuperación y seguridad

| ID | Procedimiento | Resultado esperado | Atlas | Estado / evidencia |
|---|---|---|:---:|---|
| BAK-01 | Ejecutar `backup.ps1` sin `MONGODB_URI`. | Error explicativo y código de salida `1`. | No | **Aprobado:** mensaje esperado y código `1` observados; `BAK-01-error-backup.png` publicado |
| BAK-02 | Ejecutar `backup.ps1` con Atlas conectado. | Código `0`, carpeta `resguardos_tpi/AAAA-MM-DD/`, archivos `.bson` y `resultado_backup.txt`. | Sí | Pendiente |
| BAK-03 | Verificar contenidos del respaldo. | Archivos de las tres colecciones, sus metadatos y documentos activos e inactivos. | Sí | Pendiente |
| BAK-04 | Ejecutar una segunda vez el mismo día. | Advierte que la carpeta de la fecha ya existe y no sobrescribe el respaldo anterior. | Sí | Pendiente |
| BAK-05 | Restaurar una copia sobre una base **diferente** de ensayo. | `mongorestore` recupera datos; colecciones, cantidades, estado y pedidos históricos coinciden. | Sí | Pendiente |
| BAK-06 | Cronometrar respaldo y, si se ensaya recuperación, restauración y vuelta a consultas. | Se registran duraciones reales; no se presenta el RTO objetivo como medido. | Sí | Pendiente |
| SEG-01 | Revisar repositorio, `.gitignore`, `.env.example` y capturas. | No hay URI completa, contraseña ni archivo `.env` publicado. | No | **Parcial:** árbol público, historial de archivos y exclusiones revisados; falta revisión visual de todas las capturas y ZIP |


### Seguimiento de evidencia local (18/10/2026)

- **APP-01:** **Aprobado**; captura de salida final `APP-01-salida-programa.png` publicada, además de las capturas de navegación.
- **APP-02:** prueba correcta reportada y captura publicada en `docs/capturas/aplicacion/APP-02-opcion-invalida.png`.
- **APP-03:** prueba correcta reportada y captura publicada en `docs/capturas/aplicacion/APP-03-sin-uri.png`.
- **BAK-01:** salida observada `Falta configurar MONGODB_URI en el archivo .env.` y código `1`; captura publicada en `docs/capturas/backup/BAK-01-error-backup.png`.
- **SEG-01:** árbol del repositorio y archivos de texto revisados parcialmente; comprobación visual de imágenes y revisión del ZIP pendientes.

No se afirma que se hayan ejecutado pruebas con una conexión real a MongoDB Atlas.

## 5. Verificación complementaria en MongoDB Atlas

Consultar directamente los documentos desactivados con este filtro en Atlas o Compass:

```javascript
{ activo: false }
```

Comprobar que `clientes.email` tenga índice único; que `clienteId` e `items.productoId` sean `ObjectId`; que `fecha` sea `Date`; que `items.cantidad` sea `Int32`; y que `precioUnitario`, `subtotal` y `total` sean `Decimal128`. No borrar físicamente documentos para crear evidencias.

## 6. Planilla de ejecución y evidencias

Completar **una fila por cada prueba realizada**, con datos y resultados observables:

| ID | Fecha y hora | Responsable | Datos de entrada | Resultado observado | Estado | Captura / incidencia |
|---|---|---|---|---|---|---|
| CLI-01 | Por completar | Por completar | Por completar | Por completar | Pendiente | Por completar |
| PED-02 | Por completar | Por completar | Por completar | Por completar | Pendiente | Por completar |
| BAK-02 | Por completar | Por completar | Por completar | Por completar | Pendiente | Por completar |

**Ubicación de las capturas:** `docs/capturas/aplicacion/`, `docs/capturas/atlas/` y `docs/capturas/backup/`. Nombrar cada captura con el ID del caso (ejemplo: `CLI-01-alta-cliente.png`) y ocultar cualquier contraseña o URI privada.

## 7. Criterios para aprobar la integración

- [ ] La aplicación Node.js se conecta correctamente con Atlas.
- [ ] Se verifica el CRUD de clientes, productos y pedidos sobre datos persistidos.
- [ ] El índice de correo único rechaza duplicados, incluidos los de clientes desactivados.
- [ ] Las consultas habituales excluyen los documentos inactivos, sin eliminarlos físicamente.
- [ ] Los pedidos validan referencias, cantidades, cálculos y tipos BSON.
- [ ] Las modificaciones y bajas de clientes o productos no alteran el historial de pedidos.
- [ ] El respaldo `mongodump` contiene las tres colecciones, su metadata y documentos activos/inactivos.
- [ ] Se registran resultados reales y evidencias; si no se ensaya la restauración, el informe lo aclara.

## 8. Alcance de RTO y RPO

Según `docs/informe/rto-rpo.md`, **RTO = 60 minutos** y **RPO = 24 horas** son objetivos propuestos, no métricas demostradas. La duración real de restauración debe medirse, y el RPO de 24 horas requeriría respaldos efectivos con periodicidad suficiente. El script actual se ejecuta manualmente.

**Nota final:** este documento organiza las pruebas planificadas. Ninguna prueba de integración se declara aprobada antes de su ejecución real y registro de evidencia.
