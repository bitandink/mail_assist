import 'dotenv/config';

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} in .env first.`);
  return value;
}

const restApiKey = env('KAKAO_REST_API_KEY');
const redirectUri = env('KAKAO_REDIRECT_URI');
const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim() ?? '';
const codeArg = process.argv.find((arg) => arg.startsWith('--code='));

if (!codeArg) {
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', restApiKey);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'talk_message');
  console.log('\n1) Open this URL in your browser and approve KakaoTalk message permission:\n');
  console.log(url.toString());
  console.log('\n2) After Kakao redirects you, copy the `code` value from the address bar.');
  console.log('3) Run: npm run kakao:auth -- --code=PASTE_CODE_HERE\n');
  process.exit(0);
}

const code = codeArg.slice('--code='.length);
const body = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: restApiKey,
  redirect_uri: redirectUri,
  code
});
if (clientSecret) body.set('client_secret', clientSecret);

const response = await fetch('https://kauth.kakao.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
  body
});
const data = await response.json() as Record<string, unknown>;
if (!response.ok) {
  console.error(data);
  process.exit(1);
}
console.log('\nAuthorization succeeded. Put this value in .env / GitHub Actions Secret:');
console.log(`KAKAO_REFRESH_TOKEN=${String(data.refresh_token ?? '')}`);
console.log('\nTreat this token like a password. Do not commit it to Git.');
