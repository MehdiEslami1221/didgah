@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 22 or 24 LTS first. & pause & exit /b 1)
if not exist node_modules (call npm ci & if errorlevel 1 goto fail)
call npm run setup
if errorlevel 1 goto fail
call npm run pdf:install
if errorlevel 1 goto fail
start "Survey" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"
call npm run dev
pause
exit /b 0
:fail
echo Setup failed. See the error above.
pause
exit /b 1
