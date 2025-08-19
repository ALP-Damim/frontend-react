import { useState, useEffect } from "react";

// API 호출 함수 (실제 API 엔드포인트로 교체 필요)
const fetchProfile = async () => {
    try {
        // 실제 API 호출 시에는 아래 주석을 해제하고 실제 엔드포인트로 교체
        // const response = await fetch('/api/student/profile');
        // const data = await response.json();
        // return data;
        
        // 임시 데이터 (API 연동 전까지 사용)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: "홍길동",
                    email: "hong@example.com",
                    studentId: "2024001",
                    phone: "010-1234-5678",
                    birthday: "1995-03-15",
                    major: "컴퓨터공학과",
                    grade: "3학년",
                    address: "서울시 강남구 테헤란로 123",
                    emergencyContact: {
                        name: "홍부모",
                        relationship: "부모",
                        phone: "010-9876-5432"
                    }
                });
            }, 500);
        });
    } catch (error) {
        console.error('프로필 데이터 조회 실패:', error);
        throw error;
    }
};

const updateProfile = async (profileData) => {
    try {
        // 실제 API 호출 시에는 아래 주석을 해제하고 실제 엔드포인트로 교체
        // const response = await fetch('/api/student/profile', {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(profileData)
        // });
        // const data = await response.json();
        // return data;
        
        // 임시 응답 (API 연동 전까지 사용)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: '프로필이 성공적으로 업데이트되었습니다.' });
            }, 1000);
        });
    } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        throw error;
    }
};

export function ProfileTab() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await fetchProfile();
                setProfile(data);
                setFormData(data);
            } catch (err) {
                setError('프로필 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmergencyContactChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            emergencyContact: {
                ...prev.emergencyContact,
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            
            await updateProfile(formData);
            setProfile(formData);
            setIsEditing(false);
            setSuccess('프로필이 성공적으로 업데이트되었습니다.');
        } catch (err) {
            setError('프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(profile);
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '18px', color: 'var(--muted)' }}>프로필 데이터를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div>
            {/* 알림 메시지 */}
            {error && (
                <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '8px',
                    color: '#dc2626',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}
            
            {success && (
                <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '8px',
                    color: '#16a34a',
                    marginBottom: '16px'
                }}>
                    {success}
                </div>
            )}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="section-title">개인 정보</h2>
                    {!isEditing ? (
                        <button 
                            className="btn" 
                            onClick={() => setIsEditing(true)}
                        >
                            수정하기
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                className="btn btn-outline" 
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                취소
                            </button>
                            <button 
                                className="btn" 
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* 기본 정보 */}
                    <div>
                        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>기본 정보</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="label">이름</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            
                            <div>
                                <label className="label">이메일</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            
                            <div>
                                <label className="label">학번</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.studentId || ''}
                                    disabled={true}
                                    style={{ backgroundColor: 'var(--hover)' }}
                                />
                            </div>
                            
                            <div>
                                <label className="label">전화번호</label>
                                <input
                                    type="tel"
                                    className="input"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="010-1234-5678"
                                />
                            </div>
                            
                            <div>
                                <label className="label">생년월일</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.birthday || ''}
                                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 학적 정보 */}
                    <div>
                        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>학적 정보</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="label">학과</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.major || ''}
                                    disabled={true}
                                    style={{ backgroundColor: 'var(--hover)' }}
                                />
                            </div>
                            
                            <div>
                                <label className="label">학년</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.grade || ''}
                                    disabled={true}
                                    style={{ backgroundColor: 'var(--hover)' }}
                                />
                            </div>
                            
                            <div>
                                <label className="label">주소</label>
                                <textarea
                                    className="input"
                                    value={formData.address || ''}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    disabled={!isEditing}
                                    rows={3}
                                    placeholder="주소를 입력하세요"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 비상 연락처 */}
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>비상 연락처</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">이름</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.emergencyContact?.name || ''}
                                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                                disabled={!isEditing}
                            />
                        </div>
                        
                        <div>
                            <label className="label">관계</label>
                            <select
                                className="input"
                                value={formData.emergencyContact?.relationship || ''}
                                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                                disabled={!isEditing}
                            >
                                <option value="">관계 선택</option>
                                <option value="부모">부모</option>
                                <option value="배우자">배우자</option>
                                <option value="형제/자매">형제/자매</option>
                                <option value="친구">친구</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="label">전화번호</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.emergencyContact?.phone || ''}
                                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                                disabled={!isEditing}
                                placeholder="010-9876-5432"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
