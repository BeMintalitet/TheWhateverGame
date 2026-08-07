@echo off
title TWG Studio
cd /d "%~dp0"
echo.
echo   Starting TWG Studio...
echo   A browser tab will open at http://localhost:4747
echo.
echo   Keep this window open while you work. Close it to stop.
echo.
node server.js
if errorlevel 1 (
  echo.
  echo   *** Could not start. Is Node.js installed? Try: node -v
  echo.
  pause
)
