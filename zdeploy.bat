@echo off
cd /d "C:\Users\Desk3\jls-integrated"
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
git add EXAM_GRADER_SPEC.md app.js
git commit -m "docs: exam grader spec and handoff notes"
git pull --no-edit origin main
git push origin main
echo.
echo ==== EXIT CODE %errorlevel% ====
pause
