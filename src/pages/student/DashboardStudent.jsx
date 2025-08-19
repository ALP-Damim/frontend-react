import { Link } from "react-router-dom";
import { ScoreChart } from "../../components/student";
import { Header } from "../../components/common";

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

// 학생용 네비게이션 링크 설정
const studentNavigationLinks = [
    { to: "/student", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function DashboardStudent() {
    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={notifications}
            />
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
