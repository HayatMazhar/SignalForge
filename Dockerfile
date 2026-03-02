FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SignalForge.slnx .
COPY src/SignalForge.Domain/*.csproj src/SignalForge.Domain/
COPY src/SignalForge.Application/*.csproj src/SignalForge.Application/
COPY src/SignalForge.Infrastructure/*.csproj src/SignalForge.Infrastructure/
COPY src/SignalForge.API/*.csproj src/SignalForge.API/
RUN dotnet restore src/SignalForge.API/SignalForge.API.csproj

COPY src/ src/
RUN dotnet publish src/SignalForge.API/SignalForge.API.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:5280
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5280

ENTRYPOINT ["dotnet", "SignalForge.API.dll"]
