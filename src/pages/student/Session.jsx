import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
import { fetchCurrentSession, fetchExamBySessionId } from '../../utils/api';

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function Session() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [exam, setExam] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadSession = async () => {
            try {
                setLoading(true);
                setError(null);
                const sessionData = await fetchCurrentSession(classId);
                setSession(sessionData);
                
                // 세션 정보가 있으면 시험 정보도 조회
                if (sessionData && sessionData.sessionId) {
                    const examData = await fetchExamBySessionId(sessionData.sessionId);
                    setExam(examData);
                }
            } catch (e) {
                setError("세션 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [classId]);

    const handleExamEntry = () => {
        // 시험 페이지로 이동 (나중에 구현)
        navigate(`/student/exam/${session?.sessionId || classId}`);
    };

    if (loading) {
        return (
            <>
                <Header 
                    navigationLinks={studentNavigationLinks}
                    notifications={[]}
                />
                <div className="container">
                    <div className="card">
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ color: 'var(--muted)' }}>세션 정보를 불러오는 중...</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header 
                    navigationLinks={studentNavigationLinks}
                    notifications={[]}
                />
                <div className="container">
                    <div className="card" style={{ borderColor: 'var(--warn)' }}>
                        <div style={{ color: 'var(--warn)', textAlign: 'center', padding: '40px' }}>
                            {error}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
            />
            <div className="container">
                <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent)' }}>
                            시험 대기중...
                        </h2>
                        <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                            {exam && !exam.isReady 
                                ? "시험 준비 중입니다. 준비가 완료되면 입장할 수 있습니다." 
                                : "시험이 시작되면 아래 버튼을 클릭하여 입장하세요."
                            }
                        </p>
                        <button 
                            className="btn" 
                            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                            onClick={handleExamEntry}
                            disabled={exam && !exam.isReady}
                            title={exam && !exam.isReady ? "시험 준비중" : ""}
                        >
                            시험 입장
                        </button>
                        {exam && !exam.isReady && (
                            <div style={{ 
                                marginTop: '16px', 
                                padding: '12px', 
                                backgroundColor: 'var(--hover)', 
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: 'var(--muted)',
                                textAlign: 'center'
                            }}>
                                ⏳ 시험 준비 중입니다. 잠시만 기다려주세요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
