import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
import { fetchExamResult, fetchSubmissionAnswers, fetchQuestionsByExamId } from '../../utils/api';

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function Result() {
    const { examId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [examResult, setExamResult] = useState(null);
    const [submissionAnswers, setSubmissionAnswers] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [exam, setExam] = useState(null);
    
    const studentId = 21; // 실제 로그인 사용자 ID로 교체 필요

    useEffect(() => {
        const loadExamResult = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. 시험 결과 조회
                const result = await fetchExamResult(examId, studentId);
                setExamResult(result);
                console.log('시험 결과:', result);

                // 2. 답안 상세 조회
                const answers = await fetchSubmissionAnswers(examId, studentId);
                setSubmissionAnswers(answers);
                console.log('답안 상세 원본 데이터:', answers);
                console.log('답안 상세 데이터 타입 확인:', answers.map(a => ({
                    questionId: a.questionId,
                    isCorrect: a.isCorrect,
                    isCorrectType: typeof a.isCorrect,
                    score: a.score,
                    scoreType: typeof a.score
                })));

                // 3. 시험 문제 조회
                const examQuestions = await fetchQuestionsByExamId(examId);
                setQuestions(examQuestions);
                console.log('시험 문제:', examQuestions);

                // 4. 시험 정보 설정 (location.state에서 가져오거나 기본값 사용)
                if (location.state?.exam) {
                    setExam(location.state.exam);
                } else {
                    setExam({
                        id: examId,
                        name: '시험 결과',
                        totalPoints: examQuestions.reduce((sum, q) => sum + q.points, 0)
                    });
                }

            } catch (err) {
                console.error('시험 결과 로드 실패:', err);
                setError('시험 결과를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadExamResult();
    }, [examId, studentId, location.state]);

    // 정답률 계산 (더 안전한 방식)
    const calculateAccuracy = () => {
        if (!submissionAnswers.length || !questions.length) return 0;
        
        // 다양한 형태의 isCorrect 값을 처리
        const correctAnswers = submissionAnswers.filter(answer => {
            const isCorrect = answer.isCorrect;
            // boolean true, 문자열 "true", 숫자 1 등을 정답으로 처리
            return isCorrect === true || isCorrect === "true" || isCorrect === 1 || isCorrect === "1";
        }).length;
        
        // 디버깅을 위한 상세 로그
        console.log('정답률 계산 상세:', {
            totalQuestions: questions.length,
            correctAnswers: correctAnswers,
            submissionAnswersCount: submissionAnswers.length,
            submissionAnswersDetail: submissionAnswers.map(a => ({
                questionId: a.questionId,
                isCorrect: a.isCorrect,
                isCorrectType: typeof a.isCorrect,
                isCorrectValue: a.isCorrect
            }))
        });
        
        // 안전한 계산 (100%를 넘지 않도록)
        const accuracy = Math.min(100, Math.round((correctAnswers / questions.length) * 100));
        console.log('정답률 계산 결과:', {
            correctAnswers,
            totalQuestions: questions.length,
            accuracy: accuracy
        });
        
        return accuracy;
    };

    // 총점 계산 (API에서 받은 score 필드 사용)
    const calculateTotalScore = () => {
        if (!submissionAnswers.length) return 0;
        
        // 숫자가 아닌 값들을 안전하게 처리
        const totalScore = submissionAnswers.reduce((sum, answer) => {
            const score = answer.score;
            // 숫자로 변환 가능한 값만 처리
            const numericScore = typeof score === 'number' ? score : 
                               typeof score === 'string' ? parseFloat(score) || 0 : 0;
            return sum + numericScore;
        }, 0);
        
        console.log('총점 계산:', {
            submissionAnswers: submissionAnswers.map(a => ({ 
                questionId: a.questionId, 
                score: a.score,
                scoreType: typeof a.score
            })),
            totalScore: totalScore
        });
        return totalScore;
    };

    // 만점 계산 (문제의 points 필드 사용)
    const calculateMaxScore = () => {
        if (!questions.length) return 0;
        
        // 숫자가 아닌 값들을 안전하게 처리
        const maxScore = questions.reduce((sum, question) => {
            const points = question.points;
            // 숫자로 변환 가능한 값만 처리
            const numericPoints = typeof points === 'number' ? points : 
                                typeof points === 'string' ? parseFloat(points) || 0 : 0;
            return sum + numericPoints;
        }, 0);
        
        console.log('만점 계산:', {
            questions: questions.map(q => ({ 
                id: q.id, 
                points: q.points,
                pointsType: typeof q.points
            })),
            maxScore: maxScore
        });
        return maxScore;
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
                            <div style={{ color: 'var(--muted)' }}>시험 결과를 불러오는 중...</div>
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

    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    const accuracy = calculateAccuracy();
    
    console.log('최종 계산 결과:', {
        totalScore,
        maxScore,
        accuracy,
        submissionAnswersCount: submissionAnswers.length,
        questionsCount: questions.length
    });

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                userType="student"
            />
            <div className="container">
                <div className="card" style={{ maxWidth: '900px', margin: '20px auto' }}>
                    {/* 결과 헤더 */}
                    <div style={{ 
                        borderBottom: '1px solid var(--border)', 
                        padding: '24px 0', 
                        marginBottom: '32px',
                        textAlign: 'center'
                    }}>
                        <h1 style={{ margin: 0, color: 'var(--accent)', fontSize: '2rem' }}>
                            시험 결과
                        </h1>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--muted)', fontSize: '1.1rem' }}>
                            {exam?.name || '시험'}
                        </p>
                    </div>

                    {/* 점수 요약 */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }}>
                        <div style={{ 
                            padding: '24px', 
                            backgroundColor: 'var(--hover)', 
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                {totalScore}
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                획득 점수
                            </div>
                        </div>
                        
                        <div style={{ 
                            padding: '24px', 
                            backgroundColor: 'var(--hover)', 
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                                {maxScore}
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                만점
                            </div>
                        </div>
                        
                        <div style={{ 
                            padding: '24px', 
                            backgroundColor: 'var(--hover)', 
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: accuracy >= 80 ? 'var(--success)' : accuracy >= 60 ? 'var(--warn)' : 'var(--error)' }}>
                                {accuracy}%
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                정답률
                            </div>
                        </div>
                    </div>

                    {/* 답안 상세 */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--text)' }}>답안 상세</h2>
                        
                        {questions.map((question, index) => {
                            const answer = submissionAnswers.find(a => a.questionId === question.id);
                            const isCorrect = answer?.isCorrect || false;
                            const userAnswer = answer?.answerText || '';
                            const score = answer?.score || 0;
                            
                            return (
                                <div key={question.id} style={{ 
                                    marginBottom: '20px',
                                    padding: '20px',
                                    border: `2px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                                    borderRadius: '12px',
                                    backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                            문제 {index + 1}
                                        </h3>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px'
                                        }}>
                                            <span style={{ 
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                backgroundColor: isCorrect ? 'var(--success)' : 'var(--error)',
                                                color: 'white'
                                            }}>
                                                {isCorrect ? '정답' : '오답'}
                                            </span>
                                            <span style={{ 
                                                fontSize: '1.1rem', 
                                                fontWeight: 'bold',
                                                color: 'var(--accent)'
                                            }}>
                                                {score}점
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ 
                                            fontWeight: 'bold', 
                                            marginBottom: '8px',
                                            color: 'var(--text)'
                                        }}>
                                            문제:
                                        </div>
                                        <div style={{ 
                                            padding: '12px',
                                            backgroundColor: 'var(--background)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            {question.body}
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ 
                                            fontWeight: 'bold', 
                                            marginBottom: '8px',
                                            color: 'var(--text)'
                                        }}>
                                            내 답안:
                                        </div>
                                        <div style={{ 
                                            padding: '12px',
                                            backgroundColor: 'var(--background)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            minHeight: '60px'
                                        }}>
                                            {userAnswer || '답안 없음'}
                                        </div>
                                    </div>
                                    
                                    {question.correctAnswer && (
                                        <div>
                                            <div style={{ 
                                                fontWeight: 'bold', 
                                                marginBottom: '8px',
                                                color: 'var(--text)'
                                            }}>
                                                정답:
                                            </div>
                                            <div style={{ 
                                                padding: '12px',
                                                backgroundColor: 'var(--success)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontWeight: 'bold'
                                            }}>
                                                {question.correctAnswer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* AI 피드백 섹션 (준비 중) */}
                    <div style={{ 
                        marginBottom: '32px',
                        padding: '20px',
                        backgroundColor: 'var(--hover)',
                        borderRadius: '12px',
                        border: '2px dashed var(--border)'
                    }}>
                        <h3 style={{ marginBottom: '12px', color: 'var(--text)' }}>AI 피드백</h3>
                        <p style={{ color: 'var(--muted)', margin: 0 }}>
                            AI 피드백 기능이 곧 추가될 예정입니다.
                        </p>
                    </div>

                    {/* 하단 버튼 */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '16px',
                        paddingTop: '24px',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <button
                            className="btn"
                            onClick={() => navigate('/student/courses')}
                            style={{ 
                                backgroundColor: 'var(--accent)', 
                                color: 'white',
                                padding: '12px 24px'
                            }}
                        >
                            내강의로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
