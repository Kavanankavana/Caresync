@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo   Starting CareSync Spring Boot & Hibernate Backend
echo =======================================================

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Maven found. Starting Spring Boot...
    mvn spring-boot:run
    goto end
)

echo Notice: Global Maven 'mvn' was not detected in PATH.
echo Please run this project in IntelliJ IDEA, Eclipse, or VS Code
echo with the Spring Boot extension, or install Maven from:
echo https://maven.apache.org/download.cgi
pause

:end
endlocal
