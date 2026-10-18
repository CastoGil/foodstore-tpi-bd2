# Aplicación y mecanismo de respaldo

Responsable de la implementación: Ricardo.
Revisión e integración: Ricardo y Maca.

Estado del documento: borrador técnico.
Las pruebas contra MongoDB Atlas todavía están pendientes.

## Aplicación por consola

Food Store se desarrolla con Node.js y utiliza el driver nativo
de MongoDB para comunicarse con la base de datos foodstore_tpi.

El programa ofrece un menú principal con acceso a clientes,
productos y pedidos. Cada módulo reúne su menú y las funciones
necesarias para realizar las operaciones CRUD.

La estructura separa el inicio del programa, la conexión,
la entrada por consola y las operaciones por colección.

## Configuración de la conexión

La configuración se obtiene desde el archivo .env:

- MONGODB_URI: cadena de conexión con MongoDB Atlas.
- MONGODB_DB: nombre de la base de datos.

El archivo .env.example contiene las claves necesarias sin
credenciales y sirve como plantilla para otros equipos.

La conexión se establece cuando una operación la necesita y se
reutiliza durante la ejecución. Al finalizar el programa, se
cierran la conexión y la entrada por consola.

## Comunicación cliente-servidor

La aplicación Node.js actúa como cliente y MongoDB Atlas aloja
el servidor de base de datos.

El usuario selecciona una operación e ingresa los datos mediante
la consola. La aplicación valida la entrada y utiliza el driver
para enviar la operación a MongoDB.

El servidor procesa la solicitud y devuelve documentos o un
resultado de la operación. La aplicación interpreta la respuesta
y muestra al usuario la información correspondiente.

El uso de async y await permite esperar las respuestas de las
operaciones antes de continuar con el flujo del menú.

## Operaciones CRUD

CREATE:
Se utiliza insertOne para registrar documentos nuevos.
Los documentos se crean con activo: true.

READ:
Se utilizan find y findOne para consultar información.
Las consultas habituales incluyen el filtro activo: true.

UPDATE:
Se utiliza updateOne con $set para modificar campos específicos.
En pedidos, la modificación permite cambiar el estado de
pendiente a entregado o cancelado, conservando el detalle original.

DELETE mediante baja lógica:
Se utiliza updateOne para establecer activo: false.
No se eliminan físicamente los documentos.

## Conservación del historial

Los pedidos contienen referencias al cliente y a los productos.

Su arreglo items almacena el nombre del producto, precio unitario,
cantidad y subtotal correspondientes a la compra.

Modificar o desactivar un producto no altera el detalle guardado
en pedidos anteriores. Desactivar un cliente tampoco modifica
sus pedidos existentes.

## Validaciones previstas en el código

- Campos obligatorios.
- Formato básico del correo electrónico.
- Correo único, incluso para clientes desactivados.
- Formato de los identificadores.
- Categorías de productos admitidas.
- Precios positivos con hasta dos decimales.
- Cantidades enteras positivas dentro del rango Int32.
- Existencia de clientes y productos activos al crear pedidos.
- Transiciones de estado permitidas para pedidos.

Los importes se calculan mediante decimal.js y se almacenan como
Decimal128. Las referencias se comprueban desde la aplicación.

La eficacia de estas validaciones sobre datos persistidos debe
confirmarse durante las pruebas de integración con Atlas.

## Mecanismo de respaldo

El script scripts/backup.ps1 lee la configuración desde .env
y ejecuta mongodump para descargar la base foodstore_tpi.

Las rutas se resuelven a partir de la ubicación del script,
sin depender de una ruta fija de la computadora del desarrollador.

El destino tiene el siguiente formato:

resguardos_tpi/AAAA-MM-DD/

Dentro de esa carpeta, mongodump genera la carpeta de la base
con sus archivos BSON y metadatos.

No se aplican filtros por activo, por lo que el respaldo incluye
documentos activos y desactivados.

El script verifica la configuración, la disponibilidad de
mongodump, su código de salida y la existencia de archivos BSON.

Si la carpeta de la fecha ya existe, detiene la ejecución para
evitar mezclar o sobrescribir respaldos.

Si la ejecución falla después de crear el destino, los archivos
parciales no deben considerarse un respaldo válido.

Cuando la ejecución termina correctamente, se genera
resultado_backup.txt con información de la ejecución, sin
incorporar credenciales.

## Evidencias obtenidas hasta el momento

- Ejecución del menú principal.
- Manejo de una opción inválida.
- Navegación del menú Clientes.
- Control de MONGODB_URI vacía en la aplicación.
- Disponibilidad de mongodump y mongorestore versión 100.19.1.
- Ejecución del script con URI vacía: mensaje explicativo y
  código de salida 1.

## Pruebas pendientes

- Conexión real a Atlas.
- Alta, consulta, modificación y baja lógica en las tres colecciones.
- Validaciones contra datos reales de prueba.
- Conservación del detalle histórico de pedidos.
- Generación del respaldo completo.
- Inspección de los archivos generados.
- Incorporación de capturas y resultados al informe final.