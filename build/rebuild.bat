@echo off
REM ===================================================================
REM  THE WHATEVER GAME - rebuild the Android app from the release HTML
REM  Run this after ANY change to the game or to the AdMob IDs.
REM ===================================================================
setlocal
set ROOT=%~dp0..
set APP=%ROOT%\android-app
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"

echo.
echo === 1/4  regenerating the release build from the dev file ===
pushd "%~dp0"
python make_release.py "..\TheWhateverGame.html" "..\TheWhateverGame-release.html"
if errorlevel 1 goto :fail
popd

echo.
echo === 2/4  copying release HTML into the Capacitor web dir ===
copy /Y "%ROOT%\TheWhateverGame-release.html" "%APP%\www\index.html" >nul
if errorlevel 1 goto :fail

echo.
echo === 3/4  capacitor sync ===
pushd "%APP%"
call npx cap sync android
if errorlevel 1 goto :fail
popd

echo.
echo === 4/4  gradle bundleRelease + assembleRelease ===
pushd "%APP%\android"
call gradlew.bat bundleRelease assembleRelease --no-daemon
if errorlevel 1 goto :fail
popd

echo.
echo ============================================================
echo  BUILD OK
echo.
echo  AAB (upload this to Play):
echo    %APP%\android\app\build\outputs\bundle\release\app-release.aab
echo.
echo  APK (sideload this to test on your own phone):
echo    %APP%\android\app\build\outputs\apk\release\app-release.apk
echo ============================================================
echo.
echo  Reminder: bump versionCode in android-app\android\app\build.gradle
echo  before every upload, or Play will reject it.
goto :eof

:fail
popd
echo.
echo *** BUILD FAILED - see the output above ***
exit /b 1
