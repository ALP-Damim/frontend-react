import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { NotificationModal } from "../../components/common";

const exam = {
    id:"ex1",
    title:"데이터 분석 실전 3주차",
    scheduled:"2025-03-22T19:00:00Z",
    questions:[
        { id:"q1", type:"mcq", prompt:"지도학습이 아닌 것은?", choices:["회귀","강화학습","분류","로지스틱회귀"] },
        { id:"q2", type:"text", prompt:"과적합(overfitting) 회피 전략을 1가지 이상 쓰시오." }
    ]
};

export default function Exam(){
    const { examId } = useParams();
    const nav = useNavigate();
    const [ans, setAns] = useState({});
    const [notify, setNotify] = useState(true);

    function submit(){
        // 최소 기능: 점수 임의 계산
        const score = (ans.q1==="강화학습" ? 60 : 40) + (ans.q2?.length>10 ? 40 : 20);
        nav(`/result/${examId}?score=${score}`);
    }

    return (
        <>
            <NotificationModal
                open={notify}
                onClose={()=>setNotify(false)}
                zoomUrl="https://zoom.us/j/123456789"
                startsAt={exam.scheduled}
            />
            <div className="card">
                <div className="badge">시험 ID: {examId}</div>
                <h2>{exam.title}</h2>
                <div className="grid">
                    {exam.questions.map((q,idx)=>(
                        <div className="card" key={q.id}>
                            <div className="badge">문항 {idx+1} · {q.type==="mcq"?"객관식":"서술형"}</div>
                            <p><b>{q.prompt}</b></p>
                            {q.type==="mcq" ? (
                                <select className="input"
                                        value={ans[q.id] ?? ""}
                                        onChange={e=>setAns({...ans,[q.id]:e.target.value})}>
                                    <option value="" disabled>선택하세요</option>
                                    {q.choices.map((c,i)=><option key={i} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <textarea className="input" rows={4}
                                          value={ans[q.id] ?? ""}
                                          onChange={e=>setAns({...ans,[q.id]:e.target.value})}/>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button className="btn" onClick={submit}>답안 제출</button>
                    <Link className="btn btn-outline" to={`/result/${examId}`}>실시간 결과 보기</Link>
                </div>
            </div>
        </>
    );
}
