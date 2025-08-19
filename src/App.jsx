import { Routes, Route, Link, NavLink } from "react-router-dom";
import DashboardStudent from "./pages/DashboardStudent.jsx";
import DashboardTeacher from "./pages/DashboardTeacher.jsx";
import DashboardAdmin from "./pages/DashboardAdmin.jsx";
import Exam from "./pages/Exam.jsx";
import Result from "./pages/Result.jsx";
import RAG from "./pages/RAG.jsx";
import NotificationLog from "./pages/NotificationLog.jsx";

function Nav() {
    const link = ({ isActive }) =>
        ({ className: isActive ? "badge" : "btn btn-outline" });
    return (
        <div className="nav">
            <Link to="/" className="btn">EduLearn</Link>
            <NavLink to="/student" {...{ className: link }}>
                학생
            </NavLink>
            <NavLink to="/teacher" {...{ className: link }}>
                강사
            </NavLink>
            <NavLink to="/admin" {...{ className: link }}>
                관리자
            </NavLink>
            <div style={{flex:1}} />
            <NavLink to="/rag" {...{ className: link }}>
                AI 검색(RAG)
            </NavLink>
            <NavLink to="/notifications" {...{ className: link }}>
                알림 로그
            </NavLink>
        </div>
    );
}

export default function App() {
    return (
        <>
            <Nav />
            <div className="container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/student" element={<DashboardStudent />} />
                    <Route path="/teacher" element={<DashboardTeacher />} />
                    <Route path="/admin" element={<DashboardAdmin />} />
                    <Route path="/exam/:examId" element={<Exam />} />
                    <Route path="/result/:examId" element={<Result />} />
                    <Route path="/rag" element={<RAG />} />
                    <Route path="/notifications" element={<NotificationLog />} />
                </Routes>
            </div>
        </>
    );
}

function Home() {
    return (
        <div className="grid grid-2">
            <div className="card">
                <h2>시작하기</h2>
                <p>역할을 선택하고 기본 플로우를 테스트하세요.</p>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                    <Link className="btn" to="/student">학생 대시보드</Link>
                    <Link className="btn" to="/teacher">강사 대시보드</Link>
                    <Link className="btn" to="/admin">관리자 대시보드</Link>
                </div>
            </div>
            <div className="card">
                <h3>데모 시나리오</h3>
                <ol>
                    <li>강사: 시험 생성 → 난이도/문항 입력</li>
                    <li>학생: 시험 목록 → 응시 → 제출</li>
                    <li>결과: 실시간 점수 확인 → <span className="kbd">AI 조언 보기</span></li>
                    <li>과제/답안 옆 <span className="kbd">AI 피드백 보기</span> 버튼</li>
                    <li>RAG 검색: 문서 Top-k + 근거 문장 하이라이트</li>
                    <li>알림: 시험 전 모달 + Zoom 이동</li>
                    <li>실패시: 재시도(최대 3회)</li>
                </ol>
            </div>
        </div>
    );
}
