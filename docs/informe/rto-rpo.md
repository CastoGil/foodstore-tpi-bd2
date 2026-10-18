# Objetivos de recuperación RTO y RPO

Estado: propuesta pendiente de validación mediante pruebas.

## RPO

El Recovery Point Objective representa la pérdida máxima de datos
tolerable, expresada en tiempo.

Para Food Store proponemos un objetivo de RPO de 24 horas.
Para sostenerlo, debe existir un respaldo exitoso con una
antigüedad no mayor a 24 horas.

El script actual se ejecuta bajo demanda. No hay una tarea
periódica configurada, por lo que todavía no se garantiza ese
objetivo.

La pérdida posible dependerá del tiempo transcurrido desde
el último respaldo exitoso hasta el incidente.

## RTO

El Recovery Time Objective representa el tiempo objetivo para
recuperar el servicio después de una interrupción.

Como objetivo inicial para el entorno académico proponemos
un RTO de 60 minutos.

Este valor es una meta de planificación, no un resultado medido.
Su viabilidad dependerá del tamaño de la base, la conexión de red,
la disponibilidad de Atlas, los permisos y la preparación del equipo.

La recuperación comprende localizar un respaldo válido,
restaurar los datos, revisar la configuración y comprobar
que la aplicación vuelva a funcionar.

## Procedimiento de recuperación propuesto

1. Identificar el incidente y elegir un respaldo válido.
2. Preparar una base de destino con los permisos necesarios.
3. Restaurar los archivos mediante mongorestore.
4. Verificar colecciones, documentos y metadatos relevantes.
5. Configurar la aplicación para utilizar la base recuperada.
6. Comprobar consultas y operaciones básicas.
7. Registrar el tiempo total de recuperación.

Una prueba inicial se realizará sobre una base separada para
preservar los datos de trabajo.

## Mediciones pendientes

- Fecha y hora del respaldo exitoso.
- Duración de generación del respaldo.
- Tamaño del respaldo.
- Tiempo de restauración, si se realiza la prueba.
- Tiempo total hasta comprobar el funcionamiento de la aplicación.

La duración del backup no equivale al RTO.

## Limitaciones

Un respaldo guardado únicamente en la misma computadora puede
perderse si falla ese equipo. Para un uso real se necesitaría
además una copia independiente y una política de conservación.

Los objetivos propuestos deberán revisarse con las mediciones.
No se presentarán estimaciones como resultados de pruebas.