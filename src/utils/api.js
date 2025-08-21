// API 기본 설정 (개발: Vite 프록시 /api 사용, 운영: 절대 URL)
const API_BASE_URL = (
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
)
    ? '/api'
    : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api');

// 공통 API 호출 함수
const apiCall = async (endpoint, options = {}) => {
    const apimKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APIM_SUBSCRIPTION_KEY) || '';
    const apimParam = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APIM_SUBSCRIPTION_QUERY_NAME) || 'subscription-key';

    const rawUrl = `${API_BASE_URL}${endpoint}`;
    let url = rawUrl;
    try {
        const u = new URL(rawUrl, (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'));
        if (apimKey && !u.searchParams.has(apimParam)) {
            u.searchParams.set(apimParam, apimKey);
        }
        url = u.toString();
    } catch {
        // URL 구성 실패 시 원본 사용
        url = rawUrl;
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(apimKey ? { 'Ocp-Apim-Subscription-Key': apimKey } : {}),
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
    return apiCall(`/${studentId}/grades`);
};

// 학생 프로필 조회 API
export const fetchStudentProfile = async (studentId) => {
    return apiCall(`/${studentId}/profile`);
};

// 학생 프로필 업데이트 API
export const updateStudentProfile = async (studentId, profileData) => {
    return apiCall(`/${studentId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};

// 출석률 조회 API
export const fetchAttendanceRate = async (studentId, courseId) => {
    return apiCall(`/${studentId}/courses/${courseId}/attendance`);
};

// 과제 성적 조회 API
export const fetchAssignmentGrades = async (studentId, courseId) => {
    return apiCall(`/${studentId}/courses/${courseId}/assignments`);
};

// 시험 성적 조회 API
export const fetchExamGrades = async (studentId, courseId) => {
    return apiCall(`/${studentId}/courses/${courseId}/exams`);
};

// 전체 성적 요약 API
export const fetchGradeSummary = async (studentId) => {
    return apiCall(`/${studentId}/grades/summary`);
};

// 수강 신청 API
export const enrollInClass = async (studentId, classId) => {
    return apiCall('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ studentId, classId }),
    });
};

// 수강 신청 목록 조회 API
export const fetchEnrollments = async (options = {}) => {
    const params = new URLSearchParams();
    if (options.studentId) params.set('studentId', String(options.studentId));
    if (options.classId) params.set('classId', String(options.classId));
    if (options.status) params.set('status', options.status);
    const qs = params.toString();
    const endpoint = `/enrollments${qs ? `?${qs}` : ''}`;
    return apiCall(endpoint);
};

// 여러 강좌 한번에 조회 API
export const fetchClassesBatch = async (classIds) => {
    return apiCall('/classes/batch', {
        method: 'POST',
        body: JSON.stringify(classIds),
    });
};

// 학생 수강 강좌 조회 API (enrollment + batch 기반)
export const fetchStudentClasses = async (studentId, options = {}) => {
    try {
        // 먼저 학생의 수강 신청 목록을 조회
        const enrollments = await fetchEnrollments({ 
            studentId, 
            status: 'ENROLLED' 
        });
        
        if (!enrollments || enrollments.length === 0) {
            return [];
        }
        
        // 수강 신청된 강좌 ID들을 추출
        const classIds = enrollments.map(enrollment => enrollment.classId);
        
        // batch API로 강좌 상세 정보를 한번에 조회
        const classes = await fetchClassesBatch(classIds);
        const validClasses = Array.isArray(classes) ? classes : [];
        
        // 옵션에 따른 필터링
        let filteredClasses = validClasses;
        
        if (options.semester) {
            filteredClasses = filteredClasses.filter(c => c.semester === options.semester);
        }
        
        if (options.active !== undefined) {
            // active 옵션은 현재 학기와 비교하여 처리
            const currentSemester = '2024-2'; // 현재 학기 (실제로는 동적으로 계산)
            if (options.active) {
                filteredClasses = filteredClasses.filter(c => c.semester === currentSemester);
            } else {
                filteredClasses = filteredClasses.filter(c => c.semester !== currentSemester);
            }
        }
        
        return filteredClasses;
    } catch (error) {
        console.error('학생 수강 강좌 조회 실패:', error);
        return [];
    }
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

// 다음 강의 시작 시간 계산 유틸리티 (현재 진행 중인 강의 포함)
export const calculateNextClassTime = (classes, limit = 1) => {
    if (!classes || classes.length === 0) return limit === 1 ? null : [];
    
    const now = new Date();
    const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 현재 시간을 분으로 변환
    
    const dayToNumber = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
    
    // 현재 진행 중인 강의와 곧 시작할 강의들을 분리
    const currentClasses = [];
    const upcomingClasses = [];
    
    classes.forEach(course => {
        if (!course.heldDaysString || !course.startsAt || !course.endsAt) return;
        
        // 요일 문자열을 배열로 변환
        const days = course.heldDaysString.split(',').map(d => d.trim());
        let isCurrentClass = false;
        let minDaysDiff = Infinity;
        let minTimeDiff = Infinity;
        
        days.forEach(day => {
            const dayNumber = dayToNumber[day];
            if (dayNumber === undefined) return;
            
            // 강의 시작/종료 시간을 분으로 변환
            const [startHours, startMinutes] = course.startsAt.split(':').map(Number);
            const [endHours, endMinutes] = course.endsAt.split(':').map(Number);
            const classStartTime = startHours * 60 + startMinutes;
            const classEndTime = endHours * 60 + endMinutes;
            
            // 오늘 진행 중인 강의인지 확인
            if (dayNumber === currentDay) {
                // 수업 10분 전부터 수업 종료 10분 후까지
                const entryStartTime = classStartTime - 10;
                const entryEndTime = classEndTime + 10;
                
                if (currentTime >= entryStartTime && currentTime <= entryEndTime) {
                    isCurrentClass = true;
                }
            }
            
            // 현재 요일과의 차이 계산
            let daysDiff = dayNumber - currentDay;
            if (daysDiff < 0) daysDiff += 7; // 다음 주로 이동
            if (daysDiff === 0 && classStartTime <= currentTime) {
                daysDiff = 7; // 오늘 이미 지난 시간이면 다음 주로
            }
            
            // 가장 가까운 시간 찾기
            if (daysDiff < minDaysDiff || (daysDiff === minDaysDiff && classStartTime < minTimeDiff)) {
                minDaysDiff = daysDiff;
                minTimeDiff = classStartTime;
            }
        });
        
        if (isCurrentClass) {
            currentClasses.push({ ...course, isCurrent: true, daysDiff: 0, timeDiff: 0 });
        } else {
            upcomingClasses.push({ ...course, isCurrent: false, daysDiff: minDaysDiff, timeDiff: minTimeDiff });
        }
    });
    
    // 현재 진행 중인 강의를 먼저 정렬 (시작 시간 순)
    currentClasses.sort((a, b) => {
        const [aHours, aMinutes] = a.startsAt.split(':').map(Number);
        const [bHours, bMinutes] = b.startsAt.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
    
    // 곧 시작할 강의들을 정렬
    upcomingClasses.sort((a, b) => {
        if (a.daysDiff !== b.daysDiff) {
            return a.daysDiff - b.daysDiff;
        }
        return a.timeDiff - b.timeDiff;
    });
    
    // 현재 진행 중인 강의와 곧 시작할 강의를 합치고 limit만큼 반환
    const allClasses = [...currentClasses, ...upcomingClasses].slice(0, limit);
    
    return limit === 1 ? (allClasses[0] || null) : allClasses;
};

// 강좌 등록 API
export const createClass = async (classData) => {
    return apiCall('/classes', {
        method: 'POST',
        body: JSON.stringify(classData),
    });
};

// 사용자 프로필 조회 API
export const fetchUserProfile = async (userId) => {
    return apiCall(`/user-profiles/${userId}`);
};

// 사용자 프로필 수정 API
export const updateUserProfile = async (userId, profileData) => {
    return apiCall(`/user-profiles/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};

// 강좌별 세션 목록 조회 API (기존 apiCall 사용)
export const fetchClassSessions = async (classId) => {
    return apiCall(`/sessions/classes/${classId}`);
};

// 출석 조회 API
export const fetchAttendance = async (studentId, sessionId) => {
    return apiCall(`/attendance/session/${studentId}/${sessionId}`);
};

// 알림 관련 API 베이스 (환경변수)
const NOTIFICATION_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NOTIFICATION_API_URL) || 'http://localhost:8080/notifications-service-http';

// 알림 전송
export const sendNotification = async (notificationData) => {
    const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
};

// 사용자별 알림 목록 조회
export const fetchUserNotifications = async (userId) => {
    const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/user/${userId}`);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
};

// 읽지 않은 알림 개수 조회
export const fetchUnreadNotificationCount = async (userId) => {
    const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/user/${userId}/unread-count`);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
};

// 개별 알림 읽음 처리
export const markNotificationAsRead = async (notificationId) => {
    const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = async (userId) => {
    const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/user/${userId}/read-all`, {
        method: 'PUT'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
};

// 강의 입장 가능 시간 체크 (수업 10분 전 ~ 수업 종료 10분 후)
export const isClassEntryAvailable = (classData) => {
    if (!classData.startsAt || !classData.endsAt) return false;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 현재 시간을 분으로 변환
    
    // 요일 체크
    const dayToNumber = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
    const heldDays = classData.heldDaysString?.split(',').map(d => d.trim()) || [];
    const isToday = heldDays.some(day => dayToNumber[day] === currentDay);
    
    if (!isToday) return false;
    
    // 시간 체크
    const [startHour, startMin] = classData.startsAt.split(':').map(Number);
    const [endHour, endMin] = classData.endsAt.split(':').map(Number);
    const classStartTime = startHour * 60 + startMin;
    const classEndTime = endHour * 60 + endMin;
    
    // 수업 10분 전부터 수업 종료 10분 후까지
    const entryStartTime = classStartTime - 10;
    const entryEndTime = classEndTime + 10;
    
    return currentTime >= entryStartTime && currentTime <= entryEndTime;
};

// 현재 진행 중인 세션 ID 조회
export const fetchCurrentSession = async (classId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/classes/${classId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        // sessionId가 있는지 확인
        if (!data || !data.sessionId) {
            console.log('현재 진행 중인 세션이 없습니다.');
            return null;
        }
        return data;
    } catch (error) {
        console.error('현재 세션 조회 실패:', error);
        return null;
    }
};



// 가장 가까운 미래 세션 찾기
export const findNearestFutureSession = async (classId) => {
    try {
        const sessions = await fetchClassSessions(classId);
        if (!sessions.length) {
            return null;
        }

        const now = new Date();
        let nearestSession = null;
        let minTimeDiff = Infinity;

        for (const session of sessions) {
            const sessionDate = new Date(session.onDate);
            
            // 미래 세션만 고려 (현재 시간보다 이후)
            if (sessionDate > now) {
                const timeDiff = sessionDate.getTime() - now.getTime();
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    nearestSession = session;
                }
            }
        }

        return nearestSession;
    } catch (error) {
        console.error('가장 가까운 미래 세션 찾기 실패:', error);
        return null;
    }
};



// 출석 생성 API
export const createAttendance = async (attendanceData) => {
    try {
        const response = await fetch('https://team02-apim.azure-api.net/student/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attendanceData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('출석 생성 실패:', error);
        throw error;
    }
};

// 시험 정보 조회 API (GET 방식)
export const fetchExamBySessionId = async (sessionId) => {
    console.log('fetchExamBySessionId called with sessionId:', sessionId);
    try {
        const response = await fetch(`https://team02-apim.azure-api.net/test-crud/api/exams?sessionId=${sessionId}`);
        console.log('fetchExamBySessionId response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const exams = await response.json();
        console.log('fetchExamBySessionId response data:', exams);
        // sessionId에 해당하는 시험 중 첫 번째 것을 반환
        return Array.isArray(exams) && exams.length > 0 ? exams[0] : null;
    } catch (error) {
        console.error('시험 정보 조회 실패:', error);
        return null;
    }
};

// 시험 문제 목록 조회 API
export const fetchQuestionsByExamId = async (examId) => {
    try {
        const response = await fetch(`https://team02-apim.azure-api.net/test-crud/api/questions?examId=${examId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const questions = await response.json();
        return Array.isArray(questions) ? questions : [];
    } catch (error) {
        console.error('시험 문제 조회 실패:', error);
        return [];
    }
};

// 시험 제출 데이터 생성 API
export const createSubmission = async (submissionData) => {
    try {
        const response = await fetch('https://team02-apim.azure-api.net/test-crud/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('시험 제출 데이터 생성 실패:', error);
        throw error;
    }
};
