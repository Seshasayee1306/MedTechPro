pipeline {
    agent any

    environment {
        AWS_REGION = "eu-north-1"
        ECR_REPO = "frontend-app"
        AWS_ACCOUNT_ID = "390402538328"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    stages {
        stage('Checkout') {
            steps {
                // Use checkout scm for Pipeline-from-SCM jobs
                checkout scm
            }
        }

        stage('Verify Prerequisites') {
            steps {
                script {
                    sh '''
                        set -e
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
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                  credentialsId: 'aws-creds']]) {
                    script {
                        sh '''
                            set -e
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
                    sh '''
                        set -e
                        # Build and tag image with both BUILD_NUMBER and latest
                        docker build -t $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG \
                                     -t $ECR_REGISTRY/$ECR_REPO:latest .
                    '''
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    sh '''
                        set -e
                        docker push $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                        docker push $ECR_REGISTRY/$ECR_REPO:latest
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    sh '''
                        set -e
                        docker rmi $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG || true
                        docker rmi $ECR_REGISTRY/$ECR_REPO:latest || true
                        docker system prune -f || true
                    '''
                }
            }
        }
    }

    post {
        always { 
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
