@echo off
cd /d "%~dp0"
REM open a new cmd window and keep it open so you can see server logs
start "Node Server" cmd /k "node server.js"
REM wait a second, then open the browser
timeout /t 1 >nul
start "" "http://localhost:5000"
exit
REM end of file
