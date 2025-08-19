import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MistakeDetailModal from "../components/MistakeDetailModal.jsx";

/**
 * URL: /teacher/:examId/monitor
 * 폴링 주기: 2초 (원하면 1초까지)
 * 서버 응답: { items:[{studentId,currentIdx,answered,totalScore,updatedAt}], nowTs }
 */
export default function TeacherMonitor() {
    const { examId } = useParams();
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [focusStudent, setFocusStudent] = useState(null);
    const lastTsRef = useRef(0);

    useEffect(() => {
        let timer;
        async function tick() {
            const r = await fetch(`/api/exams/${examId}/progress?since=${lastTsRef.current}`);
            if (!r.ok) return;
            const data = await r.json();
            setRows(prev => merge(prev, data.items ?? []));
            lastTsRef.current = data.nowTs ?? Date.now();
        }
        tick();
        timer = setInterval(tick, 2000);
        return () => clearInterval(timer);
    }, [examId]);

    function openDetail(studentId){
        setFocusStudent(studentId);
        setOpen(true);
    }

    return (
        <>
            <div className="card">
                <h2>실시간 진행 (교사)</h2>
                <table className="table">
                    <thead>
                    <tr><th>학생</th><th>현재 문제 번호</th><th>제출 수</th><th>총점</th><th>갱신</th><th>디테일</th></tr>
                    </thead>
                    <tbody>
                    {rows
                        .sort((a,b)=>a.studentId.localeCompare(b.studentId))
                        .map(r=>(
                            <tr key={r.studentId}>
                                <td>{r.studentId}</td>
                                <td>{r.currentIdx}</td>
                                <td>{r.answered}</td>
                                <td>{r.totalScore}</td>
                                <td>{new Date(r.updatedAt).toLocaleTimeString()}</td>
                                <td><button className="btn btn-outline" onClick={()=>openDetail(r.studentId)}>보기</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MistakeDetailModal
                open={open}
                onClose={()=>setOpen(false)}
                examId={examId}
                studentId={focusStudent}
            />
        </>
    );
}

function merge(prev, delta) {
    const map = new Map(prev.map(x => [x.studentId, x]));
    for (const d of delta) {
        const old = map.get(d.studentId) || {};
        map.set(d.studentId, { ...old, ...d });
    }
    return [...map.values()];
}
