import { Link, useNavigate } from "react-router-dom";
import { Header } from "../../components/common";

export default function DashboardAdmin(){
    const navigate = useNavigate();
    
    // 기본 로그아웃 핸들러
    const handleLogout = () => {
        navigate('/');
    };

    const stats = [
        {k:"전체 학생", v: 128, icon: "👥"},
        {k:"전체 강사", v: 24, icon: "👨‍🏫"},
        {k:"진행 중인 강의", v: 18, icon: "📚"},
        {k:"이번 달 수강신청", v: 156, icon: "📝"},
        {k:"오늘 알림 발송", v: 42, icon: "🔔"},
        {k:"Zoom 세션 예정", v: 7, icon: "🎥"},
    ];

    const recentActivities = [
        { time: "10분 전", action: "새로운 강의 등록", detail: "React 실전 프로젝트 - 김교수" },
        { time: "30분 전", action: "학생 수강신청", detail: "홍길동님이 '웹 개발 입문' 신청" },
        { time: "1시간 전", action: "시스템 알림 발송", detail: "오늘 강의 시작 30분 전 알림" },
        { time: "2시간 전", action: "강의 완료", detail: "데이터 분석 실전 2주차 완료" },
    ];

    // 하드코딩된 알림 데이터
    const notifications = [
        { id: 1, message: "새로운 강의 등록 요청이 있습니다.", time: "5분 전", read: false },
        { id: 2, message: "시스템 점검이 완료되었습니다.", time: "1시간 전", read: false },
        { id: 3, message: "데이터베이스 백업이 성공적으로 완료되었습니다.", time: "2시간 전", read: true },
        { id: 4, message: "새로운 사용자 가입이 발생했습니다.", time: "1일 전", read: true },
    ];

    // 관리자용 네비게이션 링크 설정
    const adminNavigationLinks = [
        { to: "/admin", text: "임시1" },
        { to: "/admin", text: "임시2" }
    ];

    return (
        <>
            <Header 
                navigationLinks={adminNavigationLinks}
                notifications={notifications}
                onLogout={handleLogout}
            />
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--accent)' }}>
                        관리자 대시보드
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
                        전체 시스템 현황 및 통계
                    </p>
                </div>

                <div className="grid" style={{ gap: '24px' }}>
                    {/* 통계 카드 */}
                    <div className="card">
                        <h2 className="section-title">시스템 통계</h2>
                        <div className="stats-grid">
                            {stats.map((stat, i) => (
                                <div key={i} className="stat-card">
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                        {stat.icon}
                                    </div>
                                    <div className="stat-value">{stat.v}</div>
                                    <div className="stat-label">{stat.k}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 최근 활동 */}
                    <div className="card">
                        <h3 className="section-title">최근 활동</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentActivities.map((activity, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '12px', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--hover)'
                                }}>
                                    <div style={{ 
                                        width: '80px', 
                                        fontSize: '12px', 
                                        color: 'var(--muted)',
                                        fontWeight: '500'
                                    }}>
                                        {activity.time}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                            {activity.action}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                            {activity.detail}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 시스템 상태 */}
                    <div className="grid grid-2" style={{ gap: '16px' }}>
                        <div className="card">
                            <h3 className="section-title">시스템 상태</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>서버 상태</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>정상</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>데이터베이스</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>정상</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>AI 서비스</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>정상</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Zoom 연동</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>정상</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="section-title">빠른 액션</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button className="btn btn-outline" style={{ textAlign: 'left' }}>
                                    📊 전체 통계 보고서 생성
                                </button>
                                <button className="btn btn-outline" style={{ textAlign: 'left' }}>
                                    👥 사용자 관리
                                </button>
                                <button className="btn btn-outline" style={{ textAlign: 'left' }}>
                                    ⚙️ 시스템 설정
                                </button>
                                <button className="btn btn-outline" style={{ textAlign: 'left' }}>
                                    📝 로그 확인
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
