import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../../components/common";
import { 
    fetchExamBySessionId, 
    fetchQuestionsByExamId, 
    fetchSubmissionAnswers 
} from "../../utils/api";

export default function SessionStatistics() {
    const { classId, sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        const loadStatistics = async () => {
            try {
                setLoading(true);
                
                // 1. 세션의 시험 정보 조회
                const exam = await fetchExamBySessionId(sessionId);
                if (!exam) {
                    setError('해당 세션에 시험이 없습니다.');
                    return;
                }

                // 2. 시험 문제 목록 조회
                const questions = await fetchQuestionsByExamId(exam.id);
                
                // 3. 모든 학생의 답안 조회 (임시로 하드코딩된 학생 ID들 사용)
                const studentIds = [27, 28, 29]; // 실제로는 해당 강의를 수강하는 학생 목록을 가져와야 함
                const allSubmissionAnswers = [];
                
                for (const studentId of studentIds) {
                    try {
                        const answers = await fetchSubmissionAnswers(exam.id, studentId);
                        allSubmissionAnswers.push(...answers);
                    } catch (error) {
                        console.log(`학생 ${studentId} 답안 조회 실패:`, error);
                    }
                }

                // 4. 문제별 통계 계산
                const questionStats = questions.map(question => {
                    const questionAnswers = allSubmissionAnswers.filter(
                        answer => answer.questionId === question.id
                    );
                    
                    const totalAnswers = questionAnswers.length;
                    const correctAnswers = questionAnswers.filter(
                        answer => answer.isCorrect === true || answer.isCorrect === "true" || answer.isCorrect === 1
                    ).length;
                    
                    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
                    const averageScore = totalAnswers > 0 ? 
                        Math.round(questionAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / totalAnswers) : 0;

                    return {
                        questionId: question.id,
                        questionNumber: question.questionNumber || 1,
                        questionText: question.body,
                        questionType: question.qtype,
                        totalAnswers,
                        correctAnswers,
                        accuracy,
                        averageScore,
                        maxScore: question.points || 10
                    };
                });

                // 5. 전체 통계 계산
                const totalQuestions = questions.length;
                const totalSubmissions = studentIds.length;
                const overallAccuracy = questionStats.length > 0 ? 
                    Math.round(questionStats.reduce((sum, q) => sum + q.accuracy, 0) / questionStats.length) : 0;
                const overallAverageScore = questionStats.length > 0 ?
                    Math.round(questionStats.reduce((sum, q) => sum + q.averageScore, 0) / questionStats.length) : 0;

                setStatistics({
                    exam,
                    questions,
                    questionStats,
                    overallStats: {
                        totalQuestions,
                        totalSubmissions,
                        overallAccuracy,
                        overallAverageScore
                    }
                });

            } catch (err) {
                console.error('통계 로딩 실패:', err);
                setError('통계 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadStatistics();
    }, [sessionId]);

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 90) return '#10b981';
        if (accuracy >= 80) return '#3b82f6';
        if (accuracy >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const getQuestionTypeText = (type) => {
        return type === 'MCQ' ? '객관식' : '주관식';
    };

    if (loading) {
        return (
            <div>
                <Header />
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '18px', color: 'var(--muted)' }}>
                        통계 데이터를 불러오는 중...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Header />
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '18px', color: 'var(--warn)' }}>{error}</div>
                    <button 
                        className="btn" 
                        onClick={() => navigate(`/teacher/class/${classId}`)}
                        style={{ marginTop: '16px' }}
                    >
                        강의로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* 헤더 */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        <button 
                            className="btn btn-outline" 
                            onClick={() => navigate(`/teacher/class/${classId}`)}
                            style={{ fontSize: '14px' }}
                        >
                            ← 강의로 돌아가기
                        </button>
                        <h1 style={{ 
                            fontSize: '24px', 
                            fontWeight: '600', 
                            color: '#1f2937',
                            margin: 0
                        }}>
                            세션 통계
                        </h1>
                    </div>
                    <div style={{ fontSize: '16px', color: '#6b7280' }}>
                        {statistics.exam.name} - 세션 {sessionId}
                    </div>
                </div>

                {/* 전체 통계 */}
                <div style={{ 
                    marginBottom: '32px',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '24px'
                    }}>
                        전체 통계
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '20px' 
                    }}>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: '700', 
                                color: '#1f2937',
                                marginBottom: '8px'
                            }}>
                                {statistics.overallStats.totalQuestions}개
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                총 문제 수
                            </div>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: '700', 
                                color: '#1f2937',
                                marginBottom: '8px'
                            }}>
                                {statistics.overallStats.totalSubmissions}명
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                응시 학생 수
                            </div>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: '700', 
                                color: getAccuracyColor(statistics.overallStats.overallAccuracy),
                                marginBottom: '8px'
                            }}>
                                {statistics.overallStats.overallAccuracy}%
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                평균 정답률
                            </div>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: '700', 
                                color: '#1f2937',
                                marginBottom: '8px'
                            }}>
                                {statistics.overallStats.overallAverageScore}점
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                평균 점수
                            </div>
                        </div>
                    </div>
                </div>

                {/* 문제별 통계 */}
                <div style={{ 
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '24px'
                    }}>
                        문제별 통계
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {statistics.questionStats.map((question, index) => (
                            <div key={question.questionId} style={{ 
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#f9fafb'
                            }}>
                                {/* 문제 정보 */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            color: '#1f2937'
                                        }}>
                                            문제 {question.questionNumber}
                                        </span>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            padding: '4px 8px',
                                            backgroundColor: '#e5e7eb',
                                            borderRadius: '4px',
                                            color: '#374151'
                                        }}>
                                            {getQuestionTypeText(question.questionType)}
                                        </span>
                                    </div>
                                    <div style={{ 
                                        fontSize: '14px', 
                                        color: '#4b5563',
                                        lineHeight: '1.5'
                                    }}>
                                        {question.questionText}
                                    </div>
                                </div>

                                {/* 통계 정보 */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                    gap: '16px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '24px', 
                                            fontWeight: '700', 
                                            color: getAccuracyColor(question.accuracy),
                                            marginBottom: '4px'
                                        }}>
                                            {question.accuracy}%
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            정답률
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '24px', 
                                            fontWeight: '700', 
                                            color: '#1f2937',
                                            marginBottom: '4px'
                                        }}>
                                            {question.correctAnswers}/{question.totalAnswers}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            정답/총 답안
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '24px', 
                                            fontWeight: '700', 
                                            color: '#1f2937',
                                            marginBottom: '4px'
                                        }}>
                                            {question.averageScore}/{question.maxScore}점
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            평균 점수
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
