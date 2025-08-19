import { useState, useEffect } from "react";

// API 호출 함수 (실제 API 엔드포인트로 교체 필요)
const fetchGrades = async () => {
    try {
        // 실제 API 호출 시에는 아래 주석을 해제하고 실제 엔드포인트로 교체
        // const response = await fetch('/api/student/grades');
        // const data = await response.json();
        // return data;
        
        // 임시 데이터 (API 연동 전까지 사용)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    courses: [
                        {
                            id: "c1",
                            title: "데이터 분석 실전",
                            instructor: "김교수",
                            attendance: 85,
                            grade: 92,
                            totalSessions: 12,
                            attendedSessions: 10,
                            assignments: [
                                { name: "1주차 과제", score: 95, maxScore: 100 },
                                { name: "2주차 과제", score: 88, maxScore: 100 },
                                { name: "3주차 과제", score: 92, maxScore: 100 }
                            ],
                            exams: [
                                { name: "중간고사", score: 89, maxScore: 100 },
                                { name: "기말고사", score: 94, maxScore: 100 }
                            ]
                        },
                        {
                            id: "c2",
                            title: "웹 개발 입문",
                            instructor: "이교수",
                            attendance: 92,
                            grade: 88,
                            totalSessions: 10,
                            attendedSessions: 9,
                            assignments: [
                                { name: "HTML/CSS 과제", score: 90, maxScore: 100 },
                                { name: "JavaScript 과제", score: 85, maxScore: 100 },
                                { name: "React 프로젝트", score: 88, maxScore: 100 }
                            ],
                            exams: [
                                { name: "기말고사", score: 87, maxScore: 100 }
                            ]
                        },
                        {
                            id: "c3",
                            title: "머신러닝 기초",
                            instructor: "박교수",
                            attendance: 78,
                            grade: 85,
                            totalSessions: 8,
                            attendedSessions: 6,
                            assignments: [
                                { name: "선형회귀 과제", score: 82, maxScore: 100 },
                                { name: "분류 알고리즘 과제", score: 88, maxScore: 100 }
                            ],
                            exams: [
                                { name: "중간고사", score: 83, maxScore: 100 }
                            ]
                        }
                    ],
                    overallStats: {
                        averageAttendance: 85,
                        averageGrade: 88.3,
                        totalCourses: 3
                    }
                });
            }, 1000); // 1초 지연으로 로딩 상태 시뮬레이션
        });
    } catch (error) {
        console.error('성적 데이터 조회 실패:', error);
        throw error;
    }
};

export function GradeTab() {
    const [grades, setGrades] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        const loadGrades = async () => {
            try {
                setLoading(true);
                const data = await fetchGrades();
                setGrades(data);
            } catch (err) {
                setError('성적 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadGrades();
    }, []);

    const getGradeColor = (grade) => {
        if (grade >= 90) return '#10b981'; // 초록색
        if (grade >= 80) return '#3b82f6'; // 파란색
        if (grade >= 70) return '#f59e0b'; // 주황색
        return '#ef4444'; // 빨간색
    };

    const getAttendanceColor = (attendance) => {
        if (attendance >= 90) return '#10b981';
        if (attendance >= 80) return '#3b82f6';
        if (attendance >= 70) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '18px', color: 'var(--muted)' }}>성적 데이터를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '18px', color: 'var(--warn)' }}>{error}</div>
                <button 
                    className="btn" 
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '16px' }}
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* 전체 통계 */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 className="section-title">전체 성적 요약</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: getGradeColor(grades.overallStats.averageGrade) }}>
                            {grades.overallStats.averageGrade}점
                        </div>
                        <div className="stat-label">평균 성적</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: getAttendanceColor(grades.overallStats.averageAttendance) }}>
                            {grades.overallStats.averageAttendance}%
                        </div>
                        <div className="stat-label">평균 출석률</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{grades.overallStats.totalCourses}개</div>
                        <div className="stat-label">수강 중인 강의</div>
                    </div>
                </div>
            </div>

            {/* 강의별 성적 */}
            <div className="card">
                <h2 className="section-title">강의별 성적 상세</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {grades.courses.map((course) => (
                        <div key={course.id} className="course-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div className="course-title">{course.title}</div>
                                    <div className="course-info">{course.instructor}</div>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                    {selectedCourse === course.id ? '접기' : '상세보기'}
                                </button>
                            </div>

                            {/* 기본 정보 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        fontWeight: '700', 
                                        color: getGradeColor(course.grade),
                                        marginBottom: '4px'
                                    }}>
                                        {course.grade}점
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>최종 성적</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        fontWeight: '700', 
                                        color: getAttendanceColor(course.attendance),
                                        marginBottom: '4px'
                                    }}>
                                        {course.attendance}%
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        출석률 ({course.attendedSessions}/{course.totalSessions})
                                    </div>
                                </div>
                            </div>

                            {/* 상세 정보 */}
                            {selectedCourse === course.id && (
                                <div style={{ 
                                    borderTop: '1px solid var(--border)', 
                                    paddingTop: '16px',
                                    marginTop: '16px'
                                }}>
                                    {/* 과제 성적 */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>과제 성적</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {course.assignments.map((assignment, index) => (
                                                <div key={index} style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    padding: '8px 12px',
                                                    backgroundColor: 'var(--hover)',
                                                    borderRadius: '6px'
                                                }}>
                                                    <span style={{ fontSize: '13px' }}>{assignment.name}</span>
                                                    <span style={{ 
                                                        fontSize: '13px', 
                                                        fontWeight: '600',
                                                        color: getGradeColor(assignment.score)
                                                    }}>
                                                        {assignment.score}/{assignment.maxScore}점
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 시험 성적 */}
                                    <div>
                                        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>시험 성적</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {course.exams.map((exam, index) => (
                                                <div key={index} style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    padding: '8px 12px',
                                                    backgroundColor: 'var(--hover)',
                                                    borderRadius: '6px'
                                                }}>
                                                    <span style={{ fontSize: '13px' }}>{exam.name}</span>
                                                    <span style={{ 
                                                        fontSize: '13px', 
                                                        fontWeight: '600',
                                                        color: getGradeColor(exam.score)
                                                    }}>
                                                        {exam.score}/{exam.maxScore}점
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
