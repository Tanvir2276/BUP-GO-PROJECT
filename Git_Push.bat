@echo off
title BUPGO - Git Push to GitHub (Tanvir2276/BUP-GO-PROJECT)
cd /d "%~dp0"
echo ====================================================
echo    BUPGO Git Push Utility for Tanvir2276
echo ====================================================
echo.
echo Target Repository: https://github.com/Tanvir2276/BUP-GO-PROJECT
echo.
echo Committing any pending updates...
git add .
git commit -m "Update BUPGO full-stack platform with Vercel and mobile support" >nul 2>&1
echo.
echo Pushing to GitHub (main branch)...
echo (If a browser login window opens, please sign in as Tanvir2276)
echo.
git push -u origin main --force
echo.
if errorlevel 1 (
    echo [!] Push encountered an issue.
    echo If permission was denied, ensure you are logged into GitHub as Tanvir2276.
) else (
    echo ====================================================
    echo    SUCCESS! All files pushed to Tanvir2276/BUP-GO-PROJECT!
    echo    Vercel will now automatically re-deploy your project.
    echo ====================================================
)
echo.
pause
