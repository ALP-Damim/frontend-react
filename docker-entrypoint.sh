#!/bin/sh

# 환경변수로 nginx 설정 파일 생성
envsubst '${API_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# nginx 시작
exec nginx -g "daemon off;"
