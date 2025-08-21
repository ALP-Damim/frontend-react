import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header, StompStatusIndicator } from "../../components/common";
import { fetchAllClasses, fetchClassSessions, formatTimeToMinutes } from "../../utils/api";

// 공통 강의 상세 페이지 컴포넌트
export default function ClassDetail({ 
    userType = 'student', 
    navigationLinks, 
    notifications,
    renderSessionActions,
    onLogout,
    showStompStatus = false
}) {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    // 강의 정보
    const [classInfo, setClassInfo] = useState(null);
    const [classLoading, setClassLoading] = useState(true);
    const [classError, setClassError] = useState(null);
    
    // 세션 목록
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsError, setSessionsError] = useState(null);

    // 강의 정보 조회
    useEffect(() => {
        const loadClassInfo = async () => {
            try {
                setClassLoading(true);
                setClassError(null);
                
                // 전체 강의 목록에서 해당 강의 찾기
                const allClasses = await fetchAllClasses();
                const targetClass = Array.isArray(allClasses) 
                    ? allClasses.find(c => c.classId === parseInt(classId))
                    : null;
                
                if (!targetClass) {
                    setClassError("강의를 찾을 수 없습니다.");
                    return;
                }
                
                setClassInfo(targetClass);
            } catch (e) {
                console.error("강의 정보 조회 실패:", e);
                setClassError("강의 정보를 불러오지 못했습니다.");
            } finally {
                setClassLoading(false);
            }
        };
        
        if (classId) {
            loadClassInfo();
        }
    }, [classId]);

    // 세션 목록 조회
    useEffect(() => {
        const loadSessions = async () => {
            try {
                setSessionsLoading(true);
                setSessionsError(null);
                
                const sessionsData = await fetchClassSessions(parseInt(classId));
                const sortedSessions = Array.isArray(sessionsData) 
                    ? sessionsData.sort((a, b) => new Date(a.onDate) - new Date(b.onDate))
                    : [];
                
                setSessions(sortedSessions);
            } catch (e) {
                console.error("세션 목록 조회 실패:", e);
                setSessionsError("세션 목록을 불러오지 못했습니다.");
            } finally {
                setSessionsLoading(false);
            }
        };
        
        if (classId) {
            loadSessions();
        }
    }, [classId]);

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
        return `${year}-${month}-${day} (${dayOfWeek})`;
    };

    if (classLoading) {
        return (
            <>
                <Header 
                    navigationLinks={navigationLinks} 
                    notifications={notifications}
                    onLogout={onLogout}
                    userType={userType}
                />
                <div className="container">
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        강의 정보를 불러오는 중...
                    </div>
                </div>
            </>
        );
    }

    if (classError) {
        return (
            <>
                <Header 
                    navigationLinks={navigationLinks} 
                    notifications={notifications}
                    onLogout={onLogout}
                    userType={userType}
                />
                <div className="container">
                    <div className="card" style={{ borderColor: 'var(--warn)' }}>
                        <div style={{ color: 'var(--warn)' }}>{classError}</div>
                        <button 
                            className="btn btn-outline" 
                            onClick={() => navigate(-1)}
                            style={{ marginTop: '12px' }}
                        >
                            뒤로 가기
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header 
                navigationLinks={navigationLinks} 
                notifications={notifications}
                onLogout={onLogout}
                userType={userType}
            />
            <div className="container">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* STOMP 연결 상태 표시 */}
                    {showStompStatus && <StompStatusIndicator />}

                    {/* 강의 정보 */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--accent)' }}>
                                {classInfo.className}
                            </h1>
                            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                                {classInfo.teacherName} · {classInfo.semester}
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                            <div>
                                <strong>강의 시간:</strong> {classInfo.heldDaysString} · {formatTimeToMinutes(classInfo.startsAt)}~{formatTimeToMinutes(classInfo.endsAt)}
                            </div>
                            <div>
                                <strong>줌 URL:</strong> {classInfo.zoomUrl ? (
                                    <button 
                                        className="btn" 
                                        style={{ backgroundColor: 'var(--accent)', color: 'white', fontSize: '12px', padding: '4px 8px' }}
                                        onClick={() => window.open(classInfo.zoomUrl, '_blank', 'noopener,noreferrer')}
                                    >
                                        줌 입장
                                    </button>
                                ) : '없음'}
                            </div>
                        </div>
                    </div>

                    {/* 세션 목록 */}
                    <div className="card">
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent)' }}>
                            세션 목록
                        </h2>
                        
                        {sessionsLoading ? (
                            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                세션 목록을 불러오는 중...
                            </div>
                        ) : sessionsError ? (
                            <div style={{ color: 'var(--warn)' }}>{sessionsError}</div>
                        ) : sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                등록된 세션이 없습니다.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {sessions.map(session => (
                                    <div key={session.sessionId} style={{ 
                                        padding: '16px', 
                                        border: '1px solid var(--border)', 
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--hover)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                    {session.sessionName}
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                                                    {formatDate(session.onDate)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {renderSessionActions(session)}
                                            </div>
                                        </div>
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
