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
                    sh """
                        sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName=${SONAR_PROJECT_NAME} \
                            -Dsonar.sources=${BACKEND_DIR}/src,${FRONTEND_DIR}/src \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts,**/*.entity.ts,**/seeds/** \
                            -Dsonar.javascript.lcov.reportPaths=${BACKEND_DIR}/coverage/lcov.info \
                            -Dsonar.coverage.exclusions=${FRONTEND_DIR}/src/** \
                            -Dsonar.cpd.exclusions=${FRONTEND_DIR}/src/**
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                sleep(15)
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
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