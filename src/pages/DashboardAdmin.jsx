export default function DashboardAdmin(){
    const cards = [
        {k:"전체 시험", v: 12},
        {k:"전체 학생", v: 128},
        {k:"대기 승인", v: 5},
        {k:"오늘 알림 발송", v: 42},
        {k:"LLM 실패(24h)", v: 3},
        {k:"Zoom 세션 예정", v: 7},
    ];
    return (
        <div className="grid">
            <div className="card">
                <h2>관리자 대시보드</h2>
                <div className="grid grid-3" style={{marginTop:10}}>
                    {cards.map((c,i)=>(
                        <div className="card" key={i}>
                            <div style={{color:"var(--muted)"}}>{c.k}</div>
                            <div style={{fontSize:28}}><b>{c.v}</b></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card">
                <h3>시스템 로그(요약)</h3>
                <ul className="mono">
                    <li>[INFO] exam:ex1 scheduled 2025-03-22 19:00</li>
                    <li>[WARN] llm:timeout exam:ex1 student:kim</li>
                    <li>[INFO] notification sent 42 rows</li>
                </ul>
            </div>
        </div>
    );
}
