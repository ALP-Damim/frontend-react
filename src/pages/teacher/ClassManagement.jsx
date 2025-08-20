import ClassDetail from "../common/ClassDetail";

// 강사용 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 학생이 웹 개발 입문 강의에 신청했습니다.", time: "1시간 전", read: false },
    { id: 3, message: "머신러닝 기초 과제 제출이 완료되었습니다.", time: "2시간 전", read: true },
    { id: 4, message: "알고리즘 문제 풀이 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

// 강사용 네비게이션 링크
const teacherNavigationLinks = [
    { to: "/teacher", text: "내 강의" },
    { to: "/course-registration", text: "신규 강의 등록" },
    { to: "/teacher/mypage", text: "마이페이지" }
];

export default function ClassManagement() {
    // 강사용 액션 버튼들
    const renderTeacherActions = (session) => {
        return (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ fontSize: '12px' }}>
                    시험 작성
                </button>
                <button className="btn btn-outline" style={{ fontSize: '12px' }}>
                    통계 보기
                </button>
            </div>
        );
    };

    return (
        <ClassDetail 
            userType="teacher"
            navigationLinks={teacherNavigationLinks}
            notifications={notifications}
            renderSessionActions={renderTeacherActions}
        />
    );
}
