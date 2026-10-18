# Food Store — TPI de Bases de Datos II

Integrantes: Ricardo y Maca.

Aplicación por consola desarrollada desde cero con Node.js y MongoDB
Atlas para gestionar clientes, productos y pedidos.

## Objetivo

Aplicar modelado NoSQL, persistencia Cloud, operaciones CRUD desde
código, baja lógica y automatización de respaldos.

El proyecto mantiene una estructura sencilla, de acuerdo con la
recomendación de la consigna.

## Tecnologías

- Node.js y npm.
- Driver nativo de MongoDB.
- dotenv para configuración.
- decimal.js para cálculos de importes.
- MongoDB Atlas con clúster M0 gratuito.
- PowerShell y mongodump para el respaldo.

## Alcance acordado

- Crear, consultar, modificar y desactivar clientes.
- Crear, consultar, modificar y desactivar productos.
- Crear, consultar, cambiar el estado y desactivar pedidos.
- Respaldar la base de datos mediante un script.

No se incluyen pagos, facturación, envíos ni actualización automática
de stock.

## Organización del código

- src/app.js: inicio y menú principal.
- src/config/: conexión con MongoDB.
- src/consola/: entrada de datos.
- src/operaciones/: menús y CRUD por colección.
- scripts/: script de respaldo.
- docs/: modelo, ejemplos, capturas e informe.

Los módulos de operaciones reúnen su menú y sus funciones CRUD.
No agregaremos capas de controladores, servicios y repositorios.

## División de tareas

### Maca

- Describir el negocio y el problema que resuelve.
- Documentar las colecciones, campos y relaciones.
- Preparar los ejemplos JSON con datos ficticios.
- Justificar embedding, linking y baja lógica.
- Configurar Atlas, Database Access y Network Access.
- Preparar las colecciones y los datos de prueba.
- Coordinar el índice único del correo de clientes.
- Guardar capturas de Atlas, usuarios y colecciones.
- Redactar las secciones del informe sobre modelo e infraestructura.

Ubicaciones principales:
docs/modelo/
docs/datos-ejemplo/
docs/capturas/atlas/
docs/informe/

### Ricardo

- Configurar el proyecto Node.js.
- Implementar la conexión y el menú.
- Desarrollar el CRUD de las tres colecciones.
- Implementar validaciones y baja lógica.
- Crear el script de respaldo.
- Documentar el mecanismo de recuperación y RTO/RPO.
- Guardar evidencias de la aplicación y del backup.
- Preparar instrucciones de ejecución y el ZIP.

Ubicaciones principales:
src/
scripts/
docs/capturas/aplicacion/
docs/capturas/backup/
docs/informe/

### Ambos

- Acordar cualquier cambio del modelo antes de implementarlo.
- Integrar y probar la aplicación contra Atlas.
- Revisar la baja lógica y la conservación del historial.
- Unificar el PDF y redactar la conclusión.
- Verificar el contenido del ZIP y el acceso para corrección.
- Comprender el proyecto completo para la defensa oral.

## Acuerdo del modelo

Base de datos: foodstore_tpi

Colecciones:
- clientes
- productos
- pedidos

Clientes:
_id, nombre, email, telefono, activo.

Productos:
_id, nombre, categoria, precio, activo.

Pedidos:
_id, clienteId, fecha, items, total, estado, activo.

Cada elemento de items contiene:
productoId, nombreProducto, precioUnitario, cantidad, subtotal.

Identificadores y referencias: ObjectId.
Fechas: Date.
Importes: Decimal128.
Cantidades: Int32.
Campo activo: Boolean.

Los importes se calculan con decimal.js y se convierten a Decimal128
mediante cadenas decimales. La moneda acordada es el peso argentino.
- Los precios se ingresan sin separadores de miles y con hasta dos
  decimales. Se acepta punto o coma decimal.
- Las categorías admitidas son comidas, bebidas y postres.

## Relaciones y reglas

- clienteId referencia un documento de clientes.
- productoId referencia un documento de productos.
- items se guarda embebido dentro del pedido.
- El nombre y el precio se copian al crear el pedido para conservar
  la información histórica.
- La aplicación valida la existencia de las referencias.
- Para crear pedidos, clientes y productos deben estar activos.
- Las cantidades deben ser enteros positivos.
- El programa calcula subtotales y total.
- Los pedidos pasan de pendiente a entregado o cancelado.
- El cambio de estado conserva el detalle original.

## Baja lógica

Todos los documentos nuevos se crean con activo: true.

La baja modifica activo a false. No se utilizan operaciones de
eliminación física.

Las consultas habituales, incluidos los filtros por identificador,
excluyen documentos inactivos.

Desactivar un cliente o producto no modifica pedidos anteriores.

El campo estado del pedido representa su situación comercial.
El campo activo controla la baja lógica.

## Correo único

clientes.email tendrá un índice único, también para documentos
desactivados.

Los correos se guardan en minúsculas y sin espacios externos.

El módulo de clientes solicita la creación del índice:
{ email: 1 }, con la opción unique: true.

La configuración manual de Atlas debe coincidir con esta definición.

## Configuración y ejecución

1. Abrir una terminal en la raíz del proyecto.
2. Instalar las dependencias:

   npm ci

3. Copiar .env.example como .env.
4. Completar MONGODB_URI con la conexión real de Atlas.
5. Mantener MONGODB_DB=foodstore_tpi.
6. Ejecutar:

   npm start

El archivo .env contiene credenciales privadas y no debe publicarse.

Sin MONGODB_URI se pueden recorrer los menús implementados, pero
no ejecutar operaciones sobre la base de datos.

## Respaldo previsto

El archivo scripts/backup.ps1 deberá:

- Utilizar rutas relativas al proyecto.
- Crear resguardos_tpi.
- Crear una subcarpeta con la fecha actual.
- Ejecutar mongodump contra Atlas para respaldar foodstore_tpi.
- Comprobar el resultado e informar éxito o error.

El respaldo debe incluir también los documentos desactivados.

El informe explicará RTO y RPO. Una ejecución periódica solo se
describirá como implementada si efectivamente fue configurada.

## Estado actual del proyecto

Verificado por ejecución:
- Node.js y npm disponibles.
- Dependencias instaladas.
- Comprobación de sintaxis de app.js, conexion.js, entrada.js y clientes.js.
- Reorganización de carpetas e importaciones.
- Menú principal y manejo de opción inválida.
- Navegación del menú Clientes y regreso al menú principal.
- Manejo de MONGODB_URI vacía sin cerrar el programa.
- Salida correcta del programa.
- MongoDB Database Tools disponible en PATH.
- mongodump y mongorestore versión 100.19.1.
- Ejecución de backup.ps1 con MONGODB_URI vacía:
  informa la configuración faltante y devuelve el código de salida 1.

Código incorporado, pendiente de pruebas reales con Atlas:
- Conexión con MongoDB.
- CRUD de clientes y creación del índice único de email.
- CRUD de productos.
- CRUD de pedidos.
- Integración de los tres módulos con el menú principal.
- Script PowerShell de respaldo.

Revisión local realizada:
- Sintaxis de los seis archivos JavaScript.
- Navegación de los tres menús, opciones inválidas y salida.
- Manejo de URI vacía en los tres módulos.
- 26 comprobaciones de lógica con datos simulados.

Estas comprobaciones no reemplazan las pruebas de persistencia,
permisos, índices y respaldo contra MongoDB Atlas.

Pendiente:
- Configurar Atlas e incorporar la URI.
- Verificar conexión, permisos y acceso de red.
- Probar el CRUD de clientes y productos contra Atlas.
- Comprobar el rechazo de correos duplicados.
- Verificar que los documentos desactivados permanezcan en Atlas
  y no aparezcan en las consultas habituales.
- Probar el CRUD de pedidos contra Atlas.
- Verificar referencias a clientes y productos activos.
- Comprobar subtotales, total y conservación del historial.
- Verificar cambios de estado y baja lógica de pedidos.
- Ejecutar el respaldo real contra Atlas.
- Comprobar los archivos BSON y metadatos generados.
- Registrar las evidencias del respaldo.
- Completar documentación, capturas y RTO/RPO.
- Integrar el PDF y preparar el ZIP.
- Preparar la defensa oral.

Actualizar esta sección a medida que se verifique cada avance.
Código escrito no significa funcionalidad probada.

## Requisitos del equipo

- Node.js 24.x y npm.
- Git, si se clona el repositorio.
- MongoDB Database Tools para ejecutar el respaldo.

## Ejecutar el respaldo en Windows

Desde la raíz del proyecto:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1

Requiere MONGODB_URI y MONGODB_DB configuradas en .env,
y mongodump disponible en PATH.

El script se ejecuta bajo demanda; no hay una tarea periódica instalada.

## Entrega

- Informe PDF.
- ZIP con código fuente, configuración y scripts.
- Información de conexión para corrección mediante entrega privada.
- Defensa oral con dominio integral de ambos integrantes.

El ZIP no incluirá node_modules ni dependencias pesadas.
Debe conservar package.json y package-lock.json.

La consigna compartida no exige frontend ni video.

Fecha de cierre: 31 de octubre de 2026 a las 23:59.