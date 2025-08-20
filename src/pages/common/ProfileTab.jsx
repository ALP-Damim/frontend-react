import { useState, useEffect } from "react";
import { fetchUserProfile, updateUserProfile } from "../../utils/api";

// 기본 사용자 ID (props로 받지 않으면 기본값 사용)
const defaultUserId = 11;

const updateProfile = async (profileData, userId) => {
    try {
        // API 요청 형식에 맞게 데이터 변환
        const apiData = {
            name: profileData.name,
            desiredCourse: profileData.desiredCourse,
            desiredJob: profileData.desiredJob,
            birthDate: profileData.birthday,
            school: profileData.major,
            phone: profileData.phone
        };
        
        // 실제 API 호출
        const response = await updateUserProfile(userId, apiData);
        return response;
    } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        throw error;
    }
};

export function ProfileTab({ userId = defaultUserId }) {
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
                const data = await fetchUserProfile(userId);
                
                // API 응답을 폼 데이터 형식으로 변환
                const profileData = {
                    name: data.name,
                    phone: data.phone,
                    birthday: data.birthDate,
                    major: data.school || '',
                    desiredCourse: data.desiredCourse,
                    desiredJob: data.desiredJob
                };
                
                setProfile(profileData);
                setFormData(profileData);
            } catch (err) {
                setError('프로필 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [userId]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            
            const response = await updateProfile(formData, userId);
            
            // 성공적으로 업데이트된 경우, 서버에서 받은 최신 데이터로 프로필 업데이트
            if (response) {
                const updatedProfileData = {
                    name: response.name,
                    phone: response.phone,
                    birthday: response.birthDate,
                    major: response.school || '',
                    desiredCourse: response.desiredCourse,
                    desiredJob: response.desiredJob
                };
                setProfile(updatedProfileData);
                setFormData(updatedProfileData);
            }
            
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
                    
                    <div>
                        <label className="label">소속 학교</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.major || ''}
                            onChange={(e) => handleInputChange('major', e.target.value)}
                            disabled={!isEditing}
                            placeholder="소속 학교를 입력하세요"
                        />
                    </div>
                    
                    <div>
                        <label className="label">희망 과목</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.desiredCourse || ''}
                            onChange={(e) => handleInputChange('desiredCourse', e.target.value)}
                            disabled={!isEditing}
                            placeholder="희망하는 과목을 입력하세요"
                        />
                    </div>
                    
                    <div>
                        <label className="label">희망 직업</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.desiredJob || ''}
                            onChange={(e) => handleInputChange('desiredJob', e.target.value)}
                            disabled={!isEditing}
                            placeholder="희망하는 직업을 입력하세요"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
