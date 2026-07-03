# Configuración Jenkins + SonarQube para `spaceup`

Este documento describe pasos concretos para que el pipeline en `Jenkinsfile` funcione correctamente con SonarQube (webhook + credencial).

Requisitos previos
- Jenkins con permisos de administrador.
- Plugin SonarQube Scanner instalado en Jenkins.
- SonarQube accesible desde Jenkins (ej: `http://sonarqube:9000`).

1) Crear credencial en Jenkins (Secret Text)
- Ir a: `Manage Jenkins` → `Credentials` → (domain global) → `Add Credentials`.
- Tipo: **Secret text**
- Secret: tu token de SonarQube (lo generas en Sonar -> My Account -> Security -> Generate token)
- ID: `sonarqube-token` (o ajusta `SONAR_CREDENTIALS_ID` en `Jenkinsfile`)

2) Registrar servidor Sonar en Jenkins
- `Manage Jenkins` → `Configure System` → sección *SonarQube servers*.
- `Name`: `sonarqube` (coincide con `withSonarQubeEnv('sonarqube')`)
- `Server URL`: `http://sonarqube:9000` (o la URL real)
- Guardar.

3) Configurar webhook en SonarQube para notificar Jenkins
- En SonarQube: `Administration` (global) -> `Configuration` -> `Webhooks` o en el proyecto: `Administration` -> `Webhooks`.
- `Name`: `Jenkins Sonar webhook`
- `URL`: `http://<JENKINS_HOST>:<JENKINS_PORT>/sonarqube-webhook/` (ej: `http://jenkins:8080/sonarqube-webhook/` si Jenkins es accesible por ese host desde Sonar)
- Guardar y probar: SonarQube permite enviar una petición de prueba.

4) Probar recepción del webhook desde SonarQube
- Puedes simular el POST que Sonar envía con `curl` al endpoint de Jenkins. Ejemplo:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"task":{"id":"TEST-CE-TASK-ID","status":"SUCCESS"}}' \
  http://<JENKINS_HOST>:<JENKINS_PORT>/sonarqube-webhook/
```
- Jenkins debería responder `200` y en los logs del job aparecerá la recepción y el `waitForQualityGate` podrá completar.

5) Verificar que `waitForQualityGate()` funcione
- `waitForQualityGate()` espera a que SonarQube realice el análisis y use el webhook para notificar Jenkins.
- Si el webhook no llega al job, `waitForQualityGate()` se quedará esperando hasta agotar el tiempo de `timeout`.

6) Notas sobre problemas comunes
- Si Sonar no alcanza a enviar el webhook: revisar conectividad desde Sonar hacia Jenkins, puertos y DNS/hosts entre contenedores.
- Si Jenkins requiere CSRF token para el webhook, el endpoint `/sonarqube-webhook/` del plugin SonarQube debería aceptar solicitudes sin autenticación adicional; asegúrate de tener la versión del plugin.
- Verifica que el `SONAR_CREDENTIALS_ID` en `Jenkinsfile` coincida con el ID en Jenkins.
- Si ves el error `Could not find credentials entry with ID 'sonarqube-tokennnn...'`, entonces la configuración de credencial usada por el job no existe o está mal escrita. Crea la credencial con ID `sonarqube-token` o actualiza el valor en el `Jenkinsfile`/parámetros de build.

7) Opcional: crear credencial via Jenkins CLI (si tienes acceso al servidor Jenkins)

```bash
java -jar jenkins-cli.jar -s http://<JENKINS_HOST>:<JENKINS_PORT> create-credentials-by-xml system::system::jenkins _ <<EOF
<com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>sonarqube-token</id>
  <description>Token SonarQube for CI</description>
  <secret>MI_TOKEN_DE_SONAR</secret>
</com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
EOF
```

8) Re-ejecutar pipeline
- Una vez creadas las credenciales y el webhook, ejecuta tu job Jenkins. Si el análisis Sonar termina y Sonar envía el webhook, la etapa `Quality Gate` del `Jenkinsfile` (`waitForQualityGate()`) recogerá el resultado.

—
Si necesitas, puedo generar un pequeño script para probar localmente el endpoint webhook de Jenkins desde este equipo (si me das la URL alcanzable), o puedo intentar ejecutar la creación de la credencial mediante Jenkins CLI si me proporcionas acceso o me indicas cómo conectarme.

9) Comprobación rápida desde Windows / PowerShell

- Asegúrate de usar el puerto correcto de Jenkins; en tu caso los logs muestran `0.0.0.0:8080` — por tanto prueba `http://<TU_IP_LAN>:8080/sonarqube-webhook/`.
- Puedes usar el script PowerShell incluido en `scripts/test-sonarqube-webhook.ps1` para obtener el crumb de Jenkins y enviar una petición simulada igual a la que envía SonarQube.

Uso del script (ejemplo):

```powershell
# desde la raíz del repo
.\scripts\test-sonarqube-webhook.ps1 -JenkinsUrl http://192.168.18.22:8080 -User admin -ApiToken "MI_API_TOKEN" -ProjectKey spaceup
```

El script obtiene el `crumb` (si el servidor lo requiere) y envía un POST JSON al endpoint `/sonarqube-webhook/`. Revisa la salida para confirmar `200 OK`.

10) Qué hacer si recibes `403` al simular el webhook

- Verifica que Jenkins no esté detrás de un proxy que modifique Host/Origin.
- Asegúrate de que el contenedor publica el puerto 8080 en el host (usa `docker ps -a` y `docker port <jenkins>`).
- Opcional temporal: deshabilitar CSRF en `Manage Jenkins` → `Configure Global Security` (NO recomendado en producción).

11) Próximos pasos automatizables

- Si quieres, puedo crear un pequeño `Makefile` target o un job de prueba en Jenkins que use este script para testear la integración automáticamente antes de ejecutar `waitForQualityGate()`.

---
Archivo de helper: `scripts/test-sonarqube-webhook.ps1` (ver carpeta `scripts/`)
