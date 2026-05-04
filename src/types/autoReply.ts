export type OutputLanguage =
  | "same_as_user"
  | "english"
  | "hindi"
  | "hinglish";

export type AutoReplyAttachment = {
  type: "image" | "document";
  url: string;
  filename?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  sizeBytes?: number | null;
  storageProvider?: string | null;
  blobPath?: string | null;
};

export type AutoReplyMessage = {
  id: string;
  businessId: string | null;
  gmailId: string;
  incomingMessage: string[];
  originalIncomingMessage?: string[] | null;
  rule: string;
  replyMessage: string[];
  category?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  language?: string | null;
  confidence?: number | null;
  isActive?: boolean;
  attachments?: AutoReplyAttachment[];
  embeddingText?: string | null;
  embeddingModel?: string | null;
  embeddingDimensions?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AutoReplyMessagePayload = {
  businessId: string | null;
  gmailId: string;
  incomingMessage: string[];
  originalIncomingMessage?: string[] | null;
  rule: string;
  replyMessage: string[];
  category?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  language?: string | null;
  confidence?: number | null;
  isActive?: boolean;
  attachments?: AutoReplyAttachment[];
};

export type AutoReplyMessageTestPayload = {
  businessId: string | null;
  gmailId: string | null;
  message: string;
  settings?: {
    contextualReplyEnabled: boolean;
    outputLanguage: OutputLanguage;
  } | null;
};

export type AutoReplyMessageTestResult = {
  matched: boolean;
  message: string;
  approvedReply: string | null;
  finalReply: string | null;
  selectedReply: string | null;
  matchedPhrase: string | null;
  matchedRule: AutoReplyMessage | null;
  matchType: string | null;
  similarityScore: number | null;
  evaluatedRules: number;
  contextualReplyEnabled: boolean;
  outputLanguage: OutputLanguage;
};

export type BusinessReplyConfig = {
  businessId: string;
  disableAIReplies: string[];
  autoReplyEnabled?: boolean;
  contextualReplyEnabled: boolean;
  outputLanguage: OutputLanguage;
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
