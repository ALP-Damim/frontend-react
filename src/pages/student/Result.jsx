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
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advice, setAdvice] = useState(null);
    const [error, setError] = useState("");
    
    // STOMP 연결 관리
    const studentId = 21; // 실제 로그인 사용자 ID로 교체 필요
    const { handleLogout } = useUserStomp(studentId);

    // 시험 결과 로드
    useEffect(() => {
        const loadResult = async () => {
            try {
                setLoading(true);
                
                // 답안을 기반으로 점수 계산
                let totalScore = 0;
                questions.forEach((question, index) => {
                    const answer = answers[index] || '';
                    if (answer === question.answerKey) {
                        totalScore += question.points;
                    }
                });
                
                setResult({
                    totalScore: totalScore,
                    maxScore: questions.reduce((sum, q) => sum + q.points, 0),
                    answers: answers,
                    questions: questions
                });
            } catch (error) {
                console.error('결과 로드 실패:', error);
                setError('결과를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadResult();
    }, [answers, questions]);

    async function fetchAdvice(){
        // 가짜 LLM 호출 (실패 확률 40%)
        await new Promise(r=>setTimeout(r,600));
        if (Math.random() < 0.4) {
            setAdvice(null); setError("LLM 호출 실패(타임아웃)");
            throw new Error("fail");
        }
        setError("");
        setAdvice([
            {title:"개념 보강: 편향-분산", body:"오답 패턴에서 '과적합/과소적합' 개념 혼동 감지. 정리 노트 2회 복습 권장."},
            {title:"문풀 전략", body:"객관식 2번 유형(개념 구분)의 정답률이 50% 미만. 개념→예제→유형별 20문제 풀이."},
            {title:"추천 자료", body:"교재 3장, 실습노트 1~2. 실전 팁: 키워드(지도/비지도/강화)의 정의를 한 줄로 요약해 암기."}
        ]);
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
    const maxScore = result?.maxScore || 100;

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
                    <b>{score}</b> / {maxScore}
                </div>
                <div style={{ 
                    margin: '16px 0', 
                    padding: '12px', 
                    backgroundColor: 'var(--hover)', 
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {score >= maxScore * 0.9 ? '🎉 우수' : 
                         score >= maxScore * 0.8 ? '👍 양호' : 
                         score >= maxScore * 0.6 ? '📝 보통' : '⚠️ 보강 필요'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                        정답률: {Math.round((score / maxScore) * 100)}%
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
                        {title:"예시 피드백 A", body:"선형/로지스틱 회귀 차이를 표로 정리해보세요."},
                        {title:"예시 피드백 B", body:"강화학습의 보상 개념을 간단한 사례로 설명해보세요."},
                        {title:"예시 피드백 C", body:"혼동되는 용어를 1문장 정의로 정리."}
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
                        const isCorrect = answer === question.answerKey;
                        const score = isCorrect ? question.points : 0;
                        
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
                                        <strong>정답:</strong> {question.answerKey}
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
