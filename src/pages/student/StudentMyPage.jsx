import { MyPage } from "../common/MyPage";
import { GradeTab } from "./GradeTab.jsx";
import { useStudentStomp } from "../../hooks/useStudentStomp";

// 학생용 네비게이션 링크 설정
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

// 학생용 탭 설정
const studentTabs = [
    { id: 'profile', label: '개인 정보', icon: '👤' },
    { id: 'grade', label: '전체 성적', icon: '📊', component: <GradeTab /> }
];

export default function StudentMyPage() {
    // 실제 로그인 연동 시 교체
    const studentId = 11;
    
    // STOMP 연결 관리
    const { handleLogout } = useStudentStomp(studentId);

    return (
        <MyPage
            title="마이페이지"
            subtitle="성적 조회 및 개인 정보 관리"
            navigationLinks={studentNavigationLinks}
            notifications={[]}
            tabs={studentTabs}
            defaultActiveTab="profile"
            userId={studentId}
            onLogout={handleLogout}
            showStompStatus={true}
        />
    );
}
