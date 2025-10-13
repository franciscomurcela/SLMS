# Keycloak Setup Script
# Automatically creates realm, client and test user via Keycloak Admin REST API

param(
    [string]$KeycloakUrl = "http://localhost:8081",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin",
    [string]$RealmName = "ESg204",
    [string]$ClientId = "frontend",
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$TestUser = "testuser",
    [string]$TestPassword = "testpass"
)

Write-Host "=== Keycloak Setup Script ===" -ForegroundColor Cyan
Write-Host "Keycloak URL: $KeycloakUrl"
Write-Host "Realm: $RealmName"
Write-Host "Client ID: $ClientId"
Write-Host ""

# Function to wait for Keycloak to be ready
function Wait-ForKeycloak {
    Write-Host "Waiting for Keycloak to be ready..." -ForegroundColor Yellow
    $maxRetries = 30
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "$KeycloakUrl/health/ready" -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Keycloak is ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            $retryCount++
            Write-Host "  Attempt $retryCount/$maxRetries - Keycloak not ready yet..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "✗ Keycloak did not become ready in time" -ForegroundColor Red
    return $false
}

# Function to get admin access token
function Get-AdminToken {
    Write-Host "Getting admin access token..." -ForegroundColor Yellow
    
    try {
        $body = @{
            username = $AdminUser
            password = $AdminPassword
            grant_type = 'password'
            client_id = 'admin-cli'
        }
        
        $response = Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" -Body $body
        Write-Host "✓ Admin token obtained" -ForegroundColor Green
        return $response.access_token
    } catch {
        Write-Host "✗ Failed to get admin token: $_" -ForegroundColor Red
        return $null
    }
}

# Function to create realm
function Create-Realm {
    param($Token)
    
    Write-Host "Creating realm '$RealmName'..." -ForegroundColor Yellow
    
    $headers = @{
        'Authorization' = "Bearer $Token"
        'Content-Type' = 'application/json'
    }
    
    $realmConfig = @{
        realm = $RealmName
        enabled = $true
        displayName = "ES204 Realm"
        loginTheme = "keycloak"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms" -Headers $headers -Body $realmConfig
        Write-Host "✓ Realm '$RealmName' created successfully" -ForegroundColor Green
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  Realm '$RealmName' already exists" -ForegroundColor Yellow
            return $true
        }
        Write-Host "✗ Failed to create realm: $_" -ForegroundColor Red
        return $false
    }
}

# Function to create client
function Create-Client {
    param($Token)
    
    Write-Host "Creating client '$ClientId'..." -ForegroundColor Yellow
    
    $headers = @{
        'Authorization' = "Bearer $Token"
        'Content-Type' = 'application/json'
    }
    
    $clientConfig = @{
        clientId = $ClientId
        name = "Frontend Application"
        description = "Public client for frontend SPA"
        enabled = $true
        publicClient = $true
        standardFlowEnabled = $true
        directAccessGrantsEnabled = $true
        implicitFlowEnabled = $false
        redirectUris = @("$FrontendUrl/*", "$FrontendUrl")
        webOrigins = @("$FrontendUrl", "+")
        protocol = "openid-connect"
        attributes = @{
            'pkce.code.challenge.method' = 'S256'
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms/$RealmName/clients" -Headers $headers -Body $clientConfig
        Write-Host "✓ Client '$ClientId' created successfully" -ForegroundColor Green
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  Client '$ClientId' already exists" -ForegroundColor Yellow
            return $true
        }
        Write-Host "✗ Failed to create client: $_" -ForegroundColor Red
        return $false
    }
}

# Function to create test user
function Create-TestUser {
    param($Token)
    
    Write-Host "Creating test user '$TestUser'..." -ForegroundColor Yellow
    
    $headers = @{
        'Authorization' = "Bearer $Token"
        'Content-Type' = 'application/json'
    }
    
    $userConfig = @{
        username = $TestUser
        email = "test@example.com"
        enabled = $true
        emailVerified = $true
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Method Post -Uri "$KeycloakUrl/admin/realms/$RealmName/users" -Headers $headers -Body $userConfig
        Write-Host "✓ User '$TestUser' created" -ForegroundColor Green
        
        # Get user ID to set password
        $users = Invoke-RestMethod -Method Get -Uri "$KeycloakUrl/admin/realms/$RealmName/users?username=$TestUser" -Headers $headers
        if ($users.Count -gt 0) {
            $userId = $users[0].id
            
            # Set password
            $passwordConfig = @{
                type = "password"
                value = $TestPassword
                temporary = $false
            } | ConvertTo-Json
            
            Invoke-RestMethod -Method Put -Uri "$KeycloakUrl/admin/realms/$RealmName/users/$userId/reset-password" -Headers $headers -Body $passwordConfig
            Write-Host "✓ Password set for user '$TestUser'" -ForegroundColor Green
        }
        
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  User '$TestUser' already exists" -ForegroundColor Yellow
            return $true
        }
        Write-Host "✗ Failed to create user: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host ""
if (-not (Wait-ForKeycloak)) {
    Write-Host "Please ensure Keycloak is running: docker compose -f docker-compose.keycloak.yml up -d" -ForegroundColor Red
    exit 1
}

Write-Host ""
$token = Get-AdminToken
if (-not $token) {
    exit 1
}

Write-Host ""
if (-not (Create-Realm -Token $token)) {
    exit 1
}

Write-Host ""
if (-not (Create-Client -Token $token)) {
    exit 1
}

Write-Host ""
if (-not (Create-TestUser -Token $token)) {
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Keycloak Admin Console: $KeycloakUrl" -ForegroundColor Cyan
Write-Host "  Username: $AdminUser"
Write-Host "  Password: $AdminPassword"
Write-Host ""
Write-Host "Test User Credentials:" -ForegroundColor Cyan
Write-Host "  Username: $TestUser"
Write-Host "  Password: $TestPassword"
Write-Host ""
Write-Host "Issuer URL for backend: $KeycloakUrl/realms/$RealmName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test token endpoint:" -ForegroundColor Yellow
Write-Host "  POST $KeycloakUrl/realms/$RealmName/protocol/openid-connect/token"
Write-Host "  Body: client_id=$ClientId&grant_type=password&username=$TestUser&password=$TestPassword"
Write-Host ""
