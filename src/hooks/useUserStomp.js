import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStomp } from '../contexts/StompContext';

export function useUserStomp(userId) {
    const { connect, disconnect, isConnected, currentUserId } = useStomp();
    const navigate = useNavigate();
    const hasConnected = useRef(false);

    // STOMP 연결 시작
    useEffect(() => {
        if (userId && userId > 0 && !isConnected && !hasConnected.current) {
            hasConnected.current = true;
            connect(userId.toString());
        }
    }, [userId, connect, isConnected]);

    // 연결 상태가 변경되면 hasConnected 플래그 업데이트
    useEffect(() => {
        if (!isConnected) {
            hasConnected.current = false;
        }
    }, [isConnected]);

    // 로그아웃 핸들러
    const handleLogout = useCallback(() => {
        disconnect();
        hasConnected.current = false;
        // 메인 페이지로 이동
        navigate('/');
    }, [disconnect, navigate]);

    return {
        isConnected,
        currentUserId,
        handleLogout
    };
}
