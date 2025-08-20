import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const NotificationTest = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('userA');
    const [targetUserId, setTargetUserId] = useState('userB');
    const [message, setMessage] = useState('');
    const [notificationType, setNotificationType] = useState('MESSAGE');
    const [logs, setLogs] = useState([]);
    
    const stompClient = useRef(null);

    // 간단한 로그 추가 함수
    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), { message, type, timestamp }]); // 최근 10개만 유지
    };

    // STOMP 연결
    const connectWebSocket = async () => {
        try {
            addLog('STOMP 연결 시도...', 'info');
            
            // 먼저 네이티브 WebSocket으로 연결 테스트
            const testSocket = new WebSocket('ws://localhost:8080/ws');
            
            testSocket.onopen = () => {
                addLog('네이티브 WebSocket 연결 성공 - STOMP 시도 중...', 'success');
                testSocket.close();
                
                // STOMP 클라이언트 생성
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
                    addLog(`STOMP 연결 성공! Frame: ${JSON.stringify(frame)}`, 'success');
                    
                    // 사용자 등록
                    client.publish({
                        destination: '/app/register',
                        body: JSON.stringify({ userId: currentUserId })
                    });
                    
                    // 알림 토픽 구독
                    client.subscribe(`/topic/notifications/${currentUserId}`, (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            
                            if (data.type === 'NOTIFICATION' || data.message) {
                                const notification = data.type === 'NOTIFICATION' ? data : {
                                    id: Date.now(),
                                    message: data.message,
                                    senderId: data.senderId || 'system',
                                    type: data.type || 'MESSAGE',
                                    isRead: false,
                                    createdAt: new Date().toISOString()
                                };
                                
                                setNotifications(prev => [notification, ...prev]);
                                setUnreadCount(prev => prev + 1);
                                
                                // 브라우저 알림
                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification('새 알림', {
                                        body: notification.message,
                                        icon: '/vite.svg'
                                    });
                                }
                                
                                addLog(`새 알림: ${notification.message}`, 'notification');
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
                    
                    // 인사 메시지 전송 (연결 테스트)
                    client.publish({
                        destination: '/app/hello',
                        body: JSON.stringify({ name: currentUserId })
                    });
                    
                    // 인사 응답 구독
                    client.subscribe('/topic/greetings', (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            addLog(`서버 응답: ${data.content || '연결 확인됨'}`, 'success');
                        } catch (error) {
                            addLog('인사 응답 파싱 오류', 'error');
                        }
                    });
                };
                
                client.onStompError = (frame) => {
                    addLog(`STOMP 오류: ${JSON.stringify(frame)}`, 'error');
                    setIsConnected(false);
                };
                
                client.onWebSocketError = (error) => {
                    addLog(`WebSocket 오류: ${error}`, 'error');
                    setIsConnected(false);
                };
                
                client.onWebSocketClose = (event) => {
                    addLog(`연결 종료: ${JSON.stringify(event)}`, 'info');
                    setIsConnected(false);
                };
                
                client.activate();
                stompClient.current = client;
            };
            
            testSocket.onerror = (error) => {
                addLog(`네이티브 WebSocket 연결 실패: ${error}`, 'error');
            };
            
        } catch (error) {
            addLog(`연결 오류: ${error.message}`, 'error');
        }
    };

    // 연결 해제
    const disconnectWebSocket = () => {
        if (stompClient.current) {
            stompClient.current.deactivate();
            stompClient.current = null;
            setIsConnected(false);
            addLog('연결 해제됨', 'info');
        }
    };

    // 알림 전송
    const sendNotification = async () => {
        if (!message.trim()) {
            addLog('메시지를 입력해주세요.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: targetUserId,
                    message: message,
                    type: notificationType
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const notification = await response.json();
            setNotifications(prev => [notification, ...prev]);
            setMessage('');
            
            // STOMP로 실시간 전송
            if (stompClient.current?.connected) {
                stompClient.current.publish({
                    destination: '/app/send-notification',
                    body: JSON.stringify({
                        senderId: currentUserId,
                        receiverId: targetUserId,
                        message: message,
                        type: notificationType
                    })
                });
            }
            
            addLog(`알림 전송: ${notification.message}`, 'success');
        } catch (error) {
            addLog(`전송 실패: ${error.message}`, 'error');
        }
    };

    // 알림 목록 조회
    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications/user/${currentUserId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            setNotifications(data);
            addLog(`알림 ${data.length}개 조회`, 'success');
        } catch (error) {
            addLog(`조회 실패: ${error.message}`, 'error');
        }
    };

    // 읽지 않은 알림 개수 조회
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`/api/notifications/user/${currentUserId}/unread-count`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const count = await response.json();
            setUnreadCount(count);
        } catch (error) {
            addLog(`개수 조회 실패: ${error.message}`, 'error');
        }
    };

    // 개별 알림 읽음 처리
    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            await fetchNotifications();
            await fetchUnreadCount();
            addLog('읽음 처리 완료', 'success');
        } catch (error) {
            addLog(`읽음 처리 실패: ${error.message}`, 'error');
        }
    };

    // 모든 알림 읽음 처리
    const markAllAsRead = async () => {
        try {
            const response = await fetch(`/api/notifications/user/${currentUserId}/read-all`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            await fetchNotifications();
            await fetchUnreadCount();
            addLog('모두 읽음 처리 완료', 'success');
        } catch (error) {
            addLog(`모두 읽음 처리 실패: ${error.message}`, 'error');
        }
    };

    // 브라우저 알림 권한 요청
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                addLog('브라우저 알림 권한 허용', 'success');
            } else {
                addLog('브라우저 알림 권한 거부', 'warning');
            }
        }
    };

    // 브라우저 알림 테스트
    const testBrowserNotification = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('테스트 알림', {
                body: '브라우저 알림이 정상적으로 작동합니다!',
                icon: '/vite.svg'
            });
            addLog('브라우저 알림 테스트 완료', 'success');
        } else {
            addLog('브라우저 알림 권한 필요', 'warning');
        }
    };

    // 실시간 테스트
    const testRealTime = () => {
        if (stompClient.current?.connected) {
            const testMessage = {
                type: 'TEST_NOTIFICATION',
                message: `테스트 알림 - ${new Date().toLocaleTimeString()}`,
                senderId: 'system',
                receiverId: currentUserId
            };
            stompClient.current.publish({
                destination: '/app/test-notification',
                body: JSON.stringify(testMessage)
            });
            addLog('실시간 테스트 메시지 전송', 'info');
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 초기화
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        requestNotificationPermission();
        
        return () => disconnectWebSocket();
    }, [currentUserId]);

    return (
        <div className="container">
            <h1>알림 테스트 페이지</h1>
            
            <div className="grid grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                {/* 연결 상태 */}
                <div className="card">
                    <h3>STOMP 연결</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <span className={`badge ${isConnected ? 'badge-success' : 'badge-error'}`}>
                            {isConnected ? '연결됨' : '연결 안됨'}
                        </span>
                        {stompClient.current && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
                                URL: ws://localhost:8080/ws
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="btn" 
                            onClick={connectWebSocket}
                            disabled={isConnected}
                        >
                            연결
                        </button>
                        <button 
                            className="btn btn-outline" 
                            onClick={disconnectWebSocket}
                            disabled={!isConnected}
                        >
                            연결 해제
                        </button>
                    </div>
                </div>

                {/* 사용자 설정 */}
                <div className="card">
                    <h3>사용자 설정</h3>
                    <div style={{ marginBottom: '12px' }}>
                        <label>현재 사용자 ID:</label>
                        <input 
                            type="text" 
                            value={currentUserId} 
                            onChange={(e) => setCurrentUserId(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label>대상 사용자 ID:</label>
                        <input 
                            type="text" 
                            value={targetUserId} 
                            onChange={(e) => setTargetUserId(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <span className="badge">읽지 않은 알림: {unreadCount}개</span>
                    </div>
                </div>
            </div>

            {/* 알림 전송 */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>알림 전송</h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label>메시지:</label>
                        <input 
                            type="text" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="알림 메시지를 입력하세요"
                            className="input"
                        />
                    </div>
                    <div>
                        <label>타입:</label>
                        <select 
                            value={notificationType} 
                            onChange={(e) => setNotificationType(e.target.value)}
                            className="input"
                        >
                            <option value="MESSAGE">메시지</option>
                            <option value="MEETING">회의</option>
                            <option value="EXAM">시험</option>
                            <option value="ASSIGNMENT">과제</option>
                        </select>
                    </div>
                    <button className="btn" onClick={sendNotification}>
                        전송
                    </button>
                </div>
            </div>

            {/* 알림 관리 */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>알림 관리</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button className="btn" onClick={fetchNotifications}>
                        목록 새로고침
                    </button>
                    <button className="btn btn-outline" onClick={markAllAsRead}>
                        모두 읽음 처리
                    </button>
                    <button className="btn btn-outline" onClick={testBrowserNotification}>
                        브라우저 알림 테스트
                    </button>
                    <button className="btn btn-outline" onClick={testRealTime}>
                        실시간 테스트
                    </button>
                </div>

                {/* 알림 목록 */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>알림이 없습니다.</p>
                    ) : (
                        notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                style={{
                                    padding: '12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    backgroundColor: notification.isRead ? 'var(--background)' : 'var(--accent-light)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                            {notification.message}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                            보낸사람: {notification.senderId} | 
                                            타입: {notification.type} | 
                                            시간: {new Date(notification.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <button 
                                            className="btn btn-sm" 
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            읽음
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 로그 */}
            <div className="card">
                <h3>실행 로그</h3>
                <div className="log-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {logs.length === 0 ? (
                        <p style={{ color: 'var(--muted)' }}>로그가 없습니다.</p>
                    ) : (
                        logs.map((log, index) => (
                            <div 
                                key={index} 
                                className={`log-${log.type}`}
                            >
                                [{log.timestamp}] {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationTest;
