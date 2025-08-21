import { useEffect, useRef } from 'react';

export const useClassAlarm = (classes, userId) => {
    const alarmTimeoutsRef = useRef(new Map());
    const alarmIntervalsRef = useRef(new Map());

    // 알람 등록 함수
    const registerAlarm = (classInfo) => {
        if (!classInfo || !classInfo.startsAt || !classInfo.heldDaysString) {
            return;
        }

        const alarmId = `alarm_${classInfo.classId}`;
        
        // 이미 등록된 알람이 있다면 제거
        if (alarmTimeoutsRef.current.has(alarmId)) {
            clearTimeout(alarmTimeoutsRef.current.get(alarmId));
            alarmTimeoutsRef.current.delete(alarmId);
        }

        // 요일별로 알람 계산
        const days = classInfo.heldDaysString.split(',').map(d => d.trim());
        const dayToNumber = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
        
        days.forEach(day => {
            const dayNumber = dayToNumber[day];
            if (dayNumber === undefined) return;

            const [hours, minutes] = classInfo.startsAt.split(':').map(Number);
            const classTime = hours * 60 + minutes; // 강의 시작 시간 (분)
            const alarmTime = classTime - 5; // 5분 전 알람 시간

            // 다음 알람 시간 계산
            const calculateNextAlarm = () => {
                const now = new Date();
                const currentDay = now.getDay();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                
                let daysDiff = dayNumber - currentDay;
                if (daysDiff < 0) daysDiff += 7;
                if (daysDiff === 0 && alarmTime <= currentTime) {
                    daysDiff = 7; // 오늘 이미 지난 시간이면 다음 주로
                }
                
                const nextAlarmDate = new Date();
                nextAlarmDate.setDate(now.getDate() + daysDiff);
                nextAlarmDate.setHours(Math.floor(alarmTime / 60), alarmTime % 60, 0, 0);
                
                return nextAlarmDate;
            };

            const scheduleAlarm = () => {
                const nextAlarm = calculateNextAlarm();
                const timeUntilAlarm = nextAlarm.getTime() - Date.now();
                
                if (timeUntilAlarm > 0) {
                    const timeoutId = setTimeout(() => {
                        // 알람 실행
                        showAlarmNotification(classInfo);
                        
                        // 다음 주 같은 시간에 다시 알람 등록
                        scheduleAlarm();
                    }, timeUntilAlarm);
                    
                    alarmTimeoutsRef.current.set(`${alarmId}_${day}`, timeoutId);
                }
            };

            scheduleAlarm();
        });
    };

    // 알람 알림 표시
    const showAlarmNotification = (classInfo) => {
        // 브라우저 알림 권한 확인
        if (Notification.permission === 'granted') {
            new Notification('수업 시작 알림', {
                body: `${classInfo.className} 수업이 5분 후에 시작됩니다.`,
                icon: '/vite.svg',
                tag: `class_${classInfo.classId}`,
                requireInteraction: true
            });
        } else if (Notification.permission !== 'denied') {
            // 권한 요청
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showAlarmNotification(classInfo);
                }
            });
        }

        // 추가적으로 페이지 내 알림도 표시할 수 있음
        console.log(`🔔 ${classInfo.className} 수업이 5분 후에 시작됩니다!`);
    };

    // 모든 알람 등록
    const registerAllAlarms = () => {
        if (!classes || classes.length === 0) return;
        
        classes.forEach(classInfo => {
            registerAlarm(classInfo);
        });
    };

    // 모든 알람 취소
    const clearAllAlarms = () => {
        alarmTimeoutsRef.current.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        alarmTimeoutsRef.current.clear();
        
        alarmIntervalsRef.current.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        alarmIntervalsRef.current.clear();
    };

    // 클래스 목록이 변경될 때마다 알람 재등록
    useEffect(() => {
        registerAllAlarms();
        
        // 컴포넌트 언마운트 시 알람 정리
        return () => {
            clearAllAlarms();
        };
    }, [classes]);

    return {
        registerAlarm,
        clearAllAlarms,
        showAlarmNotification
    };
};
