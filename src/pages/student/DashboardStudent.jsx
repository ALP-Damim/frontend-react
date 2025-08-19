import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ScoreChart } from "../../components/student";

// 하드코딩된 데이터
const upcomingCourses = [
    { id: "c1", title: "데이터 분석 실전 3주차", time: "오늘 19:00", instructor: "김교수", type: "라이브" },
    { id: "c2", title: "웹 개발 입문", time: "내일 10:00", instructor: "이교수", type: "라이브" },
    { id: "c3", title: "머신러닝 기초", time: "3일 후 14:00", instructor: "박교수", type: "라이브" },
];

const recommendedCourses = [
    { id: "rc1", title: "React 실전 프로젝트", instructor: "최교수", rating: 4.8, students: 156, type: "온라인" },
    { id: "rc2", title: "Python 데이터 시각화", instructor: "정교수", rating: 4.6, students: 89, type: "온라인" },
    { id: "rc3", title: "알고리즘 문제 풀이", instructor: "한교수", rating: 4.9, students: 234, type: "온라인" },
];

const scheduleData = [
    { day: "월", events: ["데이터 분석 실전 19:00"] },
    { day: "화", events: ["웹 개발 입문 10:00"] },
    { day: "수", events: [] },
    { day: "목", events: ["머신러닝 기초 14:00"] },
    { day: "금", events: [] },
    { day: "토", events: ["주말 특강 15:00"] },
    { day: "일", events: [] },
];

// 하드코딩된 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 강의 'React 실전 프로젝트'가 등록되었습니다.", time: "1시간 전", read: false },
    { id: 3, message: "웹 개발 입문 과제 제출 마감이 임박했습니다.", time: "2시간 전", read: true },
    { id: 4, message: "머신러닝 기초 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

function StudentHeader() {
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
                <Link to="/student" className="nav-link">내강의</Link>
                <Link to="/course-application" className="nav-link">강의신청</Link>
                <Link to="/mypage" className="nav-link">마이페이지</Link>
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

export default function DashboardStudent() {
    return (
        <>
            <StudentHeader />
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* 왼쪽 2/3 컬럼 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* 곧 들어야 하는 강의 */}
                        <div className="card">
                            <h3 className="section-title">곧 들어야 하는 강의</h3>
                            <div>
                                {upcomingCourses.map(course => (
                                    <div key={course.id} className="course-card">
                                        <div className="course-title">{course.title}</div>
                                        <div className="course-info">
                                            {course.time} · {course.instructor} · {course.type}
                                        </div>
                                        <div style={{ marginTop: '12px' }}>
                                            <Link className="btn" to={`/course/${course.id}`}>
                                                입장하기
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 추천 강의 */}
                        <div className="card">
                            <h3 className="section-title">추천 강의</h3>
                            <div>
                                {recommendedCourses.map(course => (
                                    <div key={course.id} className="course-card">
                                        <div className="course-title">{course.title}</div>
                                        <div className="course-info">
                                            {course.instructor} · ⭐ {course.rating} · {course.students}명 수강 · {course.type}
                                        </div>
                                        <div style={{ marginTop: '12px' }}>
                                            <Link className="btn btn-outline" to={`/course/${course.id}`}>
                                                신청하기
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 1/3 컬럼 - 일정 */}
                    <div className="schedule-section">
                        <h3 className="section-title">이번 주 일정</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {scheduleData.map((day, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    padding: '12px', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '8px',
                                    backgroundColor: day.events.length > 0 ? 'var(--hover)' : 'transparent'
                                }}>
                                    <div style={{ 
                                        width: '40px', 
                                        fontWeight: '600', 
                                        color: 'var(--accent)' 
                                    }}>
                                        {day.day}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {day.events.length > 0 ? (
                                            day.events.map((event, eventIndex) => (
                                                <div key={eventIndex} style={{ 
                                                    fontSize: '14px', 
                                                    color: 'var(--text)' 
                                                }}>
                                                    {event}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: 'var(--muted)' 
                                            }}>
                                                일정 없음
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <Link className="btn btn-outline" to="/schedule" style={{ width: '100%', textAlign: 'center' }}>
                                전체 일정 보기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
