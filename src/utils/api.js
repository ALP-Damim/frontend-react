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
