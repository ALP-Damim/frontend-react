import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MistakeDetailModal } from "../../components/student";
import { Header } from "../../components/common";
import { useUserStomp } from "../../hooks/useUserStomp";

/**
 * URL: /teacher/:examId/monitor
 * 폴링 주기: 2초 (원하면 1초까지)
 * 서버 응답: { items:[{studentId,currentIdx,answered,totalScore,updatedAt}], nowTs }
 */
export default function TeacherMonitor() {
    const { examId } = useParams();
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [focusStudent, setFocusStudent] = useState(null);
    const lastTsRef = useRef(0);

    // 실제 로그인 연동 시 교체
    const teacherId = 1;
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(teacherId);

    // 강사용 네비게이션 링크
    const teacherNavigationLinks = [
        { to: "/teacher", text: "내 강의" },
        { to: "/course-registration", text: "신규 강의 등록" },
        { to: "/teacher/mypage", text: "마이페이지" }
    ];

    // 하드코딩된 알림 데이터
    const notifications = [
        { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
        { id: 2, message: "새로운 학생이 웹 개발 입문 강의에 신청했습니다.", time: "1시간 전", read: false },
        { id: 3, message: "머신러닝 기초 과제 제출이 완료되었습니다.", time: "2시간 전", read: true },
        { id: 4, message: "알고리즘 문제 풀이 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
    ];

    useEffect(() => {
        let timer;
        async function tick() {
            const r = await fetch(`/api/exams/${examId}/progress?since=${lastTsRef.current}`);
            if (!r.ok) return;
            const data = await r.json();
            setRows(prev => merge(prev, data.items ?? []));
            lastTsRef.current = data.nowTs ?? Date.now();
        }
        tick();
        timer = setInterval(tick, 2000);
        return () => clearInterval(timer);
    }, [examId]);

    function openDetail(studentId){
        setFocusStudent(studentId);
        setOpen(true);
    }

    return (
        <>
            <Header 
                navigationLinks={teacherNavigationLinks}
                notifications={notifications}
                onLogout={handleLogout}
                userType="teacher"
            />
            <div className="container">
                <div className="card">
                    <h2>실시간 진행 (교사)</h2>
                    <table className="table">
                        <thead>
                        <tr><th>학생</th><th>현재 문제 번호</th><th>제출 수</th><th>총점</th><th>갱신</th><th>디테일</th></tr>
                        </thead>
                        <tbody>
                        {rows
                            .sort((a,b)=>a.studentId.localeCompare(b.studentId))
                            .map(r=>(
                                <tr key={r.studentId}>
                                    <td>{r.studentId}</td>
                                    <td>{r.currentIdx}</td>
                                    <td>{r.answered}</td>
                                    <td>{r.totalScore}</td>
                                    <td>{new Date(r.updatedAt).toLocaleTimeString()}</td>
                                    <td><button className="btn btn-outline" onClick={()=>openDetail(r.studentId)}>보기</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <MistakeDetailModal
                    open={open}
                    onClose={()=>setOpen(false)}
                    examId={examId}
                    studentId={focusStudent}
                />
            </div>
        </>
    );
}

function merge(prev, delta) {
    const map = new Map(prev.map(x => [x.studentId, x]));
    for (const d of delta) {
        const old = map.get(d.studentId) || {};
        map.set(d.studentId, { ...old, ...d });
    }
    return [...map.values()];
}
