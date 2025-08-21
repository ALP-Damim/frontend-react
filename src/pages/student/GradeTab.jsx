import { useState, useEffect } from "react";
import { fetchStudentClasses, fetchClassAttendance } from "../../utils/api";

// 수강 강좌 및 강좌별 출석률을 불러와 UI에 맞게 가공
const fetchGrades = async () => {
	const studentId = 21; // TODO: 로그인 사용자 ID로 교체
	const classes = await fetchStudentClasses(studentId);
	// classes가 배열이 아닐 수 있으니 방어코드
	const classList = Array.isArray(classes) ? classes : [];

	// 각 강좌별 출석률 동시 조회
	const attendanceResults = await Promise.allSettled(
		classList.map((c) => fetchClassAttendance(studentId, c.classId))
	);

	// 응답에서 출석률(%)과 세부 수치가 있으면 함께 매핑
	const courses = classList.map((c, idx) => {
		const r = attendanceResults[idx];
		let attendanceRate = 0;
		let attendedSessions;
		let totalSessions;
		if (r && r.status === 'fulfilled' && r.value) {
			const v = r.value;
			// 다양한 백엔드 키 대응
			attendanceRate =
				Number(
					v.attendanceRate ?? v.rate ?? v.percentage ?? v.attendance ?? 0
				) || 0;
			attendedSessions = v.attendedSessions ?? v.attended ?? v.presentCount;
			totalSessions = v.totalSessions ?? v.total ?? v.sessionCount;
		}
		return {
			id: c.classId,
			title: c.className,
			instructor: c.teacherName,
			attendance: attendanceRate,
			attendedSessions,
			totalSessions,
		};
	});

	const validRates = courses
		.map((c) => (typeof c.attendance === 'number' ? c.attendance : 0))
		.filter((n) => !Number.isNaN(n));
	const averageAttendance = validRates.length
		? Math.round(
			validRates.reduce((sum, v) => sum + v, 0) / validRates.length
		)
		: 0;

	return {
		courses,
		overallStats: {
			averageAttendance,
			totalCourses: classList.length,
		},
	};
};

export function GradeTab() {
    const [grades, setGrades] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <h2 className="section-title">강의별 출석률</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {grades.courses.map((course) => (
                        <div key={course.id} className="course-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div className="course-title">{course.title}</div>
                                    <div className="course-info">{course.instructor}</div>
                                </div>
                            </div>

                            {/* 출석 정보 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '4px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        fontWeight: '700', 
                                        color: getAttendanceColor(course.attendance),
                                        marginBottom: '4px'
                                    }}>
                                        {course.attendance}%
                                    </div>
                                    {typeof course.attendedSessions === 'number' && typeof course.totalSessions === 'number' && (
                                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                            출석률 ({course.attendedSessions}/{course.totalSessions})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
