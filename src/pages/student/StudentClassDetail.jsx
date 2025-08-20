import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ClassDetail from "../common/ClassDetail";
import { fetchClassAttendance } from "../../utils/api";

// 학생용 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 강의 'React 실전 프로젝트'가 등록되었습니다.", time: "1시간 전", read: false },
    { id: 3, message: "웹 개발 입문 과제 제출 마감이 임박했습니다.", time: "2시간 전", read: true },
    { id: 4, message: "머신러닝 기초 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function StudentClassDetail() {
    // 실제 로그인 연동 시 교체
    const studentId = 11;
    const { classId } = useParams();
    
    // 해당 강좌의 세션별 출석 상태 맵 { [sessionId]: boolean }
    const [attendanceBySession, setAttendanceBySession] = useState({});
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState(null);
    
    useEffect(() => {
        let isMounted = true;
        const loadClassAttendance = async () => {
            try {
                setAttendanceLoading(true);
                setAttendanceError(null);
                const data = await fetchClassAttendance(studentId, parseInt(classId));
                const results = Array.isArray(data?.attendanceResults) ? data.attendanceResults : [];
                const map = {};
                results.forEach(item => {
                    if (item && item.sessionId != null) {
                        // 상태 문자열 그대로 저장: PRESENT, ABSENT, LATE, EXCUSED
                        map[item.sessionId] = item.status;
                    }
                });
                if (isMounted) {
                    setAttendanceBySession(map);
                }
            } catch (e) {
                console.error('강좌 출석 조회 실패:', e);
                if (isMounted) setAttendanceError('출석 정보를 불러오지 못했습니다.');
            } finally {
                if (isMounted) setAttendanceLoading(false);
            }
        };
        if (classId) {
            loadClassAttendance();
        }
        return () => { isMounted = false; };
    }, [classId, studentId]);

    const renderSessionActions = (session) => {
        const status = attendanceBySession[session.sessionId];
        const labelMap = {
            PRESENT: '출석',
            ABSENT: '결석',
            LATE: '지각',
            EXCUSED: '공결'
        };
        const iconMap = {
            PRESENT: '✅',
            ABSENT: '❌',
            LATE: '⏰',
            EXCUSED: '📝'
        };
        const colorMap = {
            PRESENT: { bg: '#e6f6ec', fg: '#166534', border: '#86efac' },
            ABSENT: { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca' },
            LATE: { bg: '#fff7ed', fg: '#9a3412', border: '#fed7aa' },
            EXCUSED: { bg: '#e0f2fe', fg: '#075985', border: '#bae6fd' },
            PLANNED: { bg: '#eef2ff', fg: '#3730a3', border: '#c7d2fe' },
            LOADING: { bg: '#f3f4f6', fg: '#374151', border: '#e5e7eb' },
            UNKNOWN: { bg: '#f3f4f6', fg: '#374151', border: '#e5e7eb' },
        };

        // 미래 세션 여부 판단
        const isFuture = (() => {
            try {
                if (!session?.onDate) return false;
                const on = new Date(session.onDate);
                const now = new Date();
                return on.getTime() > now.getTime();
            } catch (_) {
                return false;
            }
        })();

        const makeBadge = (text, tone) => (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${tone.border}`,
                    backgroundColor: tone.bg,
                    color: tone.fg,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 0.2,
                }}
            >
                {text}
            </span>
        );

        let badge;
        if (isFuture) {
            badge = makeBadge('📅 예정됨', colorMap.PLANNED);
        } else if (attendanceLoading && status === undefined) {
            badge = makeBadge('확인 중...', colorMap.LOADING);
        } else if (status && labelMap[status]) {
            badge = makeBadge(`${iconMap[status]} ${labelMap[status]}`, colorMap[status]);
        } else {
            badge = makeBadge('확인 불가', colorMap.UNKNOWN);
        }
        return (
            <>
                {badge}
                <button className="btn btn-outline" style={{ fontSize: '12px' }}>
                    시험 보기
                </button>
            </>
        );
    };
    

    return (
        <ClassDetail 
            userType="student"
            navigationLinks={studentNavigationLinks}
            notifications={notifications}
            renderSessionActions={renderSessionActions}
        />
    );
}
