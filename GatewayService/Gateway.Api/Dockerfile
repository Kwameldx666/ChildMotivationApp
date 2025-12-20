# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY GatewayService/ ./GatewayService/
RUN dotnet restore GatewayService/Gateway.Api/Gateway.Api.csproj
RUN dotnet publish GatewayService/Gateway.Api/Gateway.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet","Gateway.Api.dll"]
