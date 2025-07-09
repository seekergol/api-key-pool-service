@echo off
setlocal enabledelayedexpansion

set SERVICE_URL=https://seekergol-api-key-poo-92.deno.dev
set ADMIN_KEY=84861142

for /f "usebackq delims=" %%k in ("keys.txt") do (
    set KEY=%%k
    curl -X POST "%SERVICE_URL%/admin/keys" ^
        -H "Content-Type: application/json" ^
        -H "X-Admin-Key: %ADMIN_KEY%" ^
        -d "{\"provider\":\"gemini\",\"apiKey\":\"!KEY!\",\"maxRequests\":1000}"
    echo.
) 