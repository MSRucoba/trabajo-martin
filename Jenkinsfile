// 🚀 Jenkinsfile - Pipeline CI/CD para SpaceUp
// Backend: NestJS
// Frontend: Angular
// Jenkins: http://localhost:9080
// SonarQube: http://localhost:9000

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        PROJECT_NAME = 'spaceup'

        REPO_URL    = 'https://github.com/MSRucoba/trabajo-martin.git'
        REPO_BRANCH = 'main'

        BACKEND_DIR  = 'SpaceUpBackend'
        FRONTEND_DIR = 'SpaceUpWeb'

        BACKEND_IMAGE  = 'spaceup-backend:latest'
        FRONTEND_IMAGE = 'spaceup-frontend:latest'

        BACKEND_CONTAINER  = 'spaceup-backend'
        FRONTEND_CONTAINER = 'spaceup-frontend'

        SONAR_PROJECT_KEY  = 'spaceup'
        SONAR_PROJECT_NAME = 'spaceup'
        // Esta credencial debe existir en Jenkins como Secret Text.
        // Si ves un error como "Could not find credentials entry with ID 'sonarqube-...'",
        // revisa que el ID sea exactamente 'sonarqube-token'.
        SONAR_CREDENTIALS_ID = 'sonarqube-token'
    }

    stages {

        stage('Checkout') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    echo '🔄 === CLONANDO REPOSITORIO ==='
                    cleanWs()
                    git branch: "${REPO_BRANCH}", url: "${REPO_URL}"
                }
            }
        }

        stage('Install & Test Backend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    echo '🧪 === BACKEND: INSTALANDO DEPENDENCIAS Y TESTS ==='

                    dir("${BACKEND_DIR}") {
                        sh 'npm install'
                        sh 'npm run test:cov || npm run test -- --coverage'
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🏗️ === BACKEND: COMPILANDO ==='

                    dir("${BACKEND_DIR}") {
                        sh 'node -v'
                        sh 'npm -v'
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Install Frontend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    echo '📦 === FRONTEND: INSTALANDO DEPENDENCIAS ==='

                    dir("${FRONTEND_DIR}") {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    echo '🏗️ === FRONTEND: COMPILANDO ==='

                    dir("${FRONTEND_DIR}") {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo '📊 === ANALIZANDO CÓDIGO CON SONARQUBE ==='
                withSonarQubeEnv('sonarqube') {
                    // Usar la credencial configurada en Jenkins (tipo Secret Text)
                    withCredentials([string(credentialsId: "${SONAR_CREDENTIALS_ID}", variable: 'SONAR_TOKEN')]) {
                        script {
                            def scannerCmd = """
sonar-scanner \
  -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
  -Dsonar.projectName=${SONAR_PROJECT_NAME} \
  -Dsonar.sources=${BACKEND_DIR}/src,${FRONTEND_DIR}/src \
  -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts,**/*.entity.ts,**/seeds/** \
  -Dsonar.javascript.lcov.reportPaths=${BACKEND_DIR}/coverage/lcov.info \
  -Dsonar.coverage.exclusions=${FRONTEND_DIR}/src/** \
  -Dsonar.cpd.exclusions=${FRONTEND_DIR}/src/** \
  -Dsonar.token=${SONAR_TOKEN}
"""
                            def out = sh(script: scannerCmd, returnStdout: true).trim()
                            echo out
                            def m = out =~ /api\\/ce\\/task\\?id=([0-9a-f\\-]+)/
                            if (m) {
                                env.SONAR_CE_TASK_ID = m[0][1]
                                echo "SONAR_CE_TASK_ID=${env.SONAR_CE_TASK_ID}"
                            } else {
                                echo "No CE task id found in scanner output."
                            }
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Intentamos waitForQualityGate() primero; si falla, hacemos polling por la API de SonarQube.
                timeout(time: 15, unit: 'MINUTES') {
                    script {
                        try {
                            def qg = waitForQualityGate()
                            if (qg.status != 'OK') {
                                error "Quality Gate failed: ${qg.status}"
                            }
                        } catch (err) {
                            echo "waitForQualityGate failed or timed out: ${err}. Usando fallback por API."

                            if (!env.SONAR_CE_TASK_ID) {
                                error 'No SONAR_CE_TASK_ID available to poll. Ensure sonar-scanner output is captured.'
                            }

                            def sonarHost = env.SONAR_HOST_URL ?: 'http://host.docker.internal:9000'
                            // Poll CE task until it reaches a terminal status
                            def maxAttempts = 60
                            def attempt = 0
                            def taskStatus = ''
                            while (attempt < maxAttempts) {
                                attempt++
                                def res = sh(script: "curl -s -u ${SONAR_TOKEN}: \"${sonarHost}/api/ce/task?id=${env.SONAR_CE_TASK_ID}\"", returnStdout: true).trim()
                                def mm = res =~ /\"status\"\s*:\s*\"([^\"]+)\"/
                                if (mm) {
                                    taskStatus = mm[0][1]
                                    echo "CE task status: ${taskStatus}"
                                    if (taskStatus == 'SUCCESS' || taskStatus == 'FAILED' || taskStatus == 'CANCELED') {
                                        break
                                    }
                                }
                                sleep 10
                            }

                            if (taskStatus != 'SUCCESS') {
                                error "SonarQube CE task did not finish successfully: ${taskStatus}"
                            }

                            // Obtener analysisId y consultar Quality Gate
                            def taskRes = sh(script: "curl -s -u ${SONAR_TOKEN}: \"${sonarHost}/api/ce/task?id=${env.SONAR_CE_TASK_ID}\"", returnStdout: true).trim()
                            def ma = taskRes =~ /\"analysisId\"\s*:\s*\"([0-9a-f\\-]+)\"/
                            def analysisId = ma ? ma[0][1] : ''
                            if (!analysisId) {
                                error 'Could not obtain analysisId from SonarQube CE task.'
                            }

                            def qgres = sh(script: "curl -s -u ${SONAR_TOKEN}: \"${sonarHost}/api/qualitygates/project_status?analysisId=${analysisId}\"", returnStdout: true).trim()
                            def mq = qgres =~ /\"status\"\s*:\s*\"([A-Z]+)\"/
                            def qgStatus = mq ? mq[0][1] : ''
                            echo "Quality Gate status (API): ${qgStatus}"
                            if (qgStatus != 'OK') {
                                error "Quality Gate failed: ${qgStatus}"
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🐳 === CONSTRUYENDO IMAGEN BACKEND ==='
                    sh "docker build -t ${BACKEND_IMAGE} ./${BACKEND_DIR}"
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🐳 === CONSTRUYENDO IMAGEN FRONTEND ==='
                    sh "docker build -t ${FRONTEND_IMAGE} ./${FRONTEND_DIR}"
                }
            }
        }

        stage('Clean Deploy') {
            steps {
                echo '🧹 === LIMPIANDO CONTENEDORES ANTERIORES ==='

                sh "docker stop ${BACKEND_CONTAINER} || true"
                sh "docker rm ${BACKEND_CONTAINER} || true"

                sh "docker stop ${FRONTEND_CONTAINER} || true"
                sh "docker rm ${FRONTEND_CONTAINER} || true"

                // Limpia cualquier contenedor que esté usando esos puertos
                sh "docker ps -q --filter publish=3000 | xargs -r docker stop || true"
                sh "docker ps -q --filter publish=4200 | xargs -r docker stop || true"
            }
        }

        stage('Docker Deploy') {
            steps {
                echo '🚀 === LEVANTANDO BACKEND Y FRONTEND ==='

                sh "docker run -d --name ${BACKEND_CONTAINER} -p 3000:3000 ${BACKEND_IMAGE}"
                sh "docker run -d --name ${FRONTEND_CONTAINER} -p 4200:80 ${FRONTEND_IMAGE}"
            }
        }

        stage('Smoke Test') {
            steps {
                echo '🔍 === VERIFICANDO CONTENEDORES ACTIVOS ==='
                sleep(10)

                sh "docker ps --filter name=${BACKEND_CONTAINER}"
                sh "docker ps --filter name=${FRONTEND_CONTAINER}"
            }
        }
    }

    post {
        always {
            echo '🏁 === PIPELINE FINALIZADO ==='
        }

        success {
            echo '🎉 ✓ Pipeline ejecutado correctamente.'
            echo '🌐 Frontend: http://localhost:4200'
            echo '🔧 Backend: http://localhost:3000'
            echo '📊 SonarQube: http://localhost:9000'
        }

        failure {
            echo '💥 ✗ El pipeline falló. Revisa los logs de Jenkins.'
        }
    }
}