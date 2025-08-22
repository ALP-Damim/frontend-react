import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Header } from "../../components/common";
import { fetchStudentClasses, fetchAllClasses, formatTimeToMinutes, enrollInClass } from "../../utils/api";
import { useUserStomp } from "../../hooks/useUserStomp";

const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

// 요일 비트마스크 유틸
const DAY = { MON:1, TUE:2, WED:4, THU:8, FRI:16, SAT:32, SUN:64 };

export default function CourseApplication(){
    const studentId = 26; // TODO: auth 연동 시 대체
    
    // STOMP 연결 관리
    const { handleLogout } = useUserStomp(studentId);

    // 나의 수강중 강좌
    const [myClasses, setMyClasses] = useState([]);
    const myClassIdSet = useMemo(() => new Set((myClasses || []).map(c => c.classId)), [myClasses]);

    // 전체 강좌 리스트 (무한 스크롤)
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [startId, setStartId] = useState(0); // cursor
    const LIMIT = 20;

    // 필터 상태 (학기 정렬 비활성화)
    const [dayMask, setDayMask] = useState(0); // 0=전체
    
    // 재시도 관련 상태
    const [retryCount, setRetryCount] = useState(0);
    const [lastRetryTime, setLastRetryTime] = useState(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000; // 3초
    
    // 신청 상태 관리
    const [enrollingClassId, setEnrollingClassId] = useState(null);
    const [enrollmentError, setEnrollmentError] = useState(null);
    const [enrollmentSuccess, setEnrollmentSuccess] = useState(null);

    const observerRef = useRef(null);

    useEffect(() => {
        // 내 수강 강좌 로드
        (async () => {
            try {
                const data = await fetchStudentClasses(studentId);
                setMyClasses(Array.isArray(data) ? data : []);
            } catch (e) {
                // 내 목록 실패해도 전체 강좌 조회는 계속
                console.error(e);
            }
        })();
    }, [studentId]);

    const loadPage = useCallback(async (reset = false, overrides = {}) => {
        if (loading) return;
        
        // 재시도 제한 확인
        const now = Date.now();
        if (retryCount >= MAX_RETRIES && (now - lastRetryTime) < RETRY_DELAY) {
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const cursor = reset ? 0 : startId;
            const effDayMask = Object.prototype.hasOwnProperty.call(overrides, 'dayMask') ? overrides.dayMask : dayMask;

            // 즉시 목록 비우기 (reset 호출시)
            if (reset) {
                setItems([]);
                setRetryCount(0); // reset 시 재시도 카운트 초기화
            }

            // 학기 정렬 파라미터는 당분간 사용하지 않음
            const data = await fetchAllClasses({ limit: LIMIT, startId: cursor, day: effDayMask || undefined });
            const list = Array.isArray(data) ? data : [];
            setItems(prev => reset ? list : [...prev, ...list]);
            setHasMore(list.length === LIMIT);
            if (list.length > 0) {
                const maxId = Math.max(...list.map(x => Number(x.classId) || 0));
                setStartId(maxId + 1);
            }
            
            // 성공 시 재시도 카운트 초기화
            setRetryCount(0);
        } catch (e) {
            setRetryCount(prev => prev + 1);
            setLastRetryTime(now);
            
            if (retryCount >= MAX_RETRIES) {
                setError(`강좌 목록을 불러오지 못했습니다. (${MAX_RETRIES}회 시도 후 실패)`);
            } else {
                setError(`강좌 목록을 불러오지 못했습니다. (${retryCount + 1}/${MAX_RETRIES})`);
            }
        } finally {
            setLoading(false);
        }
    }, [LIMIT, startId, dayMask, loading, retryCount, lastRetryTime, MAX_RETRIES, RETRY_DELAY]);

    // 필터 변경 시 초기화 후 재조회 (학기 정렬 비활성화)
    useEffect(() => {
        setStartId(0);
        loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayMask]);

    // 인터섹션 옵저버로 무한 스크롤
    useEffect(() => {
        if (!observerRef.current) return;
        const el = observerRef.current;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasMore && !loading) {
                    // 재시도 제한 확인
                    const now = Date.now();
                    if (retryCount >= MAX_RETRIES && (now - lastRetryTime) < RETRY_DELAY) {
                        return;
                    }
                    loadPage(false);
                }
            });
        }, { threshold: 1.0 });
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, loading, loadPage, retryCount, lastRetryTime, MAX_RETRIES, RETRY_DELAY]);

    const toggleDay = (mask) => {
        setStartId(0);
        setItems([]);
        setHasMore(true);
        setDayMask(prev => {
            const next = (prev & mask) ? (prev & ~mask) : (prev | mask);
            // 즉시 재조회 (현재 정렬 유지)
            loadPage(true, { dayMask: next });
            return next;
        });
    };

    // 학기 정렬 토글 비활성화 (주석 처리)
    // const [semesterOrder, setSemesterOrder] = useState(undefined); // 'asc' | 'desc' | undefined
    // const toggleSemesterOrder = () => {
    //     const next = semesterOrder === 'desc' ? 'asc' : 'desc';
    //     setSemesterOrder(next);
    //     setOffset(0);
    //     setItems([]);
    //     setHasMore(true);
    //     loadPage(true, { semesterOrder: next });
    // };

    const resetFilters = () => {
        setDayMask(0);
        setStartId(0);
        setItems([]);
        setHasMore(true);
        setRetryCount(0); // 필터 초기화 시 재시도 카운트도 초기화
        // dayMask를 0으로 강제하여 즉시 재조회
        loadPage(true, { dayMask: 0 });
    };

    // 시간 충돌 검사 함수
    const hasTimeConflict = (newClass) => {
        if (!newClass || !newClass.heldDaysString || !newClass.startsAt || !newClass.endsAt) {
            return false;
        }

        const newDays = newClass.heldDaysString.split(',').map(d => d.trim());
        const newStartTime = newClass.startsAt;
        const newEndTime = newClass.endsAt;

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

    // 강의 신청 핸들러
    const handleEnroll = async (classId) => {
        try {
            setEnrollingClassId(classId);
            setEnrollmentError(null);
            setEnrollmentSuccess(null);
            
            await enrollInClass(studentId, classId);
            
            // 성공 시 로컬 상태에 추가 (API 재호출 없이)
            const enrolledClass = items.find(c => c.classId === classId);
            if (enrolledClass) {
                setMyClasses(prev => [...prev, enrolledClass]);
            }
            
            setEnrollmentSuccess('강의 신청이 완료되었습니다!');
            
            // 3초 후 성공 메시지 제거
            setTimeout(() => {
                setEnrollmentSuccess(null);
            }, 3000);
            
        } catch (error) {
            console.error('강의 신청 실패:', error);
            setEnrollmentError('강의 신청에 실패했습니다. 다시 시도해주세요.');
            
            // 5초 후 에러 메시지 제거
            setTimeout(() => {
                setEnrollmentError(null);
            }, 5000);
        } finally {
            setEnrollingClassId(null);
        }
    };

    return (
        <>
            <Header 
                navigationLinks={studentNavigationLinks} 
                notifications={[]}
                onLogout={handleLogout}
                userType="student"
            />
            <div className="container">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div>
                        <h2 className="section-title">강의 신청</h2>
                        <div style={{ color:'var(--muted)', fontSize:13 }}>전체 강좌를 탐색하고 신청하세요</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                        {/* 학기 정렬 비활성화
                        <button className={`${semesterOrder==='desc' ? 'btn' : 'btn btn-outline'}`} onClick={toggleSemesterOrder}>
                            학기 {semesterOrder==='desc' ? '내림차순' : '오름차순'}
                        </button>
                        */}
                        <button className="btn btn-outline" onClick={resetFilters}>필터 초기화</button>
                    </div>
                </div>

                {/* STOMP 연결 상태 표시 */}


                {/* 요일 필터 */}
                <div className="card" style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        <button className={`${(dayMask & DAY.MON) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.MON)}>월</button>
                        <button className={`${(dayMask & DAY.TUE) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.TUE)}>화</button>
                        <button className={`${(dayMask & DAY.WED) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.WED)}>수</button>
                        <button className={`${(dayMask & DAY.THU) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.THU)}>목</button>
                        <button className={`${(dayMask & DAY.FRI) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.FRI)}>금</button>
                        <button className={`${(dayMask & DAY.SAT) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.SAT)}>토</button>
                        <button className={`${(dayMask & DAY.SUN) ? 'btn' : 'btn btn-outline'}`} onClick={() => toggleDay(DAY.SUN)}>일</button>
                    </div>
                </div>

                {error && (
                    <div className="card" style={{ marginBottom: 16, borderColor:'var(--warn)' }}>
                        <div style={{ color:'var(--warn)' }}>{error}</div>
                        {retryCount >= MAX_RETRIES && (
                            <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--muted)' }}>
                                잠시 후 다시 시도해주세요.
                            </div>
                        )}
                    </div>
                )}

                {/* 신청 결과 메시지 */}
                {enrollmentError && (
                    <div className="card" style={{ marginBottom: 16, borderColor:'var(--warn)', backgroundColor: '#fef2f2' }}>
                        <div style={{ color:'var(--warn)' }}>{enrollmentError}</div>
                    </div>
                )}
                
                {enrollmentSuccess && (
                    <div className="card" style={{ marginBottom: 16, borderColor:'var(--success)', backgroundColor: '#f0fdf4' }}>
                        <div style={{ color:'var(--success)' }}>{enrollmentSuccess}</div>
                    </div>
                )}

                {/* 전체 강좌 리스트 */}
                <div className="grid">
                    {items.map(c => (
                        <div key={`${c.classId}`} className="card">
                            <div className="course-title" style={{ marginTop: 6 }}>{c.className}</div>
                            <div className="course-info" style={{ marginTop: 6 }}>
                                {c.teacherName} · {c.heldDaysString} · {formatTimeToMinutes(c.startsAt)}~{formatTimeToMinutes(c.endsAt)}
                            </div>
                            <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
                                {myClassIdSet.has(c.classId) ? (
                                    <span className="badge">이미 수강중</span>
                                ) : hasTimeConflict(c) ? (
                                    <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                        시간 충돌
                                    </span>
                                ) : (
                                    <button 
                                        className="btn" 
                                        onClick={() => handleEnroll(c.classId)}
                                        disabled={enrollingClassId === c.classId}
                                    >
                                        {enrollingClassId === c.classId ? '신청 중...' : '신청'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 로딩/더보기/끝 */}
                <div style={{ display:'flex', justifyContent:'center', marginTop:16 }}>
                    {loading && <div className="card">불러오는 중...</div>}
                </div>
                <div ref={observerRef} style={{ height: 1 }} />
                {!hasMore && !loading && items.length > 0 && (
                    <div style={{ textAlign:'center', color:'var(--muted)', marginTop:12 }}>마지막 강좌까지 확인했습니다.</div>
                )}
            </div>
        </>
    );
}


