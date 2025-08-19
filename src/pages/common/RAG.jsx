import { useState } from "react";

const corpus = [
    { id:"d1", title:"지도학습 개요", snippets:["지도학습은 레이블이 있는 데이터를 사용한다.","회귀와 분류가 대표적이다."]},
    { id:"d2", title:"강화학습 요약", snippets:["에이전트가 보상을 최대화하도록 학습한다.","탐험-활용 트레이드오프가 핵심이다."]},
    { id:"d3", title:"비지도학습 개념", snippets:["레이블 없이 패턴을 찾는다.","군집화와 차원축소가 예시다."]},
];

export default function RAG(){
    const [q, setQ] = useState("");
    const [k, setK] = useState(2);
    const [out, setOut] = useState([]);

    function search(){
        // 아주 단순한 데모 매칭
        const res = corpus
            .map(d=>({d,score: (d.title+ d.snippets.join(" ")).toLowerCase().includes(q.toLowerCase())?1:0}))
            .sort((a,b)=>b.score-a.score)
            .slice(0,k).map(r=>r.d);
        setOut(res);
    }

    return (
        <div className="card">
            <h2>RAG 검색</h2>
            <div className="grid grid-3">
                <input className="input" placeholder="질문을 입력하세요" value={q} onChange={e=>setQ(e.target.value)}/>
                <select className="input" value={k} onChange={e=>setK(Number(e.target.value))}>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>Top-{n}</option>)}
                </select>
                <button className="btn" onClick={search}>AI 검색</button>
            </div>

            <div className="grid" style={{marginTop:12}}>
                {out.map(d=>(
                    <div className="card" key={d.id}>
                        <b>{d.title}</b>
                        <ul>{d.snippets.map((s,i)=>(
                            <li key={i} dangerouslySetInnerHTML={{__html: highlight(s,q)}} />
                        ))}</ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]))}
function highlight(text, kw){
    if(!kw) return escapeHtml(text);
    const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"ig");
    return escapeHtml(text).replace(re,'<mark>$1</mark>');
}
