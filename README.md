# SignalForge - AI Stock Trading Intelligence Platform

A full-stack AI-powered stock trading intelligence platform with real-time market data, AI signals, options flow analysis, and smart money tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | .NET 10, ASP.NET Core, Entity Framework Core, SignalR |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Mobile** | React Native, Expo SDK 55, Expo Router |
| **Database** | SQL Server 2022 |
| **Cache** | Redis (optional) |
| **AI** | Core42 AI (GPT-4o compatible) |
| **Market Data** | Polygon.io |

## Features

### Core Trading
- Real-time stock quotes and candlestick charts
- AI-generated Buy/Sell/Hold signals with confidence scores
- Technical indicators (RSI, MACD, SMA, Bollinger Bands, ATR)
- Options flow analysis
- News with sentiment analysis

### Unique Features
- **AI Trade Thesis** - Full research report with bull/bear case and entry/exit prices
- **Fear & Greed Index** - Composite market sentiment gauge
- **Smart Money Tracker** - Institutional vs retail flow visualization
- **Market Pulse Timeline** - Real-time chronological event feed
- **Portfolio Risk Radar** - Multi-axis risk visualization
- **Backtesting Engine** - Test 4 strategies against historical data
- **AI Chat Assistant** - Conversational stock analysis

### Platform
- JWT authentication with refresh tokens
- Role-based access control (Admin, Moderator, Analyst, User)
- Subscription tiers (Free, Pro, Elite) with feature gating
- Real-time updates via SignalR WebSockets
- Toast notifications with audio chime
- Admin dashboard with user/role management

## Quick Start

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- SQL Server (or SQL Server Express)

### Backend
```bash
cd src/SignalForge.API
dotnet run --environment Development
```
API runs at http://localhost:5280
Swagger at http://localhost:5280/swagger

### Frontend
```bash
cd src/SignalForge.Web
npm install
npm run dev
```
App runs at http://localhost:5173

### Mobile
```bash
cd src/SignalForge.Mobile
npm install
npx expo start
```

### Docker
```bash
docker-compose up -d
```

## Test Accounts

| Email | Password | Role | Tier |
|-------|----------|------|------|
| admin@signalforge.com | Admin@12345! | Admin | Elite |
| pro@signalforge.com | ProUser123! | User | Pro |
| free@signalforge.com | FreeUser123! | User | Free |

## API Endpoints (50+)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

### Stocks
- GET /api/stocks/search?q={query}
- GET /api/stocks/{symbol}/quote
- GET /api/stocks/{symbol}/history
- GET /api/stocks/{symbol}/indicators
- GET /api/stocks/top-movers
- GET /api/stocks/movers/losers

### Signals
- GET /api/signals
- POST /api/signals/generate
- GET /api/signals/watchlist

### News
- GET /api/news/{symbol}
- GET /api/news/market
- GET /api/news/{symbol}/sentiment

### Options
- GET /api/options/unusual
- GET /api/options/{symbol}

### User Features
- GET/POST/DELETE /api/watchlist
- GET/POST/DELETE /api/alerts
- GET/POST/DELETE /api/portfolio

### AI Insights
- GET /api/insights/thesis/{symbol}
- GET /api/insights/fear-greed
- GET /api/insights/market-pulse
- GET /api/insights/smart-money

### Advanced
- POST /api/backtest
- GET /api/backtest/strategies
- POST /api/chat
- GET /api/social/leaderboard
- GET /api/compare?symbols=AAPL,MSFT

### Admin
- GET /api/admin/stats
- GET /api/admin/users
- PUT /api/admin/users/{id}/role
- PUT /api/admin/users/{id}/tier
- PUT /api/admin/users/{id}/lock
- GET /api/admin/roles
- POST /api/admin/roles

## Project Structure

```
SignalForge/
├── src/
│   ├── SignalForge.API/           # ASP.NET Core Web API
│   ├── SignalForge.Application/   # CQRS handlers, DTOs, interfaces
│   ├── SignalForge.Domain/        # Entities, enums
│   ├── SignalForge.Infrastructure/ # EF Core, external APIs, services
│   ├── SignalForge.Web/           # React frontend (Vite)
│   └── SignalForge.Mobile/        # React Native (Expo)
├── tests/
│   └── SignalForge.Tests/         # xUnit tests
├── docker-compose.yml
├── Dockerfile
└── SignalForge.slnx
```

## Azure Deployment

- **API**: Azure Container Apps at `https://signalforge-api.ambitiouscliff-f7080230.eastus.azurecontainerapps.io`
- **Web**: Azure Static Web Apps at `https://nice-ground-055efc20f.1.azurestaticapps.net`

### Database on Azure

**The database was not deployed to Azure.** If the Container App has no `ConnectionStrings__DefaultConnection` set, the API uses an **in-memory database** (data is lost on restart). If `/health` or login times out, the Container App may have a connection string set to a non-existent or unreachable SQL server (so the app or health check hangs). Fix: remove `ConnectionStrings__DefaultConnection` from the Container App env so the API starts with in-memory DB, then add Azure SQL and set the env (see below).

- **Liveness**: Use **`/live`** to check if the container is up (no DB/Redis). Example: `https://signalforge-api..../live`
- **Health**: **`/health`** runs SQL/Redis checks with a 5s timeout; use it after the app is running.

To use **Azure SQL** (persistent data):

1. **Create Azure SQL**  
   - Run `.\scripts\azure-sql-setup.ps1` (requires `az login` and resource group `SignalForge-RG`).  
   - If you get **RegionDoesNotAllowProvisioning**, create the SQL server manually in [Azure Portal](https://portal.azure.com) → Create resource → Azure SQL Database → choose a region that allows creation (try e.g. **Central US**, **North Europe**). Set server name, admin login, and password. Then run:  
     `.\scripts\azure-sql-database-only.ps1 -SqlServerName <your-server> -AdminLogin <user> -AdminPassword '<password>'`  
     to create the database and firewall rule and get the connection string.
2. **Set the connection string on the Container App**  
   Use the `az containerapp update --set-env-vars "ConnectionStrings__DefaultConnection=..."` command printed by the script (or set the env in Portal).
3. **Redeploy or restart** the Container App so the API runs migrations and connects to SQL.

## Configuration

Copy `appsettings.Development.json` and add your API keys:
- **Core42 AI** - Sentiment analysis and signal reasoning
- **Polygon.io** - Live market data (free tier available)
- **NewsAPI** - News headlines (free tier available)

## License

Proprietary - All rights reserved.
