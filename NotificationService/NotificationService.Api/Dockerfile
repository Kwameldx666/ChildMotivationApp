FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["NotificationService/NotificationService.Api/NotificationService.Api.csproj", "NotificationService/NotificationService.Api/"]
COPY ["NotificationService/NotificationService.Application/NotificationService.Application.csproj", "NotificationService/NotificationService.Application/"]
COPY ["NotificationService/NotificationService.Domain/NotificationService.Domain.csproj", "NotificationService/NotificationService.Domain/"]
COPY ["NotificationService/NotificationService.Infrastructure/NotificationService.Infrastructure.csproj", "NotificationService/NotificationService.Infrastructure/"]

RUN dotnet restore "NotificationService/NotificationService.Api/NotificationService.Api.csproj"

COPY NotificationService/ NotificationService/
WORKDIR "/src/NotificationService/NotificationService.Api"
RUN dotnet build "NotificationService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NotificationService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NotificationService.Api.dll"]
