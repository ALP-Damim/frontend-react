import { MyPage } from "../common/MyPage";
import { useUserStomp } from "../../hooks/useUserStomp";

// 강사용 네비게이션 링크 설정
const teacherNavigationLinks = [
    { to: "/teacher", text: "내 강의" },
    { to: "/course-registration", text: "신규 강의 등록" },
    { to: "/teacher/mypage", text: "마이페이지" }
];

// 강사용 탭 설정
const teacherTabs = [
    { id: 'profile', label: '강사 정보', icon: '👨‍🏫' }
    // 향후 다른 탭들을 여기에 추가할 수 있습니다
    // { id: 'settings', label: '설정', icon: '⚙️', component: <SettingsTab /> },
    // { id: 'history', label: '강의 이력', icon: '📚', component: <HistoryTab /> },
];

export default function TeacherMyPage() {
    // 실제 로그인 연동 시 교체
    const teacherId = 4;
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(teacherId);

    return (
        <MyPage
            title="강사 마이페이지"
            subtitle="강사 정보 관리"
            navigationLinks={teacherNavigationLinks}
            notifications={[]}
            tabs={teacherTabs}
            defaultActiveTab="profile"
            userId={teacherId}
            onLogout={handleLogout}
            showStompStatus={false}
        />
    );
}
