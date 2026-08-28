import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  mailboxes: [
    {
      label: '네이버',
      host: 'imap.naver.com',
      port: 993,
      secure: true,
      user: required('NAVER_EMAIL'),
      pass: required('NAVER_PASSWORD')
    },
    {
      label: '네이트',
      host: 'imap.nate.com',
      port: 993,
      secure: true,
      user: required('NATE_EMAIL'),
      pass: required('NATE_PASSWORD')
    }
  ],
  kakao: {
    restApiKey: required('KAKAO_REST_API_KEY'),
    clientSecret: process.env.KAKAO_CLIENT_SECRET?.trim() ?? '',
    refreshToken: required('KAKAO_REFRESH_TOKEN'),
    linkUrl: required('KAKAO_LINK_URL')
  },
  lookbackHours: numberEnv('LOOKBACK_HOURS', 28),
  importanceThreshold: numberEnv('IMPORTANCE_THRESHOLD', 4),
  sendEmptySummary: (process.env.SEND_EMPTY_SUMMARY ?? 'false').toLowerCase() === 'true'
};
