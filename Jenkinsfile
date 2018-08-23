
def label = "mypod-${UUID.randomUUID().toString()}"
podTemplate(label: label, containers: [
    containerTemplate(
        name: 'nodejs2', 
        image: 'node:8.9.4', 
        ttyEnabled: true, 
        command: 'cat'
        )
    ]
)

{
    node(label) {
        def branch = env.BRANCH_NAME
        stage ("Checkout") {
            container('nodejs2'){
                checkout scm
            }
        }
        stage('Install npm') {
            container('nodejs2') {
                echo 'installing npm...'
                sh 'npm i npm@latest -g'
            }
        }
        stage('Install dependencies') {
            container('nodejs2') {
                echo 'installing dependencies...'
                sh 'npm install'           
            }
        }
        stage('Test') {
            container('nodejs2') {
                echo 'Testing..'
                sh 'npm test'
            }
        }
         stage('Lint') {
            container('nodejs2') {
                echo 'Linting..'
                sh 'npm lint'
            }
        }
    }
}