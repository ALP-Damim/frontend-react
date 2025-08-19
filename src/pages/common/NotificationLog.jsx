export default function NotificationLog(){
    const rows = [
        {t:"2025-03-20 09:00", kind:"시험시작", msg:"ex1 알림 발송 · Zoom 링크 포함", to:120},
        {t:"2025-03-21 18:00", kind:"리마인드", msg:"ex1 D-1 리마인드", to:118},
        {t:"2025-03-22 18:50", kind:"시험시작", msg:"ex1 D-0 시작 10분 전", to:121},
    ];
    return (
        <div className="card">
            <h2>알림 로그</h2>
            <table className="table">
                <thead><tr><th>시간</th><th>종류</th><th>메시지</th><th>대상 수</th></tr></thead>
                <tbody>
                {rows.map((r,i)=>(
                    <tr key={i}><td>{r.t}</td><td>{r.kind}</td><td>{r.msg}</td><td>{r.to}</td></tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
