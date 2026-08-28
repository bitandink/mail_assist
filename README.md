# 📬 Mail Assist

네이버(Naver)와 네이트(Nate) 메일을 자동으로 확인하고, 중요도가 높은 메일만 선별해 카카오톡으로 전달하는 개인 메일 자동화 프로젝트입니다.

매일 여러 메일함에 직접 로그인해 확인해야 하는 번거로움을 줄이고, 채용·계약·업무·결제·공모전 등 놓치면 안 되는 메일을 빠르게 확인할 수 있도록 만들었습니다.

---

## ✨ Overview

Mail Assist는 다음 흐름으로 동작합니다.

```text
Naver Mail ─┐
            ├─ IMAP 수집
Nate Mail ──┘
      ↓
최근 메일 조회
      ↓
규칙 기반 중요도 분석
      ↓
중요 메일 필터링
      ↓
KakaoTalk REST API
      ↓
나와의 채팅으로 알림
```

GitHub Actions를 이용해 매일 자동 실행되며, 로컬 PC를 계속 켜두지 않아도 동작하도록 구성했습니다.

---

## 🎯 Why I Built This

현재 사용하는 주 메일과 과거 업무·계약 창구로 사용했던 메일 계정이 서로 달라 두 메일함을 지속적으로 확인해야 했습니다.

하지만 사용 빈도가 낮은 메일함은 확인을 잊기 쉬웠고, 광고·프로모션 메일 사이에서 필요한 메일을 빠르게 파악하기도 어려웠습니다.

이를 해결하기 위해 다음과 같은 자동화 흐름을 설계했습니다.

- 여러 메일 계정을 하나의 프로세스에서 확인
- 최근 수신 메일만 수집
- 중요도 점수 기반으로 필요한 메일만 선별
- 카카오톡으로 요약 알림 전송
- GitHub Actions로 매일 자동 실행

---

## 🛠 Tech Stack

### Runtime

- Node.js
- TypeScript

### Mail

- IMAP
- ImapFlow
- Naver Mail
- Nate Mail

### API / Authentication

- Kakao REST API
- Kakao Login
- OAuth 2.0
- Access Token / Refresh Token

### Automation

- GitHub Actions
- GitHub Actions Secrets

---

## 🔍 Important Mail Classification

현재는 외부 AI API를 사용하지 않고 **규칙 기반 점수 방식**으로 메일의 중요도를 판별합니다.

### 높은 우선순위

- 채용 / 면접 / 서류 결과
- 계약 / 견적 / 정산 / 세금계산서
- 업무 요청 / 회신 요청 / 마감
- 결제 / 계정 보안
- 글 공모전 / 심사 / 수상 / 접수 일정
- 개인적으로 확인이 필요한 주요 연락

### 낮은 우선순위

- 광고
- 프로모션
- 쇼핑 알림
- 이벤트 안내
- 뉴스레터
- 반복적인 자동 발송 메일

메일 제목, 발신자 및 본문 일부의 키워드에 점수를 부여한 뒤 설정된 threshold 이상인 메일만 알림 대상으로 선택합니다.

```env
IMPORTANCE_THRESHOLD=4
```

---

## ⏰ Scheduled Execution

GitHub Actions를 이용해 매일 오전 10시(KST)에 실행합니다.

GitHub Actions의 cron은 UTC 기준이므로 다음과 같이 설정합니다.

```yaml
schedule:
  - cron: "0 1 * * *"
```

```text
01:00 UTC
= 10:00 KST
```

GitHub Actions의 스케줄 실행은 서버 상태에 따라 몇 분 정도 지연될 수 있습니다.

---

## 📮 Mail Search Window

기본적으로 최근 **28시간**의 메일을 조회합니다.

```env
LOOKBACK_HOURS=28
```

24시간이 아닌 28시간으로 설정한 이유는 GitHub Actions 실행 지연이나 일시적인 실패가 발생했을 때 메일이 조회 범위에서 누락될 가능성을 줄이기 위해서입니다.

---

## 💬 KakaoTalk Notification

중요 메일이 발견되면 KakaoTalk의 **나에게 메시지 보내기 API**를 사용해 알림을 전송합니다.

예시:

```text
📬 오늘 확인할 메일 2건

[채용]
ABC Company
웹 퍼블리셔 면접 일정 안내

→ 일정 확인 및 회신 필요

[계약]
XYZ Studio
유지보수 계약 갱신 문의

→ 계약 조건 확인 필요
```

중요한 메일이 없는 경우에는 기본적으로 메시지를 보내지 않습니다.

```env
SEND_EMPTY_SUMMARY=false
```

---

## 🔐 Security

실제 계정 정보와 API 인증값은 코드에 포함하지 않습니다.

다음 정보들은 로컬 `.env` 또는 GitHub Actions Secrets를 통해 관리합니다.

```env
NAVER_EMAIL=
NAVER_PASSWORD=

NATE_EMAIL=
NATE_PASSWORD=

KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REFRESH_TOKEN=
KAKAO_REDIRECT_URI=
KAKAO_LINK_URL=
```

`.env`는 Git에서 제외합니다.

```gitignore
.env
.env.*
!.env.example
node_modules/
```

공개 저장소에는 실제 인증정보 대신 `.env.example`만 포함합니다.

---

## ⚙️ Environment Variables

`.env.example`을 복사합니다.

### Windows CMD

```cmd
copy .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

이후 `.env` 파일에 실제 값을 입력합니다.

```env
NAVER_EMAIL=your-id@naver.com
NAVER_PASSWORD=your-naver-app-password

NATE_EMAIL=your-id@nate.com
NATE_PASSWORD=your-nate-password

KAKAO_REST_API_KEY=your-rest-api-key
KAKAO_CLIENT_SECRET=your-client-secret
KAKAO_REFRESH_TOKEN=your-refresh-token

KAKAO_REDIRECT_URI=http://localhost:3000/oauth/kakao
KAKAO_LINK_URL=https://example.com

LOOKBACK_HOURS=28
IMPORTANCE_THRESHOLD=4
SEND_EMPTY_SUMMARY=false
```

---

## 🔑 Naver IMAP Authentication

Naver Mail은 IMAP을 활성화해야 합니다.

```text
Naver Mail
→ 환경설정
→ POP3 / IMAP 설정
→ IMAP / SMTP
→ 사용함
```

2단계 인증을 사용하는 계정의 경우 일반 계정 비밀번호 대신 **애플리케이션 비밀번호**를 사용합니다.

```env
NAVER_PASSWORD=your-application-password
```

---

## 🔑 Kakao OAuth Setup

Kakao Developers에서 애플리케이션을 생성한 뒤 다음 설정이 필요합니다.

- Kakao Login 활성화
- REST API Key 발급
- Client Secret 활성화
- Redirect URI 등록
- `talk_message` 동의항목 활성화

Redirect URI 예시:

```text
http://localhost:3000/oauth/kakao
```

인가 URL 생성:

```bash
npm run kakao:auth
```

브라우저 로그인 후 받은 authorization code를 이용해 토큰을 발급합니다.

```bash
npm run kakao:auth -- --code=AUTHORIZATION_CODE
```

발급받은 refresh token을 다음 환경변수에 저장합니다.

```env
KAKAO_REFRESH_TOKEN=
```

---

## 🚀 Run Locally

의존성 설치:

```bash
npm install
```

실행:

```bash
npm start
```

개발 모드:

```bash
npm run dev
```

TypeScript 검사:

```bash
npm run check
```

---

## ☁️ GitHub Actions Secrets

GitHub Repository에서 아래 경로로 이동합니다.

```text
Settings
→ Secrets and variables
→ Actions
```

다음 값을 각각 Repository Secret으로 등록합니다.

- `NAVER_EMAIL`
- `NAVER_PASSWORD`
- `NATE_EMAIL`
- `NATE_PASSWORD`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REFRESH_TOKEN`
- `KAKAO_REDIRECT_URI`
- `KAKAO_LINK_URL`

---

## 🧯 Failure Handling

각 메일 계정은 독립적으로 처리합니다.

따라서 하나의 메일 계정에서 인증 오류가 발생하더라도 다른 메일 계정의 확인 작업까지 중단되지 않도록 구성했습니다.

예:

```text
[Naver] authentication failed

[Nate] IMAP login successful
[Nate] fetched 4 recent messages
```

이 구조를 통해 특정 메일 서비스의 일시적인 오류가 전체 자동화 실패로 이어지는 것을 줄였습니다.

---

## 📁 Project Structure

```text
mail_assist/
├─ .github/
│  └─ workflows/
│     └─ daily-mail.yml
│
├─ scripts/
│  └─ kakao-auth.ts
│
├─ src/
│  ├─ config.ts
│  ├─ filter.ts
│  ├─ format.ts
│  ├─ index.ts
│  ├─ kakao.ts
│  ├─ mail.ts
│  └─ types.ts
│
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 💡 Key Implementation Points

### 1. Multiple IMAP Accounts

Naver와 Nate를 동일한 인터페이스로 처리해 메일 서비스가 달라도 하나의 자동화 흐름에서 관리할 수 있도록 구성했습니다.

### 2. Rule-based Classification

외부 AI 서비스에 메일 본문을 전송하지 않고 로컬에서 키워드와 점수를 이용해 중요도를 판별합니다.

이를 통해 다음을 목표로 했습니다.

- 개인정보 외부 전송 최소화
- 추가 API 비용 없음
- 예측 가능한 분류 결과

### 3. OAuth Token Handling

KakaoTalk API 인증을 위해 OAuth 2.0 기반의 Access Token / Refresh Token 구조를 사용합니다.

### 4. Secret Management

계정 비밀번호와 API Key는 코드와 분리하고 GitHub Actions Secrets를 통해 CI 환경에 주입합니다.

### 5. Scheduled Automation

로컬 PC에 의존하지 않도록 GitHub Actions를 이용해 정기 실행 환경을 구성했습니다.

---

## 🔮 Future Improvements

- 중요도 분류 규칙 커스터마이징
- 발신자 whitelist / blacklist
- 이미 알림한 메일의 중복 알림 방지 강화
- 카카오 메시지 포맷 개선
- 메일 서비스 추가 지원
- 간단한 관리 UI
- 사용자별 필터 설정
- 선택적인 AI 기반 중요도 분류
- 메일 통계 및 주간 요약

---

## 📌 Notes

이 프로젝트는 개인 메일 자동화를 목적으로 제작되었습니다.

실제 사용 시 API Key, 메일 비밀번호, OAuth Token과 같은 민감 정보가 Git 저장소에 포함되지 않도록 주의해야 합니다.
