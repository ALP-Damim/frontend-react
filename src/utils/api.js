// API 기본 설정 (Vite 환경 변수 사용)
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

// 공통 API 호출 함수
const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // 인증 토큰이 있다면 여기에 추가
            // 'Authorization': `Bearer ${getToken()}`,
        },
        ...options,
    };

    try {
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
};

// 학생 성적 조회 API
export const fetchStudentGrades = async (studentId) => {
    return apiCall(`/student/${studentId}/grades`);
};

// 학생 프로필 조회 API
export const fetchStudentProfile = async (studentId) => {
    return apiCall(`/student/${studentId}/profile`);
};

// 학생 프로필 업데이트 API
export const updateStudentProfile = async (studentId, profileData) => {
    return apiCall(`/student/${studentId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};

// 출석률 조회 API
export const fetchAttendanceRate = async (studentId, courseId) => {
    return apiCall(`/student/${studentId}/courses/${courseId}/attendance`);
};

// 과제 성적 조회 API
export const fetchAssignmentGrades = async (studentId, courseId) => {
    return apiCall(`/student/${studentId}/courses/${courseId}/assignments`);
};

// 시험 성적 조회 API
export const fetchExamGrades = async (studentId, courseId) => {
    return apiCall(`/student/${studentId}/courses/${courseId}/exams`);
};

// 전체 성적 요약 API
export const fetchGradeSummary = async (studentId) => {
    return apiCall(`/student/${studentId}/grades/summary`);
};

// 학생 수강 강좌 조회 API (semester, active, nearestOnly 지원)
export const fetchStudentClasses = async (studentId, options = {}) => {
    const params = new URLSearchParams();
    if (options.semester) params.set('semester', options.semester);
    if (options.active) params.set('active', String(options.active));
    if (options.nearestOnly) params.set('nearestOnly', 'true');
    const qs = params.toString();
    const endpoint = `/students/${studentId}/classes${qs ? `?${qs}` : ''}`;
    return apiCall(endpoint);
};

// 클래스별 출석률 조회 API (백엔드 스펙: /api/attendance/class/{student_id}/{class_id})
export const fetchClassAttendance = async (studentId, classId) => {
    return apiCall(`/attendance/class/${studentId}/${classId}`);
};

// 전체 강좌 조회 API (limit, semesterOrder, day, offset, teacherId 지원)
export const fetchAllClasses = async (options = {}) => {
    const params = new URLSearchParams();
    if (typeof options.limit === 'number') params.set('limit', String(options.limit));
    if (options.semesterOrder) params.set('semesterOrder', options.semesterOrder);
    if (typeof options.day === 'number' && options.day > 0) params.set('day', String(options.day));
    if (typeof options.offset === 'number' && options.offset > 0) params.set('offset', String(options.offset)); // legacy
    if (typeof options.startId === 'number' && options.startId > 0) params.set('startId', String(options.startId));
    if (typeof options.teacherId === 'number' && options.teacherId > 0) params.set('teacherId', String(options.teacherId));
    const qs = params.toString();
    const endpoint = `/classes${qs ? `?${qs}` : ''}`;
    return apiCall(endpoint);
};

// 에러 처리 유틸리티
export const handleApiError = (error) => {
    if (error.message.includes('401')) {
        // 인증 오류 처리
        return '로그인이 필요합니다.';
    } else if (error.message.includes('403')) {
        // 권한 오류 처리
        return '접근 권한이 없습니다.';
    } else if (error.message.includes('404')) {
        // 데이터 없음 처리
        return '요청한 데이터를 찾을 수 없습니다.';
    } else if (error.message.includes('500')) {
        // 서버 오류 처리
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else {
        // 기타 오류 처리
        return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
};

// 로딩 상태 관리를 위한 유틸리티
export const withLoading = async (asyncFunction, setLoading, setError) => {
    try {
        setLoading(true);
        setError(null);
        const result = await asyncFunction();
        return result;
    } catch (error) {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        throw error;
    } finally {
        setLoading(false);
    }
};

// 시간 포맷팅 유틸리티 (초단위 -> 분단위)
export const formatTimeToMinutes = (timeString) => {
    if (!timeString) return '--:--';
    
    // HH:MM:SS 형식인 경우 HH:MM으로 변환
    if (timeString.includes(':')) {
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
    }
    
    return timeString;
};

// 다음 강의 시작 시간 계산 유틸리티
export const calculateNextClassTime = (classes, limit = 1) => {
    if (!classes || classes.length === 0) return limit === 1 ? null : [];
    
    const now = new Date();
    const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 현재 시간을 분으로 변환
    
    const dayToNumber = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
    
    // 모든 강의의 다음 시작 시간까지의 거리 계산
    const classesWithDistance = classes
        .map(course => {
            if (!course.heldDaysString || !course.startsAt) return null;
            
            // 요일 문자열을 배열로 변환
            const days = course.heldDaysString.split(',').map(d => d.trim());
            let minDaysDiff = Infinity;
            let minTimeDiff = Infinity;
            
            days.forEach(day => {
                const dayNumber = dayToNumber[day];
                if (dayNumber === undefined) return;
                
                // 강의 시작 시간을 분으로 변환
                const [hours, minutes] = course.startsAt.split(':').map(Number);
                const classTime = hours * 60 + minutes;
                
                // 현재 요일과의 차이 계산
                let daysDiff = dayNumber - currentDay;
                if (daysDiff < 0) daysDiff += 7; // 다음 주로 이동
                if (daysDiff === 0 && classTime <= currentTime) {
                    daysDiff = 7; // 오늘 이미 지난 시간이면 다음 주로
                }
                
                // 가장 가까운 시간 찾기
                if (daysDiff < minDaysDiff || (daysDiff === minDaysDiff && classTime < minTimeDiff)) {
                    minDaysDiff = daysDiff;
                    minTimeDiff = classTime;
                }
            });
            
            return { ...course, daysDiff: minDaysDiff, timeDiff: minTimeDiff };
        })
        .filter(course => course && course.daysDiff !== Infinity)
        .sort((a, b) => {
            if (a.daysDiff !== b.daysDiff) {
                return a.daysDiff - b.daysDiff;
            }
            return a.timeDiff - b.timeDiff;
        })
        .slice(0, limit);
    
    return limit === 1 ? (classesWithDistance[0] || null) : classesWithDistance;
};
