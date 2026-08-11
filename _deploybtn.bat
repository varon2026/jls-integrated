@echo off
chcp 65001 >nul
cd /d "C:\Users\Desk3\jls-integrated"

echo === clean stale locks ===
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if exist ".git\MERGE_HEAD" del /f /q ".git\MERGE_HEAD"
if exist ".git\MERGE_MSG" del /f /q ".git\MERGE_MSG"
if exist ".git\objects\maintenance.lock" del /f /q ".git\objects\maintenance.lock"

echo === stage + commit ONLY app.js (no reset) ===
git add app.js
git commit -m "chore: hide unfinished exam-grading card on wonmu dashboard until new grader is ready"

echo === pull + push ===
git pull --no-edit origin main
if errorlevel 1 goto :fail
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
echo   PROBLEM (exit %errorlevel%). Tell Claude.
echo ############################################
pause
