import { config } from './config.js';
import { fetchRecentMail } from './mail.js';
import { selectImportant } from './filter.js';
import { buildMessages } from './format.js';
import { sendKakaoMessages } from './kakao.js';

async function main() {
  const since = new Date(Date.now() - config.lookbackHours * 60 * 60 * 1000);
  console.log(`Checking mail since ${since.toISOString()} (${config.lookbackHours}h lookback)`);

  const settled = await Promise.allSettled(
    config.mailboxes.map(async (mailbox) => {
      const mails = await fetchRecentMail(mailbox, since);
      console.log(`[${mailbox.label}] fetched ${mails.length} recent messages`);
      return mails;
    })
  );

  const all = [] as Awaited<ReturnType<typeof fetchRecentMail>>;
  const failures: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') all.push(...result.value);
    else failures.push(`${config.mailboxes[index].label}: ${String(result.reason)}`);
  });

  if (!all.length && failures.length === config.mailboxes.length) {
    throw new Error(`All mailboxes failed:\n${failures.join('\n')}`);
  }

  const important = selectImportant(all, config.importanceThreshold);
  console.log(`Selected ${important.length} important messages out of ${all.length}`);
  important.forEach((mail) => console.log(`[score=${mail.score}] [${mail.source}] ${mail.subject}`));

  let messages: string[] = [];
  if (important.length) messages = buildMessages(important);
  else if (config.sendEmptySummary) messages = buildMessages([]);

  if (failures.length) {
    const warning = `⚠️ 메일 확인 오류\n${failures.map((x) => x.split(':')[0]).join(', ')} 계정을 확인하지 못했어요.`;
    messages.unshift(warning.slice(0, 190));
  }

  if (!messages.length) {
    console.log('Nothing important; Kakao message skipped.');
    return;
  }

  await sendKakaoMessages(messages);
  console.log(`Sent ${messages.length} Kakao message(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
