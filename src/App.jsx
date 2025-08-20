import { Routes, Route, Link, NavLink } from "react-router-dom";
import { DashboardStudent, Exam, Result, StudentStep, StudentMyPage } from "./pages/student";
import MyCourses from "./pages/student/MyCourses.jsx";
import CourseApplication from "./pages/student/CourseApplication.jsx";
import StudentClassDetail from "./pages/student/StudentClassDetail.jsx";
import { DashboardTeacher, TeacherMonitor, CourseRegistration, TeacherMyPage } from "./pages/teacher";
import ClassManagement from "./pages/teacher/ClassManagement.jsx";
import { DashboardAdmin } from "./pages/admin";
import { RAG, NotificationLog, NotificationTest } from "./pages/common";
import { StompProvider } from "./contexts/StompContext";

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
            <NavLink to="/notification-test" {...{ className: link }}>
                알림 테스트
            </NavLink>
        </div>
    );
}

export default function App() {
    return (
        <StompProvider>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/student" element={<DashboardStudent />} />
                <Route path="/student/courses" element={<MyCourses />} />
                <Route path="/student/class/:classId" element={<StudentClassDetail />} />
                <Route path="/course-application" element={<CourseApplication />} />
                <Route path="/teacher" element={<DashboardTeacher />} />
                <Route path="/teacher/class/:classId" element={<ClassManagement />} />
                <Route path="/course-registration" element={<CourseRegistration />} />
                <Route path="/teacher/mypage" element={<TeacherMyPage />} />
                <Route path="/admin" element={<DashboardAdmin />} />
                <Route path="/exam/:examId" element={<Exam />} />
                <Route path="/exam/:examId/step" element={<StudentStep />} />
                <Route path="/teacher/:examId/monitor" element={<TeacherMonitor />} />
                <Route path="/result/:examId" element={<Result />} />
                <Route path="/mypage" element={<StudentMyPage />} />
                <Route path="/rag" element={<RAG />} />
                <Route path="/notifications" element={<NotificationLog />} />
                <Route path="/notification-test" element={<NotificationTest />} />
            </Routes>
        </StompProvider>
    );
}

function Home() {
    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--accent)' }}>
                    EduLearn
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
                    스마트한 교육 플랫폼
                </p>
            </div>
            
            <div className="grid grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '16px' }}>시작하기</h2>
                    <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                        역할을 선택하고 기본 플로우를 테스트하세요.
                    </p>
                    <div style={{display:"flex", gap:12, flexDirection: 'column'}}>
                        <Link className="btn" to="/student" style={{ textAlign: 'center' }}>
                            학생 대시보드
                        </Link>
                        <Link className="btn btn-outline" to="/teacher" style={{ textAlign: 'center' }}>
                            강사 대시보드
                        </Link>
                        <Link className="btn btn-outline" to="/admin" style={{ textAlign: 'center' }}>
                            관리자 대시보드
                        </Link>
                        <Link className="btn btn-outline" to="/notification-test" style={{ textAlign: 'center' }}>
                            알람 테스트
                        </Link>
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>데모 시나리오</h3>
                    <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
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
        </div>
    );
}
