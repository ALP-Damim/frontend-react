import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// 하드코딩된 데이터
const myCourses = [
    { 
        id: "tc1", 
        title: "데이터 분석 실전", 
        students: 45, 
        progress: 75, 
        nextSession: "오늘 19:00",
        status: "진행중"
    },
    { 
        id: "tc2", 
        title: "웹 개발 입문", 
        students: 32, 
        progress: 60, 
        nextSession: "내일 10:00",
        status: "진행중"
    },
    { 
        id: "tc3", 
        title: "머신러닝 기초", 
        students: 28, 
        progress: 40, 
        nextSession: "3일 후 14:00",
        status: "진행중"
    },
    { 
        id: "tc4", 
        title: "알고리즘 문제 풀이", 
        students: 56, 
        progress: 90, 
        nextSession: "이번 주 토요일",
        status: "진행중"
    },
];

const upcomingSessions = [
    { 
        id: "us1", 
        title: "데이터 분석 실전 3주차", 
        time: "오늘 19:00", 
        students: 45,
        type: "라이브"
    },
    { 
        id: "us2", 
        title: "웹 개발 입문 2주차", 
        time: "내일 10:00", 
        students: 32,
        type: "라이브"
    },
];

// 하드코딩된 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 학생이 웹 개발 입문 강의에 신청했습니다.", time: "1시간 전", read: false },
    { id: 3, message: "머신러닝 기초 과제 제출이 완료되었습니다.", time: "2시간 전", read: true },
    { id: 4, message: "알고리즘 문제 풀이 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

function TeacherHeader() {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const handleLogout = () => {
        // 나중에 쿠키 해제 로직 추가 예정
        navigate('/');
    };

    const handleNotificationClick = (e) => {
        e.stopPropagation();
        setShowNotifications(!showNotifications);
    };

    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="header-nav">
            <div className="header-nav-left">
                <Link to="/" className="logo">EduLearn</Link>
                <Link to="/teacher" className="nav-link">내 강의</Link>
                <Link to="/course-registration" className="nav-link">신규 강의 등록</Link>
            </div>
            <div className="header-nav-right">
                <div ref={notificationRef} style={{ position: 'relative' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleNotificationClick} 
                        style={{ padding: '8px 12px', position: 'relative' }}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'var(--warn)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    
                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            width: '350px',
                            maxHeight: '400px',
                            backgroundColor: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: 'var(--hover)',
                                fontWeight: '600'
                            }}>
                                알림 ({notifications.length})
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div 
                                            key={notification.id} 
                                            style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border)',
                                                backgroundColor: notification.read ? 'transparent' : 'var(--hover)',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = notification.read ? 'transparent' : 'var(--hover)'}
                                        >
                                            <div style={{ 
                                                fontSize: '14px', 
                                                marginBottom: '4px',
                                                fontWeight: notification.read ? '400' : '600'
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: 'var(--muted)' 
                                            }}>
                                                {notification.time}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: 'var(--muted)'
                                    }}>
                                        알림이 없습니다
                                    </div>
                                )}
                            </div>
                            <div style={{
                                padding: '8px 16px',
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
                        </div>
                    )}
                </div>
                <button className="btn btn-outline" onClick={handleLogout}>로그아웃</button>
            </div>
        </div>
    );
}

export default function DashboardTeacher() {
    return (
        <>
            <TeacherHeader />
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* 왼쪽 2/3 - 내가 하고 있는 강의 */}
                    <div>
                        <div className="card">
                            <h2 className="section-title">내가 하고 있는 강의</h2>
                            <div className="grid" style={{ gap: '16px' }}>
                                {myCourses.map(course => (
                                    <div key={course.id} className="course-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div className="course-title">{course.title}</div>
                                            <span className="badge">{course.status}</span>
                                        </div>
                                        <div className="course-info" style={{ marginBottom: '16px' }}>
                                            수강생 {course.students}명 · 진행률 {course.progress}% · 다음 세션: {course.nextSession}
                                        </div>
                                        
                                        {/* 진행률 바 */}
                                        <div style={{ 
                                            width: '100%', 
                                            height: '8px', 
                                            backgroundColor: 'var(--border)', 
                                            borderRadius: '4px',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ 
                                                width: `${course.progress}%`, 
                                                height: '100%', 
                                                backgroundColor: 'var(--accent)', 
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link className="btn" to={`/teacher/course/${course.id}`}>
                                                강의실 입장
                                            </Link>
                                            <Link className="btn btn-outline" to={`/teacher/course/${course.id}/manage`}>
                                                관리
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 1/3 - 곧 시작하는 강의 */}
                    <div>
                        <div className="card">
                            <h3 className="section-title">곧 시작하는 강의</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {upcomingSessions.map(session => (
                                    <div key={session.id} className="course-card">
                                        <div className="course-title">{session.title}</div>
                                        <div className="course-info" style={{ marginBottom: '12px' }}>
                                            {session.time} · {session.students}명 참여 · {session.type}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link className="btn" to={`/teacher/session/${session.id}`}>
                                                입장하기
                                            </Link>
                                            <Link className="btn btn-outline" to={`/teacher/session/${session.id}/prepare`}>
                                                준비
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <Link className="btn btn-outline" to="/teacher/schedule" style={{ width: '100%', textAlign: 'center' }}>
                                    전체 일정 보기
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
