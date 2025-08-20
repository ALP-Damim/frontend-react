import { MyPage } from "../common/MyPage";
import { GradeTab } from "./GradeTab.jsx";

// 하드코딩된 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 강의 'React 실전 프로젝트'가 등록되었습니다.", time: "1시간 전", read: false },
    { id: 3, message: "웹 개발 입문 과제 제출 마감이 임박했습니다.", time: "2시간 전", read: true },
    { id: 4, message: "머신러닝 기초 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

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
    return (
        <MyPage
            title="마이페이지"
            subtitle="성적 조회 및 개인 정보 관리"
            navigationLinks={studentNavigationLinks}
            notifications={notifications}
            tabs={studentTabs}
            defaultActiveTab="profile"
            userId={11}
        />
    );
}
