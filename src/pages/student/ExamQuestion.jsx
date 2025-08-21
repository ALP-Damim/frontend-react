import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../components/common';
import { submitAnswer } from '../../utils/api';

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function ExamQuestion() {
    const { examId, questionNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [exam, setExam] = useState(location.state?.exam || null);
    const [questions, setQuestions] = useState(location.state?.questions || []);
    const [submission, setSubmission] = useState(location.state?.submission || null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(parseInt(questionNumber) - 1);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 상태가 없으면 이전 페이지로 이동
    useEffect(() => {
        if (!exam || !questions || !submission) {
            navigate('/student');
            return;
        }
    }, [exam, questions, submission, navigate]);

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



    // 다음 문제로 이동 (현재 답안 제출 후)
    const handleNextQuestion = async () => {
        if (!isLastQuestion) {
            try {
                // 현재 답안 제출
                if (answers[currentQuestionIndex]) {
                    await submitAnswer(submission.id, currentQuestion.id, { 
                        answer: answers[currentQuestionIndex]
                    });
                    console.log(`문제 ${currentQuestionIndex + 1} 답안 제출 완료`);
                }
                
                // 다음 문제로 이동
                const nextIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIndex);
                navigate(`/student/exam/${examId}/question/${nextIndex + 1}`);
            } catch (error) {
                console.error('답안 제출 실패:', error);
                setError('답안 제출에 실패했습니다. 다시 시도해주세요.');
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
            // 1. 마지막 문제 답안 제출
            if (answers[currentQuestionIndex]) {
                await submitAnswer(submission.id, currentQuestion.id, { 
                    answer: answers[currentQuestionIndex]
                });
                console.log(`마지막 문제 답안 제출 완료`);
            }

            // 2. 모든 답안을 서버에 제출
            const submitPromises = Object.entries(answers).map(async ([index, answer]) => {
                if (answer) {
                    const questionIndex = parseInt(index);
                    const question = questions[questionIndex];
                    return submitAnswer(submission.id, question.id, { 
                        answer: answer
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(submitPromises);
            console.log('모든 답안 제출 완료');

            // 3. 결과 페이지로 이동
            navigate(`/student/exam/${examId}/result`, {
                state: {
                    exam,
                    submission,
                    answers,
                    questions
                }
            });
        } catch (error) {
            console.error('시험 제출 실패:', error);
            setError('시험 제출에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

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
                             >
                                 다음 문제 →
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
