import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../components/common';
import { fetchCurrentSession, fetchExamBySessionId } from '../../utils/api';
import { useStomp } from '../../contexts/StompContext';

// 문제 목록 조회 API
const fetchQuestionsByExamId = async (examId) => {
    try {
        const response = await fetch(`https://team02-apim.azure-api.net/test-crud/api/exams/${examId}/questions`);
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

// 시험 생성 API
const createExam = async (examData) => {
    try {
        console.log('시험 생성 요청 데이터:', examData);
        
        const response = await fetch('https://team02-apim.azure-api.net/test-crud/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(examData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('시험 생성 실패:', error);
        throw error;
    }
};

// 문제 생성 API
const createQuestion = async (examId, questionData) => {
    try {
        console.log('문제 생성 요청 데이터:', { examId, questionData });
        
        const response = await fetch(`https://team02-apim.azure-api.net/test-crud/api/exams/${examId}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('문제 생성 실패:', error);
        throw error;
    }
};

// 강사용 네비게이션 링크
const teacherNavigationLinks = [
    { to: "/teacher", text: "내 강의" },
    { to: "/course-registration", text: "신규 강의 등록" },
    { to: "/teacher/mypage", text: "마이페이지" }
];

export default function ExamCreate() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const teacherId = 2; // 실제 로그인 사용자 ID로 교체 필요
    
    // STOMP 훅 사용
    const { sendMessage, connect, disconnect } = useStomp();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [session, setSession] = useState(null);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [examData, setExamData] = useState({
        name: '',
        difficulty: 'EASY',
        isReady: false
    });

    // 시험 데이터 초기화
    useEffect(() => {
        const initializeExam = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // URL에서 sessionId 파라미터 확인
                const urlParams = new URLSearchParams(location.search);
                const sessionIdFromUrl = urlParams.get('sessionId');
                
                let sessionData;
                if (sessionIdFromUrl) {
                    // URL에서 전달된 sessionId 사용
                    sessionData = { sessionId: parseInt(sessionIdFromUrl) };
                } else {
                    // 현재 세션 정보 조회
                    sessionData = await fetchCurrentSession(classId);
                    if (!sessionData || !sessionData.sessionId) {
                        setError("현재 진행 중인 세션이 없습니다.");
                        return;
                    }
                }
                setSession(sessionData);
                
                // 2. 기존 시험 정보 조회
                const examData = await fetchExamBySessionId(sessionData.sessionId);
                if (examData) {
                    setExam(examData);
                    setExamData({
                        name: examData.name || '',
                        difficulty: examData.difficulty || 'EASY',
                        isReady: examData.isReady || false
                    });
                    
                    // 3. 기존 문제 목록 조회
                    const questionsData = await fetchQuestionsByExamId(examData.id);
                    setQuestions(questionsData || []);
                }
                
            } catch (e) {
                setError("시험 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        
        initializeExam();
    }, [classId, location.search]);



    // 시험 데이터 변경 핸들러
    const handleExamDataChange = (field, value) => {
        setExamData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 시험 준비 완료 알림 전송 (필요할 때만 연결)
    const handleExamReadyNotification = async () => {
        try {
            console.log('🔗 시험 준비 알림을 위한 STOMP 연결...');
            await connect(teacherId);
            
            console.log(`📤 시험 준비 완료 알림 전송: 세션 ${session.sessionId}`);
            sendMessage(`/topic/session/${session.sessionId}`, {
                type: 'EXAM_READY',
                sessionId: session.sessionId,
                examId: exam?.id || 'new',
                message: '시험이 준비되었습니다.',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ 시험 준비 완료 알림 전송 완료');
        } catch (error) {
            console.error('STOMP 연결 실패, API를 통한 알림 전송 시도:', error);
            
            // STOMP 연결 실패 시 API를 통한 대체 알림 전송
            try {
                const response = await fetch('https://team02-apim.azure-api.net/notification/api/notifications/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: session.sessionId,
                        type: 'EXAM_READY',
                        message: '시험이 준비되었습니다.',
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    console.log('✅ API를 통한 시험 준비 알림 전송 완료');
                } else {
                    console.error('API 알림 전송 실패:', response.status);
                }
            } catch (apiError) {
                console.error('API 알림 전송 실패:', apiError);
            }
        } finally {
            console.log('🔌 STOMP 연결 해제...');
            disconnect();
        }
    };

    // 문제 추가
    const handleAddQuestion = () => {
        const newQuestion = {
            id: Date.now(), // 임시 ID
            qtype: 'MCQ',
            body: '',
            choices: JSON.stringify(['', '', '', '']),
            answerKey: '',
            points: 10,
            position: questions.length + 1
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    // 문제 삭제
    const handleDeleteQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    // 문제 데이터 변경
    const handleQuestionChange = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) => 
            i === index ? { ...q, [field]: value } : q
        ));
    };

    // 객관식 선택지 변경
    const handleChoiceChange = (questionIndex, choiceIndex, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i === questionIndex) {
                const choices = JSON.parse(q.choices || '[]');
                choices[choiceIndex] = value;
                return { ...q, choices: JSON.stringify(choices) };
            }
            return q;
        }));
    };

    // 시험 저장 (임시 저장)
    const handleSaveExam = async () => {
        if (!examData.name.trim()) {
            setError("시험 이름을 입력해주세요.");
            return;
        }

        if (questions.length === 0) {
            setError("최소 하나의 문제를 추가해주세요.");
            return;
        }

        // 문제 유효성 검사
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.body.trim()) {
                setError(`${i + 1}번 문제의 내용을 입력해주세요.`);
                return;
            }
            if (q.qtype === 'MCQ') {
                const choices = JSON.parse(q.choices || '[]');
                if (choices.some(choice => !choice.trim())) {
                    setError(`${i + 1}번 문제의 모든 선택지를 입력해주세요.`);
                    return;
                }
            }
            if (!q.answerKey.trim()) {
                setError(`${i + 1}번 문제의 정답을 입력해주세요.`);
                return;
            }
        }

        setSaving(true);
        try {
            // 1. 시험 생성 (임시 저장)
            const examRequestData = {
                sessionId: session.sessionId,
                name: examData.name,
                difficulty: examData.difficulty,
                isReady: false, // 임시 저장이므로 false
                createdBy: teacherId
            };
            
            const createdExam = await createExam(examRequestData);
            console.log('시험 임시 저장 완료:', createdExam);

            // 2. 문제들 생성
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionData = {
                    qtype: q.qtype,
                    body: q.body,
                    choices: q.qtype === 'MCQ' ? q.choices : null, // MCQ일 때만 choices 전송, SHORT일 때는 null
                    answerKey: q.answerKey,
                    points: q.points,
                    position: i + 1
                };
                
                await createQuestion(createdExam.id, questionData);
                console.log(`${i + 1}번 문제 생성 완료`);
            }

            // 임시 저장 성공 메시지
            alert('시험이 임시 저장되었습니다.');
        } catch (error) {
            console.error('시험 저장 실패:', error);
            setError('시험 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    // 최종 수정 (시험 준비 완료)
    const handleFinalSubmit = async () => {
        if (!examData.name.trim()) {
            setError("시험 이름을 입력해주세요.");
            return;
        }

        if (questions.length === 0) {
            setError("최소 하나의 문제를 추가해주세요.");
            return;
        }

        // 문제 유효성 검사
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.body.trim()) {
                setError(`${i + 1}번 문제의 내용을 입력해주세요.`);
                return;
            }
            if (q.qtype === 'MCQ') {
                const choices = JSON.parse(q.choices || '[]');
                if (choices.some(choice => !choice.trim())) {
                    setError(`${i + 1}번 문제의 모든 선택지를 입력해주세요.`);
                    return;
                }
            }
            if (!q.answerKey.trim()) {
                setError(`${i + 1}번 문제의 정답을 입력해주세요.`);
                return;
            }
        }

        setSaving(true);
        try {
            // 1. 시험 생성 (최종 제출)
            const examRequestData = {
                sessionId: session.sessionId,
                name: examData.name,
                difficulty: examData.difficulty,
                isReady: true, // 최종 제출이므로 true
                createdBy: teacherId
            };
            
            const createdExam = await createExam(examRequestData);
            console.log('시험 최종 제출 완료:', createdExam);

            // 2. 문제들 생성
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionData = {
                    qtype: q.qtype,
                    body: q.body,
                    choices: q.qtype === 'MCQ' ? q.choices : null, // MCQ일 때만 choices 전송, SHORT일 때는 null
                    answerKey: q.answerKey,
                    points: q.points,
                    position: i + 1
                };
                
                const createdQuestion = await createQuestion(createdExam.id, questionData);
                console.log(`문제 ${i + 1} 생성 완료:`, createdQuestion);
            }

            // 3. 세션에 시험 준비 완료 알림 전송
            console.log('시험 준비 완료 알림 전송 시도...');
            try {
                await handleExamReadyNotification();
                console.log('✅ 알림 전송 성공');
            } catch (notificationError) {
                console.log('⚠️ 알림 전송 실패, 하지만 시험은 생성됨:', notificationError);
            }

            // 4. 최종 제출 성공 후 목록으로 이동
            alert('시험이 최종 제출되었습니다. 학생들에게 알림이 전송되었습니다.');
            navigate(`/teacher/class/${classId}`);
        } catch (error) {
            console.error('시험 최종 제출 실패:', error);
            setError('시험 최종 제출에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header 
                    navigationLinks={teacherNavigationLinks}
                    notifications={[]}
                    userType="teacher"
                />
                <div className="container">
                    <div className="card">
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ color: 'var(--muted)' }}>시험 정보를 불러오는 중...</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header 
                    navigationLinks={teacherNavigationLinks}
                    notifications={[]}
                    userType="teacher"
                />
                <div className="container">
                    <div className="card" style={{ borderColor: 'var(--warn)' }}>
                        <div style={{ color: 'var(--warn)', textAlign: 'center', padding: '40px' }}>
                            {error}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header 
                navigationLinks={teacherNavigationLinks}
                notifications={[]}
                userType="teacher"
            />
            <div className="container">
                <div className="card" style={{ maxWidth: '1000px', margin: '20px auto' }}>
                    <div style={{ padding: '24px' }}>
                        <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>
                            {exam ? '시험 편집' : '시험 생성'}
                        </h2>

                        {/* 시험 기본 정보 */}
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ marginBottom: '16px' }}>시험 기본 정보</h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        시험 이름 *
                                    </label>
                                    <input
                                        type="text"
                                        value={examData.name}
                                        onChange={(e) => handleExamDataChange('name', e.target.value)}
                                        placeholder="시험 이름을 입력하세요"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        난이도
                                    </label>
                                    <select
                                        value={examData.difficulty}
                                        onChange={(e) => handleExamDataChange('difficulty', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    >
                                        <option value="EASY">쉬움</option>
                                        <option value="MEDIUM">보통</option>
                                        <option value="HARD">어려움</option>
                                    </select>
                                </div>

                                <div style={{ 
                                    padding: '12px', 
                                    backgroundColor: 'var(--hover)', 
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: 'var(--muted)'
                                }}>
                                    💡 시험 준비 완료는 "최종 수정" 버튼을 클릭하면 자동으로 설정됩니다.
                                </div>
                            </div>
                        </div>

                        {/* 문제 목록 */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>문제 목록 ({questions.length}개)</h3>
                                <button 
                                    className="btn"
                                    onClick={handleAddQuestion}
                                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                                >
                                    + 문제 추가
                                </button>
                            </div>

                            {questions.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '40px', 
                                    color: 'var(--muted)',
                                    border: '2px dashed var(--border)',
                                    borderRadius: '8px'
                                }}>
                                    아직 문제가 없습니다. 문제를 추가해주세요.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {questions.map((question, index) => (
                                        <div key={question.id} style={{ 
                                            border: '1px solid var(--border)', 
                                            borderRadius: '8px', 
                                            padding: '20px',
                                            backgroundColor: 'var(--hover)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h4 style={{ margin: 0 }}>문제 {index + 1}</h4>
                                                <button 
                                                    className="btn"
                                                    onClick={() => handleDeleteQuestion(index)}
                                                    style={{ backgroundColor: 'var(--warn)', color: 'white', padding: '8px 12px' }}
                                                >
                                                    삭제
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gap: '16px' }}>
                                                {/* 문제 유형 */}
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                                        문제 유형
                                                    </label>
                                                    <select
                                                        value={question.qtype}
                                                        onChange={(e) => handleQuestionChange(index, 'qtype', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        <option value="MCQ">객관식</option>
                                                        <option value="SHORT">단답식</option>
                                                    </select>
                                                </div>

                                                {/* 문제 내용 */}
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                                        문제 내용 *
                                                    </label>
                                                    <textarea
                                                        value={question.body}
                                                        onChange={(e) => handleQuestionChange(index, 'body', e.target.value)}
                                                        placeholder="문제 내용을 입력하세요"
                                                        style={{
                                                            width: '100%',
                                                            minHeight: '80px',
                                                            padding: '12px',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '8px',
                                                            resize: 'vertical'
                                                        }}
                                                    />
                                                </div>

                                                {/* 객관식 선택지 */}
                                                {question.qtype === 'MCQ' && (
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                                            선택지 *
                                                        </label>
                                                        <div style={{ display: 'grid', gap: '8px' }}>
                                                            {JSON.parse(question.choices || '[]').map((choice, choiceIndex) => (
                                                                <input
                                                                    key={choiceIndex}
                                                                    type="text"
                                                                    value={choice}
                                                                    onChange={(e) => handleChoiceChange(index, choiceIndex, e.target.value)}
                                                                    placeholder={`선택지 ${choiceIndex + 1}`}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 정답 */}
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                                        정답 *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={question.answerKey}
                                                        onChange={(e) => handleQuestionChange(index, 'answerKey', e.target.value)}
                                                        placeholder="정답을 입력하세요"
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                </div>

                                                {/* 배점 */}
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                                        배점
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={question.points}
                                                        onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value) || 0)}
                                                        min="1"
                                                        style={{
                                                            width: '100px',
                                                            padding: '8px',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 저장 버튼 */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate(`/teacher/class/${classId}`)}
                            >
                                취소
                            </button>
                            <button
                                className="btn"
                                onClick={handleSaveExam}
                                disabled={saving}
                                style={{ backgroundColor: 'var(--muted)', color: 'white' }}
                            >
                                {saving ? '저장 중...' : '임시 저장'}
                            </button>
                            <button
                                className="btn"
                                onClick={handleFinalSubmit}
                                disabled={saving}
                                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                            >
                                {saving ? '제출 중...' : '최종 수정'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
