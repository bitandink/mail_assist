import { config } from './config.js';

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
};

async function getAccessToken(): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.kakao.restApiKey,
    refresh_token: config.kakao.refreshToken
  });
  if (config.kakao.clientSecret) body.set('client_secret', config.kakao.clientSecret);

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(`Kakao token refresh failed: ${data.error_description || data.error || response.status}`);
  }

  if (data.refresh_token) {
    console.warn('KAKAO_REFRESH_TOKEN_ROTATION_REQUIRED=true');
    console.warn('Kakao issued a new refresh token. Re-run local Kakao authorization and update the GitHub secret before the old token expires.');
  }
  return data;
}

export async function sendKakaoMessages(messages: string[]): Promise<void> {
  const token = await getAccessToken();

  for (const text of messages) {
    const template = {
      object_type: 'text',
      text: text.slice(0, 200),
      link: {
        web_url: config.kakao.linkUrl,
        mobile_web_url: config.kakao.linkUrl
      }
    };

    const body = new URLSearchParams({ template_object: JSON.stringify(template) });
    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kakao message send failed (${response.status}): ${errorText}`);
    }
  }
}
