// 🚀 Jenkinsfile - Pipeline CI/CD para SpaceUp
// Proyecto: NestJS Backend + Angular Frontend
// Jenkins: http://localhost:9080
// SonarQube: http://localhost:9000

pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        PROJECT_NAME = 'spaceup'

        REPO_URL     = 'https://github.com/MSRucoba/trabajo-martin.git'
        REPO_BRANCH  = 'main'

        BACKEND_DIR  = 'SpaceUpBackend'
        FRONTEND_DIR = 'SpaceUpWeb'

        DOCKER_BACKEND  = 'spaceup-backend:latest'
        DOCKER_FRONTEND = 'spaceup-frontend:latest'

        BACKEND_CONTAINER  = 'spaceup-backend'
        FRONTEND_CONTAINER = 'spaceup-frontend'

        SONAR_PROJECT_KEY  = 'spaceup'
        SONAR_PROJECT_NAME = 'spaceup'

        // Si Jenkins está en Docker, usar host.docker.internal
        // No uses localhost aquí si el análisis corre dentro de Docker/Jenkins
        SONAR_HOST_URL = 'http://host.docker.internal:9000'
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
                    echo '🧪 === BACKEND: INSTALANDO DEPENDENCIAS Y EJECUTANDO TESTS ==='

                    dir("${BACKEND_DIR}") {
                        sh 'npm ci'
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
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Install & Test Frontend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    echo '🧪 === FRONTEND: INSTALANDO DEPENDENCIAS Y EJECUTANDO TESTS ==='

                    dir("${FRONTEND_DIR}") {
                        sh 'npm ci'
                        sh 'npm run test:ci || npm test -- --watch=false --code-coverage'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🏗️ === FRONTEND: COMPILANDO ==='

                    dir("${FRONTEND_DIR}") {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '📊 === EJECUTANDO ANÁLISIS SONARQUBE CON DOCKER ==='

                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_AUTH')]) {
                        sh """
                        docker run --rm \
                            -u root \
                            -v "${WORKSPACE}:/usr/src" \
                            -w /usr/src \
                            sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName=${SONAR_PROJECT_NAME} \
                            -Dsonar.sources=${BACKEND_DIR}/src,${FRONTEND_DIR}/src \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts,**/*.entity.ts,**/seeds/** \
                            -Dsonar.javascript.lcov.reportPaths=${BACKEND_DIR}/coverage/lcov.info,${FRONTEND_DIR}/coverage/lcov.info \
                            -Dsonar.coverage.exclusions=${FRONTEND_DIR}/src/** \
                            -Dsonar.cpd.exclusions=${FRONTEND_DIR}/src/** \
                            -Dsonar.scm.disabled=false \
                            -Dsonar.javascript.node.maxspace=4096 \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_AUTH}
                        """
                    }
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🐳 === CONSTRUYENDO IMAGEN DOCKER DEL BACKEND ==='
                    sh "docker build -t ${DOCKER_BACKEND} ./${BACKEND_DIR}"
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo '🐳 === CONSTRUYENDO IMAGEN DOCKER DEL FRONTEND ==='
                    sh "docker build -t ${DOCKER_FRONTEND} ./${FRONTEND_DIR}"
                }
            }
        }

        stage('Clean Deploy') {
            steps {
                echo '🧹 === ELIMINANDO CONTENEDORES ANTERIORES ==='

                sh "docker stop ${BACKEND_CONTAINER} || true"
                sh "docker rm ${BACKEND_CONTAINER} || true"

                sh "docker stop ${FRONTEND_CONTAINER} || true"
                sh "docker rm ${FRONTEND_CONTAINER} || true"
            }
        }

        stage('Docker Deploy') {
            steps {
                echo '🚀 === LEVANTANDO BACKEND Y FRONTEND ==='

                sh "docker run -d --name ${BACKEND_CONTAINER} -p 3000:3000 ${DOCKER_BACKEND}"
                sh "docker run -d --name ${FRONTEND_CONTAINER} -p 4200:80 ${DOCKER_FRONTEND}"
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