export default function NotificationModal({ open, onClose, zoomUrl, startsAt }) {
    if (!open) return null;
    return (
        <div style={{
            position:"fixed", inset:0, background:"#0009",
            display:"grid", placeItems:"center", zIndex:50
        }}>
            <div className="card" style={{maxWidth:520}}>
                <h3>시험 시작 알림</h3>
                <p>시작 시각: <b>{new Date(startsAt).toLocaleString()}</b></p>
                <div style={{display:"flex", gap:8, marginTop:10}}>
                    <a className="btn" href={zoomUrl} target="_blank" rel="noreferrer">Zoom 링크 열기</a>
                    <button className="btn btn-outline" onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    );
}
