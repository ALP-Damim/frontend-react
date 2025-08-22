import { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';

const StompContext = createContext();

export const useStomp = () => {
    const context = useContext(StompContext);
    if (!context) {
        throw new Error('useStomp must be used within a StompProvider');
    }
    return context;
};

export const StompProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [logs, setLogs] = useState([]);
    const stompClient = useRef(null);

    // 로그 추가 함수
    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), { message, type, timestamp }]);
        
        // 콘솔에도 로그 출력
        const logMessage = `[STOMP ${type.toUpperCase()}] ${message}`;
        switch (type) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warning':
                console.warn(logMessage);
                break;
            case 'success':
                console.log(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    };

    // STOMP 연결
    const connect = async (userId) => {
        if (isConnected && currentUserId === userId) {
            addLog('이미 연결되어 있습니다.', 'info');
            return Promise.resolve();
        }

        // 기존 연결이 있다면 해제
        if (stompClient.current) {
            disconnect();
        }

        return new Promise((resolve, reject) => {
            try {
                addLog(`STOMP 연결 시도... (사용자: ${userId})`, 'info');
                
                const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
                
                // 웹소켓 URL 설정 (개발/운영 환경 모두 실제 서버 사용)
                const wsUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEBSOCKET_URL) || 'wss://team02-apim.azure-api.net/ws';
                console.log('🌐 WebSocket URL 설정:', wsUrl);
                console.log('🔧 개발 환경:', isDev);
                
                const client = new Client({
                    brokerURL: wsUrl,
                    connectHeaders: {},
                    debug: function (str) {
                        addLog(`STOMP Debug: ${str}`, 'info');
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    connectionTimeout: 10000 // 10초 타임아웃 추가
                });
            
            client.onConnect = (frame) => {
                setIsConnected(true);
                setCurrentUserId(userId);
                addLog(`STOMP 연결 성공! (사용자: ${userId})`, 'success');
                resolve(); // Promise 해결
                
                // 사용자 등록 제거됨
                
                // 알림 토픽 구독 제거됨 - 세션 페이지에서만 구독

                // 브로드캐스트 토픽 구독 제거됨 - 세션 페이지에서만 구독

                // 세션 토픽 구독 (동적으로 처리)
                // 세션 페이지에서 구독 요청 시 처리
                // 실제로는 세션 페이지에서 sessionId를 받아서 구독해야 함
                // 여기서는 기본 구독만 설정하고, 세션 페이지에서 추가 구독을 처리
                
                // 등록 응답 구독 제거됨
            };
            
            client.onStompError = (frame) => {
                addLog(`STOMP 오류: ${JSON.stringify(frame)}`, 'error');
                setIsConnected(false);
                setCurrentUserId(null);
                reject(new Error(`STOMP 오류: ${JSON.stringify(frame)}`));
            };
            
            client.onWebSocketError = (error) => {
                addLog(`WebSocket 오류: ${error}`, 'error');
                setIsConnected(false);
                setCurrentUserId(null);
                reject(new Error(`WebSocket 오류: ${error}`));
            };
            
            client.onWebSocketClose = (event) => {
                addLog(`연결 종료: ${JSON.stringify(event)}`, 'info');
                setIsConnected(false);
                setCurrentUserId(null);
            };
            
            client.activate();
            stompClient.current = client;
            
            // 전역에서 접근할 수 있도록 window 객체에 저장
            window.stompClient = client;
            
        } catch (error) {
            addLog(`연결 오류: ${error.message}`, 'error');
            reject(error);
        }
        });
    };

    // STOMP 연결 해제
    const disconnect = () => {
        if (stompClient.current) {
            stompClient.current.deactivate();
            stompClient.current = null;
            setIsConnected(false);
            setCurrentUserId(null);
            addLog('STOMP 연결 해제됨', 'info');
        }
    };

    // 메시지 전송
    const sendMessage = (destination, body) => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
            console.log('📤 메시지 전송:', destination);
            console.log('📄 메시지 내용:', body);
            addLog(`메시지 전송: ${destination}`, 'info');
        } else {
            console.log('⚠️ STOMP 연결이 필요합니다.');
            addLog('STOMP 연결이 필요합니다.', 'warning');
        }
    };

    // 동적 토픽 구독
    const subscribeToTopic = (topic, callback) => {
        if (stompClient.current?.connected) {
            const subscription = stompClient.current.subscribe(topic, callback);
            console.log(`📡 토픽 구독: ${topic}`);
            addLog(`토픽 구독: ${topic}`, 'info');
            return subscription;
        } else {
            console.log('⚠️ STOMP 연결이 필요합니다.');
            addLog('STOMP 연결이 필요합니다.', 'warning');
            return null;
        }
    };

    // 컴포넌트 언마운트 시 연결 해제
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    const value = {
        isConnected,
        currentUserId,
        logs,
        connect,
        disconnect,
        sendMessage,
        subscribeToTopic,
        addLog
    };

    return (
        <StompContext.Provider value={value}>
            {children}
        </StompContext.Provider>
    );
};
