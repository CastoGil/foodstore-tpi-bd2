# Objetivos de recuperación: RTO y RPO

**Proyecto:** Food Store — Trabajo Práctico Integrador, Base de Datos II.

**Estado al 21/10/2026:** respaldo, restauración y consultas sobre una base recuperada comprobados. El cumplimiento sostenido de los objetivos RTO y RPO sigue pendiente de validación.

## 1. Objetivo de punto de recuperación (RPO)

El *Recovery Point Objective* (RPO) representa la pérdida máxima de datos tolerable, expresada en tiempo. Para Food Store se establece como **objetivo propuesto un RPO de 24 horas**. Ante un incidente, se busca disponer de un respaldo recuperable suficientemente reciente para no perder más de ese período de información.

El script `scripts/backup.ps1` permite ejecutar respaldos manuales con `mongodump`. Se comprobaron tres ejecuciones exitosas. Sin embargo, **no existe una tarea periódica configurada y supervisada**, de modo que no se garantiza disponer de un respaldo recuperable con una antigüedad máxima de 24 horas en cualquier momento.

La pérdida potencial depende del intervalo entre el último respaldo válido y el incidente. La frecuencia de ejecución, la detección de fallos y la capacidad de restaurar las copias son necesarias para sostener el objetivo en un entorno real.

## 2. Objetivo de tiempo de recuperación (RTO)

El *Recovery Time Objective* (RTO) establece el tiempo objetivo para restablecer el servicio tras una interrupción. Para este entorno académico se propone un **RTO de 60 minutos**.

Se realizó una restauración real mediante `mongorestore`, con una **duración medida de 2,43 segundos** para el comando. También se comprobaron los datos y se realizaron consultas desde Food Store contra la base recuperada. No obstante, **2,43 segundos no equivalen al RTO integral**: faltaría cronometrar en una misma prueba la detección del incidente, la selección del respaldo, la preparación de la configuración, la restauración y la comprobación final del funcionamiento de la aplicación.

Por lo tanto, **el cumplimiento del RTO de 60 minutos no está validado integralmente**.

## 3. Procedimiento de recuperación ejecutado

1. Se seleccionó el respaldo del **20/10/2026** ubicado en `resguardos_tpi/2026-10-20/foodstore_tpi/`.
2. Se comprobó la disponibilidad de `mongodump` y `mongorestore` (versión 100.19.1).
3. Se revisaron los tres archivos BSON, los metadatos de las colecciones y `prelude.json`.
4. Se ejecutó una simulación con `mongorestore --dryRun` para comprobar que `foodstore_tpi.*` se asignaría a `foodstore_tpi_restore_test.*`.
5. Se ejecutó la restauración real en la base independiente `foodstore_tpi_restore_test`, sin usar `--drop` sobre la base principal.
6. Se verificaron con `mongosh` las cantidades de documentos y el índice único `email_1` de la colección `clientes`.
7. Se inició Food Store con `MONGODB_DB=foodstore_tpi_restore_test` configurada temporalmente y se consultaron clientes, productos y pedidos activos.
8. Se cerró la aplicación y se comprobó que la variable de entorno temporal ya no estaba configurada.

La restauración se realizó sobre una base separada para preservar los datos de trabajo de `foodstore_tpi`.

## 4. Mediciones y resultados de las pruebas

### 4.1. Respaldo utilizado en la restauración

| Indicador | Resultado observado |
| --- | --- |
| Fecha | 20/10/2026 |
| Inicio y finalización | 22:48:24 y 22:48:33, hora local |
| Duración registrada del backup | **8,21 segundos** |
| Tamaño de los archivos de datos | **3.904 bytes (3,81 KB)** |
| Archivos en `foodstore_tpi/` | 7: tres BSON, tres archivos de metadatos y `prelude.json` |
| Resultado de `mongodump` | Código de salida 0 |
| Documentos respaldados | 5 clientes, 8 productos y 5 pedidos: **18 en total** |

El tamaño indicado corresponde a los siete archivos de la carpeta de datos y **no incluye** `resultado_backup.txt`, situado en la carpeta superior.

### 4.2. Restauración y validación funcional

| Indicador | Resultado observado |
| --- | --- |
| Fecha de restauración | 21/10/2026, alrededor de las 00:06, hora local |
| Base de destino | `foodstore_tpi_restore_test` |
| Duración del comando `mongorestore` | **2,43 segundos** |
| Resultado de `mongorestore` | Código de salida 0; **18 documentos restaurados, 0 fallidos** |
| Colecciones recuperadas | `clientes` (5), `productos` (8) y `pedidos` (5) |
| Índice verificado | `clientes.email_1`, único |
| Consultas desde Food Store | 4 clientes activos, 6 productos activos y 5 pedidos activos; sin errores observados |
| Tiempo integral de recuperación del servicio | **No medido** |

La diferencia entre documentos totales y documentos activos en clientes y productos se debe al filtro de baja lógica utilizado por la aplicación.

### 4.3. Respaldos posteriores y mejora del script

El script fue mejorado para almacenar nuevas ejecuciones en carpetas independientes con la estructura `resguardos_tpi/AAAA-MM-DD/HH-mm-ss/`. El respaldo del 20/10/2026 conserva la estructura anterior.

| Respaldo | Duración | Resultado |
| --- | ---: | --- |
| 21/10/2026, `00-50-20` | **1,93 segundos** | Tres archivos BSON, 18 documentos, código de salida 0 |
| 21/10/2026, `01-22-18` | **2,02 segundos** | Tres archivos BSON, 18 documentos, código de salida 0 |

El respaldo de las **01:22:18** se generó después de corregir un precio unitario inconsistente en un pedido de ejemplo. Tras la corrección, una verificación de solo lectura en `foodstore_tpi` analizó cinco pedidos y obtuvo **cinco cálculos correctos y cero inconsistencias aritméticas**.

**Alcance:** la restauración de 2,43 segundos se realizó con el respaldo del **20/10/2026**, no con el respaldo posterior de las 01:22:18. No se dispone de una prueba de restauración independiente de esta última copia. Además, los cambios posteriores de la base principal no se replican automáticamente en la base restaurada.

## 5. Evaluación de los objetivos

**RPO de 24 horas:** se demostraron respaldos exitosos y la capacidad de restaurar una de las copias. Sin embargo, al tratarse de una ejecución manual, no se garantiza que siempre exista una copia recuperable con la antigüedad exigida por el objetivo.

**RTO de 60 minutos:** se verificó la recuperación técnica de datos y las consultas desde la aplicación, pero no se midió de manera integral el tiempo hasta restablecer el servicio tras un incidente simulado. En consecuencia, el RTO sigue siendo una meta propuesta, no un resultado demostrado.

Las mediciones de **8,21, 1,93 y 2,02 segundos** corresponden a distintas ejecuciones de respaldo; **2,43 segundos** corresponde a la ejecución de `mongorestore`. Ninguna de esas cifras representa por sí sola el RTO completo.

## 6. Limitaciones y mejoras propuestas

- Para sostener el RPO en un entorno operativo, programar respaldos con una frecuencia adecuada, comprobar sus resultados y detectar fallos de ejecución.
- Mantener al menos una copia independiente del equipo de trabajo y definir una política de conservación y retención de respaldos.
- Medir en una prueba integral el tiempo desde la detección de un incidente hasta la recuperación funcional de la aplicación.
- Repetir periódicamente pruebas de restauración, incluida una prueba sobre el respaldo más reciente.
- Ampliar las verificaciones funcionales a operaciones controladas adicionales, no solo consultas de lectura.
- Mantener las credenciales fuera del repositorio y del ZIP de entrega y revisar los permisos de acceso a Atlas.

La implementación de estas mejoras queda propuesta y **no se declara ejecutada**.

## 7. Evidencias y documentación relacionada

- [Respaldo exitoso](../capturas/backup/BAK-02-respaldo-exitoso.png) y [archivos generados](../capturas/backup/BAK-03-archivos-respaldo.png).
- [Restauración exitosa](../capturas/backup/BKP-02-restauracion-exitosa.png) y [verificación de documentos e índice](../capturas/backup/BKP-03-verificacion-datos-restaurados.png).
- Consultas de la base recuperada: [clientes](../capturas/backup/BKP-04-validacion-clientes.png), [productos](../capturas/backup/BKP-05-validacion-productos.png) y [pedidos](../capturas/backup/BKP-06-validacion-pedidos.png).
- [Plan de pruebas](../pruebas/plan-de-pruebas.md) y [registro de ejecución](../pruebas/registro-ejecucion.md).

**Conclusión:** Food Store demostró en el entorno académico que es posible respaldar una base MongoDB Atlas, restaurar 18 documentos en una base independiente, verificar un índice único y consultar los datos recuperados desde la aplicación. Esto acredita la recuperación técnica ensayada, pero **no demuestra todavía el cumplimiento sostenido de los objetivos propuestos de RPO (24 horas) y RTO (60 minutos)**.
