import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header, StompStatusIndicator } from "../../components/common";
import { fetchStudentClasses, formatTimeToMinutes } from "../../utils/api";
import { useStudentStomp } from "../../hooks/useStudentStomp";

// 학생용 네비게이션 링크 (상단바 동일 구성)
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function MyCourses(){
    // 실제 로그인 연동 시 교체
    const studentId = 11;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classes, setClasses] = useState([]);
    
    // STOMP 연결 관리
    const { handleLogout } = useStudentStomp(studentId);

    useEffect(() => {
        let abort = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                
                const classData = await fetchStudentClasses(studentId);
                
                if (!abort) {
                    setClasses(Array.isArray(classData) ? classData : []);
                }
            } catch (e) {
                if (!abort) setError("수강 강좌를 불러오지 못했습니다.");
            } finally {
                if (!abort) setLoading(false);
            }
        })();
        return () => { abort = true; };
    }, [studentId]);

    const totalCount = useMemo(() => classes?.length ?? 0, [classes]);

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                onLogout={handleLogout}
            />
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 6, color: 'var(--accent)' }}>내 강의</h1>
                    <div style={{ color: 'var(--muted)' }}>현재 수강 중인 강의 {totalCount}개</div>
                </div>

                {/* STOMP 연결 상태 표시 */}
                <StompStatusIndicator />

                {error && (
                    <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warn)' }}>
                        <div style={{ color: 'var(--warn)' }}>{error}</div>
                    </div>
                )}

                {loading ? (
                    <div className="card">불러오는 중...</div>
                ) : (
                    <div className="grid">
                        {(classes && classes.length > 0) ? classes.map(c => (
                            <div key={c.classId} className="card">
                                <div className="course-title" style={{ marginTop: 6 }}>{c.className ?? '강의명'}</div>
                                <div className="course-info" style={{ marginTop: 6 }}>
                                    {(c.teacherName ?? '담당교수 미정')} · {(c.heldDaysString ?? '요일 미정')} · {formatTimeToMinutes(c.startsAt)}~{formatTimeToMinutes(c.endsAt)}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    {c.zoomUrl && (
                                        <a className="btn" href={c.zoomUrl} target="_blank" rel="noopener noreferrer">Zoom 입장</a>
                                    )}
                                    <Link className="btn btn-outline" to={`/student/class/${c.classId}`}>상세</Link>
                                </div>
                            </div>
                        )) : (
                            <div className="card" style={{ color: 'var(--muted)' }}>수강 중인 강의가 없습니다.</div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}


