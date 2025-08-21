import { useState, useEffect } from 'react';

export default function AlarmStatusIndicator({ classes }) {
    const [alarmStatus, setAlarmStatus] = useState('inactive');
    const [nextAlarm, setNextAlarm] = useState(null);

    useEffect(() => {
        if (!classes || classes.length === 0) {
            setAlarmStatus('inactive');
            setNextAlarm(null);
            return;
        }

        // 다음 알람 시간 계산
        const calculateNextAlarm = () => {
            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            
            const dayToNumber = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
            let closestAlarm = null;
            let minTimeDiff = Infinity;

            classes.forEach(classInfo => {
                if (!classInfo.startsAt || !classInfo.heldDaysString) return;

                const days = classInfo.heldDaysString.split(',').map(d => d.trim());
                const [hours, minutes] = classInfo.startsAt.split(':').map(Number);
                const classTime = hours * 60 + minutes;
                const alarmTime = classTime - 5; // 5분 전

                days.forEach(day => {
                    const dayNumber = dayToNumber[day];
                    if (dayNumber === undefined) return;

                    let daysDiff = dayNumber - currentDay;
                    if (daysDiff < 0) daysDiff += 7;
                    if (daysDiff === 0 && alarmTime <= currentTime) {
                        daysDiff = 7;
                    }

                    const timeDiff = daysDiff * 24 * 60 + (alarmTime - currentTime);
                    
                    if (timeDiff > 0 && timeDiff < minTimeDiff) {
                        minTimeDiff = timeDiff;
                        closestAlarm = {
                            classInfo,
                            timeDiff,
                            alarmTime: new Date(now.getTime() + timeDiff * 60 * 1000)
                        };
                    }
                });
            });

            return closestAlarm;
        };

        const next = calculateNextAlarm();
        setNextAlarm(next);

        if (next) {
            // 5분 이내면 활성 상태
            if (next.timeDiff <= 5) {
                setAlarmStatus('active');
            } else {
                setAlarmStatus('scheduled');
            }
        } else {
            setAlarmStatus('inactive');
        }
    }, [classes]);

    const getStatusText = () => {
        switch (alarmStatus) {
            case 'active':
                return '🔔 알람 활성';
            case 'scheduled':
                return '⏰ 알람 예약됨';
            case 'inactive':
                return '🔕 알람 비활성';
            default:
                return '🔕 알람 비활성';
        }
    };

    const getStatusColor = () => {
        switch (alarmStatus) {
            case 'active':
                return 'var(--warn)';
            case 'scheduled':
                return 'var(--accent)';
            case 'inactive':
                return 'var(--muted)';
            default:
                return 'var(--muted)';
        }
    };

    const formatTimeUntil = (timeDiff) => {
        if (timeDiff < 60) {
            return `${timeDiff}분 후`;
        } else if (timeDiff < 24 * 60) {
            const hours = Math.floor(timeDiff / 60);
            const minutes = timeDiff % 60;
            return `${hours}시간 ${minutes}분 후`;
        } else {
            const days = Math.floor(timeDiff / (24 * 60));
            const hours = Math.floor((timeDiff % (24 * 60)) / 60);
            return `${days}일 ${hours}시간 후`;
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: getStatusColor()
        }}>
            <span>{getStatusText()}</span>
            {nextAlarm && (
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    ({nextAlarm.classInfo.className} - {formatTimeUntil(nextAlarm.timeDiff)})
                </span>
            )}
        </div>
    );
}
