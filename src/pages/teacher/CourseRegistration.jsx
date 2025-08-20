import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common";
import { createClass, fetchUserProfile } from "../../utils/api";

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
    const teacherId = 1; // 강사 ID 고정
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        className: '',
        semester: '2024-2',
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

        try {
            setLoading(true);
            setError(null);
            
            const classData = {
                teacherId,
                teacherName: teacherProfile?.name || "강사",
                className: formData.className.trim(),
                semester: formData.semester,
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

                        {/* 학기 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                학기 *
                            </label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                <option value="2024-1">2024-1</option>
                                <option value="2024-2">2024-2</option>
                                <option value="2025-1">2025-1</option>
                                <option value="2025-2">2025-2</option>
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
                                <input
                                    type="time"
                                    name="startsAt"
                                    value={formData.startsAt}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    종료 시간 *
                                </label>
                                <input
                                    type="time"
                                    name="endsAt"
                                    value={formData.endsAt}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>
                        </div>

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
                                disabled={loading}
                                style={{ flex: 1 }}
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
                    </form>
                </div>
            </div>
        </>
    );
}
