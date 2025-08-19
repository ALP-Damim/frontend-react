import { useEffect, useState } from "react";

export default function MistakeDetailModal({ open, onClose, examId, studentId }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(()=>{
        if (!open) return;
        let abort = false;
        (async () => {
            setLoading(true);
            const r = await fetch(`/api/exams/${examId}/students/${studentId}/mistakes`);
            const data = r.ok ? await r.json() : { mistakes: [] };
            if (!abort) { setRows(data.mistakes ?? []); setLoading(false); }
        })();
        return ()=>{ abort = true; };
    }, [open, examId, studentId]);

    if (!open) return null;
    return (
        <div style={{position:"fixed", inset:0, background:"#0009", display:"grid", placeItems:"center", zIndex:100}}>
            <div className="card" style={{minWidth:600}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <h3>틀린 문항 상세 · {studentId}</h3>
                    <button className="btn btn-outline" onClick={onClose}>닫기</button>
                </div>
                {loading ? <p>불러오는 중...</p> : (
                    <table className="table" style={{marginTop:8}}>
                        <thead>
                        <tr><th>#</th><th>문항ID</th><th>정답</th><th>학생답</th></tr>
                        </thead>
                        <tbody>
                        {rows.length===0 ? (
                            <tr><td colSpan={4}>틀린 문항 없음</td></tr>
                        ) : rows.map((m,i)=>(
                            <tr key={i}>
                                <td>{m.questionIdx}</td>
                                <td>{m.questionId}</td>
                                <td>{m.correctAnswer}</td>
                                <td>{m.studentAnswer}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
