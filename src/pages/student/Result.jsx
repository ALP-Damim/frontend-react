import { useLocation, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
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
    const q = useQuery();
    const score = Number(q.score ?? 83);
    const [advice, setAdvice] = useState(null);
    const [error, setError] = useState("");
    
    // STOMP 연결 관리
    const studentId = 21; // 실제 로그인 사용자 ID로 교체 필요
    const { handleLogout } = useUserStomp(studentId);

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

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={[]}
                onLogout={handleLogout}
            />
            <div className="container">
                <div className="grid">
            <div className="card">
                <div className="badge">시험 ID: {examId}</div>
                <h2>결과</h2>
                <div style={{fontSize:42, margin:"10px 0"}}><b>{score}</b> / 100</div>
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

                <h4 style={{marginTop:14}}>제출 답안 옆 AI 피드백(예시)</h4>
                <ul>
                    <li>Q1: <span className="badge">정답</span> · <button className="btn btn-outline">AI 피드백 보기</button></li>
                    <li>Q2: <span className="badge">부분 정답</span> · Evidence: “과적합은 학습 데이터에 대한 오류가 낮고…”</li>
                </ul>
            </div>
                </div>
            </div>
        </>
    );
}
