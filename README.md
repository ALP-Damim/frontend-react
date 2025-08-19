# EduLearn - 교육 플랫폼

React + Vite 기반의 교육 플랫폼으로, 학생, 강사, 관리자 역할별 대시보드와 AI 기능을 제공합니다.

## 🚀 프로젝트 구성

### 기술 스택
- **Frontend**: React 19.1.1 + Vite 7.1.2
- **Routing**: React Router DOM 7.8.1
- **Charts**: Recharts 3.1.2
- **Linting**: ESLint 9.33.0

### 디렉토리 구조
```
frontend-react/
├── public/                 # 정적 파일
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── student/        # 학생 관련 컴포넌트
│   │   │   ├── ScoreChart.jsx
│   │   │   ├── MistakeDetailModal.jsx
│   │   │   └── index.js
│   │   ├── teacher/        # 강사 관련 컴포넌트
│   │   │   └── index.js
│   │   ├── common/         # 공통 컴포넌트
│   │   │   ├── NotificationModal.jsx
│   │   │   ├── RetryButton.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── student/        # 학생 페이지
│   │   │   ├── DashboardStudent.jsx
│   │   │   ├── Exam.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── StudentStep.jsx
│   │   │   └── index.js
│   │   ├── teacher/        # 강사 페이지
│   │   │   ├── DashboardTeacher.jsx
│   │   │   ├── TeacherMonitor.jsx
│   │   │   └── index.js
│   │   ├── admin/          # 관리자 페이지
│   │   │   ├── DashboardAdmin.jsx
│   │   │   └── index.js
│   │   ├── common/         # 공통 페이지
│   │   │   ├── RAG.jsx
│   │   │   ├── NotificationLog.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── assets/            # 이미지, 아이콘 등
│   ├── App.jsx            # 메인 앱 컴포넌트
│   ├── main.jsx           # 앱 진입점
│   ├── index.css          # 전역 스타일
│   ├── App.css            # 앱 스타일
│   └── styles.css         # 추가 스타일
├── package.json
├── vite.config.js
└── eslint.config.js
```

### 주요 기능
- **학생 대시보드**: 시험 목록, 응시, 결과 확인
- **강사 대시보드**: 시험 생성, 모니터링, 결과 관리
- **관리자 대시보드**: 시스템 관리 및 통계
- **AI 검색(RAG)**: 문서 검색 및 근거 문장 하이라이트
- **실시간 알림**: 시험 전 모달 및 Zoom 연동
- **AI 피드백**: 답안에 대한 AI 조언 제공
- **재시도 기능**: 실패 시 최대 3회 재시도

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 3. 프로덕션 빌드
```bash
npm run build
```
빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 4. 빌드 미리보기
```bash
npm run preview
```
빌드된 프로덕션 버전을 로컬에서 미리볼 수 있습니다.

### 5. 코드 린팅
```bash
npm run lint
```

## 🎯 데모 시나리오

1. **강사**: 시험 생성 → 난이도/문항 입력
2. **학생**: 시험 목록 → 응시 → 제출
3. **결과**: 실시간 점수 확인 → AI 조언 보기
4. **과제/답안**: AI 피드백 보기 버튼
5. **RAG 검색**: 문서 Top-k + 근거 문장 하이라이트
6. **알림**: 시험 전 모달 + Zoom 이동
7. **실패시**: 재시도(최대 3회)

## 📱 사용법

### 역할별 접근
- **학생**: `/student` - 시험 응시 및 결과 확인
- **강사**: `/teacher` - 시험 관리 및 모니터링
- **관리자**: `/admin` - 시스템 관리

### 주요 페이지
- **시험 응시**: `/exam/:examId`
- **학생 단계별 진행**: `/exam/:examId/step`
- **강사 모니터링**: `/teacher/:examId/monitor`
- **결과 확인**: `/result/:examId`
- **AI 검색**: `/rag`
- **알림 로그**: `/notifications`

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 권장 개발 도구
- VS Code
- React Developer Tools
- ESLint 확장

## 📝 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.
