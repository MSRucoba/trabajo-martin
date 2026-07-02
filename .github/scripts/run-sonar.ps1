param(
  [string]$SonarHostUrl,
  [string]$SonarToken,
  [string]$Workspace
)

$dockerArgs = @(
  'run',
  '--rm',
  '-e', "SONAR_TOKEN=$SonarToken",
  '-v', "${Workspace}:/usr/src",
  '-w', '/usr/src',
  'sonarsource/sonar-scanner-cli:latest',
  '-Dsonar.host.url=' + $SonarHostUrl,
  '-Dproject.settings=sonar-project.properties',
  '-Dsonar.token=' + $SonarToken
)

& docker @dockerArgs
exit $LASTEXITCODE
