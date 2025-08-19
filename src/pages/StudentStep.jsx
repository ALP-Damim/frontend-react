import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

/**
 * URL: /exam/:examId/step?idx=1
 * API:
 *   GET  /api/exams/:id/questions/:idx -> {id, idx, type, prompt, choices?}
 *   POST /api/exams/:id/answers        -> {ok:true, nextIdx, finished?:true}
 */
export default function StudentStep() {
    const { examId } = useParams();
    const [sp, setSp] = useSearchParams();
    const idx = Number(sp.get("idx") ?? 1);

    const [q, setQ] = useState(null);
    const [ans, setAns] = useState("");
    const [loading, setLoading] = useState(false);

    // 문항 로딩
    useEffect(() => {
        let abort = false;
        (async () => {
            setLoading(true);
            const r = await fetch(`/api/exams/${examId}/questions/${idx}`);
            if (!r.ok) { setQ(null); setLoading(false); return; }
            const data = await r.json();
            if (!abort) { setQ(data); setAns(""); setLoading(false); }
        })();
        return () => { abort = true; };
    }, [examId, idx]);

    async function submitAndNext() {
        if (!q) return;
        const r = await fetch(`/api/exams/${examId}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId: q.id, answer: ans })
        });
        if (!r.ok) return;
        const data = await r.json(); // {nextIdx, finished?}
        if (data.finished) {
            // 시험 종료 → 결과 페이지로
            window.location.href = `/result/${examId}`;
            return;
        }
        // 다음 문항
        setSp({ idx: String(data.nextIdx ?? idx + 1) });
    }

    if (loading) return <div className="card">로딩...</div>;
    if (!q) return <div className="card">문항을 불러올 수 없습니다.</div>;

    return (
        <div className="card">
            <div className="badge">문항 #{q.idx ?? idx}</div>
            <p><b>{q.prompt}</b></p>

            {q.type === "mcq" ? (
                <select className="input" value={ans} onChange={e=>setAns(e.target.value)}>
                    <option value="" disabled>선택</option>
                    {(q.choices ?? []).map((c,i)=><option key={i} value={c}>{c}</option>)}
                </select>
            ) : (
                <textarea className="input" rows={4} value={ans} onChange={e=>setAns(e.target.value)} />
            )}

            <div style={{marginTop:10, display:"flex", gap:8}}>
                <button className="btn" onClick={submitAndNext} disabled={!ans}>제출 후 다음</button>
            </div>
        </div>
    );
}
