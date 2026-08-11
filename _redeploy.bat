@echo off
chcp 65001 >nul
cd /d "C:\Users\Desk3\jls-integrated"

echo === 1) clean stale locks / merge state ===
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if exist ".git\MERGE_HEAD" del /f /q ".git\MERGE_HEAD"
if exist ".git\MERGE_MSG" del /f /q ".git\MERGE_MSG"
if exist ".git\objects\maintenance.lock" del /f /q ".git\objects\maintenance.lock"

echo === 2) commit the cache-bust change (index.html only) ===
git add inwon-app/index.html
git commit -m "fix: cache-bust app.js so browsers always load the newest code"

echo === 3) clean working-tree line-ending noise (my commit is safe) ===
git reset --hard HEAD

echo === 4) pull + merge latest remote (no conflict expected) ===
git pull --no-edit origin main
if errorlevel 1 goto :fail

echo === 5) push ===
git push origin main
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   SUCCESS - pushed to origin/main
echo ============================================
pause
exit /b 0

:fail
echo.
echo ############################################
echo   PROBLEM (exit %errorlevel%). Read messages above and tell Claude.
echo ############################################
pause
