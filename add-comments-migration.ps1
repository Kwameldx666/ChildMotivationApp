# Add migration for TaskComments
Write-Host "Creating migration for TaskComments..." -ForegroundColor Yellow

Set-Location -Path "TaskService/TaskService.Api"

dotnet ef migrations add AddTaskComments `
  --project ../TaskService.Persistence/TaskService.Persistence.csproj `
  --startup-project TaskService.Api.csproj `
  --context TaskDbContext `
  --output-dir ../TaskService.Persistence/Migrations

Set-Location -Path "../.."

Write-Host "Migration created successfully!" -ForegroundColor Green
Write-Host "Don't forget to rebuild task-service with: docker-compose up -d --build task-service" -ForegroundColor Cyan
