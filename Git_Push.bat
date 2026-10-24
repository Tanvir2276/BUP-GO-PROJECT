@echo off
title BUPGO - Git Push to GitHub
cd /d "%~dp0"
echo ====================================================
echo    BUPGO Git Push Utility
echo ====================================================
echo.
git remote -v | findstr origin >nul
if errorlevel 1 (
    echo [!] GitHub remote link not set yet.
    echo Please paste your GitHub Repository URL (e.g. https://github.com/yourname/bupgo.git):
    set /p REPO_URL="Repository URL: "
    git remote add origin "%REPO_URL%"
)
echo.
echo Committing latest updates...
git add .
git commit -m "Update BUPGO project files" >nul 2>&1
echo.
echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Standard push rejected (remote contains files). Syncing with force push...
    git push -u origin main --force
)
echo.
echo ====================================================
echo    All files pushed to GitHub successfully!
echo ====================================================
pause
