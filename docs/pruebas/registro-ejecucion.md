# Food Store — Registro de ejecución de pruebas

**Trabajo Práctico Integrador — Bases de Datos II**  
**Responsables:** Ricardo y Maca  
**Registro actualizado:** 18/10/2026  
**Base prevista:** `foodstore_tpi`

Este registro complementa el [plan de 41 pruebas](plan-de-pruebas.md). La información se basa en las capturas disponibles, los resultados compartidos por Ricardo y el estado comprobado del repositorio. Las pruebas de integración con MongoDB Atlas **todavía no se ejecutaron**.

## 1. Resultados locales y evidencias

| Caso | Resultado conocido | Estado documentado | Evidencia en GitHub |
|---|---|---|---|
| **APP-01** | `npm start`, navegación por Clientes, Productos y Pedidos y regreso al principal; opción `0` produjo `Programa finalizado.` y retorno a PowerShell sin errores | **Aprobado** | [Principal](../capturas/aplicacion/APP-01-menu-principal.png), [Productos](../capturas/aplicacion/APP-01-menu-productos.png), [Pedidos](../capturas/aplicacion/APP-01-menu-pedidos.png), [Navegación completa](../capturas/aplicacion/APP-01-navegacion-completa.png), [Salida final](../capturas/aplicacion/APP-01-salida-programa.png) |
| **APP-02** | Ricardo confirmó que una opción inválida muestra mensaje y conserva el menú | **Aprobado (informado por ejecutor)** | [Opción inválida](../capturas/aplicacion/APP-02-opcion-invalida.png) |
| **APP-03** | Ricardo confirmó que la ausencia de URI produce error controlado y permite continuar | **Aprobado (informado por ejecutor)** | [Sin URI](../capturas/aplicacion/APP-03-sin-uri.png) |
| **BAK-01** | `backup.ps1` mostró `Falta configurar MONGODB_URI en el archivo .env.` y `$LASTEXITCODE` devolvió `1` | **Aprobado (resultado observado)** | [Error de respaldo](../capturas/backup/BAK-01-error-backup.png) |
| **SEG-01** | Se verificó árbol de `main`, ocho commits publicados y configuración de exclusiones. No aparece un archivo `.env` ni un respaldo privado en esos archivos versionados. `.env.example` contiene URI vacía | **Parcial; faltan revisión visual de imágenes y verificación del ZIP final** | Revisión textual del repositorio; no existe todavía una captura específica |

**Fecha de ejecución:** 18/10/2026 para los ensayos observados o informados en la conversación. La hora exacta de cada caso no se consignó en una planilla; no se inventa. La mera existencia del archivo PNG no demuestra su contenido: revisar visualmente las capturas antes de presentar la evidencia final.

**Conteo de evidencias publicadas:** 8 imágenes, siete en `docs/capturas/aplicacion/` y una en `docs/capturas/backup/`.

## 2. APP-01 — Validación completada

APP-01 fue completada el 18/10/2026. El comando ejecutado desde la raíz del proyecto fue:

```powershell
npm start
```

Desde el menú principal se ingresó `0` y se observó `Programa finalizado.` seguido del retorno al prompt `PS ...>` sin errores. Captura subida:

`docs/capturas/aplicacion/APP-01-salida-programa.png`

APP-01 queda registrada como **Aprobada**, respaldada por los resultados observados y la captura publicada.

## 3. SEG-01 — Seguridad: revisión documental

Se comprobaron los siguientes hechos:

- El repositorio usa la rama pública `main`.
- En el árbol versionado no hay archivo `.env` ni carpeta `resguardos_tpi/`.
- El archivo `.gitignore` excluye `node_modules/`, `.env`, `resguardos_tpi/` y `*.log`.
- El archivo `.env.example` solamente contiene una URI vacía y el nombre de la base.
- La lista de archivos de los ocho commits existentes hasta la comprobación no contiene un `.env` ni respaldos privados.

Estas comprobaciones no constituyen una auditoría completa del contenido de las imágenes, datos sensibles que pudieran figurar en texto o futuros archivos de entrega. Antes de cerrar SEG-01, abrir y revisar **visualmente las siete capturas** y controlar el ZIP que se va a entregar. No publicar URI reales, contraseñas o datos privados.

## 4. Pruebas pendientes que requieren Atlas

Aún falta verificar conexión y permisos (`ATL-01`, `ATL-02`); el CRUD real (`CLI-01` a `CLI-09`, `PRO-01` a `PRO-07` y `PED-01` a `PED-13`); y respaldos/recuperación (`BAK-02` a `BAK-06`).

No se considerarán aprobadas hasta registrar resultados reales y evidencias en la aplicación y Atlas.

## 5. Plantilla para siguientes ejecuciones

| Campo | Valor |
|---|---|
| Caso | [Completar] |
| Fecha/hora y responsable | [Completar] |
| Precondiciones y datos utilizados | [Completar] |
| Resultado esperado | [Completar] |
| Resultado observado | [Completar] |
| Estado: Aprobado / Falló / Bloqueado | [Completar] |
| Archivo de evidencia o incidencia | [Completar] |

## 6. Próximos pasos

1. APP-01 completada: conservar la evidencia de salida en la entrega final.
2. Comprobar visualmente los siete archivos PNG y cerrar SEG-01 cuando corresponda.
3. Esperar la configuración de Atlas de Maca y ejecutar las pruebas de integración.
4. Completar las capturas de las colecciones, los tipos BSON y el respaldo real.
5. Unificar los resultados comprobados en el informe final en PDF.

**Nota:** la carpeta con las capturas publicadas es [Aplicación](../capturas/aplicacion/) y [Backup](../capturas/backup/). La información de este registro representa el estado comprobado al 18/10/2026, no un certificado de funcionamiento en Atlas.
