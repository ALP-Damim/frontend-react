import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../../components/common";
import { fetchStudentClasses, formatTimeToMinutes, isClassEntryAvailable, findNearestFutureSession } from "../../utils/api";
import { useUserStomp } from "../../hooks/useUserStomp";
import { useStomp } from "../../contexts/StompContext";

// 학생용 네비게이션 링크 (상단바 동일 구성)
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function MyCourses(){
    // 실제 로그인 연동 시 교체
    const studentId = 21;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classes, setClasses] = useState([]);
    const navigate = useNavigate();
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(studentId);
    
    // STOMP 훅 사용
    const { isConnected, sendMessage } = useStomp();

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

    // 강의 입장 핸들러
    const handleClassEntry = async (classData) => {
        try {
            // 해당 강의의 세션 정보 조회
            const session = await findNearestFutureSession(classData.classId);
            
            if (!session || !session.sessionId) {
                console.log('세션 정보가 없어 강의에 입장할 수 없습니다.');
                alert('현재 진행 중인 세션이 없습니다.');
                return;
            }
            
            // 세션 ID에 대한 STOMP 구독 설정
            if (isConnected) {
                console.log(`📡 세션 구독 시도: /topic/session/${session.sessionId}`);
                
                // 구독 요청 메시지 전송
                sendMessage('/app/session/subscribe', {
                    sessionId: session.sessionId,
                    studentId: studentId
                });
                
                console.log(`✅ 세션 ${session.sessionId} 구독 완료`);
            } else {
                console.log('⚠️ STOMP 연결이 필요합니다.');
            }
            
            // 세션 페이지로 이동
            navigate(`/student/session/${session.sessionId}`);
            
        } catch (error) {
            console.error('강의 입장 실패:', error);
            alert('강의 입장에 실패했습니다.');
        }
    };

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                onLogout={handleLogout}
                userType="student"
            />
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 6, color: 'var(--accent)' }}>내 강의</h1>
                    <div style={{ color: 'var(--muted)' }}>현재 수강 중인 강의 {totalCount}개</div>
                </div>

                {/* STOMP 연결 상태 표시 */}


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
                                    {isClassEntryAvailable(c) ? (
                                        <button 
                                            className="btn" 
                                            onClick={() => handleClassEntry(c)}
                                        >
                                            강의 입장
                                        </button>
                                    ) : (
                                        <button className="btn" disabled>
                                            강의 입장
                                        </button>
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


