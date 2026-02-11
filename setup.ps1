# Check and setup server environment
if (-not (Test-Path "server/.env")) {
    Write-Host "Creating server/.env from .env.example..."
    Copy-Item "server/.env.example" "server/.env"
} else {
    Write-Host "server/.env already exists."
}

# Install server dependencies
Write-Host "Installing server dependencies..."
Push-Location "server"
npm install
Pop-Location

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
Push-Location "camscanner-clone"
npm install
Pop-Location

Write-Host "Setup complete!"
