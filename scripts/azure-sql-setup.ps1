# Create Azure SQL (free tier) for SignalForge and output connection string + Container App update command.
# Prerequisites: az login, resource group SignalForge-RG and Container App signalforge-api already exist.

$ErrorActionPreference = "Stop"
$ResourceGroup = "SignalForge-RG"
# Try centralus with a unique name (signalforge-sql may be reserved in eastus). If RegionDoesNotAllowProvisioning, create server in Portal and run scripts/azure-sql-database-only.ps1
$Location = "centralus"
$SqlServerName = "signalforge-sql-cus"
$DbName = "SignalForge"
$AdminLogin = "signalforgeadmin"
# Generate a strong password (change or pass as parameter in production)
$AdminPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 20 | ForEach-Object { [char]$_ })

Write-Host "Creating Azure SQL logical server: $SqlServerName (admin: $AdminLogin) in $ResourceGroup ..."
az sql server create `
  --resource-group $ResourceGroup `
  --name $SqlServerName `
  --location $Location `
  --admin-user $AdminLogin `
  --admin-password $AdminPassword `
  --output none

Write-Host "Allowing Azure services to access the server (firewall)..."
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
Write-Host "=== Set on Container App (run this, replace PASSWORD if you changed it) ==="
Write-Host "az containerapp update --name signalforge-api --resource-group $ResourceGroup --set-env-vars ""ConnectionStrings__DefaultConnection=$connStr"""
Write-Host ""
Write-Host "Then restart the revision or redeploy so the API runs migrations and uses Azure SQL."
