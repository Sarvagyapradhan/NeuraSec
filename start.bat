@echo off
echo Starting URL Analyzer project...

rem Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local file...
    (
        echo # API Keys
        echo OTX_API_KEY=3265fdf8c0944f9959788eb6a7269ecfa04d7c2258bd570443cf1863199610a9
        echo VIRUSTOTAL_API_KEY=6dc7996736dbff534052e412e5928e1c5efd70674e325fdcb766303f5e065b4b
        echo GEMINI_API_KEY=AIzaSyBC17iAfICXqT3JTE_zY0DK3bO4dBweXdg
    ) > .env.local
)

rem Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting server...
echo Access URL Analyzer at: http://localhost:3000/url-analyzer
call npm run dev 