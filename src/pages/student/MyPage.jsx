import { useState } from "react";
import { Header } from "../../components/common";
import { GradeTab } from "./GradeTab.jsx";
import { ProfileTab } from "./ProfileTab.jsx";

// 하드코딩된 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 강의 'React 실전 프로젝트'가 등록되었습니다.", time: "1시간 전", read: false },
    { id: 3, message: "웹 개발 입문 과제 제출 마감이 임박했습니다.", time: "2시간 전", read: true },
    { id: 4, message: "머신러닝 기초 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

// 학생용 네비게이션 링크 설정
const studentNavigationLinks = [
    { to: "/student", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function MyPage() {
    const [activeTab, setActiveTab] = useState('grade'); // 'grade' 또는 'profile'

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks}
                notifications={notifications}
            />
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--accent)' }}>
                        마이페이지
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
                        성적 조회 및 개인 정보 관리
                    </p>
                </div>

                {/* 탭 네비게이션 */}
                <div style={{ 
                    display: 'flex', 
                    borderBottom: '1px solid var(--border)', 
                    marginBottom: '24px' 
                }}>
                    <button
                        onClick={() => setActiveTab('grade')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderBottom: activeTab === 'grade' ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === 'grade' ? 'var(--accent)' : 'var(--muted)',
                            fontWeight: activeTab === 'grade' ? '600' : '400',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📊 전체 성적
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
                            fontWeight: activeTab === 'profile' ? '600' : '400',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        👤 개인 정보
                    </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div>
                    {activeTab === 'grade' && <GradeTab />}
                    {activeTab === 'profile' && <ProfileTab />}
                </div>
            </div>
        </>
    );
}
