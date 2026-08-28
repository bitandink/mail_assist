import type { MailItem, ScoredMail } from './types.js';

type Rule = { re: RegExp; points: number; reason: string; category: string };

const importantRules: Rule[] = [
  { re: /면접|채용|입사|서류\s*(합격|전형|결과)|지원\s*(결과|현황)|포지션|recruit|interview|offer/i, points: 5, reason: '채용/면접', category: '채용' },
  { re: /계약|계약서|견적|발주|정산|입금|송금|세금계산서|청구|invoice|contract|payment/i, points: 5, reason: '계약/정산', category: '계약' },
  { re: /업무\s*(요청|문의)|검토\s*(요청|부탁)|회신\s*(요청|부탁)|답변\s*(요청|부탁)|마감|기한|deadline|action required/i, points: 4, reason: '업무/마감', category: '업무' },
  { re: /보안|로그인|비밀번호|인증|결제\s*(실패|오류|승인|취소)|이상\s*접속|security|password|suspicious/i, points: 5, reason: '보안/결제', category: '보안' },
  { re: /공모전|문학상|신춘문예|투고|응모|심사|수상|당선|접수\s*마감|contest|competition|award/i, points: 5, reason: '글 공모전', category: '공모전' },
  { re: /확인\s*(부탁|요청)|부탁드립니다|회신\s*바랍니다|답변\s*바랍니다|회신\s*주세요|답변\s*주세요/i, points: 2, reason: '응답 요청', category: '기타' }
];

const promoRules: Rule[] = [
  { re: /광고|프로모션|특가|쿠폰|할인|세일|이벤트|newsletter|뉴스레터|marketing|promotion|sale|coupon/i, points: -6, reason: '광고/프로모션', category: '광고' },
  { re: /수신거부|unsubscribe/i, points: -4, reason: '대량메일', category: '광고' },
  { re: /no[-_.]?reply|noreply|do[-_.]?not[-_.]?reply/i, points: -1, reason: '자동발송 주소', category: '자동' }
];

function headerText(mail: MailItem): string {
  const interesting = ['list-unsubscribe', 'precedence', 'auto-submitted', 'x-auto-response-suppress'];
  return interesting.map((key) => `${key}:${String(mail.headers.get(key) ?? '')}`).join(' ');
}

function looksPersonal(address: string): boolean {
  if (!address) return false;
  return !/(no[-_.]?reply|noreply|newsletter|marketing|notice|notify|notification|admin|system|support)/i.test(address);
}

export function scoreMail(mail: MailItem): ScoredMail {
  const haystack = `${mail.subject}\n${mail.text.slice(0, 2500)}\n${mail.from}\n${mail.fromAddress}\n${headerText(mail)}`;
  let score = 0;
  let category = '기타';
  const reasons: string[] = [];

  for (const rule of importantRules) {
    if (rule.re.test(haystack)) {
      score += rule.points;
      reasons.push(rule.reason);
      if (category === '기타' || rule.points >= 4) category = rule.category;
    }
  }

  for (const rule of promoRules) {
    if (rule.re.test(haystack)) {
      score += rule.points;
      reasons.push(rule.reason);
    }
  }

  const bulkHeader = /precedence:(bulk|list)|list-unsubscribe:.+|auto-submitted:(?!no)/i.test(headerText(mail));
  if (bulkHeader) {
    score -= 5;
    reasons.push('대량/자동 발송 헤더');
  }

  if (looksPersonal(mail.fromAddress) && !bulkHeader) {
    score += 1;
    reasons.push('개인 발신 가능성');
  }

  return { ...mail, score, reasons: [...new Set(reasons)], category };
}

export function selectImportant(mails: MailItem[], threshold: number): ScoredMail[] {
  return mails
    .map(scoreMail)
    .filter((mail) => mail.score >= threshold)
    .sort((a, b) => b.score - a.score || b.date.getTime() - a.date.getTime());
}
