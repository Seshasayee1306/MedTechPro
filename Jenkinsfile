pipeline {
    agent any

    environment {
        AWS_REGION = "eu-north-1"
        ECR_REPO = "frontend-app"
        AWS_ACCOUNT_ID = "390402538328"
        IMAGE_TAG = "${env.BUILD_NUMBER}" // Use Jenkins build number as image tag
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Seshasayee1306/MedTechPro.git'
            }
        }

        stage('Verify Prerequisites') {
            steps {
                script {
                    sh '''
                        echo "Checking prerequisites..."
                        docker --version
                        docker-compose --version
                        aws --version
                    '''
                }
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        sh '''
                            echo "Logging into ECR..."
                            aws ecr get-login-password --region $AWS_REGION | \
                            docker login --username AWS --password-stdin $ECR_REGISTRY
                            echo "ECR login successful"
                        '''
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh "docker build -t ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} ."
                    sh "docker tag ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPO}:latest"
                    echo "Docker image built successfully"
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    echo "Pushing image to ECR..."
                    sh "docker push ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
                    sh "docker push ${ECR_REGISTRY}/${ECR_REPO}:latest"
                    echo "Image pushed successfully"
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    echo "Cleaning up local Docker images..."
                    sh '''
                        docker rmi ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} || true
                        docker rmi ${ECR_REGISTRY}/${ECR_REPO}:latest || true
                        docker system prune -f || true
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed'
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
