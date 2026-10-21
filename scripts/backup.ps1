<#
Food Store - TPI de Bases de Datos II

Responsable de implementacion: Ricardo.
Configuracion de Atlas: coordinada con Maca.

Este script:
- Lee MONGODB_URI y MONGODB_DB desde el archivo .env.
- Usa rutas relativas a la ubicacion del proyecto.
- Crea resguardos_tpi y subcarpetas por fecha y hora.
- Permite generar varios respaldos en un mismo dia.
- Ejecuta mongodump para respaldar la base completa.
- Incluye los documentos activos e inactivos.
- Comprueba el codigo de salida de mongodump.
- Registra la duracion y el resultado del respaldo.

No escribir credenciales dentro de este archivo.
#>

$ErrorActionPreference = "Stop"

try {
    # El script esta en scripts/, un nivel debajo de la raiz.
    $raizProyecto = Split-Path -Parent $PSScriptRoot
    $rutaConfiguracion = Join-Path $raizProyecto ".env"

    if (-not (Test-Path -LiteralPath $rutaConfiguracion -PathType Leaf)) {
        throw "No se encontro el archivo .env en la raiz del proyecto."
    }

    # Leemos pares CLAVE=VALOR.
    # Separamos solo por el primer signo igual, porque la URI puede contener otros.
    $configuracion = @{}

    foreach ($linea in Get-Content -LiteralPath $rutaConfiguracion -Encoding UTF8) {
        $texto = $linea.Trim()

        if ($texto -eq "" -or $texto.StartsWith("#")) {
            continue
        }

        $partes = $texto -split "=", 2

        if ($partes.Count -ne 2) {
            continue
        }

        $clave = $partes[0].Trim()
        $valor = $partes[1].Trim()

        # Permite valores encerrados entre comillas simples o dobles.
        if ($valor.Length -ge 2) {
            $primero = $valor[0]
            $ultimo = $valor[$valor.Length - 1]

            if (
                ($primero -eq '"' -and $ultimo -eq '"') -or
                ($primero -eq "'" -and $ultimo -eq "'")
            ) {
                $valor = $valor.Substring(1, $valor.Length - 2)
            }
        }

        $configuracion[$clave] = $valor
    }

    $uriMongo = $configuracion["MONGODB_URI"]
    $nombreBase = $configuracion["MONGODB_DB"]

    if ([string]::IsNullOrWhiteSpace($uriMongo)) {
        throw "Falta configurar MONGODB_URI en el archivo .env."
    }

    if ([string]::IsNullOrWhiteSpace($nombreBase)) {
        throw "Falta configurar MONGODB_DB en el archivo .env."
    }

    # Verificamos que mongodump este disponible.
    $herramienta = Get-Command mongodump -CommandType Application `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($null -eq $herramienta) {
        throw "No se encontro mongodump. Instala MongoDB Database Tools y configura su carpeta bin en PATH."
    }

    # Generamos carpetas independientes por fecha y hora.
    $momentoActual = Get-Date
    $fechaActual = $momentoActual.ToString("yyyy-MM-dd")
    $horaActual = $momentoActual.ToString("HH-mm-ss")

    $carpetaResguardos = Join-Path $raizProyecto "resguardos_tpi"
    $carpetaDia = Join-Path $carpetaResguardos $fechaActual
    $carpetaFecha = Join-Path $carpetaDia $horaActual

    # Evitamos mezclar o sobrescribir respaldos anteriores.
    if (Test-Path -LiteralPath $carpetaFecha) {
        throw "Ya existe un respaldo con esta fecha y hora."
    }

    New-Item -ItemType Directory -Path $carpetaDia `
        -Force | Out-Null

    New-Item -ItemType Directory -Path $carpetaFecha |
        Out-Null

    Write-Host ""
    Write-Host "Iniciando respaldo de Food Store..."
    Write-Host "Base de datos: $nombreBase"
    Write-Host "Destino: $carpetaFecha"
    Write-Host ""

    $inicioRespaldo = Get-Date

    # Sin filtros: se respaldan tambien los documentos con activo: false.
    & $herramienta.Source `
        "--uri=$uriMongo" `
        "--db=$nombreBase" `
        "--out=$carpetaFecha"

    $codigoSalida = $LASTEXITCODE

    if ($codigoSalida -ne 0) {
        throw "mongodump termino con codigo $codigoSalida. La carpeta puede contener archivos incompletos y no debe considerarse un respaldo valido."
    }

    # Comprobamos que se hayan generado archivos BSON.
    $archivosBson = @(
        Get-ChildItem -LiteralPath $carpetaFecha `
            -Recurse -File -Filter "*.bson"
    )

    if ($archivosBson.Count -eq 0) {
        throw "mongodump no genero archivos BSON. Verifica el nombre de la base y que existan las colecciones."
    }

    # Calculamos la duracion del respaldo.
    $finRespaldo = Get-Date

    $duracionSegundos = [math]::Round(
        ($finRespaldo - $inicioRespaldo).TotalSeconds,
        2
    )

    # Generamos un registro sin incluir credenciales.
    $registro = @(
        "Food Store - Respaldo"
        "Base: $nombreBase"
        "Inicio: $($inicioRespaldo.ToString('yyyy-MM-dd HH:mm:ss'))"
        "Fin: $($finRespaldo.ToString('yyyy-MM-dd HH:mm:ss'))"
        "Duracion en segundos: $duracionSegundos"
        "Archivos BSON: $($archivosBson.Count)"
        "Codigo de salida de mongodump: $codigoSalida"
    )

    $rutaRegistro = Join-Path $carpetaFecha "resultado_backup.txt"

    $registro | Set-Content -LiteralPath $rutaRegistro -Encoding UTF8

    Write-Host ""
    Write-Host "Respaldo generado correctamente."
    Write-Host "Archivos BSON encontrados: $($archivosBson.Count)"
    Write-Host "Duracion: $duracionSegundos segundos"
    Write-Host "Registro: $rutaRegistro"

    exit 0
}
catch {
    Write-Host ""
    Write-Host "No se completo el respaldo."
    Write-Host $_.Exception.Message

    exit 1
}