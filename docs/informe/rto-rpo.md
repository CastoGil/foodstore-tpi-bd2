# Objetivos de recuperación: RTO y RPO

**Proyecto:** Food Store — Trabajo Práctico Integrador, Base de Datos II.
**Estado:** Prueba de restauración y consultas completada; cumplimiento sostenido de RTO y RPO pendiente de validación.

## 1. Objetivo de punto de recuperación (RPO)

El *Recovery Point Objective* (RPO) establece la pérdida máxima de datos tolerable, expresada en tiempo. Para Food Store se propone un **RPO de 24 horas**: ante un incidente, el respaldo recuperable debería tener una antigüedad no mayor a 24 horas.

La ejecución registrada del respaldo fue exitosa, pero el script `mongodump` se utiliza actualmente bajo demanda. **Como no hay una ejecución periódica comprobada, el RPO de 24 horas todavía no está garantizado.** Su cumplimiento dependerá del momento del último respaldo recuperable respecto del incidente.

## 2. Objetivo de tiempo de recuperación (RTO)

El *Recovery Time Objective* (RTO) expresa el tiempo objetivo para restablecer el servicio después de una interrupción. Para el entorno académico se propone un **RTO de 60 minutos**.

Se realizó una restauración exitosa con `mongorestore`, cuyo tiempo de ejecución medido fue de **2,43 segundos**. Este dato **no equivale al RTO integral**: la medición completa también debe incluir detección del incidente, elección del respaldo, configuración, verificación de datos y recuperación del uso de la aplicación. No se cronometró ese proceso completo, por lo que el RTO propuesto sigue pendiente de validación integral.

## 3. Procedimiento aplicado en la prueba

1. Se identificó el respaldo del **20/10/2026** en `resguardos_tpi/2026-10-20/foodstore_tpi/`.
2. Se comprobó la disponibilidad de `mongodump` y `mongorestore` (versión 100.19.1).
3. Se revisó la estructura de tres archivos BSON, sus metadatos y `prelude.json`.
4. Se ejecutó `mongorestore --dryRun` y se comprobó el cambio de nombres desde `foodstore_tpi.*` hacia `foodstore_tpi_restore_test.*`.
5. Se realizó la restauración efectiva en **`foodstore_tpi_restore_test`**, sin usar `--drop` sobre la base principal.
6. Se verificaron cantidades de documentos con `mongosh` y el índice único `email_1` de `clientes`.
7. Se ejecutó Food Store con `MONGODB_DB=foodstore_tpi_restore_test` temporalmente y se probaron consultas de solo lectura de clientes, productos y pedidos.
8. Se cerró la aplicación y se comprobó que la variable temporal `MONGODB_DB` ya no estaba definida.

## 4. Mediciones y resultados observados

| Indicador | Resultado de la prueba |
|---|---|
| Fecha del respaldo | 20/10/2026 |
| Inicio y fin del backup | 22:48:24 a 22:48:33 (hora local) |
| Duración registrada del backup | **8,21 segundos** |
| Tamaño del respaldo de datos | **3.904 bytes (3,81 KB)** |
| Archivos de la carpeta de datos | 7 (3 BSON, 3 metadatos y 1 `prelude.json`) |
| Resultado de `mongodump` | Código de salida 0 |
| Restauración real | 21/10/2026, alrededor de las 00:06 (hora local) |
| Duración medida de `mongorestore` | **2,43 segundos** |
| Resultado de `mongorestore` | Código de salida 0; 18 documentos recuperados, 0 fallidos |
| Documentos restaurados | 5 clientes, 8 productos y 5 pedidos |
| Índice verificado | `clientes.email_1`, único |
| Consultas desde Food Store | 4 clientes activos, 6 productos activos y 5 pedidos activos; sin errores observados |
| Tiempo integral de recuperación | **No medido** |

El tamaño indicado corresponde exclusivamente a los siete archivos dentro de la carpeta `foodstore_tpi`; no incluye el registro `resultado_backup.txt`, que está en la carpeta superior.

La aplicación filtró únicamente registros activos en sus opciones de listado. Por eso los recuentos visibles de clientes y productos fueron inferiores a los totales restaurados.

## 5. Evaluación de los objetivos propuestos

**RPO de 24 horas:** se confirmó un respaldo recuperable, pero no hay evidencia de una periodicidad que permita garantizar este objetivo frente a cualquier incidente.

**RTO de 60 minutos:** la restauración técnica y las consultas sobre la base de pruebas fueron exitosas. No obstante, **no se midió el tiempo completo de recuperación del servicio** y, por tanto, no corresponde afirmar que se cumplió el RTO.

## 6. Limitaciones y mejoras pendientes

- Configurar y comprobar la ejecución automática del backup con una frecuencia acorde al RPO propuesto.
- Mantener una copia independiente del equipo de trabajo y definir una política de retención.
- Medir en una prueba integral el tiempo entre la detección de un incidente simulado y la recuperación funcional de la aplicación.
- Realizar futuras pruebas controladas de operaciones adicionales, no solo consultas de lectura.
- Proteger las credenciales de Atlas: no publicarlas en GitHub y rotar cualquier contraseña que haya sido expuesta.

**Conclusión:** se comprobó en un entorno académico que el respaldo puede restaurarse en una base independiente y consultarse desde Food Store sin fallos reportados. Las mediciones obtenidas respaldan esa capacidad técnica, pero no prueban por sí solas el cumplimiento sostenido de los RTO y RPO propuestos.
