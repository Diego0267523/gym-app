$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$testEmail = "testuser_$timestamp@test.com"
$testPassword = "Test12345!"
$testNombre = "Test User"

Write-Host "============================================================"
Write-Host "TESTING REGISTER & LOGIN (RATE LIMITER DESHABILITADO)" -ForegroundColor Cyan
Write-Host "============================================================"

# 1 REGISTER
Write-Host ""
Write-Host "1. TESTING REGISTER:" -ForegroundColor Yellow
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
Write-Host "Sending request to /api/auth/register..."
try {
    $registerResponse = Invoke-WebRequest -Uri "https://gym-app-gytx.onrender.com/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody `
        -TimeoutSec 15
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "STATUS: $($registerResponse.StatusCode)" -ForegroundColor Green
    Write-Host "SUCCESS: $($registerData.success)" -ForegroundColor Green
    Write-Host "MESSAGE: '$($registerData.message)'" -ForegroundColor Green
    if ($registerData.userId) {
        Write-Host "USER ID: $($registerData.userId)" -ForegroundColor Green
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "STATUS: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "ERROR: $errorBody" -ForegroundColor Red
    } else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2 LOGIN
Write-Host ""
Write-Host "============================================================"
Write-Host "2. TESTING LOGIN:" -ForegroundColor Yellow
Write-Host "Email: $testEmail"
Write-Host "Password: $testPassword"

$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

Write-Host ""
Write-Host "Sending request to /api/auth/login..."
try {
    $loginResponse = Invoke-WebRequest -Uri "https://gym-app-gytx.onrender.com/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 15
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "STATUS: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "SUCCESS: $($loginData.success)" -ForegroundColor Green
    Write-Host "MESSAGE: '$($loginData.message)'" -ForegroundColor Green
    if ($loginData.token) {
        Write-Host "TOKEN: $($loginData.token.Substring(0, 20))..." -ForegroundColor Green
        Write-Host "USER NAME: $($loginData.user.nombre)" -ForegroundColor Green
        Write-Host "USER EMAIL: $($loginData.user.email)" -ForegroundColor Green
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "STATUS: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "ERROR: $errorBody" -ForegroundColor Red
    } else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "VALIDATION SUMMARY" -ForegroundColor Magenta
Write-Host "============================================================"
Write-Host ""
Write-Host "✅ EXPECTED MESSAGES:" -ForegroundColor Green
Write-Host "   • Register Success: 'Usuario registrado correctamente con todos los datos 🚀'"
Write-Host "   • Login Success: 'Login exitoso 🚀'"
Write-Host "   • No 429 errors (Rate Limiter disabled)"
Write-Host ""
Write-Host "============================================================"
