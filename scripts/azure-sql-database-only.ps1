# Create database + firewall on an EXISTING Azure SQL server (use when you created the server manually in Portal).
# Usage: .\azure-sql-database-only.ps1 -SqlServerName <server> -AdminLogin <user> -AdminPassword <password>
# Example: .\azure-sql-database-only.ps1 -SqlServerName myserver -AdminLogin myadmin -AdminPassword 'MyP@ss1'

param(
    [Parameter(Mandatory = $true)]
    [string] $SqlServerName,
    [Parameter(Mandatory = $true)]
    [string] $AdminLogin,
    [Parameter(Mandatory = $true)]
    [string] $AdminPassword
)

$ErrorActionPreference = "Stop"
$ResourceGroup = "SignalForge-RG"
$DbName = "SignalForge"

Write-Host "Adding firewall rule AllowAzureServices on $SqlServerName ..."
az sql server firewall-rule create `
  --resource-group $ResourceGroup `
  --server $SqlServerName `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0 `
  --output none

Write-Host "Creating database: $DbName (free tier / serverless)..."
az sql db create `
  --resource-group $ResourceGroup `
  --server $SqlServerName `
  --name $DbName `
  --edition GeneralPurpose `
  --family Gen5 `
  --capacity 2 `
  --compute-model Serverless `
  --use-free-limit `
  --free-limit-exhaustion-behavior AutoPause `
  --output none

$serverFqdn = "${SqlServerName}.database.windows.net"
$connStr = "Server=tcp:$serverFqdn,1433;Database=$DbName;User ID=$AdminLogin;Password=$AdminPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

Write-Host ""
Write-Host "=== Connection string (store securely) ==="
Write-Host $connStr
Write-Host ""
Write-Host "=== Set on Container App ==="
Write-Host "az containerapp update --name signalforge-api --resource-group $ResourceGroup --set-env-vars ""ConnectionStrings__DefaultConnection=$connStr"""
Write-Host ""
Write-Host "Then restart the Container App so the API runs migrations."
