# Build stage
FROM node:20-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (빌드를 위해 모든 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Production stage
FROM nginx:alpine

# nginx 설정 파일 복사 (템플릿으로)
COPY nginx.conf /etc/nginx/nginx.conf.template
RUN apk add --no-cache bash
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# 빌드된 파일들을 nginx의 정적 파일 디렉토리로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 80 노출
EXPOSE 80

# nginx 시작 (환경변수 처리)
CMD ["/docker-entrypoint.sh"]
