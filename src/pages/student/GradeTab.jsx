import { useState, useEffect } from "react";
import { fetchStudentClasses, fetchClassAttendance, fetchStudentExamGrades } from "../../utils/api";

// 수강 강좌 및 강좌별 출석률과 시험 성적을 불러와 UI에 맞게 가공
const fetchGrades = async () => {
	const studentId = 21; // TODO: 로그인 사용자 ID로 교체
	
	// 출석률 데이터 조회
	const classes = await fetchStudentClasses(studentId);
	const classList = Array.isArray(classes) ? classes : [];

	const attendanceResults = await Promise.allSettled(
		classList.map((c) => fetchClassAttendance(studentId, c.classId))
	);

	// 시험 성적 데이터 조회
	const examGrades = await fetchStudentExamGrades(studentId);

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

		// 해당 강의의 시험 성적 찾기
		const classExamData = examGrades.classes.find(classData => classData.classId === c.classId);
		const exams = classExamData ? classExamData.exams : [];

		// 강의별 평균 시험 성적 계산
		let averageExamScore = 0;
		let averageExamAccuracy = 0;
		let totalExamCount = 0;
		
		if (exams.length > 0) {
			const totalScore = exams.reduce((sum, exam) => sum + exam.totalScore, 0);
			const totalMaxScore = exams.reduce((sum, exam) => sum + exam.maxScore, 0);
			const totalAccuracy = exams.reduce((sum, exam) => sum + exam.accuracy, 0);
			
			averageExamScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
			averageExamAccuracy = Math.round(totalAccuracy / exams.length);
			totalExamCount = exams.length;
		}

		return {
			id: c.classId,
			title: c.className,
			instructor: c.teacherName,
			attendance: attendanceRate,
			attendedSessions,
			totalSessions,
			exams: exams,
			examStats: {
				averageScore: averageExamScore,
				averageAccuracy: averageExamAccuracy,
				totalExams: totalExamCount
			}
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
		examStats: examGrades.overallStats,
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

    const getScoreColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
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
            <div className="card" style={{ 
                marginBottom: '32px',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <h2 className="section-title" style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    marginBottom: '24px'
                }}>
                    전체 성적 요약
                </h2>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px' 
                }}>
                    <div style={{ 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '700', 
                            color: getAttendanceColor(grades.overallStats.averageAttendance),
                            marginBottom: '8px'
                        }}>
                            {grades.overallStats.averageAttendance}%
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            평균 출석률
                        </div>
                    </div>
                    <div style={{ 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '700', 
                            color: '#1f2937',
                            marginBottom: '8px'
                        }}>
                            {grades.overallStats.totalCourses}개
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            수강 중인 강의
                        </div>
                    </div>
                    <div style={{ 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '700', 
                            color: getScoreColor(grades.examStats.averageScore),
                            marginBottom: '8px'
                        }}>
                            {grades.examStats.averageScore}%
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            평균 시험 점수
                        </div>
                    </div>
                    <div style={{ 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '700', 
                            color: '#1f2937',
                            marginBottom: '8px'
                        }}>
                            {grades.examStats.totalExams}개
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            응시한 시험
                        </div>
                    </div>
                </div>
            </div>

            {/* 강의별 성적 */}
            <div className="card" style={{ 
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <h2 className="section-title" style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    marginBottom: '24px'
                }}>
                    강의별 성적
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {grades.courses.map((course) => (
                        <div key={course.id} className="course-card" style={{ 
                            padding: '24px', 
                            borderRadius: '12px', 
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* 강의 정보 */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ 
                                    fontSize: '18px', 
                                    fontWeight: '600', 
                                    color: '#1f2937',
                                    marginBottom: '4px'
                                }}>
                                    {course.title}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {course.instructor}
                                </div>
                            </div>

                            {/* 성적 정보 */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '24px',
                                alignItems: 'center'
                            }}>
                                {/* 출석 정보 */}
                                <div style={{ 
                                    textAlign: 'center',
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ 
                                        fontSize: '32px', 
                                        fontWeight: '700', 
                                        color: getAttendanceColor(course.attendance),
                                        marginBottom: '8px'
                                    }}>
                                        {course.attendance}%
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                        출석률
                                    </div>
                                    {typeof course.attendedSessions === 'number' && typeof course.totalSessions === 'number' && (
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {course.attendedSessions} / {course.totalSessions}회
                                        </div>
                                    )}
                                </div>

                                {/* 시험 성적 정보 */}
                                {course.examStats.totalExams > 0 ? (
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '16px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ 
                                            fontSize: '32px', 
                                            fontWeight: '700', 
                                            color: getScoreColor(course.examStats.averageScore),
                                            marginBottom: '8px'
                                        }}>
                                            {course.examStats.averageScore}%
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                            평균 점수
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {course.examStats.totalExams}회 응시
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '16px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ 
                                            fontSize: '24px', 
                                            fontWeight: '600', 
                                            color: '#9ca3af',
                                            marginBottom: '8px'
                                        }}>
                                            -
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                            평균 점수
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            응시한 시험 없음
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
