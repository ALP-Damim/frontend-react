import { Link } from "react-router-dom";
import { Header } from "../../components/common";

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

// 강사용 네비게이션 링크 설정
const teacherNavigationLinks = [
    { to: "/teacher", text: "내 강의" },
    { to: "/course-registration", text: "신규 강의 등록" }
];

export default function DashboardTeacher() {
    return (
        <>
            <Header 
                navigationLinks={teacherNavigationLinks}
                notifications={notifications}
            />
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
