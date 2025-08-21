import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
import { fetchCurrentSession, fetchExamBySessionId, fetchQuestionsByExamId, createSubmission, createAttendance } from '../../utils/api';

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function Session() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const studentId = 21; // 실제 로그인 사용자 ID로 교체 필요
    
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    const [exam, setExam] = useState(null);
    const [examReady, setExamReady] = useState(false);
    const [checkingExam, setCheckingExam] = useState(false);
    const [attendanceCreated, setAttendanceCreated] = useState(false);

    // 출석 생성 및 시험 상태 확인
    useEffect(() => {
        const initializeSession = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // 1. 현재 세션 정보 조회
                const sessionData = await fetchCurrentSession(classId);
                if (!sessionData || !sessionData.sessionId) {
                    setError("현재 진행 중인 세션이 없습니다.");
                    return;
                }
                setSession(sessionData);
                
                // 2. 출석 생성 (아직 생성되지 않은 경우)
                if (!attendanceCreated) {
                    try {
                        const attendanceData = {
                            sessionId: sessionData.sessionId,
                            studentId: studentId,
                            status: 'PRESENT',
                            note: ''
                        };
                        await createAttendance(attendanceData);
                        console.log('출석이 기록되었습니다:', attendanceData);
                        setAttendanceCreated(true);
                    } catch (attendanceError) {
                        console.error('출석 기록 실패:', attendanceError);
                        // 출석 실패해도 계속 진행
                    }
                }
                
                // 3. 시험 상태 확인
                await checkExamStatus(sessionData.sessionId);
                
            } catch (e) {
                setError("세션 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        
        initializeSession();
    }, [classId, attendanceCreated]);

    // 시험 상태 확인 함수
    const checkExamStatus = async (sessionId) => {
        try {
            setCheckingExam(true);
            
            // 시험 정보 조회
            const examData = await fetchExamBySessionId(sessionId);
            
            if (examData) {
                setExam(examData);
                setExamReady(examData.isReady);
                
                // 시험이 준비되지 않은 경우 주기적으로 재확인
                if (!examData.isReady) {
                    setTimeout(() => checkExamStatus(sessionId), 5000); // 5초마다 재확인
                }
            } else {
                // 시험이 아직 생성되지 않은 경우 주기적으로 재확인
                setTimeout(() => checkExamStatus(sessionId), 3000); // 3초마다 재확인
            }
        } catch (error) {
            console.error('시험 상태 확인 실패:', error);
        } finally {
            setCheckingExam(false);
        }
    };

    // 시험 시작 핸들러
    const handleExamStart = async () => {
        if (!exam || !exam.isReady) {
            return;
        }
        
        try {
            // 1. 시험 문제 목록 조회
            const questions = await fetchQuestionsByExamId(exam.id);
            if (!questions || questions.length === 0) {
                setError("시험 문제를 불러올 수 없습니다.");
                return;
            }
            
            // 2. Submission 데이터 생성
            const submissionData = {
                examId: exam.id,
                userId: studentId,
                submittedAt: new Date().toISOString(),
                totalScore: 0,
                feedback: '',
                feedbackStatus: 'NONE',
                feedbackRetryCount: 0
            };
            
            const submission = await createSubmission(submissionData);
            console.log('시험 제출 데이터가 생성되었습니다:', submission);
            
            // 3. 첫 번째 문제 페이지로 이동
            navigate(`/student/exam/${exam.id}/question/1`, {
                state: {
                    exam: exam,
                    questions: questions,
                    submission: submission,
                    currentQuestionIndex: 0
                }
            });
            
        } catch (error) {
            console.error('시험 시작 실패:', error);
            setError("시험을 시작할 수 없습니다. 다시 시도해주세요.");
        }
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
                            {exam ? '시험 대기중...' : '시험 준비중...'}
                        </h2>
                        
                        {!exam ? (
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                                    시험이 준비되고 있습니다. 잠시만 기다려주세요.
                                </p>
                                {checkingExam && (
                                    <div style={{ 
                                        marginTop: '16px', 
                                        padding: '12px', 
                                        backgroundColor: 'var(--hover)', 
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: 'var(--muted)',
                                        textAlign: 'center'
                                    }}>
                                        🔍 시험 상태를 확인하는 중...
                                    </div>
                                )}
                            </div>
                        ) : !exam.isReady ? (
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                                    시험 준비 중입니다. 준비가 완료되면 입장할 수 있습니다.
                                </p>
                                <button 
                                    className="btn" 
                                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                                    disabled={true}
                                    title="시험 준비중"
                                >
                                    시험 입장
                                </button>
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
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                                    시험 준비가 완료되었습니다. 아래 버튼을 클릭하여 시험을 시작하세요.
                                </p>
                                <button 
                                    className="btn" 
                                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                                    onClick={handleExamStart}
                                >
                                    시험 시작
                                </button>
                                <div style={{ 
                                    marginTop: '16px', 
                                    padding: '12px', 
                                    backgroundColor: 'var(--success)', 
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    ✅ 시험 준비 완료! 시험을 시작할 수 있습니다.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
