export type MailItem = {
  source: string;
  uid: number;
  messageId?: string;
  date: Date;
  from: string;
  fromAddress: string;
  subject: string;
  text: string;
  headers: Map<string, unknown>;
};

export type ScoredMail = MailItem & {
  score: number;
  reasons: string[];
  category: string;
};
