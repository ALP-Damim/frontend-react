import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ScoreChart } from "../../components/student";
import { Header, AlarmStatusIndicator } from "../../components/common";
import { fetchStudentClasses, formatTimeToMinutes, calculateNextClassTime, isClassEntryAvailable, createAttendance, fetchCurrentSession } from "../../utils/api";
import { useUserStomp } from "../../hooks/useUserStomp";
import { useClassAlarm } from "../../hooks/useClassAlarm";

// 하드코딩된 데이터 (추천 강의 예시)
const recommendedCourses = [
    { id: "rc1", title: "React 실전 프로젝트", instructor: "최교수", rating: 4.8, students: 156, type: "온라인" },
    { id: "rc2", title: "Python 데이터 시각화", instructor: "정교수", rating: 4.6, students: 89, type: "온라인" },
    { id: "rc3", title: "알고리즘 문제 풀이", instructor: "한교수", rating: 4.9, students: 234, type: "온라인" },
];

// 요일 매핑
const dayNames = ["일", "월", "화", "수", "목", "금", "토"]; // 0~6 (일~토)
const bitToDays = (heldDay) => {
    // 비트셋: 월(1), 화(2), 수(4), 목(8), 금(16), 토(32), 일(64) 라고 가정 시 서버 설명과 맞추기 위해 변환 필요
    // 서버 응답 예시에서 heldDaysString이 함께 오므로, 우선 heldDaysString을 신뢰하고 heldDay는 폴백으로만 사용
    const result = [];
    const mapping = [6, 0, 1, 2, 3, 4, 5]; // bit index -> real day index (일=6, 월=0 ...)
    for (let i = 0; i < 7; i++) {
        if (heldDay & (1 << i)) {
            result.push(dayNames[mapping[i]]);
        }
    }
    return result;
};

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function DashboardStudent() {
    // 실제 적용 시 로그인 유저의 studentId를 사용
    const studentId = 21; // 임시 고정
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classes, setClasses] = useState([]);
    const navigate = useNavigate();
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(studentId);

    // 알람 관리
    const { clearAllAlarms } = useClassAlarm(classes, studentId);

    // 로그아웃 시 알람도 함께 취소
    const handleLogoutWithAlarm = () => {
        clearAllAlarms();
        handleLogout();
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchStudentClasses(studentId);
                setClasses(Array.isArray(data) ? data : []);
            } catch (e) {
                setError("수강 강좌를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [studentId]);

    // 가까운 3개 (계산 함수 사용)
    const nearestThree = useMemo(() => {
        return calculateNextClassTime(classes, 3);
    }, [classes]);

    // 요일별 그룹화
    const byWeekday = useMemo(() => {
        const groups = { "월": [], "화": [], "수": [], "목": [], "금": [], "토": [], "일": [] };
        classes.forEach((c) => {
            const days = (c.heldDaysString && c.heldDaysString.split(',').map(s => s.trim()))?.filter(Boolean);
            const normalized = days?.length ? days : bitToDays(c.heldDay);
            normalized.forEach((d) => {
                if (!groups[d]) groups[d] = [];
                groups[d].push(c);
            });
        });
        // 각 요일 내 정렬 (startsAt 기준)
        const toVal = (hhmm) => (hhmm ? Number(hhmm.replace(":", "")) : 9999);
        for (const k of Object.keys(groups)) {
            groups[k].sort((a, b) => toVal(a.startsAt) - toVal(b.startsAt));
        }
        return groups;
    }, [classes]);

    // 강의 입장 핸들러
    const handleClassEntry = async (classData) => {
        try {
            // 현재 세션 정보 조회
            const sessionData = await fetchCurrentSession(classData.classId);
            
            // sessionData가 null이거나 sessionId가 없는 경우 출석 기록하지 않음
            if (sessionData && sessionData.sessionId && typeof sessionData.sessionId === 'number') {
                // 출석 상태 결정 (현재 시간과 강의 시작 시간 비교)
                const now = new Date();
                const [startHour, startMin] = classData.startsAt.split(':').map(Number);
                const classStartTime = new Date();
                classStartTime.setHours(startHour, startMin, 0, 0);
                
                // 10분 지각 기준
                const lateThreshold = new Date(classStartTime.getTime() + 10 * 60 * 1000);
                
                let status = 'PRESENT';
                let note = '';
                
                if (now > lateThreshold) {
                    status = 'LATE';
                    const minutesLate = Math.floor((now - classStartTime) / (1000 * 60));
                    note = `${minutesLate}분 지각`;
                }
                
                // 출석 데이터 생성
                const attendanceData = {
                    sessionId: sessionData.sessionId,
                    studentId: studentId,
                    status: status,
                    note: note
                };
                
                await createAttendance(attendanceData);
                console.log('출석이 기록되었습니다:', attendanceData);
            } else {
                console.log('현재 진행 중인 세션이 없어 출석을 기록하지 않습니다.');
            }
            
            // 강의실로 이동
            navigate(`/student/session/${classData.classId}`);
        } catch (error) {
            console.error('출석 기록 실패:', error);
            // 출석 기록에 실패해도 강의실로 이동
            navigate(`/student/session/${classData.classId}`);
        }
    };

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                onLogout={handleLogoutWithAlarm}
            />
            <div className="container">
                {error && (
                    <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warn)' }}>
                        <div style={{ color: 'var(--warn)' }}>{error}</div>
                    </div>
                )}

                {/* 알람 상태 표시 */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <AlarmStatusIndicator classes={classes} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* 왼쪽 2/3 컬럼 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* 제일 가까운 수업 3개 */}
                        <div className="card">
                            <h3 className="section-title">곧 시작하는 강의</h3>
                            {loading ? (
                                <div style={{ color: 'var(--muted)' }}>불러오는 중...</div>
                            ) : (
                                <div>
                                    {nearestThree.length > 0 ? nearestThree.map((c, index) => (
                                        <div key={c.classId} className="course-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div className="course-title">{c.className}</div>
                                                {c.isCurrent && (
                                                    <span className="badge" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                                                        진행중
                                                    </span>
                                                )}
                                            </div>
                                            <div className="course-info">
                                                {c.teacherName} · {c.heldDaysString} · {formatTimeToMinutes(c.startsAt)}~{formatTimeToMinutes(c.endsAt)}
                                            </div>
                                            <div style={{ marginTop: '12px', display: 'flex', gap: 8 }}>
                                                {isClassEntryAvailable(c) ? (
                                                    <button 
                                                        className="btn" 
                                                        onClick={() => handleClassEntry(c)}
                                                    >
                                                        {c.isCurrent ? '강의 참여' : '강의 입장'}
                                                    </button>
                                                ) : (
                                                    <button className="btn" disabled>
                                                        {c.isCurrent ? '강의 참여' : '강의 입장'}
                                                    </button>
                                                )}
                                                <Link className="btn btn-outline" to={`/student/class/${c.classId}`}>상세</Link>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ color: 'var(--muted)' }}>예정된 강의가 없습니다</div>
                                    )}
                                </div>
                            )}
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

                    {/* 오른쪽 1/3 컬럼 - 요일별 정리 */}
                    <div className="schedule-section">
                        <h3 className="section-title">요일별 강의</h3>
                        {loading ? (
                            <div style={{ color: 'var(--muted)' }}>불러오는 중...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {["월","화","수","목","금","토","일"].map((d) => (
                                    <div key={d} style={{ 
                                        padding: '12px',
                                        border: '1px solid var(--border)', 
                                        borderRadius: '8px',
                                        backgroundColor: (byWeekday[d]?.length ?? 0) > 0 ? 'var(--hover)' : 'transparent'
                                    }}>
                                        <div style={{ 
                                            fontWeight: '700', 
                                            color: 'var(--accent)',
                                            marginBottom: 8
                                        }}>{d}</div>
                                        {(byWeekday[d] && byWeekday[d].length > 0) ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {byWeekday[d].map((c) => (
                                                    <div key={`${d}-${c.classId}`} style={{ fontSize: 14, color: 'var(--text)' }}>
                                                        {c.className} · {formatTimeToMinutes(c.startsAt)}~{formatTimeToMinutes(c.endsAt)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 14, color: 'var(--muted)' }}>강의 없음</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
