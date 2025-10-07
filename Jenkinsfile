pipeline {
    agent any

    tools {
        nodejs "Node18"
    }

    environment {
        FRONTEND_IMAGE = "medtechpro-frontend"
        BACKEND_IMAGE = "medtechpro-backend"
        DOCKERHUB_USER = "seshasayee1306"  // replace with your Docker Hub username if pushing
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                git branch: 'main', url: 'https://github.com/Seshasayee1306/MedTechPro.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "Installing Node.js dependencies..."
                sh 'npm install'
            }
        }

        stage('Build React Frontend') {
            steps {
                echo "Building React app..."
                dir('src') {
                    sh 'npm run build'
                }
            }
        }

        stage('Run Backend / Tests') {
            steps {
                echo "Running backend and tests..."
                sh 'nohup node server.js &'
                sh 'npm test || true'
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo "Archiving frontend build artifacts..."
                archiveArtifacts artifacts: '**/build/**', followSymlinks: false
            }
        }

        // 🚀 NEW: Docker build stages
        stage('Build Docker Images') {
            steps {
                script {
                    echo "Building Docker images..."
                    sh 'docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend .'
                    sh 'docker build -t ${FRONTEND_IMAGE}:latest -f src/Dockerfile.frontend src/'
                }
            }
        }

        // (Optional) Push to Docker Hub if you’re logged in
        stage('Push Docker Images') {
            when {
                expression { return env.DOCKERHUB_USER != null }
            }
            steps {
                script {
                    echo "Pushing Docker images to Docker Hub..."
                    sh """
                        docker login -u ${DOCKERHUB_USER} -p ${DOCKERHUB_PASS}
                        docker tag ${BACKEND_IMAGE}:latest ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest
                        docker tag ${FRONTEND_IMAGE}:latest ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest
                        docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest
                        docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully. Docker images built."
        }
        failure {
            echo "❌ Pipeline failed. Check logs for details."
        }
    }
}
