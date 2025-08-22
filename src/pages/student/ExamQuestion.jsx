import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../components/common';

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
    totalPoints: 100
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

const mockSubmission = {
    id: "submission-001",
    examId: "exam-001",
    studentId: "student-001",
    startTime: new Date().toISOString(),
    status: "in_progress"
};

export default function ExamQuestion() {
    const { examId, questionNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const studentId = 22; // 실제 로그인 사용자 ID로 교체 필요
    
    // 실제 데이터 사용
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [submission, setSubmission] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(parseInt(questionNumber) - 1);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const questionStartTimeRef = useRef(null);

    // 데이터 초기화
    useEffect(() => {
        if (location.state) {
            setExam(location.state.exam);
            setQuestions(location.state.questions);
            setSubmission(location.state.submission);
            setCurrentQuestionIndex(location.state.currentQuestionIndex || 0);
            setLoading(false);
        } else {
            setError("시험 데이터를 찾을 수 없습니다.");
            setLoading(false);
        }
    }, [location.state]);

    // 문제 시작 시간 기록
    useEffect(() => {
        if (currentQuestionIndex >= 0 && questions.length > 0) {
            const startTime = new Date();
            setQuestionStartTime(startTime);
            questionStartTimeRef.current = startTime;
        }
    }, [currentQuestionIndex, questions.length]);

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    // 답안 변경 핸들러
    const handleAnswerChange = (answer) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
    };

    // 다음 문제로 이동 (현재 답안 저장 후)
    const handleNextQuestion = async () => {
        if (!isLastQuestion) {
            try {
                // 현재 답안 저장 (API 호출)
                const currentAnswer = answers[currentQuestionIndex];
                const endTime = new Date();
                const timeSpent = Math.floor((endTime - questionStartTimeRef.current) / 1000); // 초 단위
                
                console.log(`문제 ${currentQuestionIndex + 1} 답안 저장:`, currentAnswer, `소요시간: ${timeSpent}초`);
                
                // 답안 API 저장
                const answerResponse = await fetch('https://team02-apim.azure-api.net/test-crud/api/submission-answers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        examId: exam.id,
                        userId: studentId,
                        questionId: currentQuestion.id,
                        answerText: currentAnswer,
                        isCorrect: false, // 임시로 false, 나중에 채점 로직에서 수정
                        score: 0, // 임시로 0, 나중에 채점 로직에서 수정
                        solvingTime: timeSpent
                    })
                });
                
                if (!answerResponse.ok) {
                    throw new Error(`답안 저장 실패: ${answerResponse.status}`);
                }
                
                // 다음 문제로 이동 (되돌리기 불가)
                const nextIndex = currentQuestionIndex + 1;
                navigate(`/student/exam/${examId}/question/${nextIndex + 1}`, {
                    state: {
                        exam,
                        questions,
                        submission,
                        currentQuestionIndex: nextIndex,
                        answers: { ...answers, [currentQuestionIndex]: currentAnswer }
                    }
                });
            } catch (error) {
                console.error('답안 저장 실패:', error);
                setError('답안 저장에 실패했습니다. 다시 시도해주세요.');
            }
        }
    };

    // 시험 제출
    const handleSubmitExam = async () => {
        if (!window.confirm('정말로 시험을 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
            return;
        }

        setLoading(true);
        try {
            // 마지막 문제 답안 저장
            const currentAnswer = answers[currentQuestionIndex];
            const endTime = new Date();
            const timeSpent = Math.floor((endTime - questionStartTimeRef.current) / 1000); // 초 단위
            
            console.log(`마지막 문제 답안 저장:`, currentAnswer, `소요시간: ${timeSpent}초`);
            
            // 마지막 답안 API 저장
            const answerResponse = await fetch('https://team02-apim.azure-api.net/test-crud/api/submission-answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: exam.id,
                    userId: studentId,
                    questionId: currentQuestion.id,
                    answerText: currentAnswer,
                    isCorrect: false, // 임시로 false, 나중에 채점 로직에서 수정
                    score: 0, // 임시로 0, 나중에 채점 로직에서 수정
                    solvingTime: timeSpent
                })
            });
            
            if (!answerResponse.ok) {
                throw new Error(`답안 저장 실패: ${answerResponse.status}`);
            }

            // submission 완료 처리
            const submissionResponse = await fetch(`https://team02-apim.azure-api.net/test-crud/api/submissions/${submission.examId}/${submission.userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: exam.id,
                    userId: studentId,
                    totalScore: totalScore,
                    feedback: "시험 완료"
                })
            });
            
            if (!submissionResponse.ok) {
                throw new Error(`Submission 완료 처리 실패: ${submissionResponse.status}`);
            }

            console.log('모든 답안 제출 완료');

            // 결과 계산
            const results = questions.map((question, index) => {
                const userAnswer = answers[index] || '';
                let isCorrect = false;
                let score = 0;

                if (question.qtype === 'MCQ') {
                    isCorrect = userAnswer === question.correctAnswer;
                    score = isCorrect ? question.points : 0;
                } else {
                    // 주관식은 부분 점수 (답안이 있으면 기본 점수)
                    score = userAnswer.trim() ? Math.floor(question.points * 0.7) : 0;
                    isCorrect = userAnswer.trim().toLowerCase().includes(question.correctAnswer.toLowerCase());
                }

                return {
                    questionId: question.id,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    score,
                    maxScore: question.points
                };
            });

            const totalScore = results.reduce((sum, result) => sum + result.score, 0);
            const maxScore = questions.reduce((sum, question) => sum + question.points, 0);

            // 결과 페이지로 이동
            navigate(`/student/exam/${examId}/result`, {
                state: {
                    exam,
                    submission,
                    answers,
                    questions,
                    results,
                    totalScore,
                    maxScore
                }
            });
        } catch (error) {
            console.error('시험 제출 실패:', error);
            setError('시험 제출에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
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

    if (!currentQuestion) {
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
                            <div style={{ color: 'var(--warn)' }}>문제를 찾을 수 없습니다.</div>
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
                <div className="card" style={{ maxWidth: '800px', margin: '20px auto' }}>
                    {/* 시험 정보 헤더 */}
                    <div style={{ 
                        borderBottom: '1px solid var(--border)', 
                        padding: '16px 0', 
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ margin: 0, color: 'var(--accent)' }}>{exam?.name || '시험'}</h2>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                                문제 {currentQuestionIndex + 1} / {totalQuestions}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                                배점: {currentQuestion.points}점
                            </div>
                        </div>
                    </div>

                    {/* 문제 내용 */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>
                            {currentQuestion.body}
                        </h3>

                        {/* 문제 유형에 따른 답안 입력 */}
                        {currentQuestion.qtype === 'MCQ' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {JSON.parse(currentQuestion.choices || '[]').map((choice, index) => (
                                    <label key={index} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        padding: '12px',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: answers[currentQuestionIndex] === choice ? 'var(--hover)' : 'transparent'
                                    }}>
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestionIndex}`}
                                            value={choice}
                                            checked={answers[currentQuestionIndex] === choice}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            style={{ margin: 0 }}
                                        />
                                        <span>{index + 1}. {choice}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {currentQuestion.qtype === 'SHORT' && (
                            <textarea
                                value={answers[currentQuestionIndex] || ''}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="답안을 입력하세요..."
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        )}

                        {currentQuestion.qtype === 'ESSAY' && (
                            <textarea
                                value={answers[currentQuestionIndex] || ''}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="답안을 입력하세요..."
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        )}
                    </div>

                    {/* 답안 상태 표시 */}
                    <div style={{ 
                        marginBottom: '24px', 
                        padding: '12px', 
                        backgroundColor: 'var(--hover)', 
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        {answers[currentQuestionIndex] ? (
                            <span style={{ color: 'var(--success)' }}>✓ 답안이 입력되었습니다</span>
                        ) : (
                            <span style={{ color: 'var(--warn)' }}>⚠ 답안을 입력해주세요</span>
                        )}
                    </div>

                    {/* 네비게이션 버튼 */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {!isLastQuestion ? (
                            <button
                                className="btn"
                                onClick={handleNextQuestion}
                                disabled={loading}
                                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                            >
                                {loading ? '저장 중...' : '다음 문제 →'}
                            </button>
                        ) : (
                            <button
                                className="btn"
                                onClick={handleSubmitExam}
                                disabled={loading}
                                style={{ backgroundColor: 'var(--warn)', color: 'white' }}
                            >
                                {loading ? '제출 중...' : '시험 제출'}
                            </button>
                        )}
                    </div>

                    {/* 문제 진행 상황 표시 */}
                    <div style={{ 
                        marginTop: '24px', 
                        padding: '16px', 
                        backgroundColor: 'var(--hover)', 
                        borderRadius: '8px'
                    }}>
                        <div style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--muted)' }}>
                            문제 진행 상황
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {questions.map((_, index) => (
                                <div
                                    key={index}
                                    style={{
                                        minWidth: '40px',
                                        height: '40px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: index === currentQuestionIndex 
                                            ? 'var(--accent)' 
                                            : index < currentQuestionIndex
                                                ? (answers[index] ? 'var(--success)' : 'var(--warn)')
                                                : 'var(--border)',
                                        color: index === currentQuestionIndex ? 'white' : 'var(--text)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}
                                >
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                            <span style={{ color: 'var(--accent)' }}>●</span> 현재 문제 | 
                            <span style={{ color: 'var(--success)' }}>●</span> 완료 | 
                            <span style={{ color: 'var(--warn)' }}>●</span> 미완료 | 
                            <span style={{ color: 'var(--border)' }}>●</span> 미도달
                        </div>
                    </div>

                    {error && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            backgroundColor: 'var(--warn)', 
                            color: 'white',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
