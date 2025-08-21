// 환경변수 설정
// 개발 환경에서는 .env 파일에서 값을 가져오고, 배포 환경에서는 환경변수에서 가져옵니다.

// API 서버 설정
export const API_CONFIG = {
    // 메인 API 서버 (Vite 프록시를 통해 연결)
    BASE_URL: import.meta.env.VITE_API_BASE_URL,
    
    // 알림 서버 (직접 연결)
    NOTIFICATION_BASE_URL: import.meta.env.VITE_NOTIFICATION_API_URL,
    
    // WebSocket 서버
    WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL,
};

// 개발/배포 환경 구분
export const ENV = {
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
    NODE_ENV: import.meta.env.MODE,
};

// 설정 유효성 검사
export const validateConfig = () => {
    const errors = [];
    
    if (!API_CONFIG.BASE_URL) {
        errors.push('VITE_API_BASE_URL is not set');
    }
    
    if (!API_CONFIG.NOTIFICATION_BASE_URL) {
        errors.push('VITE_NOTIFICATION_API_URL is not set');
    }
    
    if (!API_CONFIG.WEBSOCKET_URL) {
        errors.push('VITE_WEBSOCKET_URL is not set');
    }
    
    if (errors.length > 0) {
        console.error('Configuration errors:', errors);
        return false;
    }
    
    return true;
};

// 개발 환경에서만 설정 로그 출력
if (ENV.IS_DEV) {
    console.log('🔧 Environment Configuration:', {
        API_BASE_URL: API_CONFIG.BASE_URL,
        NOTIFICATION_API_URL: API_CONFIG.NOTIFICATION_BASE_URL,
        WEBSOCKET_URL: API_CONFIG.WEBSOCKET_URL,
        NODE_ENV: ENV.NODE_ENV,
    });
}
