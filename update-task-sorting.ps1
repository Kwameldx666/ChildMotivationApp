# Add migration for UpdatedAt field
Write-Host "Creating migration for UpdatedAt field..." -ForegroundColor Yellow

Set-Location -Path "TaskService/TaskService.Api"

dotnet ef migrations add AddUpdatedAtToTasks `
  --project ../TaskService.Persistence/TaskService.Persistence.csproj `
  --startup-project TaskService.Api.csproj `
  --context TaskDbContext `
  --output-dir ../TaskService.Persistence/Migrations

Set-Location -Path "../.."

Write-Host "Migration created successfully!" -ForegroundColor Green
Write-Host "Rebuilding task-service..." -ForegroundColor Yellow

docker-compose up -d --build task-service

Write-Host "Done! Task-service rebuilt with new sorting." -ForegroundColor Green
