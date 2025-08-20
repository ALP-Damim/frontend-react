import { useEffect, useCallback, useRef } from 'react';
import { useStomp } from '../contexts/StompContext';

export function useStudentStomp(studentId) {
    const { connect, disconnect, isConnected, currentUserId } = useStomp();
    const hasConnected = useRef(false);

    // STOMP 연결 시작
    useEffect(() => {
        if (studentId && !isConnected && !hasConnected.current) {
            hasConnected.current = true;
            connect(studentId.toString());
        }
    }, [studentId, connect, isConnected]);

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
    }, [disconnect]);

    return {
        isConnected,
        currentUserId,
        handleLogout
    };
}
