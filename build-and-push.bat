@echo off
chcp 65001 >nul
echo ========================================
echo Docker 이미지 빌드 및 푸시 스크립트
echo ========================================

REM Docker Hub 사용자명 설정 (여기에 본인의 Docker Hub 사용자명을 입력하세요)
set DOCKER_USERNAME=%DOCKER_USERNAME%
set IMAGE_NAME=frontend-react
set TAG=latest

REM 추가 태그 설정 (쉼표로 구분)
set ADDITIONAL_TAGS=v1.0.0, dev

echo.
echo 1. Docker Hub 로그인 확인...
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요.
    pause
    exit /b 1
)

echo Docker가 실행 중입니다.

echo.
echo 2. Docker Hub에 로그인...
docker login
if errorlevel 1 (
    echo Docker Hub 로그인에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 3. 기존 이미지 정리...
docker rmi %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% 2>nul
docker system prune -f

echo.
echo 4. Docker 이미지 빌드...
docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% .
if errorlevel 1 (
    echo 이미지 빌드에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 5. 추가 태그 생성...
for %%t in (%ADDITIONAL_TAGS%) do (
    echo 태그 생성: %%t
    docker tag %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% %DOCKER_USERNAME%/%IMAGE_NAME%:%%t
)

echo.
echo 6. Docker Hub에 이미지 푸시...
echo 메인 태그 푸시: %TAG%
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
if errorlevel 1 (
    echo 메인 태그 푸시에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 추가 태그들 푸시...
for %%t in (%ADDITIONAL_TAGS%) do (
    echo 태그 푸시: %%t
    docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%%t
    if errorlevel 1 (
        echo 태그 %%t 푸시에 실패했습니다.
    )
)

echo.
echo ========================================
echo 성공! 이미지가 Docker Hub에 푸시되었습니다.
echo 메인 이미지: %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo 추가 태그들: %ADDITIONAL_TAGS%
echo ========================================

echo.
echo 로컬에서 테스트하려면 다음 명령어를 실행하세요:
echo docker run -p 3000:80 %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

pause
