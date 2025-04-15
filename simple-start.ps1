# Simple Project Starter
Write-Host "Starting URL Analyzer project setup..."

# Check env file
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..."
    @"
# API Keys
OTX_API_KEY=3265fdf8c0944f9959788eb6a7269ecfa04d7c2258bd570443cf1863199610a9
VIRUSTOTAL_API_KEY=6dc7996736dbff534052e412e5928e1c5efd70674e325fdcb766303f5e065b4b
GEMINI_API_KEY=AIzaSyBC17iAfICXqT3JTE_zY0DK3bO4dBweXdg
"@ | Set-Content ".env.local"
}

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start server
Write-Host "Starting server... Access at http://localhost:3000/url-analyzer"
npm run dev 