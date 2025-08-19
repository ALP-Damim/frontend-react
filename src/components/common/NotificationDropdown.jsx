import { Link } from "react-router-dom";

export function NotificationDropdown({ notifications = [], onClose }) {
    const recentNotifications = notifications.slice(0, 3); // 최근 3개만 표시

    return (
        <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '350px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            marginTop: '8px'
        }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>알림</h4>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {notifications.filter(n => !n.read).length}개 읽지 않음
                </span>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {recentNotifications.length > 0 ? (
                    recentNotifications.map((notification) => (
                        <div 
                            key={notification.id}
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                backgroundColor: notification.read ? 'transparent' : 'var(--hover)',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = notification.read ? 'transparent' : 'var(--hover)';
                            }}
                        >
                            <div style={{
                                fontSize: '13px',
                                lineHeight: '1.4',
                                marginBottom: '4px'
                            }}>
                                {notification.message}
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: 'var(--muted)'
                            }}>
                                {notification.time}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{
                        padding: '20px 16px',
                        textAlign: 'center',
                        color: 'var(--muted)',
                        fontSize: '13px'
                    }}>
                        새로운 알림이 없습니다
                    </div>
                )}
            </div>
            
            {notifications.length > 0 && (
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    backgroundColor: 'var(--hover)'
                }}>
                    <Link 
                        to="/notifications" 
                        style={{
                            fontSize: '13px',
                            color: 'var(--accent)',
                            textDecoration: 'none'
                        }}
                    >
                        모든 알림 보기 →
                    </Link>
                </div>
            )}
        </div>
    );
}
