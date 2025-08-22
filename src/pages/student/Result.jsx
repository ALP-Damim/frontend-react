import { useLocation, useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { RetryButton, Header } from "../../components/common";
import { useUserStomp } from "../../hooks/useUserStomp";

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

function useQuery() {
    const { search } = useLocation();
    return useMemo(()=>Object.fromEntries(new URLSearchParams(search)),[search]);
}

export default function Result(){
    const { examId } = useParams();
    const location = useLocation();
    const q = useQuery();
    
    // 상태에서 데이터 가져오기
    const exam = location.state?.exam;
    const submission = location.state?.submission;
    const answers = location.state?.answers || {};
    const questions = location.state?.questions || [];
    const results = location.state?.results || [];
    const totalScore = location.state?.totalScore || 0;
    const maxScore = location.state?.maxScore || 100;
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advice, setAdvice] = useState(null);
    const [error, setError] = useState("");
    
    // STOMP 연결 관리
    const studentId = 26; // 실제 로그인 사용자 ID로 교체 필요
    const { handleLogout } = useUserStomp(studentId);

    // 시험 결과 로드
    useEffect(() => {
        const loadResult = async () => {
            try {
                setLoading(true);
                
                // 하드코딩된 결과 데이터 사용
                setResult({
                    totalScore: totalScore,
                    maxScore: maxScore,
                    answers: answers,
                    questions: questions,
                    results: results
                });
            } catch (error) {
                console.error('결과 로드 실패:', error);
                setError('결과를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadResult();
    }, [answers, questions, totalScore, maxScore, results]);

    async function fetchAdvice(){
        // 가짜 LLM 호출 (실패 확률 40%)
        await new Promise(r=>setTimeout(r,600));
        if (Math.random() < 0.4) {
            setAdvice(null); setError("LLM 호출 실패(타임아웃)");
            throw new Error("fail");
        }
        setError("");
        
        // 점수에 따른 맞춤형 조언
        const scorePercentage = (totalScore / maxScore) * 100;
        let adviceData = [];
        
        if (scorePercentage >= 90) {
            adviceData = [
                {title:"🎉 우수한 성과", body:"React 기본 개념을 잘 이해하고 있습니다. 고급 개념 학습을 권장합니다."},
                {title:"다음 단계", body:"React Router, Context API, Custom Hooks 등 고급 주제로 확장해보세요."},
                {title:"추천 자료", body:"React 공식 문서의 고급 가이드와 실전 프로젝트를 진행해보세요."}
            ];
        } else if (scorePercentage >= 80) {
            adviceData = [
                {title:"👍 양호한 성과", body:"기본 개념은 잘 이해하고 있으나 일부 세부사항에서 개선이 필요합니다."},
                {title:"개선 포인트", body:"props와 state의 차이점, 컴포넌트 생명주기를 더 자세히 학습하세요."},
                {title:"추천 자료", body:"React 튜토리얼을 다시 한번 복습하고 실습 문제를 풀어보세요."}
            ];
        } else if (scorePercentage >= 60) {
            adviceData = [
                {title:"📝 보통 수준", body:"기본 개념은 이해하고 있으나 더 많은 연습이 필요합니다."},
                {title:"개선 방향", body:"컴포넌트 작성법과 JSX 문법을 더 자세히 학습하세요."},
                {title:"추천 자료", body:"React 기초 튜토리얼을 처음부터 차근차근 다시 학습하세요."}
            ];
        } else {
            adviceData = [
                {title:"⚠️ 보강 필요", body:"React 기본 개념에 대한 이해가 부족합니다. 기초부터 다시 학습하세요."},
                {title:"학습 계획", body:"JavaScript 기초 → JSX → 컴포넌트 → props/state 순서로 학습하세요."},
                {title:"추천 자료", body:"React 공식 튜토리얼을 처음부터 끝까지 완주하세요."}
            ];
        }
        
        setAdvice(adviceData);
    }

    if (loading) {
        return (
            <>
                <Header 
                    navigationLinks={studentNavigationLinks}
                    notifications={[]}
                    onLogout={handleLogout}
                    userType="student"
                />
                <div className="container">
                    <div className="card">
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ color: 'var(--muted)' }}>결과를 불러오는 중...</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const score = result?.totalScore || 0;
    const maxScoreResult = result?.maxScore || 100;

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                onLogout={handleLogout}
                userType="student"
            />
            <div className="container">
                <div className="grid">
            <div className="card">
                <div className="badge">시험: {exam?.name || examId}</div>
                <h2>시험 결과</h2>
                <div style={{fontSize:42, margin:"10px 0"}}>
                    <b>{score}</b> / {maxScoreResult}
                </div>
                <div style={{ 
                    margin: '16px 0', 
                    padding: '12px', 
                    backgroundColor: 'var(--hover)', 
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {score >= maxScoreResult * 0.9 ? '🎉 우수' : 
                         score >= maxScoreResult * 0.8 ? '👍 양호' : 
                         score >= maxScoreResult * 0.6 ? '📝 보통' : '⚠️ 보강 필요'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                        정답률: {Math.round((score / maxScoreResult) * 100)}%
                    </div>
                </div>
                <div style={{display:"flex", gap:8}}>
                    <button className="btn" onClick={fetchAdvice}>AI 조언 보기</button>
                    <RetryButton onTry={fetchAdvice} />
                </div>
                {error && <div className="card btn-warn" style={{marginTop:10}}>
                    <b>오류</b>: {error}
                </div>}
            </div>

            <div className="card">
                <h3>AI 학습 피드백 카드</h3>
                <div className="grid grid-3">
                    {(advice ?? [
                        {title:"예시 피드백 A", body:"React 컴포넌트 작성법을 더 자세히 학습해보세요."},
                        {title:"예시 피드백 B", body:"props와 state의 차이점을 명확히 이해하세요."},
                        {title:"예시 피드백 C", body:"JSX 문법을 다시 한번 복습해보세요."}
                    ]).map((a,i)=>(
                        <div className="card" key={i}>
                            <b>{a.title}</b>
                            <p style={{color:"var(--muted)"}}>{a.body}</p>
                            <button className="btn btn-outline">AI 피드백 보기</button>
                        </div>
                    ))}
                </div>

                <h4 style={{marginTop:14}}>제출 답안 상세</h4>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {questions.map((question, index) => {
                        const answer = answers[index] || '';
                        const questionResult = results[index];
                        const isCorrect = questionResult?.isCorrect || false;
                        const score = questionResult?.score || 0;
                        
                        return (
                            <div key={index} style={{ 
                                marginBottom: '16px', 
                                padding: '12px', 
                                border: '1px solid var(--border)', 
                                borderRadius: '8px',
                                backgroundColor: 'var(--hover)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong>문제 {index + 1} ({question.points}점)</strong>
                                    <span className="badge" style={{ 
                                        backgroundColor: isCorrect ? 'var(--success)' : 'var(--warn)',
                                        color: 'white'
                                    }}>
                                        {isCorrect ? '정답' : '오답'} ({score}점)
                                    </span>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>문제:</strong> {question.body}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>제출 답안:</strong> {answer || '(답안 없음)'}
                                </div>
                                {!isCorrect && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>정답:</strong> {question.correctAnswer}
                                    </div>
                                )}
                                <button className="btn btn-outline" style={{ fontSize: '12px' }}>
                                    AI 피드백 보기
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
                </div>
            </div>
        </>
    );
}
