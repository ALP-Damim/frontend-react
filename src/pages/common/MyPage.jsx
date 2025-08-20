import { useState } from "react";
import { Header } from "../../components/common";
import { ProfileTab } from "./ProfileTab";

export function MyPage({ 
    title = "마이페이지",
    subtitle = "개인 정보 관리",
    navigationLinks = [],
    notifications = [],
    tabs = [],
    defaultActiveTab = null,
    userId = 11
}) {
    const [activeTab, setActiveTab] = useState(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : 'profile'));

    return (
        <>
            <Header 
                navigationLinks={navigationLinks}
                notifications={notifications}
            />
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--accent)' }}>
                        {title}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
                        {subtitle}
                    </p>
                </div>

                {/* 탭 네비게이션 */}
                {tabs.length > 0 && (
                    <div style={{ 
                        display: 'flex', 
                        borderBottom: '1px solid var(--border)', 
                        marginBottom: '24px' 
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted)',
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* 탭 컨텐츠 */}
                <div>
                    {activeTab === 'profile' && <ProfileTab userId={userId} />}
                    {tabs.map(tab => {
                        if (tab.id !== 'profile' && tab.component) {
                            return activeTab === tab.id && (
                                <div key={tab.id}>
                                    {tab.component}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </>
    );
}
