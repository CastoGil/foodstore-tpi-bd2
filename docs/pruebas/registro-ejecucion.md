# Food Store — Registro de ejecución de pruebas

**TPI Bases de Datos II · Ricardo y Maca**  
**Fecha de apertura:** 18/10/2026  
**Estado:** registro en preparación; no confundir resultados informados con evidencias cargadas.

Este registro complementa [el plan de 41 pruebas](plan-de-pruebas.md). La confirmación de una prueba requiere anotar resultado observado y adjuntar su evidencia. No se inventan capturas ni se presentan pruebas sobre Atlas como ejecutadas.

## 1. Seguimiento de las pruebas locales

| ID | Actividad | Resultado observado o informado | Estado de evidencia | Archivo sugerido |
|---|---|---|---|---|
| APP-01 | Inicio, navegación por Clientes, Productos y Pedidos, regreso y salida | Inicio y tres menús visibles en capturas compartidas en la conversación; retorno al principal visible. **Cierre definitivo del programa sin captura confirmada.** | Parcial: faltan subir capturas y verificar salida final | `APP-01-navegacion-completa.png`, `APP-01-salida-programa.png` |
| APP-02 | Ingresar opción inválida y comprobar continuidad | Ricardo informó que el resultado fue correcto. | Captura pendiente de incorporación al repositorio | `APP-02-opcion-invalida.png` |
| APP-03 | Operación sin `MONGODB_URI` y continuidad del menú | Ricardo informó que el resultado fue correcto. | Captura pendiente de incorporación al repositorio | `APP-03-sin-uri.png` |
| BAK-01 | Ejecutar respaldo sin URI | Según el README, una verificación local anterior produjo código de salida 1; repetirla para adjuntar evidencia actual. | Captura y nueva ejecución pendientes | `BAK-01-error-backup.png` |
| SEG-01 | Revisar archivos publicados y exclusiones | Revisión del árbol público de `main` al 18/10/2026: no figura un archivo `.env` ni la carpeta de respaldos; `.gitignore` excluye ambos. `.env.example` no incluye credenciales. | Revisión parcial; falta comprobar historial y capturas nuevas | `SEG-01-revision-seguridad.png` |

**Nota:** el estado de APP-02 y APP-03 refleja el resultado *informado por Ricardo*; debe completarse con fecha, captura y observación escrita antes de cerrar el expediente de evidencias. APP-01 no se cierra hasta confirmar la salida del programa.

## 2. Próxima prueba: BAK-01, sin Atlas

**Precondición:** en el archivo local `.env`, `MONGODB_URI` debe estar vacía. No publicar el contenido del archivo si llegara a contener credenciales.

Desde PowerShell, en la raíz del proyecto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
$LASTEXITCODE
```

**Esperado:** mensaje `Falta configurar MONGODB_URI en el archivo .env.` y resultado final `1`; no se debe generar un respaldo válido. Registrar exactamente lo observado y sacar una captura de la consola. Si el archivo `.env` aún no existe, crearlo a partir de `.env.example` sin configurar la URI; de lo contrario, el error esperado será `No se encontro el archivo .env...`, que es un escenario diferente.

## 3. Plantilla para completar cada caso ejecutado

| Campo | Valor |
|---|---|
| ID de prueba | [Completar] |
| Fecha y hora | [Completar] |
| Responsable | [Completar] |
| Precondiciones | [Completar] |
| Datos de entrada | [Completar] |
| Resultado esperado | [Completar] |
| Resultado observado | [Completar] |
| Estado final: Aprobado / Falló / Bloqueado | [Completar] |
| Archivo de captura o incidencia | [Completar] |

## 4. Evidencias pendientes y ubicación

- `docs/capturas/aplicacion/`: APP-01, APP-02 y APP-03.
- `docs/capturas/backup/`: BAK-01; BAK-02 a BAK-06 cuando Atlas esté disponible.
- `docs/capturas/atlas/`: conexión, índices, documentos y tipos BSON solo después de ejecutar la integración.

Las imágenes compartidas en el chat **no se copian automáticamente al repositorio**. Guardarlas manualmente, revisar que no muestren credenciales y agregarlas mediante Git.

## 5. Alcance de la revisión de seguridad

La ausencia de `.env` en el árbol actual y su exclusión por `.gitignore` es una comprobación inicial, **no prueba por sí sola** que nunca se haya expuesto información sensible en commits anteriores, enlaces, capturas o copias del proyecto. Antes de entregar, revisar historial, archivos nuevos y ZIP final.

## 6. Próximas acciones

1. Completar captura de salida final de APP-01.
2. Guardar capturas de APP-02 y APP-03.
3. Repetir BAK-01 y registrar el resultado exacto.
4. Completar SEG-01 con comprobación final del repositorio y del ZIP.
5. Esperar Atlas para pruebas ATL, CLI, PRO, PED y respaldo real.
