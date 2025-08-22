import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClassDetail from "../common/ClassDetail";
import { fetchClassAttendance, fetchExamBySessionId, fetchClassSessions } from "../../utils/api";
import { useUserStomp } from "../../hooks/useUserStomp";

// 학생용 네비게이션 링크
const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

export default function StudentClassDetail() {
    // 실제 로그인 연동 시 교체
    const studentId = 27;
    const { classId } = useParams();
    const navigate = useNavigate();
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(studentId);
    
    // 해당 강좌의 세션별 출석 상태 맵 { [sessionId]: boolean }
    const [attendanceBySession, setAttendanceBySession] = useState({});
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState(null);
    
    // 해당 강좌의 세션별 시험 정보 맵 { [sessionId]: exam }
    const [examBySession, setExamBySession] = useState({});
    const [examLoading, setExamLoading] = useState(true);
    
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

    // 세션별 시험 정보 조회
    useEffect(() => {
        let isMounted = true;
        const loadSessionExams = async () => {
            try {
                setExamLoading(true);
                
                // ClassDetail에서 세션 목록을 받아와서 각 세션의 시험 정보를 조회
                const sessionsData = await fetchClassSessions(parseInt(classId));
                const sessions = Array.isArray(sessionsData) ? sessionsData : [];
                
                const examMap = {};
                const examPromises = sessions.map(async (session) => {
                    try {
                        const exam = await fetchExamBySessionId(session.sessionId);
                        if (exam) {
                            examMap[session.sessionId] = exam;
                        }
                    } catch (error) {
                        console.error(`세션 ${session.sessionId} 시험 조회 실패:`, error);
                    }
                });
                
                await Promise.all(examPromises);
                
                if (isMounted) {
                    setExamBySession(examMap);
                }
            } catch (e) {
                console.error('세션별 시험 정보 조회 실패:', e);
            } finally {
                if (isMounted) setExamLoading(false);
            }
        };
        
        if (classId) {
            loadSessionExams();
        }
        return () => { isMounted = false; };
    }, [classId]);

    const renderSessionActions = (session) => {
        const status = attendanceBySession[session.sessionId];
        const exam = examBySession[session.sessionId];
        
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

        // 과거 세션 여부 판단
        const isPast = (() => {
            try {
                if (!session?.onDate) return false;
                const on = new Date(session.onDate);
                const now = new Date();
                return on.getTime() < now.getTime();
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

        // 과거 세션이고 시험이 있는 경우에만 시험 결과 확인 버튼 표시
        const showExamResultButton = isPast && exam;
        
        // 시험 결과 확인 핸들러
        const handleExamResult = () => {
            console.log('시험결과 확인 버튼 클릭됨', exam);
            
            // 실제 시험 데이터 사용
            const examData = {
                id: exam.id || `exam-${session.sessionId}`,
                name: exam.name || `세션 ${session.sessionId} 시험`,
                description: exam.description || "시험 결과입니다.",
                duration: exam.duration || 60,
                totalPoints: exam.totalPoints || 100
            };

            const mockQuestions = [
                {
                    id: "q1",
                    body: "React에서 컴포넌트를 정의하는 방법 중 올바른 것은?",
                    qtype: "MCQ",
                    choices: JSON.stringify([
                        "function MyComponent() { return <div>Hello</div>; }",
                        "class MyComponent { render() { return <div>Hello</div>; } }",
                        "const MyComponent = () => <div>Hello</div>;",
                        "모든 위의 방법들이 올바르다"
                    ]),
                    points: 20,
                    correctAnswer: "모든 위의 방법들이 올바르다"
                },
                {
                    id: "q2",
                    body: "React에서 상태(state)를 관리하는 Hook은?",
                    qtype: "MCQ",
                    choices: JSON.stringify([
                        "useState",
                        "useEffect", 
                        "useContext",
                        "useReducer"
                    ]),
                    points: 20,
                    correctAnswer: "useState"
                },
                {
                    id: "q3",
                    body: "React에서 props의 특징을 설명하세요.",
                    qtype: "SHORT",
                    points: 20,
                    correctAnswer: "읽기 전용이며 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법"
                },
                {
                    id: "q4",
                    body: "React의 Virtual DOM이 실제 DOM보다 빠른 이유를 설명하세요.",
                    qtype: "ESSAY",
                    points: 25,
                    correctAnswer: "Virtual DOM은 메모리상의 가상 표현으로, 실제 DOM 조작을 최소화하여 성능을 향상시킵니다."
                },
                {
                    id: "q5",
                    body: "React에서 조건부 렌더링을 구현하는 방법을 예시와 함께 설명하세요.",
                    qtype: "ESSAY",
                    points: 15,
                    correctAnswer: "삼항 연산자나 && 연산자를 사용하여 조건에 따라 다른 컴포넌트를 렌더링할 수 있습니다."
                }
            ];

            const mockSubmission = {
                id: `submission-${session.sessionId}`,
                examId: examData.id,
                studentId: studentId,
                startTime: new Date().toISOString(),
                status: "completed"
            };

            // 목업 답안 (실제로는 서버에서 가져와야 함)
            const mockAnswers = {
                0: "모든 위의 방법들이 올바르다",
                1: "useState",
                2: "읽기 전용이며 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법",
                3: "Virtual DOM은 메모리상의 가상 표현으로, 실제 DOM 조작을 최소화하여 성능을 향상시킵니다.",
                4: "삼항 연산자나 && 연산자를 사용하여 조건에 따라 다른 컴포넌트를 렌더링할 수 있습니다."
            };

            // 결과 계산
            const results = mockQuestions.map((question, index) => {
                const userAnswer = mockAnswers[index] || '';
                let isCorrect = false;
                let score = 0;

                if (question.qtype === 'MCQ') {
                    isCorrect = userAnswer === question.correctAnswer;
                    score = isCorrect ? question.points : 0;
                } else {
                    // 주관식은 부분 점수 (답안이 있으면 기본 점수)
                    score = userAnswer.trim() ? Math.floor(question.points * 0.9) : 0;
                    isCorrect = userAnswer.trim().toLowerCase().includes(question.correctAnswer.toLowerCase());
                }

                return {
                    questionId: question.id,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    score,
                    maxScore: question.points
                };
            });

            const totalScore = results.reduce((sum, result) => sum + result.score, 0);
            const maxScore = mockQuestions.reduce((sum, question) => sum + question.points, 0);

            // 결과 페이지로 이동
            navigate(`/student/exam/${examData.id}/result`, {
                state: {
                    exam: examData,
                    submission: mockSubmission,
                    answers: mockAnswers,
                    questions: mockQuestions,
                    results,
                    totalScore,
                    maxScore
                }
            });
        };
        
        return (
            <>
                {/* 시험 버튼을 먼저 표시 */}
                {showExamResultButton && (
                    <button 
                        className="btn btn-outline" 
                        style={{ fontSize: '12px' }}
                        onClick={handleExamResult}
                    >
                        시험 결과 확인
                    </button>
                )}
                
                {/* 출석 배지를 나중에 표시 */}
                {badge}
            </>
        );
    };
    

    return (
        <ClassDetail 
            userType="student"
            navigationLinks={studentNavigationLinks}
            notifications={[]}
            renderSessionActions={renderSessionActions}
            onLogout={handleLogout}
            showStompStatus={false}
        />
    );
}
