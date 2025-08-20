import { useStomp } from "../../contexts/StompContext";

export function StompStatusIndicator() {
    const { isConnected, currentUserId } = useStomp();

    return (
        <div className="card" style={{ 
            marginBottom: 16, 
            backgroundColor: isConnected ? 'var(--success-light)' : 'var(--warn-light)' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: isConnected ? 'var(--success)' : 'var(--warn)' 
                }}></span>
                <span style={{ fontSize: '14px', color: isConnected ? 'var(--success)' : 'var(--warn)' }}>
                    {isConnected ? `STOMP 연결됨 (사용자: ${currentUserId})` : 'STOMP 연결 중...'}
                </span>
            </div>
        </div>
    );
}
