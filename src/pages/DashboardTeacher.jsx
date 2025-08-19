import { useState } from "react";
import { Link } from "react-router-dom";

export default function DashboardTeacher() {
    const [form, setForm] = useState({
        title:"예시 시험",
        level:"중",
        questions:[
            { type:"text", prompt:"서술형: 과적합을 설명하시오." },
            { type:"mcq",  prompt:"다음 중 지도학습이 아닌 것은?", choices:["회귀","분류","강화학습","의사결정트리"], answer:2 }
        ]
    });

    function addQuestion(type){
        setForm(f=>({
            ...f, questions:[...f.questions, type==="mcq"?
                {type:"mcq", prompt:"객관식 질문", choices:["A","B","C","D"], answer:0} :
                {type:"text", prompt:"서술형 질문"}]
        }));
    }

    function saveExam(){
        alert("시험이 생성(가상)되었습니다.");
    }

    return (
        <div className="grid grid-2">
            <div className="card">
                <h2>강사 대시보드</h2>
                <p className="badge">시험 생성/수정/삭제</p>
                <div className="grid">
                    <div>
                        <label className="label">시험 제목</label>
                        <input className="input" value={form.title}
                               onChange={e=>setForm({...form,title:e.target.value})}/>
                    </div>
                    <div>
                        <label className="label">난이도</label>
                        <select className="input" value={form.level}
                                onChange={e=>setForm({...form,level:e.target.value})}>
                            <option>하</option><option>중</option><option>상</option>
                        </select>
                    </div>
                </div>

                <h3 style={{marginTop:12}}>문항</h3>
                <div className="grid">
                    {form.questions.map((q,idx)=>(
                        <div className="card" key={idx}>
                            <div className="badge">#{idx+1} · {q.type==="mcq"?"객관식":"서술형"}</div>
                            <textarea className="input" rows={2} value={q.prompt}
                                      onChange={e=>{
                                          const questions=[...form.questions];
                                          questions[idx]={...questions[idx], prompt:e.target.value};
                                          setForm({...form,questions});
                                      }}/>
                            {q.type==="mcq" && (
                                <div style={{marginTop:8}}>
                                    <label className="label">선택지</label>
                                    {q.choices.map((c,i)=>(
                                        <input key={i} className="input" style={{marginBottom:6}} value={c}
                                               onChange={e=>{
                                                   const questions=[...form.questions];
                                                   const choices=[...q.choices]; choices[i]=e.target.value;
                                                   questions[idx]={...q,choices}; setForm({...form,questions});
                                               }}/>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button className="btn" onClick={()=>addQuestion("text")}>서술형 추가</button>
                    <button className="btn" onClick={()=>addQuestion("mcq")}>객관식 추가</button>
                    <button className="btn" onClick={saveExam}>저장</button>
                </div>
            </div>

            <div className="card">
                <h3>학생별 성적 관리</h3>
                <table className="table">
                    <thead><tr><th>학생</th><th>최근 점수</th><th>관리</th></tr></thead>
                    <tbody>
                    {["홍길동","김학생","이수강"].map((s,i)=>(
                        <tr key={i}>
                            <td>{s}</td>
                            <td>{70+10*i}</td>
                            <td>
                                <button className="btn btn-outline" style={{marginRight:6}}>추가</button>
                                <button className="btn btn-outline">수정</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div style={{marginTop:12, display:"flex", gap:8}}>
                    <Link className="btn" to="/exam/ex1">예시 시험 미리보기</Link>
                    {/* ▶ 실시간 모니터로 이동 */}
                    <Link className="btn btn-outline" to="/teacher/ex1/monitor">ex1 실시간 모니터</Link>
                </div>
            </div>
        </div>
    );
}
