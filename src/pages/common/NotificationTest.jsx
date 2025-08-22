import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { 
    sendNotification, 
    fetchUserNotifications, 
    fetchUnreadNotificationCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from '../../utils/api';

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
            
            // STOMP 클라이언트 생성 (개발/운영 환경 모두 실제 서버 사용)
            const client = new Client({
                brokerURL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEBSOCKET_URL) || 'wss://team02-apim.azure-api.net/ws',
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
                
                // 사용자 등록 제거됨
                
                // 알림 토픽 구독
                client.subscribe(`/topic/notifications/${currentUserId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        
                                                 if (data.type === 'NOTIFICATION' || data.message) {
                             addLog(`알림 수신 (처리 제거됨): ${data.message}`, 'info');
                         }
                    } catch (error) {
                        addLog(`메시지 파싱 오류: ${error.message}`, 'error');
                    }
                });
                
                // 등록 응답 구독 제거됨
                
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

                // 브로드캐스트 토픽 구독
                client.subscribe('/topic/broadcast', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        addLog(`브로드캐스트 메시지 수신: ${data.message}`, 'notification');
                        
                                                 // 브로드캐스트 메시지 처리 제거됨
                    } catch (error) {
                        addLog('브로드캐스트 메시지 파싱 오류', 'error');
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
    const handleSendNotification = async () => {
        if (!message.trim()) {
            addLog('메시지를 입력해주세요.', 'warning');
            return;
        }

        try {
            const notificationData = {
                senderId: currentUserId,
                receiverId: targetUserId,
                message: message,
                type: notificationType
            };

            const notification = await sendNotification(notificationData);
            setNotifications(prev => [notification, ...prev]);
            setMessage('');
            
            // STOMP로 실시간 전송
            if (stompClient.current?.connected) {
                stompClient.current.publish({
                    destination: '/app/send-notification',
                    body: JSON.stringify(notificationData)
                });
            }
            
            addLog(`알림 전송: ${notification.message}`, 'success');
        } catch (error) {
            addLog(`전송 실패: ${error.message}`, 'error');
        }
    };

    // 알림 목록 조회
    const handleFetchNotifications = async () => {
        try {
            const data = await fetchUserNotifications(currentUserId);
            setNotifications(data);
            addLog(`알림 ${data.length}개 조회`, 'success');
        } catch (error) {
            addLog(`조회 실패: ${error.message}`, 'error');
        }
    };

    // 읽지 않은 알림 개수 조회
    const handleFetchUnreadCount = async () => {
        try {
            const count = await fetchUnreadNotificationCount(currentUserId);
            setUnreadCount(count);
        } catch (error) {
            addLog(`개수 조회 실패: ${error.message}`, 'error');
        }
    };

    // 개별 알림 읽음 처리
    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            await handleFetchNotifications();
            await handleFetchUnreadCount();
            addLog('읽음 처리 완료', 'success');
        } catch (error) {
            addLog(`읽음 처리 실패: ${error.message}`, 'error');
        }
    };

    // 모든 알림 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead(currentUserId);
            await handleFetchNotifications();
            await handleFetchUnreadCount();
            addLog('모두 읽음 처리 완료', 'success');
        } catch (error) {
            addLog(`모두 읽음 처리 실패: ${error.message}`, 'error');
        }
    };

    // 브라우저 알림 권한 요청
    const requestNotificationPermission = async () => {
        addLog('브라우저 알림 기능이 비활성화되었습니다.', 'info');
    };

    // 브라우저 알림 테스트
    const testBrowserNotification = () => {
        addLog('브라우저 알림 기능이 비활성화되었습니다.', 'info');
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

    // 구독 테스트 - 직접 메시지 전송
    const testSubscription = () => {
        if (stompClient.current?.connected) {
            const testMessage = {
                type: 'SUBSCRIPTION_TEST',
                message: `구독 테스트 메시지 - ${new Date().toLocaleTimeString()}`,
                senderId: 'test-system',
                receiverId: currentUserId,
                timestamp: new Date().toISOString()
            };
            
            // 직접 토픽에 메시지 전송 (테스트용)
            stompClient.current.publish({
                destination: `/topic/notifications/${currentUserId}`,
                body: JSON.stringify(testMessage)
            });
            addLog(`구독 테스트: /topic/notifications/${currentUserId}에 직접 메시지 전송`, 'info');
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 구독 테스트 - 다른 사용자에게 메시지 전송
    const testOtherUserSubscription = () => {
        if (stompClient.current?.connected && targetUserId) {
            const testMessage = {
                type: 'CROSS_USER_TEST',
                message: `다른 사용자 테스트 - ${new Date().toLocaleTimeString()}`,
                senderId: currentUserId,
                receiverId: targetUserId,
                timestamp: new Date().toISOString()
            };
            
            // 대상 사용자의 토픽에 메시지 전송
            stompClient.current.publish({
                destination: `/topic/notifications/${targetUserId}`,
                body: JSON.stringify(testMessage)
            });
            addLog(`다른 사용자 구독 테스트: /topic/notifications/${targetUserId}에 메시지 전송`, 'info');
        } else {
            addLog('STOMP 연결 또는 대상 사용자 ID 필요', 'warning');
        }
    };

    // 학생 테스트 알림 전송
    const testStudentNotification = () => {
        if (stompClient.current?.connected) {
            const studentTestMessage = {
                type: 'STUDENT_NOTIFICATION',
                message: `학생 테스트 알림 - ${new Date().toLocaleTimeString()}`,
                senderId: 'teacher-system',
                receiverId: '21', // 학생 ID 21
                timestamp: new Date().toISOString()
            };
            
            // 학생 ID 21에게 메시지 전송
            stompClient.current.publish({
                destination: '/topic/notifications/21',
                body: JSON.stringify(studentTestMessage)
            });
            addLog('학생 테스트 알림 전송: /topic/notifications/21에 메시지 전송', 'info');
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 세션 테스트 - 시험 준비 완료 알림
    const testSessionExamReady = () => {
        if (stompClient.current?.connected) {
            const examReadyMessage = {
                type: 'EXAM_READY',
                examReady: true,
                sessionId: '123', // 테스트 세션 ID
                message: '시험이 준비되었습니다.',
                timestamp: new Date().toISOString()
            };
            
            // 세션 ID 123에 시험 준비 완료 메시지 전송
            stompClient.current.publish({
                destination: '/topic/session/123',
                body: JSON.stringify(examReadyMessage)
            });
            addLog('세션 시험 준비 완료 테스트: /topic/session/123에 메시지 전송', 'info');
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 구독 테스트 - 브로드캐스트 메시지
    const testBroadcastSubscription = () => {
        if (stompClient.current?.connected) {
            const broadcastMessage = {
                type: 'BROADCAST_TEST',
                message: `브로드캐스트 테스트 - ${new Date().toLocaleTimeString()}`,
                senderId: 'broadcast-system',
                timestamp: new Date().toISOString()
            };
            
            // 브로드캐스트 토픽에 메시지 전송
            stompClient.current.publish({
                destination: '/topic/broadcast',
                body: JSON.stringify(broadcastMessage)
            });
            addLog('브로드캐스트 구독 테스트: /topic/broadcast에 메시지 전송', 'info');
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 구독 상태 확인
    const checkSubscriptionStatus = () => {
        if (stompClient.current?.connected) {
            const subscriptions = stompClient.current.subscriptions;
            const subscriptionCount = Object.keys(subscriptions).length;
            addLog(`현재 구독 중인 토픽 수: ${subscriptionCount}`, 'info');
            
            Object.keys(subscriptions).forEach(topic => {
                addLog(`구독 토픽: ${topic}`, 'info');
            });
        } else {
            addLog('STOMP 연결 필요', 'warning');
        }
    };

    // 초기화
    useEffect(() => {
        handleFetchNotifications();
        handleFetchUnreadCount();
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
                                URL: {(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEBSOCKET_URL) || 'wss://team02-apim.azure-api.net/ws'}
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
                    <button className="btn" onClick={handleSendNotification}>
                        전송
                    </button>
                </div>
            </div>

            {/* 알림 관리 */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>알림 관리</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={handleFetchNotifications}>
                        목록 새로고침
                    </button>
                    <button className="btn btn-outline" onClick={handleMarkAllAsRead}>
                        모두 읽음 처리
                    </button>
                    <button className="btn btn-outline" onClick={testBrowserNotification}>
                        브라우저 알림 테스트
                    </button>
                    <button className="btn btn-outline" onClick={testRealTime}>
                        실시간 테스트
                    </button>
                </div>
                
                {/* 구독 테스트 섹션 */}
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '8px', color: 'var(--primary)' }}>구독 테스트</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={testSubscription}>
                            직접 구독 테스트
                        </button>
                        <button className="btn btn-sm" onClick={testOtherUserSubscription}>
                            다른 사용자 테스트
                        </button>
                        <button className="btn btn-sm" onClick={testBroadcastSubscription}>
                            브로드캐스트 테스트
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={testStudentNotification}>
                            학생 테스트
                        </button>
                        <button className="btn btn-sm btn-success" onClick={testSessionExamReady}>
                            세션 테스트
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={checkSubscriptionStatus}>
                            구독 상태 확인
                        </button>
                    </div>
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
                                            onClick={() => handleMarkAsRead(notification.id)}
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
