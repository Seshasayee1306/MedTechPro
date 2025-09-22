pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/Seshasayee1306/MedTechPro.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm install'
            }
        }

        stage('Build React Frontend') {
            steps {
                echo 'Building React frontend...'
                sh 'npm run build'
            }
        }

        stage('Run Backend / Tests') {
            steps {
                echo 'Running backend server or tests...'
                // If you have backend tests, replace with: sh 'npm test || true'
                sh 'node server.js & sleep 5' // simple example: start server briefly
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo 'Archiving frontend build...'
                archiveArtifacts artifacts: 'build/**', allowEmptyArchive: true
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
