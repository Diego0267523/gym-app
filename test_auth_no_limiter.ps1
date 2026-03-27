$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$testEmail = "testuser_$timestamp@test.com"
$testPassword = "Test12345!"
$testNombre = "Test User"

Write-Host "============================================================"
Write-Host "TESTING REGISTER & LOGIN (SIN RATE LIMITER)" -ForegroundColor Cyan
Write-Host "============================================================"

# 1 REGISTER
Write-Host ""
Write-Host "1. TESTING REGISTER (SIN RATE LIMITER):" -ForegroundColor Yellow
Write-Host "Email: $testEmail"
Write-Host "Password: $testPassword"
Write-Host "Name: $testNombre"

$registerBody = @{
    nombre = $testNombre
    email = $testEmail
    password = $testPassword
    peso = 75
    altura = 180
    genero = "M"
    objetivo = "Ganar musculo"
    frecuencia = "4-5 veces"
    nivelActividad = "Moderado"
    tiempoObjetivo = "3 meses"
    condiciones = ""
    medicamentos = ""
    lesiones = ""
    restricciones = ""
    profesion = "Engineer"
    sueno = "7-8 horas"
} | ConvertTo-Json

Write-Host ""
Write-Host "Sending request to /test/register..."
try {
    $registerResponse = Invoke-WebRequest -Uri "https://gym-app-gytx.onrender.com/api/auth/test/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody `
        -TimeoutSec 15
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "Status: $($registerResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Success: $($registerData.success)" -ForegroundColor Green
    Write-Host "Message: $($registerData.message)" -ForegroundColor Green
    if ($registerData.userId) {
        Write-Host "User ID: $($registerData.userId)" -ForegroundColor Green
        $userId = $registerData.userId
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    } else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2 LOGIN
Write-Host ""
Write-Host "============================================================"
Write-Host "2. TESTING LOGIN (SIN RATE LIMITER):" -ForegroundColor Yellow
Write-Host "Email: $testEmail"
Write-Host "Password: $testPassword"

$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

Write-Host ""
Write-Host "Sending request to /test/login..."
try {
    $loginResponse = Invoke-WebRequest -Uri "https://gym-app-gytx.onrender.com/api/auth/test/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 15
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Success: $($loginData.success)" -ForegroundColor Green
    Write-Host "Message: $($loginData.message)" -ForegroundColor Green
    Write-Host "Token: $($loginData.token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "User Name: $($loginData.user.nombre)" -ForegroundColor Green
    Write-Host "User Email: $($loginData.user.email)" -ForegroundColor Green
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    } else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "TEST MESSAGES VALIDATION" -ForegroundColor Magenta
Write-Host "============================================================"
Write-Host ""
Write-Host "✅ EXPECTED MESSAGES:" -ForegroundColor Green
Write-Host "   Register: 'Usuario registrado correctamente con todos los datos 🚀'"
Write-Host "   Login: 'Login exitoso 🚀'"
Write-Host ""
Write-Host "============================================================"
