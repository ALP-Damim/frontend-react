import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common";
import { createClass, fetchUserProfile, fetchAllClasses } from "../../utils/api";
import { useUserStomp } from "../../hooks/useUserStomp";

// 하드코딩된 알림 데이터
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 학생이 웹 개발 입문 강의에 신청했습니다.", time: "1시간 전", read: false },
    { id: 3, message: "머신러닝 기초 과제 제출이 완료되었습니다.", time: "2시간 전", read: true },
    { id: 4, message: "알고리즘 문제 풀이 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

// 강사용 네비게이션 링크 설정
const teacherNavigationLinks = [
    { to: "/teacher", text: "내 강의" },
    { to: "/course-registration", text: "신규 강의 등록" },
    { to: "/teacher/mypage", text: "마이페이지" }
];

// 요일 비트마스크 매핑
const DAY_MASKS = {
    '월': 1,
    '화': 2,
    '수': 4,
    '목': 8,
    '금': 16,
    '토': 32,
    '일': 64
};

export default function CourseRegistration() {
    const navigate = useNavigate();
    const teacherId = 9; // 강사 ID 고정
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(teacherId);
    
    // 강사의 현재 강의 목록
    const [myClasses, setMyClasses] = useState([]);
    const [classesLoading, setClassesLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        className: '',
        schoolYear: '',
        subject: '',
        zoomUrl: '',
        startsAt: '',
        endsAt: '',
        capacity: 30
    });
    
    const [selectedDays, setSelectedDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 사용자 프로필 조회
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setProfileLoading(true);
                const profile = await fetchUserProfile(teacherId);
                setTeacherProfile(profile);
            } catch (e) {
                console.error("프로필 조회 실패:", e);
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfile();
    }, [teacherId]);

    // 강사의 현재 강의 목록 조회
    useEffect(() => {
        const loadMyClasses = async () => {
            try {
                setClassesLoading(true);
                const classes = await fetchAllClasses({ teacherId });
                setMyClasses(Array.isArray(classes) ? classes : []);
            } catch (e) {
                console.error("강의 목록 조회 실패:", e);
            } finally {
                setClassesLoading(false);
            }
        };
        loadMyClasses();
    }, [teacherId]);

    // 요일 선택 토글
    const toggleDay = (day) => {
        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    // 요일 비트마스크 계산
    const calculateHeldDay = () => {
        return selectedDays.reduce((sum, day) => sum + DAY_MASKS[day], 0);
    };

    // 시간 충돌 검사 함수
    const hasTimeConflict = (newDays, newStartTime, newEndTime) => {
        if (!newDays || newDays.length === 0 || !newStartTime || !newEndTime) {
            return false;
        }

        return myClasses.some(myClass => {
            if (!myClass.heldDaysString || !myClass.startsAt || !myClass.endsAt) {
                return false;
            }

            const myDays = myClass.heldDaysString.split(',').map(d => d.trim());
            
            // 요일이 겹치는지 확인
            const hasDayOverlap = newDays.some(newDay => myDays.includes(newDay));
            
            if (!hasDayOverlap) {
                return false;
            }

            // 시간이 겹치는지 확인
            const myStartTime = myClass.startsAt;
            const myEndTime = myClass.endsAt;

            // 시간 겹침 조건: (새강의 시작 < 기존강의 끝) && (새강의 끝 > 기존강의 시작)
            return (newStartTime < myEndTime) && (newEndTime > myStartTime);
        });
    };

    // 현재 입력된 정보로 시간 충돌 확인
    const currentTimeConflict = hasTimeConflict(
        selectedDays,
        formData.startsAt + ':00',
        formData.endsAt + ':00'
    );

    // 폼 데이터 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 유효성 검사
        if (!formData.className.trim()) {
            setError("강좌명을 입력해주세요.");
            return;
        }
        
        if (!formData.schoolYear) {
            setError("학년을 선택해주세요.");
            return;
        }
        
        if (!formData.subject) {
            setError("과목을 선택해주세요.");
            return;
        }
        
        if (selectedDays.length === 0) {
            setError("요일을 선택해주세요.");
            return;
        }
        
        if (!formData.startsAt || !formData.endsAt) {
            setError("시작 시간과 종료 시간을 입력해주세요.");
            return;
        }
        
        if (formData.startsAt >= formData.endsAt) {
            setError("종료 시간은 시작 시간보다 늦어야 합니다.");
            return;
        }

        // 시간 충돌 검사
        if (currentTimeConflict) {
            setError("기존 강의와 시간이 겹칩니다. 다른 시간을 선택해주세요.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const classData = {
                teacherId,
                teacherName: teacherProfile?.name || "강사",
                className: formData.className.trim(),
                semester: '2025-2', // 강제로 2025-2 선택
                schoolYear: formData.schoolYear,
                subject: formData.subject,
                zoomUrl: formData.zoomUrl.trim() || null,
                heldDay: calculateHeldDay(),
                startsAt: formData.startsAt + ':00',
                endsAt: formData.endsAt + ':00',
                capacity: parseInt(formData.capacity) || 30
            };
            
            const result = await createClass(classData);
            
            if (result) {
                alert("강좌가 성공적으로 등록되었습니다!");
                navigate('/teacher');
            }
        } catch (e) {
            setError("강좌 등록에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header 
                navigationLinks={teacherNavigationLinks}
                notifications={notifications}
                onLogout={handleLogout}
                userType="teacher"
            />
            <div className="container">
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: 6, color: 'var(--accent)' }}>신규 강의 등록</h1>
                    </div>



                    {error && (
                        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warn)' }}>
                            <div style={{ color: 'var(--warn)' }}>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="card">
                        {/* 강좌명 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                강좌명 *
                            </label>
                            <input
                                type="text"
                                name="className"
                                value={formData.className}
                                onChange={handleInputChange}
                                placeholder="강좌명을 입력하세요"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                required
                            />
                        </div>

                        {/* 강사명 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                강사명 *
                            </label>
                            <input
                                type="text"
                                name="teacherName"
                                value={profileLoading ? '프로필 불러오는 중...' : (teacherProfile?.name || '')}
                                disabled={true}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--hover)' }}
                                required
                            />
                        </div>

                        {/* 학년 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                학년 *
                            </label>
                            <select
                                name="schoolYear"
                                value={formData.schoolYear}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                required
                            >
                                <option value="">학년 선택</option>
                                <option value="1">1학년</option>
                                <option value="2">2학년</option>
                                <option value="3">3학년</option>
                                <option value="4">4학년</option>
                                <option value="5">5학년</option>
                                <option value="6">6학년</option>
                            </select>
                        </div>

                        {/* 과목 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                과목 *
                            </label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                required
                            >
                                <option value="">과목 선택</option>
                                <option value="국어">국어</option>
                                <option value="수학">수학</option>
                                <option value="영어">영어</option>
                                <option value="사회">사회</option>
                                <option value="과학">과학</option>
                                <option value="체육">체육</option>
                                <option value="음악">음악</option>
                                <option value="미술">미술</option>
                                <option value="도덕">도덕</option>
                                <option value="실과">실과</option>
                                <option value="컴퓨터">컴퓨터</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>

                        {/* 요일 선택 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                요일 *
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {Object.keys(DAY_MASKS).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={selectedDays.includes(day) ? 'btn' : 'btn btn-outline'}
                                        style={{ minWidth: '60px' }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            {selectedDays.length > 0 && (
                                <div style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '14px' }}>
                                    선택된 요일: {selectedDays.join(', ')}
                                </div>
                            )}
                        </div>

                        {/* 시간 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    시작 시간 *
                                </label>
                                <select
                                    name="startsAt"
                                    value={formData.startsAt}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    required
                                >
                                    <option value="">시작 시간 선택</option>
                                    {Array.from({ length: 144 }, (_, i) => {
                                        const hour = Math.floor(i / 6); // 0시부터 23시까지
                                        const minute = (i % 6) * 10; // 0분, 10분, 20분, 30분, 40분, 50분
                                        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                        return (
                                            <option key={timeString} value={timeString}>
                                                {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    종료 시간 *
                                </label>
                                <select
                                    name="endsAt"
                                    value={formData.endsAt}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    required
                                >
                                    <option value="">종료 시간 선택</option>
                                    {Array.from({ length: 144 }, (_, i) => {
                                        const hour = Math.floor(i / 6); // 0시부터 23시까지
                                        const minute = (i % 6) * 10; // 0분, 10분, 20분, 30분, 40분, 50분
                                        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                        return (
                                            <option key={timeString} value={timeString}>
                                                {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* 시간 충돌 경고 */}
                        {currentTimeConflict && selectedDays.length > 0 && formData.startsAt && formData.endsAt && (
                            <div style={{ marginBottom: '20px' }}>
                                <div className="card" style={{ borderColor: 'var(--warn)', backgroundColor: '#fef2f2' }}>
                                    <div style={{ color: 'var(--warn)', fontWeight: '600', marginBottom: '8px' }}>
                                        ⚠️ 시간 충돌 감지
                                    </div>
                                    <div style={{ color: 'var(--warn)', fontSize: '14px' }}>
                                        선택한 요일과 시간이 기존 강의와 겹칩니다. 다른 시간을 선택해주세요.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Zoom URL */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Zoom URL (선택)
                            </label>
                            <input
                                type="url"
                                name="zoomUrl"
                                value={formData.zoomUrl}
                                onChange={handleInputChange}
                                placeholder="https://zoom.us/j/..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {/* 수용 인원 */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                수용 인원 (선택)
                            </label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleInputChange}
                                min="1"
                                max="100"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="submit"
                                className="btn"
                                disabled={loading || currentTimeConflict}
                                style={{ flex: 1 }}
                                title={currentTimeConflict ? "시간 충돌이 발생했습니다. 다른 시간을 선택해주세요." : ""}
                            >
                                {loading ? '등록 중...' : '강좌 등록'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/teacher')}
                                style={{ flex: 1 }}
                            >
                                취소
                            </button>
                        </div>
                        
                        {/* 버튼 상태 안내 메시지 */}
                        {currentTimeConflict && (
                            <div style={{ 
                                marginTop: '8px', 
                                padding: '8px 12px', 
                                backgroundColor: 'var(--hover)', 
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: 'var(--muted)',
                                textAlign: 'center'
                            }}>
                                ⚠️ 시간 충돌로 인해 등록 버튼이 비활성화되었습니다.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
