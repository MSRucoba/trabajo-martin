// 🚀 Jenkinsfile para SpaceUp (NestJS + Angular)
pipeline {
    agent any

    environment {
        APP_NAME        = 'spaceup'
        DOCKER_BACKEND  = 'spaceup-backend:latest'
        DOCKER_FRONTEND = 'spaceup-frontend:latest'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node.js') {
            steps {
                sh '''
                    # Instalar Node.js 20 si no existe
                    if ! command -v node &> /dev/null; then
                        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                        apt-get install -y nodejs
                    fi
                    node --version
                    npm --version
                '''
            }
        }

        stage('Build & Test Backend') {
            steps {
                dir('SpaceUpBackend') {
                    sh 'npm ci'
                    sh 'npm run test:cov'
                    sh 'npm run build'
                }
            }
        }

        stage('Build & Test Frontend') {
            steps {
                dir('SpaceUpWeb') {
                    sh 'npm ci'
                    sh 'npm run test:ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Sonar Analysis') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    withSonarQubeEnv('sonarqube') {
                        sh '''
                            # Instalar sonar-scanner si no existe
                            if ! command -v sonar-scanner &> /dev/null; then
                                npm install -g sonarqube-scanner
                            fi
                            sonar-scanner \
                                -Dsonar.projectKey=spaceup \
                                -Dsonar.projectName=spaceup \
                                -Dsonar.sources=SpaceUpBackend/src,SpaceUpWeb/src \
                                -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts,**/*.entity.ts,**/seeds/** \
                                -Dsonar.javascript.lcov.reportPaths=SpaceUpBackend/coverage/lcov.info \
                                -Dsonar.typescript.lcov.reportPaths=SpaceUpWeb/coverage/lcov.info
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                sleep(10)
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_BACKEND}  ./SpaceUpBackend"
                    sh "docker build -t ${DOCKER_FRONTEND} ./SpaceUpWeb"

                    sh "docker stop spaceup-backend  || true"
                    sh "docker rm   spaceup-backend  || true"
                    sh "docker stop spaceup-frontend || true"
                    sh "docker rm   spaceup-frontend || true"

                    sh "docker run -d --name spaceup-backend  -p 3000:3000 ${DOCKER_BACKEND}"
                    sh "docker run -d --name spaceup-frontend -p 4200:80  ${DOCKER_FRONTEND}"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline finalizado con exito!'
        }
        failure {
            echo '❌ El pipeline fallo.'
        }
    }
}
