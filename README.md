# OSoRi_Repository
오(O)늘의 소(So)비 리(Ri)포트

# 0. Getting Started (시작하기)
```bash
$ npm start
```
[서비스 링크]

<br/>
<br/>

# 1. Project Overview (프로젝트 개요)
- 프로젝트 이름: 오소리
- 프로젝트 설명: 쉽고 편리하게 오늘의 소비를 기록하자!!

<br/>
<br/>

# 2. Team Members (팀원 및 팀 소개)
| 서채원 | 전성중 | 조수인 | 강민채 |
|:------:|:------:|:------:|:------:|
| <img src="https://avatars.githubusercontent.com/u/250162373?s=400&u=59aa0a768a3383c0fdbf0a71b1e54e56bcff3ff5&v=4" alt="서채원" width="150"> | <img src="https://avatars.githubusercontent.com/u/223277907?v=4" alt="전성중" width="150"> | <img src="https://avatars.githubusercontent.com/u/250043719?v=4" alt="조수인" width="150"> | <img src="https://avatars.githubusercontent.com/u/216668731?v=4" alt="강민채" width="150"> |
| Team Leader | Team Member | Team Member | Team Member |
| [GitHub](https://github.com/annnerss) | [GitHub](https://github.com/jsj0345) | [GitHub](https://github.com/jsi4770) | [GitHub](https://github.com/minchaeee514) |

<br/>
<br/>

# 3. Key Features (주요 기능)
- **회원가입**:
  - 회원가입 시 DB에 유저정보가 등록됩니다.

- **로그인**:
  - 사용자 인증 정보를 통해 로그인합니다.
 
- **개인 가계부**:
  - 개인 가계부 관리와 수입/지출 내역을 통해 소비패턴 분석과 뱃지 획득이 가능합니다.

- **그룹 가계부**:
  - 가족/연인과 함께 수입/지출을 관리하며 챌린지를 통해 뱃지 획득을 하실 수 있습니다.

- **실시간 알림**:
  - 그룹 가계부에서 초대와 수입/지출 내역 추가시 실시간 알림을 보내드립니다.

<br/>
<br/>

# 4. Tasks & Responsibilities (작업 및 역할 분담)
|  |  |  |
|-----------------|-----------------|-----------------|
| 서채원    |  <img src="https://avatars.githubusercontent.com/u/250162373?s=400&u=59aa0a768a3383c0fdbf0a71b1e54e56bcff3ff5&v=4" alt="서채원" width="100"> | <ul><li>프로젝트 계획 및 관리</li><li>팀 리딩 및 커뮤니케이션</li><li>메인 페이지 구현</li><li>마이 페이지 - 진행중인 가계부 목록/이전 가계부 목록 조회 기능 구현</li><li>그룹 가계부 이메일로 회원 초대 기능 구현</li><li>실시간 그룹 가계부 초대 요청 알림 수락/거절 기능 구현</li><li>챌린지 목록 조회/참여 기능 구현</li><li>그룹 가계부 상세 페이지 구현</li><li>그룹 가계부 수입/지출 내역 목록 조회/삭제 기능 구현</li><li>가계부 관리자 기능 구현(예산 금액 수정, 멤버 추가/삭제, 가계부 삭제)</li><li>N분의 1 정산 로직</li><li>수입/지출 내역 추가시 실시간 알림 기능 구현</li></ul>     |
| 전성중   |  <img src="https://avatars.githubusercontent.com/u/223277907?v=4" alt="전성중" width="100">| <ul><li>회원 가입 페이지 구현</li><li>회원가입 기능 구현</li><li>로그인 페이지/기능 구현(소셜 로그인(API) 포함)</li><li>회원 상태에 따른 서비스 제한 기능 구현</li><li>내 가계부 고정 지출 등록 기능 구현</li><li>회원정보 수정 페이지 구현</li><li>수정 기능(프로필 사진 변경, 비밀번호 수정, 회원 탈퇴) 구현</li></ul> |
| 조수인   |  <img src="https://avatars.githubusercontent.com/u/250043719?v=4" alt="조수인" width="100">    |     <ul><li>가계부 종료까지 남은 기간/예산 계산 기능 구현 (예산 초과시 경고)</li><li>개인 소비 패턴(전월 대비, 카테고리별) 분석 기능 구현</li><li>개인/그룹 챌린지 달성시 뱃지 지급 기능 구현</li><li>마이 뱃지 페이지 구현</li><li>회원 별 보유중인 뱃지 목록 조회, 뱃지 분석 기능 구현</li><li>새로운 챌린지 신청 기능 구현</li><li>캘린더뷰 구현/금액, 내용, 카테고리 별 복합 검색 기능 구현</li></ul>  |
| 강민채    |  <img src="https://avatars.githubusercontent.com/u/216668731?v=4" alt="강민채" width="100">    | <ul><li>(개인/그룹)새로운 가계부 추가 페이지 구현</li><li>가계부 정보 입력폼 구현</li><li>개인 가계부 상세페이지 구현</li><li>개인 가계부 수입/지출 내역 목록 조회 기능 구현</li><li>예산 금액 수정 기능 구현</li><li>수입/지출 내역 추가 기능 구현</li><li>최근 수입/지출 내역 목록 조회/선택시 자동 입력 기능 구현</li><li>영수증 분석하기 (네이버 클로바/카카오 검색 API) 기능 구현</li></ul>    |
<br/>
<br/>

# 5. Technology Stack (기술 스택)
## 5.1 Language
|  |  |
|-----------------|-----------------|
| CSS    |  <img src="https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white" alt="CSS" width="100"> | ?    |
| JavaScript    |  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=white" alt="JavaScript" width="100"> | ?    |

https://github.com/envoy1084/awesome-badges
<br/>

## 5.2 Frotend
|  |  |  |
|-----------------|-----------------|-----------------|
| React    |  <img src="https://github.com/user-attachments/assets/e3b49dbb-981b-4804-acf9-012c854a2fd2" alt="React" width="100"> | ?    |

<br/>

## 5.3 Backend
|  |  |  |
|-----------------|-----------------|-----------------|
| SqlDeveloper    |  <img src="https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=black" alt="SqlDeveloper" width="100">    | ?    |
<br/>

## 5.4 Cooperation
|  |  |
|-----------------|-----------------|
| Git    |  <img src="https://github.com/user-attachments/assets/483abc38-ed4d-487c-b43a-3963b33430e6" alt="git" width="100">    |
| Notion    |  <img src="https://github.com/user-attachments/assets/34141eb9-deca-416a-a83f-ff9543cc2f9a" alt="Notion" width="100">    |

<br/>

# 6. Project Structure (프로젝트 구조)
```plaintext
project/
├── public/
│   ├── index.html           # HTML 템플릿 파일
│   └── favicon.ico          # 아이콘 파일
├── src/
│   ├── assets/              # 이미지, 폰트 등 정적 파일
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── hooks/               # 커스텀 훅 모음
│   ├── pages/               # 각 페이지별 컴포넌트
│   ├── App.js               # 메인 애플리케이션 컴포넌트
│   ├── index.js             # 엔트리 포인트 파일
│   ├── index.css            # 전역 css 파일
│   ├── firebaseConfig.js    # firebase 인스턴스 초기화 파일
│   package-lock.json    # 정확한 종속성 버전이 기록된 파일로, 일관된 빌드를 보장
│   package.json         # 프로젝트 종속성 및 스크립트 정의
├── .gitignore               # Git 무시 파일 목록
└── README.md                # 프로젝트 개요 및 사용법
```

<br/>
<br/>

# 7. Development Workflow (개발 워크플로우)
## 브랜치 전략 (Branch Strategy)
우리의 브랜치 전략은 Git Flow를 기반으로 하며, 다음과 같은 브랜치를 사용합니다.

- Main Branch
  - 배포 가능한 상태의 코드를 유지합니다.
  - 모든 배포는 이 브랜치에서 이루어집니다.
  
- {name} Branch
  - 팀원 각자의 개발 브랜치입니다.
  - 모든 기능 개발은 이 브랜치에서 이루어집니다.

<br/>
<br/>

# 8. Coding Convention
## 명명 규칙
* 상수 : 영문 대문자 + 스네이크 케이스
```
const NAME_ROLE;
```
* 변수 & 함수 : 카멜케이스
```
// state
const [isLoading, setIsLoading] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [currentUser, setCurrentUser] = useState(null);

// 배열 - 복수형 이름 사용
const datas = [];

// 이벤트 핸들러: 'on'으로 시작
const onClick = () => {};
const onChange = () => {};

// 반환 값이 불린인 경우: 'is'로 시작
const isLoading = false;

// Fetch함수: method(get, post, put, del)로 시작
const getEnginList = () => {...}
```

<br/>


<br/>

## 태그 네이밍
Styled-component태그 생성 시 아래 네이밍 규칙을 준수하여 의미 전달을 명확하게 한다.<br/>
전체 영역: Container<br/>
영역의 묶음: {Name}Area<br/>
```
<Container>
  <ContentsArea>
    <Contents>...</Contents>
    <Contents>...</Contents>
  </ContentsArea>
</Container>
```

<br/>
<br/>

# 9. 커밋 컨벤션
## type 종류
```
feat : 새로운 기능 추가
fix : 버그 수정
docs : 문서 수정
style : 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
refactor : 코드 리펙토링
chore : 빌드 업무 수정, 패키지 매니저 수정
```

<br/>

## 커밋 이모지
```
== 코드 관련
📝	코드 작성
🔥	코드 제거
🔨	코드 리팩토링
💄	UI / style 변경

== 문서&파일
📰	새 파일 생성
🔥	파일 제거
📚	문서 작성

== 버그
🐛	버그 리포트
🚑	버그를 고칠 때

== 기타
🐎	성능 향상
✨	새로운 기능 구현
🚀	배포
```

<br/>

## 커밋 예시
```
== ex1
✨Feat: "회원 가입 기능 구현"

SMS, 이메일 중복확인 API 개발

== ex2
📚chore: styled-components 라이브러리 설치

UI개발을 위한 라이브러리 styled-components 설치
```

<br/>
<br/>

# 10. 컨벤션 수행 결과
<img width="100%" alt="코드 컨벤션" src="https://github.com/user-attachments/assets/0dc218c0-369f-45d2-8c6d-cdedc81169b4">
<img width="100%" alt="깃플로우" src="https://github.com/user-attachments/assets/2a4d1332-acc2-4292-9815-d122f5aea77c">
