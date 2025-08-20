import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Header } from "../../components/common";
import { fetchStudentClasses, fetchAllClasses, formatTimeToMinutes } from "../../utils/api";

// 상단바 알림 (공통)
const notifications = [
    { id: 1, message: "데이터 분석 실전 강의가 30분 후에 시작됩니다.", time: "5분 전", read: false },
    { id: 2, message: "새로운 강의 'React 실전 프로젝트'가 등록되었습니다.", time: "1시간 전", read: false },
    { id: 3, message: "웹 개발 입문 과제 제출 마감이 임박했습니다.", time: "2시간 전", read: true },
    { id: 4, message: "머신러닝 기초 강의 자료가 업데이트되었습니다.", time: "1일 전", read: true },
];

const studentNavigationLinks = [
    { to: "/student/courses", text: "내강의" },
    { to: "/course-application", text: "강의신청" },
    { to: "/mypage", text: "마이페이지" }
];

// 요일 비트마스크 유틸
const DAY = { MON:1, TUE:2, WED:4, THU:8, FRI:16, SAT:32, SUN:64 };

export default function CourseApplication(){
    const studentId = 11; // TODO: auth 연동 시 대체

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
    }, []);

    const loadPage = useCallback(async (reset = false, overrides = {}) => {
        if (loading) return;
        try {
            setLoading(true);
            setError(null);
            const cursor = reset ? 0 : startId;
            const effDayMask = Object.prototype.hasOwnProperty.call(overrides, 'dayMask') ? overrides.dayMask : dayMask;

            // 즉시 목록 비우기 (reset 호출시)
            if (reset) {
                setItems([]);
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
        } catch (e) {
            setError('강좌 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [LIMIT, startId, dayMask, loading]);

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
                    loadPage(false);
                }
            });
        }, { threshold: 1.0 });
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, loading, loadPage]);

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
        // dayMask를 0으로 강제하여 즉시 재조회
        loadPage(true, { dayMask: 0 });
    };

    return (
        <>
            <Header navigationLinks={studentNavigationLinks} notifications={notifications} />
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
                                ) : (
                                    <button className="btn">신청</button>
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


