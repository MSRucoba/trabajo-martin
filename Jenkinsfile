pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        DOCKER_REGISTRY = credentials('docker-registry-url')
        AWS_REGION = credentials('aws-region')
        SONAR_TOKEN = credentials('sonar-token')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('SpaceUpBackend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run test'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('SpaceUpWeb') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run test:ci'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npm install -g sonarqube-scanner
                        sonar-scanner \
                            -Dsonar.projectKey=spaceup \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts,**/*.test.ts \
                            -Dsonar.javascript.lcov.reportPaths=SpaceUpBackend/coverage/lcov.info,SpaceUpWeb/coverage/lcov.info \
                            -Dsonar.login=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def imageBackend = docker.build("spaceup/backend:${env.BUILD_NUMBER}", "./SpaceUpBackend")
                    def imageFrontend = docker.build("spaceup/frontend:${env.BUILD_NUMBER}", "./SpaceUpWeb")

                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        imageBackend.push()
                        imageBackend.push('latest')
                        imageFrontend.push()
                        imageFrontend.push('latest')
                    }
                }
            }
        }

        stage('Deploy to AWS') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $DOCKER_REGISTRY
                    # Aquí va tu script de despliegue a ECS/EC2/EKS
                    # ./scripts/deploy-aws.sh
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Ver consola: ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL ?: 'dev-team@example.com'}"
            )
        }
    }
}
