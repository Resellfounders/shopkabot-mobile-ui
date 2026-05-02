export type AutoReplyMessage = {
  id: string;
  businessId: string | null;
  gmailId: string;
  incomingMessage: string[];
  rule: string;
  replyMessage: string[];
  createdAt: string;
  updatedAt: string;
};

export type AutoReplyMessagePayload = {
  businessId: string | null;
  gmailId: string;
  incomingMessage: string[];
  rule: string;
  replyMessage: string[];
};

export type AutoReplyMessageTestPayload = {
  businessId: string | null;
  gmailId: string | null;
  message: string;
};

export type AutoReplyMessageTestResult = {
  matched: boolean;
  message: string;
  selectedReply: string | null;
  matchedPhrase: string | null;
  matchedRule: AutoReplyMessage | null;
  matchType: string | null;
  similarityScore: number | null;
  evaluatedRules: number;
};

export type BusinessReplyConfig = {
  businessId: string;
  disableAIReplies: string[];
};

export type ChatHistoryMessage = {
  id: string;
  content: string;
  role: string;
  type?: string | null;
  fromPhoneNumber: string;
  toPhoneNumber: string;
  read: boolean;
  createdOn?: string;
};

export type TrainingDraft = {
  incomingMessage: string[];
  replyMessage: string[];
  rule: string;
  sourceLabel?: string;
};

export type WhatsAppBusinessConnection = {
  wabaId: string;
  phoneNumberId: string;
  eventType?: string;
  displayName?: string;
  phoneNumber?: string;
  connectedAt: string;
};

export type StoredAppSettings = {
  apiBaseUrl: string;
  businessId: string;
  businessName: string;
  botActive: boolean;
  whatsappConnection?: WhatsAppBusinessConnection | null;
};
