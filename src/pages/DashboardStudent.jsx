import { Link } from "react-router-dom";
import ScoreChart from "../components/ScoreChart.jsx";

const mockExams = [
    { id:"ex1", title:"데이터 분석 실전 3주차", level:"중", scheduled:"2025-03-22T19:00:00Z" },
    { id:"ex2", title:"웹 개발 입문", level:"하", scheduled:"2025-03-25T10:00:00Z" },
];

const mockScores = [
    { label:"1주차", score: 72 },
    { label:"2주차", score: 81 },
    { label:"3주차", score: 90 },
];

export default function DashboardStudent() {
    return (
        <div className="grid grid-2">
            <div className="card">
                <h2>학생 대시보드</h2>
                <p className="badge">내 강의/시험/알림</p>
                <h3 style={{marginTop:10}}>예정된 시험</h3>
                <div className="grid">
                    {mockExams.map(e=>(
                        <div className="card" key={e.id}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <div>
                                    <b>{e.title}</b>
                                    <div style={{color:"var(--muted)"}}>
                                        난이도: {e.level} · {new Date(e.scheduled).toLocaleString()}
                                    </div>
                                </div>
                                <Link className="btn" to={`/exam/${e.id}/step?idx=1`}>응시하기</Link>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{marginTop:10}}>
                    <Link className="btn btn-outline" to="/notifications">알림 보기</Link>
                </div>
            </div>

            <div className="grid">
                <ScoreChart data={mockScores} />
                <div className="card">
                    <h3>내 성적</h3>
                    <div className="grid grid-3">
                        <Stat k="진행 중" v="4"/>
                        <Stat k="예정 라이브" v="2"/>
                        <Stat k="완료 강의" v="7"/>
                    </div>
                    <div style={{marginTop:10}}>
                        <button className="btn">내 성적 조회</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({k,v}) {
    return <div className="card"><div style={{color:"var(--muted)"}}>{k}</div><div style={{fontSize:24}}><b>{v}</b></div></div>;
}
