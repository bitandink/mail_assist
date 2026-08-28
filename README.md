# Mail → Kakao Assistant

네이버메일과 네이트메일의 받은편지함을 IMAP으로 확인하고, 중요한 메일만 골라 매일 오전 10시(KST)에 카카오톡 **나와의 채팅**으로 알려주는 개인용 자동화 프로젝트입니다.

## 동작

1. 네이버 `imap.naver.com:993` + 네이트 `imap.nate.com:993`에서 최근 메일을 읽습니다.
2. 제목·발신자·본문 일부·메일 헤더를 규칙 기반으로 점수화합니다.
3. 채용/면접, 업무 요청/마감, 계약/정산, 결제/보안, 글 공모전 등을 우선합니다.
4. 광고/프로모션/뉴스레터/대량 자동메일은 감점합니다.
5. 기준 점수 이상의 메일만 카카오톡 나와의 채팅으로 보냅니다.
6. 카카오 텍스트 템플릿 제한에 맞춰 메시지를 자동 분할합니다.

> 메일 본문은 AI API로 보내지 않습니다. 분류는 로컬 규칙 기반입니다.

## 1. 준비

- Node.js 20 이상
- GitHub 계정
- Kakao Developers 앱 1개
- 네이버메일 IMAP 사용 설정
- 네이트메일 계정

### 네이버

네이버 메일 환경설정에서 IMAP/SMTP를 사용함으로 설정합니다. 2단계 인증 계정은 일반 로그인 비밀번호 대신 **애플리케이션 비밀번호**를 사용하세요.

### 네이트

IMAP 서버는 `imap.nate.com`, 포트 `993`, SSL입니다.

## 2. 설치

```bash
npm install
cp .env.example .env
```

Windows PowerShell에서는:

```powershell
Copy-Item .env.example .env
```

`.env` 파일에 네이버/네이트 계정 정보를 입력합니다. `.env`는 `.gitignore`에 포함되어 있으므로 저장소에 커밋하지 않습니다.

## 3. Kakao Developers 설정

1. Kakao Developers에서 애플리케이션을 만듭니다.
2. **카카오 로그인**을 활성화합니다.
3. Redirect URI에 `.env`의 `KAKAO_REDIRECT_URI` 값을 등록합니다. 예: `http://localhost:3000/oauth/kakao`
4. 동의항목에서 **카카오톡 메시지 전송 (`talk_message`)** 권한을 사용할 수 있게 설정합니다.
5. **제품 링크 관리**에 메시지 링크로 사용할 웹 도메인을 등록합니다.
6. REST API 키를 `.env`의 `KAKAO_REST_API_KEY`에 넣습니다.
7. REST API Client Secret이 켜져 있으면 `KAKAO_CLIENT_SECRET`도 넣습니다.
8. 등록한 웹 도메인의 URL을 `KAKAO_LINK_URL`에 넣습니다.

### Refresh Token 최초 발급

먼저:

```bash
npm run kakao:auth
```

출력된 주소를 브라우저에서 엽니다. 카카오 로그인/동의 후 Redirect URI로 이동하면 브라우저 주소에 `?code=...`가 붙습니다.

그 값을 복사해:

```bash
npm run kakao:auth -- --code=복사한_코드
```

출력된 `KAKAO_REFRESH_TOKEN=...` 값을 `.env`에 넣습니다.

> Redirect URI에 실제 웹서버가 없어 브라우저에 연결 오류가 보여도 괜찮습니다. 주소창에 `code`가 있으면 그 값만 복사하면 됩니다.

## 4. 로컬 테스트

```bash
npm run check
npm start
```

최근 28시간 메일을 확인해 중요 메일이 있다면 카카오톡 나와의 채팅으로 전송합니다.

테스트할 때 중요 메일이 없어도 카톡이 오는지 확인하려면 `.env`에서:

```env
SEND_EMPTY_SUMMARY=true
```

로 바꿔 실행하세요. 테스트가 끝나면 `false`로 되돌리는 것을 권장합니다.

## 5. 중요도 기준 조절

`src/filter.ts`에서 키워드와 점수를 수정할 수 있습니다.

기본적으로 다음을 높게 평가합니다.

- 채용/면접/입사/서류 결과
- 계약/견적/발주/정산/입금/세금계산서
- 업무 요청/검토 요청/회신 요청/마감
- 계정 보안/로그인/비밀번호/결제 이상
- 공모전/문학상/투고/심사/수상/접수 마감

다음은 낮게 평가합니다.

- 광고/프로모션/쿠폰/특가/세일
- 뉴스레터/수신거부 링크가 있는 대량메일
- 자동 발송 헤더가 있는 메시지

`.env`의 `IMPORTANCE_THRESHOLD=4`를 높이면 더 엄격하게, 낮추면 더 많이 알려줍니다.

## 6. GitHub에 올리기

```bash
git init
git add .
git commit -m "feat: add daily mail to KakaoTalk assistant"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## 7. GitHub Actions Secrets

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에 아래 값을 등록합니다.

- `NAVER_EMAIL`
- `NAVER_PASSWORD`
- `NATE_EMAIL`
- `NATE_PASSWORD`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET` (사용하는 경우)
- `KAKAO_REFRESH_TOKEN`
- `KAKAO_LINK_URL`

워크플로는 `.github/workflows/daily-mail.yml`에 있으며 매일 `01:00 UTC`, 즉 **한국시간 오전 10시**에 실행됩니다.

처음에는 GitHub 저장소의 **Actions → Daily important mail to KakaoTalk → Run workflow**로 수동 실행해서 확인하세요.

## 8. 카카오 Refresh Token 주의

GitHub Actions Secrets는 워크플로 자체가 안전하게 값을 교체하기 어렵기 때문에, 이 프로젝트는 카카오가 새 Refresh Token을 발급해야 하는 시점이 되면 Actions 로그에 다음 경고를 남깁니다.

```text
KAKAO_REFRESH_TOKEN_ROTATION_REQUIRED=true
```

이 경고가 보이면 로컬에서 `npm run kakao:auth` 절차를 다시 진행하고 GitHub Secret `KAKAO_REFRESH_TOKEN`을 새 값으로 교체하세요.

## 보안

- `.env`를 GitHub에 올리지 마세요.
- 네이버는 가능하면 앱 비밀번호를 사용하세요.
- 토큰/메일 비밀번호를 코드에 직접 적지 마세요.
- 저장소는 private으로 만드는 것을 권장합니다.
- 메일 전체 본문을 저장하거나 외부 AI API로 전송하지 않습니다.
