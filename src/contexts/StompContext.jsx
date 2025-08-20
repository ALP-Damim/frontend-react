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
    };

    // STOMP 연결
    const connect = (userId) => {
        if (isConnected && currentUserId === userId) {
            addLog('이미 연결되어 있습니다.', 'info');
            return;
        }

        // 기존 연결이 있다면 해제
        if (stompClient.current) {
            disconnect();
        }

        try {
            addLog(`STOMP 연결 시도... (사용자: ${userId})`, 'info');
            
            const client = new Client({
                brokerURL: 'ws://localhost:8080/ws',
                connectHeaders: {},
                debug: function (str) {
                    addLog(`STOMP Debug: ${str}`, 'info');
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000
            });
            
            client.onConnect = (frame) => {
                setIsConnected(true);
                setCurrentUserId(userId);
                addLog(`STOMP 연결 성공! (사용자: ${userId})`, 'success');
                
                // 사용자 등록
                client.publish({
                    destination: '/app/register',
                    body: JSON.stringify({ userId: userId })
                });
                
                // 알림 토픽 구독
                client.subscribe(`/topic/notifications/${userId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        addLog(`새 알림 수신: ${data.message || '알림'}`, 'notification');
                        
                        // 브라우저 알림
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('새 알림', {
                                body: data.message || '새로운 알림이 도착했습니다.',
                                icon: '/vite.svg'
                            });
                        }
                    } catch (error) {
                        addLog(`메시지 파싱 오류: ${error.message}`, 'error');
                    }
                });
                
                // 등록 응답 구독
                client.subscribe('/topic/registration', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        addLog(`등록 완료: ${data.message || '성공'}`, 'success');
                    } catch (error) {
                        addLog('등록 응답 파싱 오류', 'error');
                    }
                });
            };
            
            client.onStompError = (frame) => {
                addLog(`STOMP 오류: ${JSON.stringify(frame)}`, 'error');
                setIsConnected(false);
                setCurrentUserId(null);
            };
            
            client.onWebSocketError = (error) => {
                addLog(`WebSocket 오류: ${error}`, 'error');
                setIsConnected(false);
                setCurrentUserId(null);
            };
            
            client.onWebSocketClose = (event) => {
                addLog(`연결 종료: ${JSON.stringify(event)}`, 'info');
                setIsConnected(false);
                setCurrentUserId(null);
            };
            
            client.activate();
            stompClient.current = client;
            
        } catch (error) {
            addLog(`연결 오류: ${error.message}`, 'error');
        }
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
            addLog(`메시지 전송: ${destination}`, 'info');
        } else {
            addLog('STOMP 연결이 필요합니다.', 'warning');
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
        addLog
    };

    return (
        <StompContext.Provider value={value}>
            {children}
        </StompContext.Provider>
    );
};
