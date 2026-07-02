param(
  [string]$SonarHostUrl,
  [string]$SonarToken,
  [string]$SonarScannerPath = $env:SONAR_SCANNER_PATH
)

Write-Host 'Ejecutando análisis SonarQube...'

$scannerArgs = @(
  '-Dsonar.projectKey=spaceup',
  '-Dsonar.sources=.',
  "-Dsonar.host.url=$SonarHostUrl",
  "-Dsonar.token=$SonarToken",
  '-Dsonar.javascript.lcov.reportPaths=SpaceUpBackend/coverage/lcov.info',
  '-Dsonar.typescript.lcov.reportPaths=SpaceUpWeb/coverage/lcov.info'
)

$candidatePaths = @()

if ($SonarScannerPath) {
  $candidatePaths += $SonarScannerPath
}

$candidatePaths += @(
  'C:\sonar-scanner\bin\sonar-scanner.bat',
  'C:\Program Files\SonarScanner\bin\sonar-scanner.bat',
  'C:\Program Files (x86)\SonarScanner\bin\sonar-scanner.bat'
)

$scannerCommand = $null

foreach ($candidate in $candidatePaths) {
  if ($candidate -and (Test-Path $candidate)) {
    $scannerCommand = $candidate
    break
  }
}

if (-not $scannerCommand) {
  $resolved = Get-Command sonar-scanner -ErrorAction SilentlyContinue
  if ($resolved) {
    $scannerCommand = $resolved.Source
  }
}

if (-not $scannerCommand) {
  throw 'No se encontró SonarScanner. Define SONAR_SCANNER_PATH o instálalo en una ruta conocida.'
}

& $scannerCommand @scannerArgs
exit $LASTEXITCODE
