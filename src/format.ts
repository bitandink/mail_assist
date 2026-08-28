import type { ScoredMail } from './types.js';

const MAX_KAKAO_TEXT = 190; // Leave a small margin under Kakao's 200-char text-template limit.

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function clip(text: string, max: number): string {
  const value = clean(text);
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;
}

function timeKst(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}

function itemText(mail: ScoredMail): string {
  const sender = clip(mail.from || mail.fromAddress || '알 수 없음', 24);
  const subject = clip(mail.subject, 54);
  const reason = clip(mail.reasons.filter((r) => !/광고|대량|자동/.test(r)).slice(0, 2).join(', ') || mail.category, 28);
  return `• [${mail.source}/${mail.category}] ${subject}\n${sender} · ${timeKst(mail.date)}\n→ ${reason}`;
}

export function buildMessages(mails: ScoredMail[]): string[] {
  if (!mails.length) return ['📬 오늘 확인할 중요 메일은 없어요.'];

  const chunks: string[] = [];
  let current = `📬 확인할 중요 메일 ${mails.length}건`;

  for (const mail of mails) {
    let block = itemText(mail);
    if (block.length > MAX_KAKAO_TEXT - 10) block = clip(block, MAX_KAKAO_TEXT - 10);
    const candidate = `${current}\n\n${block}`;
    if (candidate.length > MAX_KAKAO_TEXT) {
      chunks.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
