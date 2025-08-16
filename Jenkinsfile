pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Seshasayee1306/MedTechPro.git'

            }
        }
        stage('Build Frontend Docker') {
            steps {
                script {
                    docker.build("frontend-app:latest")
                }
            }
        }
        stage('Deploy to AWS S3') {
            steps {
                sh 'aws s3 cp build/ s3://prmaintain/ --recursive'
            }
        }
    }
}
