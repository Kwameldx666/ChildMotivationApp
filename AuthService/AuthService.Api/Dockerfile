# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Ensure required system dependencies for Npgsql/kerberos are present to avoid runtime warnings about libgssapi
RUN apt-get update && apt-get install -y --no-install-recommends libkrb5-3 libgssapi-krb5-2 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY AuthService/ ./AuthService/
RUN dotnet restore AuthService/AuthService.Api/AuthService.Api.csproj
RUN dotnet publish AuthService/AuthService.Api/AuthService.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet","AuthService.Api.dll"]
