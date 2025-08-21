@echo off
chcp 65001 >nul
echo ========================================
echo Docker 이미지 빌드 및 ACR 푸시 스크립트
echo ========================================

REM Azure Container Registry 설정
set ACR_NAME=team02containerregistry
set ACR_LOGIN_SERVER=%ACR_NAME%.azurecr.io
set IMAGE_NAME=frontend-react
set TAG=latest

REM 추가 태그 설정 (쉼표로 구분)
set ADDITIONAL_TAGS=v1.0.1,dev

echo.
echo 1. Docker 실행 확인...
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요.
    pause
    exit /b 1
)

echo Docker가 실행 중입니다.

@REM echo.
@REM echo 2. Azure CLI 로그인 확인...
@REM az account show >nul 2>&1
@REM if errorlevel 1 (
@REM     echo Azure CLI에 로그인되지 않았습니다. 로그인을 진행합니다...
@REM     az login
@REM     if errorlevel 1 (
@REM         echo Azure CLI 로그인에 실패했습니다.
@REM         pause
@REM         exit /b 1
@REM     )
@REM )

@REM echo Azure CLI 로그인 완료.

@REM echo.
@REM echo 3. ACR에 로그인...
@REM az acr login --name %ACR_NAME%
@REM if errorlevel 1 (
@REM     echo ACR 로그인에 실패했습니다. ACR 이름을 확인해주세요.
@REM     pause
@REM     exit /b 1
@REM )

@REM echo ACR 로그인 완료.

echo.
echo 4. 기존 이미지 정리...
docker rmi %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG% 2>nul
docker system prune -f

echo.
echo 5. Docker 이미지 빌드...
docker build -t %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG% .
if errorlevel 1 (
    echo 이미지 빌드에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 6. 추가 태그 생성...
for %%t in (%ADDITIONAL_TAGS%) do (
    echo 태그 생성: %%t
    docker tag %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG% %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%%t
)

echo.
echo 7. ACR에 이미지 푸시...
echo 메인 태그 푸시: %TAG%
docker push %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG%
if errorlevel 1 (
    echo 메인 태그 푸시에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 추가 태그들 푸시...
for %%t in (%ADDITIONAL_TAGS%) do (
    echo 태그 푸시: %%t
    docker push %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%%t
    if errorlevel 1 (
        echo 태그 %%t 푸시에 실패했습니다.
    )
)

echo.
echo ========================================
echo 성공! 이미지가 ACR에 푸시되었습니다.
echo ACR 서버: %ACR_LOGIN_SERVER%
echo 메인 이미지: %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG%
echo 추가 태그들: %ADDITIONAL_TAGS%
echo ========================================

echo.
echo 로컬에서 테스트하려면 다음 명령어를 실행하세요:
echo docker run -p 8080:8080 %ACR_LOGIN_SERVER%/%IMAGE_NAME%:%TAG%

echo.
echo ACR에서 이미지를 확인하려면:
echo https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.ContainerRegistry/registries/%ACR_NAME%/repository

pause
