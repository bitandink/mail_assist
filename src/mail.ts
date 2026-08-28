import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { MailItem } from './types.js';

export type MailboxConfig = {
  label: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

function normalizeAddress(parsed: Awaited<ReturnType<typeof simpleParser>>['from']): { name: string; address: string } {
  const first = parsed?.value?.[0];
  return {
    name: first?.name?.trim() || first?.address?.trim() || '알 수 없음',
    address: first?.address?.trim().toLowerCase() || ''
  };
}

export async function fetchRecentMail(mailbox: MailboxConfig, since: Date): Promise<MailItem[]> {
  const client = new ImapFlow({
    host: mailbox.host,
    port: mailbox.port,
    secure: mailbox.secure,
    auth: { user: mailbox.user, pass: mailbox.pass },
    logger: false
  });

  const results: MailItem[] = [];
  try {
    console.log(`[${mailbox.label}] connecting to ${mailbox.host}:${mailbox.port}...`);
    await client.connect();
    console.log(`[${mailbox.label}] IMAP login successful`);
  } catch (error) {
    console.error(`[${mailbox.label}] IMAP connection/login failed:`, error);
    throw error;
  }

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids = await client.search({ since }, { uid: true });
      if (!uids.length) return [];

      for await (const message of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        const sender = normalizeAddress(parsed.from);
        const date = parsed.date ?? new Date();
        if (date < since) continue;

        const text = (parsed.text || parsed.html || '')
          .toString()
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000);

        results.push({
          source: mailbox.label,
          uid: message.uid,
          messageId: parsed.messageId,
          date,
          from: sender.name,
          fromAddress: sender.address,
          subject: parsed.subject?.trim() || '(제목 없음)',
          text,
          headers: parsed.headers
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }

  return results;
}
