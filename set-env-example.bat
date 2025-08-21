@echo off
chcp 65001 >nul
REM Windows 환경변수 설정 스크립트

REM ==============================
REM docker 설정 (필요 시)
set DOCKER_USERNAME=YOUR_NICKNAME
@REM set API_URL=API_URL

REM ==============================
REM Vite/Frontend 환경변수 설정
REM env.example 기준 기본값들
set VITE_API_SERVER_URL=https://team02-apim.azure-api.net
set VITE_NOTIFICATION_API_URL=https://team02-apim.azure-api.net/notifications-service-http
set VITE_API_BASE_URL=https://team02-apim.azure-api.net/student
set VITE_WEBSOCKET_URL=wss://team02-apim.azure-api.net/ws

REM APIM 구독키 (옵션)
set VITE_APIM_SUBSCRIPTION_KEY=
set VITE_APIM_SUBSCRIPTION_QUERY_NAME=subscription-key

echo.
echo [환경변수 설정 완료]
echo VITE_API_SERVER_URL=%VITE_API_SERVER_URL%
echo VITE_NOTIFICATION_API_URL=%VITE_NOTIFICATION_API_URL%
echo VITE_API_BASE_URL=%VITE_API_BASE_URL%
echo VITE_WEBSOCKET_URL=%VITE_WEBSOCKET_URL%
if not "%VITE_APIM_SUBSCRIPTION_KEY%"=="" (
  echo VITE_APIM_SUBSCRIPTION_KEY=****
) else (
  echo VITE_APIM_SUBSCRIPTION_KEY=(비어있음)
)
echo VITE_APIM_SUBSCRIPTION_QUERY_NAME=%VITE_APIM_SUBSCRIPTION_QUERY_NAME%
echo.
echo 이 창에서만 유효합니다. 같은 세션에서 npm run dev 를 실행하세요.