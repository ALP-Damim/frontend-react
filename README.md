# EduLearn - 스마트한 교육 플랫폼

React 기반의 교육 플랫폼으로, 학생, 강사, 관리자 역할별 대시보드를 제공합니다.

## 주요 기능

### 학생 기능
- **대시보드**: 수강 중인 강의, 추천 강의, 일정 관리
- **마이페이지**: 
  - 📊 **전체 성적**: 수강 중인 모든 강의의 출석률과 성적 조회
  - 👤 **개인 정보**: 생년월일, 연락처 등 개인 정보 수정
- **시험 응시**: 온라인 시험 시스템
- **결과 확인**: 시험 결과 및 성적 확인

### 강사 기능
- **대시보드**: 진행 중인 강의 관리, 학생 현황
- **모니터링**: 실시간 시험 모니터링

### 관리자 기능
- **대시보드**: 전체 시스템 통계 및 현황
- **사용자 관리**: 학생 및 강사 계정 관리

## 마이페이지 상세 기능

### 📊 전체 성적 탭
- **전체 통계**: 평균 성적, 평균 출석률, 수강 강의 수
- **강의별 상세**: 각 강의의 출석률, 최종 성적
- **과제/시험 성적**: 개별 과제 및 시험 성적 상세 조회
- **API 연동**: 실제 서버에서 성적 데이터 조회

### 👤 개인 정보 탭
- **기본 정보**: 이름, 이메일, 전화번호, 생년월일
- **학적 정보**: 학과, 학년, 주소
- **비상 연락처**: 비상 시 연락할 사람 정보
- **실시간 수정**: 정보 수정 및 저장 기능

## 기술 스택

- **Frontend**: React 18, React Router
- **Styling**: CSS3 (CSS Variables)
- **API**: RESTful API 연동 준비 완료
- **State Management**: React Hooks

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 배포

### 환경변수(.env.production)
아래 예시를 참고해 루트에 `.env.production` 파일을 생성하세요.

```
VITE_API_SERVER_URL=https://team02-apim.azure-api.net
VITE_API_BASE_URL=https://team02-apim.azure-api.net/student
VITE_NOTIFICATION_API_URL=https://team02-apim.azure-api.net/notifications-service-http
VITE_WEBSOCKET_URL=wss://team02-apim.azure-api.net/ws
VITE_APIM_SUBSCRIPTION_KEY=
VITE_APIM_SUBSCRIPTION_QUERY_NAME=subscription-key
```

### Docker 빌드/실행
```
docker build -t your/image:tag .
docker run -e API_URL=team02-apim.azure-api.net -p 8080:80 your/image:tag
```

nginx는 CSP의 connect-src에 Azure APIM 도메인을 허용하도록 설정되어 있습니다.

## API 연동

### 성적 조회 API
```javascript
// 전체 성적 조회
GET /api/student/{studentId}/grades

// 성적 요약 조회
GET /api/student/{studentId}/grades/summary

// 출석률 조회
GET /api/student/{studentId}/courses/{courseId}/attendance
```

### 프로필 API
```javascript
// 프로필 조회
GET /api/student/{studentId}/profile

// 프로필 업데이트
PUT /api/student/{studentId}/profile
```

## 프로젝트 구조

```
src/
├── components/
│   ├── common/          # 공통 컴포넌트 (Header, NotificationDropdown)
│   ├── student/         # 학생 전용 컴포넌트
│   └── teacher/         # 강사 전용 컴포넌트
├── pages/
│   ├── student/         # 학생 페이지 (대시보드, 마이페이지, 시험)
│   ├── teacher/         # 강사 페이지
│   ├── admin/           # 관리자 페이지
│   └── common/          # 공통 페이지
├── utils/
│   └── api.js           # API 유틸리티 함수
└── styles.css           # 전역 스타일
```

## 주요 컴포넌트

### 재사용 가능한 컴포넌트
- **Header**: 네비게이션과 알림 기능이 포함된 공통 헤더
- **NotificationDropdown**: 알림 목록을 표시하는 드롭다운

### 마이페이지 컴포넌트
- **MyPage**: 메인 마이페이지 컴포넌트 (탭 관리)
- **GradeTab**: 전체 성적 조회 및 표시
- **ProfileTab**: 개인 정보 수정 폼

## 개발 가이드

### 새로운 페이지 추가
1. `src/pages/` 디렉토리에 새 컴포넌트 생성
2. `App.jsx`에 라우트 추가
3. 필요한 경우 `index.js`에 export 추가

### API 연동
1. `src/utils/api.js`에 API 함수 추가
2. 컴포넌트에서 API 함수 호출
3. 로딩 상태 및 에러 처리 구현

### 스타일링
- CSS Variables를 사용한 일관된 디자인 시스템
- 반응형 디자인 지원
- 접근성 고려

## 라이센스

MIT License
