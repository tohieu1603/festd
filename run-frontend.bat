@echo off
chcp 65001 >nul
echo ========================================
echo    FRONTEND SERVER ĐANG CHẠY
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo.
echo Nhấn Ctrl+C để dừng server
echo ========================================
echo.

if not exist node_modules (
    echo Cài đặt dependencies...
    call npm install
)

npm run dev

pause
