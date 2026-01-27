@echo off
docker volume rm projectcode_postgres_data projectcode_postgres_shop_data projectcode_postgres_task_data 2>nul
docker compose up -d
