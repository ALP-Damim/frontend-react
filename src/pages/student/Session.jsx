import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
import { useStomp } from '../../contexts/StompContext';

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

// 하드코딩된 시험 데이터
const mockExam = {
    id: "exam-001",
    name: "React 기초 시험",
    description: "React의 기본 개념과 사용법에 대한 시험입니다.",
    duration: 60, // 분
    totalPoints: 100,
    isReady: false // 초기에는 준비되지 않은 상태
};

const mockQuestions = [
    {
        id: "q1",
        body: "React에서 컴포넌트를 정의하는 방법 중 올바른 것은?",
        qtype: "MCQ",
        choices: JSON.stringify([
            "function MyComponent() { return <div>Hello</div>; }",
            "class MyComponent { render() { return <div>Hello</div>; } }",
            "const MyComponent = () => <div>Hello</div>;",
            "모든 위의 방법들이 올바르다"
        ]),
        points: 20,
        correctAnswer: "모든 위의 방법들이 올바르다"
    },
    {
        id: "q2",
        body: "React에서 상태(state)를 관리하는 Hook은?",
        qtype: "MCQ",
        choices: JSON.stringify([
            "useState",
            "useEffect", 
            "useContext",
            "useReducer"
        ]),
        points: 20,
        correctAnswer: "useState"
    },
    {
        id: "q3",
        body: "React에서 props의 특징을 설명하세요.",
        qtype: "SHORT",
        points: 20,
        correctAnswer: "읽기 전용이며 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법"
    },
    {
        id: "q4",
        body: "React의 Virtual DOM이 실제 DOM보다 빠른 이유를 설명하세요.",
        qtype: "ESSAY",
        points: 25,
        correctAnswer: "Virtual DOM은 메모리상의 가상 표현으로, 실제 DOM 조작을 최소화하여 성능을 향상시킵니다."
    },
    {
        id: "q5",
        body: "React에서 조건부 렌더링을 구현하는 방법을 예시와 함께 설명하세요.",
        qtype: "ESSAY",
        points: 15,
        correctAnswer: "삼항 연산자나 && 연산자를 사용하여 조건에 따라 다른 컴포넌트를 렌더링할 수 있습니다."
    }
];

export default function Session() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const studentId = 26; // 실제 로그인 사용자 ID로 교체 필요
    
    // STOMP 훅 사용
    const { isConnected, sendMessage, subscribeToTopic } = useStomp();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exam, setExam] = useState(null);
    const [examReady, setExamReady] = useState(false);
    const [checkingExam, setCheckingExam] = useState(false);
    const subscriptionRef = useRef(null);
    const isSubscribedRef = useRef(false);

    // 시험 상태 확인
    useEffect(() => {
        console.log('Session.jsx - sessionId from params:', sessionId);
        
        const initializeExam = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // sessionId가 없으면 에러 처리
                if (!sessionId) {
                    setError("세션 ID가 없습니다.");
                    return;
                }
                
                // 하드코딩된 시험 데이터 사용 (초기에는 준비되지 않은 상태)
                setExam(mockExam);
                setExamReady(mockExam.isReady);
                setLoading(false);
                
            } catch (e) {
                console.error('Session.jsx - Error:', e);
                setError("시험 정보를 불러오지 못했습니다.");
                setLoading(false);
            }
        };
        
        initializeExam();
        
        // 브라우저 알림 권한 요청
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
    }, [sessionId]);

    // STOMP를 통한 시험 준비 상태 실시간 감지
    useEffect(() => {
        if (!isConnected || !sessionId) {
            return;
        }

        // 이미 구독 중이면 중복 구독 방지
        if (isSubscribedRef.current) {
            console.log('이미 구독 중입니다. 중복 구독 방지.');
            return;
        }

        console.log('🔗 STOMP 연결됨, 세션 구독 시작');
        console.log(`📋 세션 ID: ${sessionId}`);
        console.log(`📡 구독 토픽: /topic/session/${sessionId}`);
        
        // 세션 구독 메시지 전송
        const subscribeMessage = {
            sessionId: sessionId,
            studentId: studentId,
            action: 'subscribe'
        };
        
        console.log('📤 세션 구독 메시지 전송:', subscribeMessage);
        sendMessage('/app/session/subscribe', subscribeMessage);
        
        // 구독 완료 로그
        console.log('✅ 세션 STOMP 구독 완료');
        console.log(`🎯 구독 토픽: /topic/session/${sessionId}`);
        console.log(`👤 학생 ID: ${studentId}`);
        console.log(`📋 세션 ID: ${sessionId}`);
        
        // 시험 준비 상태 변경 감지를 위한 구독 (강사가 시험 작성 완료 시)
        console.log('🔔 시험 준비 상태 변경 감지 구독 준비');
        console.log(`📡 시험 준비 토픽: /topic/session/${sessionId}/exam-ready`);
        
        // 실제 STOMP 메시지 수신 시 처리할 로직
        // 강사가 시험 작성 완료 버튼을 누르면 서버에서 메시지를 보내고
        // 여기서 해당 메시지를 받아서 시험 준비 상태를 업데이트
        console.log('🎯 실제 STOMP 메시지 대기 중...');
        
        // sessionId에 대한 토픽 구독
        const sessionTopic = `/topic/session/${sessionId}`;
        const subscription = subscribeToTopic(sessionTopic, (message) => {
            try {
                const data = JSON.parse(message.body);
                console.log('📨 세션 메시지 수신:', data);
                
                if (data.type === 'EXAM_READY' || data.examReady) {
                    console.log('✅ 시험 준비 완료!');
                    setExamReady(true);
                    
                    // 브라우저 알림 표시
                    if (Notification.permission === 'granted') {
                        new Notification('시험 준비 완료', {
                            body: '시험이 준비되었습니다. 시험 시작 버튼을 클릭하세요!',
                            icon: '/vite.svg',
                            tag: `exam_ready_${sessionId}`,
                            requireInteraction: true
                        });
                    } else if (Notification.permission !== 'denied') {
                        // 권한 요청
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification('시험 준비 완료', {
                                    body: '시험이 준비되었습니다. 시험 시작 버튼을 클릭하세요!',
                                    icon: '/vite.svg',
                                    tag: `exam_ready_${sessionId}`,
                                    requireInteraction: true
                                });
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('세션 메시지 파싱 오류:', error);
            }
        });
        
        // 구독 상태 저장
        subscriptionRef.current = subscription;
        isSubscribedRef.current = true;
        
        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                console.log('📡 세션 구독 해제:', sessionTopic);
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
        };
        
    }, [isConnected, sessionId, studentId]); // sendMessage 제거



    // 시험 시작 핸들러
    const handleExamStart = async () => {
        if (!exam || !examReady) {
            return;
        }
        
        try {
            // 1. 빈 submission 생성
            const submissionResponse = await fetch('https://team02-apim.azure-api.net/test-crud/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: exam.id,
                    userId: studentId,
                    totalScore: 0,
                    feedback: ""
                })
            });
            
            if (!submissionResponse.ok) {
                throw new Error(`Submission 생성 실패: ${submissionResponse.status}`);
            }
            
            const submission = await submissionResponse.json();
            console.log('시험 제출 데이터가 생성되었습니다:', submission);
            
            // 2. examId로 questions 조회
            const questionsResponse = await fetch(`https://team02-apim.azure-api.net/test-crud/exams/${exam.id}/questions`);
            
            if (!questionsResponse.ok) {
                throw new Error(`Questions 조회 실패: ${questionsResponse.status}`);
            }
            
            const questions = await questionsResponse.json();
            console.log('시험 문제를 조회했습니다:', questions);
            
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
                    userType="student"
                />
                <div className="container">
                    <div className="card">
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ color: 'var(--muted)' }}>시험 정보를 불러오는 중...</div>
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
                    userType="student"
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
                userType="student"
            />
            <div className="container">
                <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent)' }}>
                            {exam ? exam.name : '시험 준비중...'}
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
                        ) : !examReady ? (
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                                    시험 준비 중입니다. 강사가 시험을 완료하면 실시간으로 알려드립니다.
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
                                    {isConnected ? (
                                        <span>🔗 실시간 연결됨 - 시험 준비 완료 시 자동 알림</span>
                                    ) : (
                                        <span>⚠️ 연결 중... - 시험 준비 상태를 확인할 수 없습니다</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ 
                                    marginBottom: '30px', 
                                    padding: '20px', 
                                    backgroundColor: 'var(--hover)', 
                                    borderRadius: '8px',
                                    textAlign: 'left'
                                }}>
                                    <h3 style={{ marginBottom: '15px', color: 'var(--accent)' }}>시험 정보</h3>
                                    <p style={{ margin: '8px 0', color: 'var(--text)' }}>
                                        <strong>시험명:</strong> {exam.name}
                                    </p>
                                    <p style={{ margin: '8px 0', color: 'var(--text)' }}>
                                        <strong>설명:</strong> {exam.description}
                                    </p>
                                    <p style={{ margin: '8px 0', color: 'var(--text)' }}>
                                        <strong>문제 수:</strong> {mockQuestions.length}문제
                                    </p>
                                    <p style={{ margin: '8px 0', color: 'var(--text)' }}>
                                        <strong>총점:</strong> {exam.totalPoints}점
                                    </p>
                                    <p style={{ margin: '8px 0', color: 'var(--text)' }}>
                                        <strong>제한시간:</strong> {exam.duration}분
                                    </p>
                                </div>
                                
                                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                                    시험 준비가 완료되었습니다! 실시간 알림을 통해 자동으로 활성화되었습니다.
                                </p>
                                <button 
                                    className="btn" 
                                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                                    onClick={handleExamStart}
                                >
                                    시험 시작
                                </button>
                                <div >
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
