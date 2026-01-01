# syntax=docker/dockerfile:1.7-labs

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY TaskService/ ./TaskService/
RUN --mount=type=cache,id=nuget-packages,target=/root/.nuget/packages \
	--mount=type=cache,id=nuget-http,target=/root/.local/share/NuGet/v3-cache \
	dotnet restore TaskService/TaskService.Api/TaskService.Api.csproj
RUN --mount=type=cache,id=nuget-packages,target=/root/.nuget/packages \
	dotnet publish TaskService/TaskService.Api/TaskService.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet","TaskService.Api.dll"]