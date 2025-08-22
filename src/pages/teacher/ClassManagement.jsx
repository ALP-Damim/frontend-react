import ClassDetail from "../common/ClassDetail";
import { useUserStomp } from "../../hooks/useUserStomp";
import { useParams } from "react-router-dom";
import { findNearestFutureSession, fetchExamBySessionId } from "../../utils/api";

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
    const { classId } = useParams();
    // 실제 로그인 연동 시 교체
    const teacherId = 4;
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(teacherId);

    // 시험 작성 핸들러
    const handleExamCreate = async (session) => {
        try {
            console.log('시험 작성 시작:', classId, '세션:', session.sessionId);
            
            // 해당 세션의 시험 검색
            const exam = await fetchExamBySessionId(session.sessionId);
            
            console.log('세션 시험 검색 결과:', exam);
            
            // 시험 존재 여부에 따라 다른 페이지로 이동
            if (exam) {
                // 시험이 존재하면 편집 페이지로 이동
                window.location.href = `/teacher/exam/edit/${exam.id}?classId=${classId}&sessionId=${session.sessionId}`;
            } else {
                // 시험이 없으면 생성 페이지로 이동
                window.location.href = `/teacher/exam/create/${classId}?sessionId=${session.sessionId}`;
            }
            
        } catch (error) {
            console.error('시험 작성 준비 실패:', error);
            alert('시험 작성 준비 중 오류가 발생했습니다.');
        }
    };

    // 시험 입장 핸들러
    const handleExamEnter = async (session) => {
        try {
            console.log('시험 입장 확인:', classId, '세션:', session.sessionId);
            
            // 해당 세션의 시험 검색
            const exam = await fetchExamBySessionId(session.sessionId);
            
            console.log('시험 입장 검색 결과:', exam);
            
            if (!exam) {
                alert('해당 세션에 시험이 없습니다.');
                return;
            }
            
            if (!exam.isReady) {
                alert('시험이 아직 준비되지 않았습니다. 시험 작성에서 최종 수정을 완료해주세요.');
                return;
            }
            
            // 시험이 준비되었으면 시험 페이지로 이동
            console.log('시험 입장 가능:', exam);
            window.location.href = `/teacher/exam/${exam.id}?classId=${classId}&sessionId=${session.sessionId}`;
            
        } catch (error) {
            console.error('시험 입장 확인 실패:', error);
            alert('시험 입장 확인 중 오류가 발생했습니다.');
        }
    };

    // 강사용 액션 버튼들
    const renderTeacherActions = (session) => {
        const now = new Date();
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(session.endTime);
        const isCurrent = now >= sessionStart && now <= sessionEnd;
        const isFuture = now < sessionStart;
        const isPast = now > sessionEnd;

        return (
            <div style={{ display: 'flex', gap: '8px' }}>
                {(isCurrent || isFuture) && (
                    <button 
                        className="btn" 
                        style={{ fontSize: '12px', backgroundColor: 'var(--accent)', color: 'white' }}
                        onClick={() => handleExamCreate(session)}
                    >
                        시험 작성
                    </button>
                )}
                {isCurrent && (
                    <button 
                        className="btn" 
                        style={{ fontSize: '12px', backgroundColor: 'var(--success)', color: 'white' }}
                        onClick={() => handleExamEnter(session)}
                    >
                        시험 입장
                    </button>
                )}
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
            onLogout={handleLogout}
            showStompStatus={false}
        />
    );
}
