@echo off
title TWG Studio
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js was not found on your PATH.
  echo   Install it from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting TWG Studio...
echo   A browser tab will open at http://localhost:4747
echo.
echo   Keep this window open while you work. Close it to stop.
echo.

node server.js
set RC=%ERRORLEVEL%

REM exit code 0 also covers "it was already running, so I opened the browser
REM and stepped aside" - that is not an error and should not nag.
if %RC% NEQ 0 (
  echo.
  echo   TWG Studio stopped with code %RC% - see the message above.
  echo.
  pause
)
