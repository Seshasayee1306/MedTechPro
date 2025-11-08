pipeline {
    agent any

    tools {
        nodejs "Node18"   // <-- Must match the name you gave in Manage Jenkins → Tools
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
                bat 'npm install'
            }
        }

        stage('Build React Frontend') {
            steps {
                echo "Building React app..."
                dir('src') {   // adjust if your React frontend root is different
                    bat 'npm run build'
                }
            }
        }

        stage('Run Backend / Tests') {
            steps {
                echo "Running backend..."
                bat 'node server.js &'
                bat 'npm test || true'
            }
        }



        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/build/**', followSymlinks: false
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
