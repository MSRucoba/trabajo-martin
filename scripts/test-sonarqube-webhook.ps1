<#
.SYNOPSIS
  Simula el webhook de SonarQube hacia Jenkins (obtiene crumb y envía POST).

.PARAMETER JenkinsUrl
  URL base de Jenkins, por ejemplo http://192.168.18.22:8080

.PARAMETER User
  Usuario de Jenkins (ej: admin)

.PARAMETER ApiToken
  API token del usuario (se usa para autenticación Basic)

.PARAMETER ProjectKey
  Clave del proyecto Sonar (por defecto 'spaceup')

Ejemplo:
  .\scripts\test-sonarqube-webhook.ps1 -JenkinsUrl http://192.168.18.22:8080 -User admin -ApiToken 'MI_TOKEN' -ProjectKey spaceup
#>

param(
    [string]$JenkinsUrl = "http://127.0.0.1:8080",
    [string]$User = "admin",
    [string]$ApiToken = "",
    [string]$ProjectKey = "spaceup"
)

if (-not $ApiToken -or $ApiToken -eq "") {
    Write-Error "Debe proporcionar -ApiToken (token de usuario Jenkins)."
    exit 2
}

# construir header Authorization
$pair = "{0}:{1}" -f $User, $ApiToken
$bytes = [System.Text.Encoding]::UTF8.GetBytes($pair)
$basic = [Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $basic" }

Write-Host "Obteniendo crumb desde $JenkinsUrl/crumbIssuer/api/json ..."
try {
    $crumbResp = Invoke-RestMethod -Uri ("$JenkinsUrl/crumbIssuer/api/json") -Headers $headers -Method Get -ErrorAction Stop
} catch {
    Write-Warning "No se pudo obtener crumb (el servidor puede no requerirlo o la URL/credenciales son incorrectas). Intentaré continuar sin crumb."
    $crumbResp = $null
}

$crumbHeader = @{}
if ($crumbResp -and $crumbResp.crumb) {
    $field = $crumbResp.crumbRequestField
    $crumb = $crumbResp.crumb
    Write-Host "Crumb recibido: $crumb (field: $field)"
    $crumbHeader[$field] = $crumb
}

# Construir payload similar al que envía SonarQube
$payload = @{ project = @{ key = $ProjectKey }; analysis = @{ status = "SUCCESS" } } | ConvertTo-Json -Depth 10

$endpoint = "$JenkinsUrl/sonarqube-webhook/"
Write-Host "Enviando POST simulado a $endpoint ..."

$allHeaders = @{
    "Content-Type" = "application/json"
} + $headers + $crumbHeader

try {
    $resp = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $allHeaders -Body $payload -ErrorAction Stop
    Write-Host "Respuesta OK. Posible cuerpo devuelto:" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Fallo al enviar POST: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try { $_.Exception.Response.GetResponseStream() | Select-Object -First 1 | ForEach-Object { $_ } } catch {}
    }
    exit 3
}

Write-Host "Petición completada. Si Jenkins respondió 200, Sonar -> Jenkins webhook debería funcionar." -ForegroundColor Cyan
