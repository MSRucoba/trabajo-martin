param(
  [string]$SonarHostUrl,
  [string]$SonarToken
)


Write-Host 'Ejecutando análisis SonarQube...'

$scannerArgs = @(
  "-Dsonar.host.url=$SonarHostUrl",
  "-Dsonar.token=$SonarToken",
  '-Dproject.settings=sonar-project.properties'
)

& sonar-scanner @scannerArgs
exit $LASTEXITCODE
