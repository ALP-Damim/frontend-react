import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Header, AlarmStatusIndicator } from "../../components/common";
import { fetchAllClasses, formatTimeToMinutes, calculateNextClassTime } from "../../utils/api";
import { useClassAlarm } from "../../hooks/useClassAlarm";
import { useUserStomp } from "../../hooks/useUserStomp";

// 요일 매핑
const dayNames = ["일", "월", "화", "수", "목", "금", "토"]; // 0~6 (일~토)
const bitToDays = (heldDay) => {
    const result = [];
    const mapping = [6, 0, 1, 2, 3, 4, 5]; // bit index -> real day index (일=6, 월=0 ...)
    for (let i = 0; i < 7; i++) {
        if (heldDay & (1 << i)) {
            result.push(dayNames[mapping[i]]);
        }
    }
    return result;
};

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
    { to: "/course-registration", text: "신규 강의 등록" },
    { to: "/teacher/mypage", text: "마이페이지" }
];

export default function DashboardTeacher() {
    const teacherId = 1; // 강사 ID 고정
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classes, setClasses] = useState([]);
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(teacherId);

    // 알람 관리
    const { clearAllAlarms } = useClassAlarm(classes, teacherId);

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
                const data = await fetchAllClasses({ teacherId });
                setClasses(Array.isArray(data) ? data : []);
            } catch (e) {
                setError("강의 목록을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [teacherId]);

    // 제일 빨리 시작하는 강의 1개
    const nextClass = useMemo(() => {
        return calculateNextClassTime(classes);
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

    return (
        <>
            <Header 
                navigationLinks={teacherNavigationLinks}
                notifications={notifications}
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
                    {/* 왼쪽 2/3 - 내가 하고 있는 강의 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* 제일 빨리 시작하는 강의 1개 */}
                        <div className="card">
                            <h3 className="section-title">곧 시작하는 강의</h3>
                            {loading ? (
                                <div style={{ color: 'var(--muted)' }}>불러오는 중...</div>
                            ) : nextClass ? (
                                <div className="course-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div className="course-title">{nextClass.className}</div>
                                        <span className="badge">진행중</span>
                                    </div>
                                    <div className="course-info" style={{ marginBottom: '16px' }}>
                                        {nextClass.teacherName} · {nextClass.heldDaysString} · {formatTimeToMinutes(nextClass.startsAt)}~{formatTimeToMinutes(nextClass.endsAt)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {nextClass.zoomUrl && (
                                            <a className="btn" href={nextClass.zoomUrl} target="_blank" rel="noreferrer">
                                                Zoom 입장
                                            </a>
                                        )}
                                        <Link className="btn btn-outline" to={`/teacher/course/${nextClass.classId}`}>
                                            강의실 입장
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'var(--muted)' }}>예정된 강의가 없습니다</div>
                            )}
                        </div>

                        {/* 모든 강좌 */}
                        <div className="card">
                            <h3 className="section-title">내가 하고 있는 강의</h3>
                            {loading ? (
                                <div style={{ color: 'var(--muted)' }}>불러오는 중...</div>
                            ) : (
                                <div className="grid" style={{ gap: '16px' }}>
                                    {classes.length > 0 ? classes.map(course => (
                                        <div key={course.classId} className="course-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div className="course-title">{course.className}</div>
                                                <span className="badge">진행중</span>
                                            </div>
                                            <div className="course-info" style={{ marginBottom: '16px' }}>
                                                {course.teacherName} · {course.heldDaysString} · {formatTimeToMinutes(course.startsAt)}~{formatTimeToMinutes(course.endsAt)}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link className="btn" to={`/teacher/course/${course.classId}`}>
                                                    강의실 입장
                                                </Link>
                                                <Link className="btn btn-outline" to={`/teacher/class/${course.classId}`}>
                                                    관리
                                                </Link>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ color: 'var(--muted)' }}>진행 중인 강의가 없습니다</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽 1/3 - 요일별 시간표 */}
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
