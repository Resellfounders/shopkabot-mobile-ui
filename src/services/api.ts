import {
  AutoReplyAttachment,
  AutoReplyMessage,
  AutoReplyMessagePayload,
  AutoReplyMessageTestPayload,
  AutoReplyMessageTestResult,
  BusinessReplyConfig,
  ChatHistoryMessage,
  OutputLanguage,
} from "../types/autoReply";
import { auth } from "./firebase";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath =
    normalizedBaseUrl.endsWith("/api/v1") && path.startsWith("/api/v1/")
      ? path.slice("/api/v1".length)
      : path;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function getBearerToken(): Promise<string | null> {
  try {
    if (!auth?.currentUser) {
      return null;
    }

    const token = await auth.currentUser.getIdToken();
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
}

async function request<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit,
  requestOptions?: {
    requiresAuth?: boolean;
  },
): Promise<T> {
  const isFormDataBody =
    typeof FormData !== "undefined" && options?.body instanceof FormData;
  const existingHeaders = (options?.headers || {}) as Record<string, string>;
  const authHeaders =
    requestOptions?.requiresAuth && !existingHeaders.Authorization
      ? await getBearerToken()
      : null;

  const response = await fetch(buildUrl(baseUrl, path), {
    headers: {
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(authHeaders
        ? {
            Authorization: authHeaders,
          }
        : {}),
      ...existingHeaders,
    },
    ...options,
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      throw new Error(errorBody.detail || fallback);
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
        throw error;
      }
      throw new Error(fallback);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function listAutoReplyMessages(params: {
  baseUrl: string;
  gmailId: string;
  businessId?: string;
}) {
  const searchParams = new URLSearchParams({
    gmailId: params.gmailId,
  });

  if (params.businessId) {
    searchParams.set("businessId", params.businessId);
  }

  return request<AutoReplyMessage[]>(
    params.baseUrl,
    `/admin/auto-reply-messages?${searchParams.toString()}`,
  );
}

export async function createAutoReplyMessage(params: {
  baseUrl: string;
  payload: AutoReplyMessagePayload;
}) {
  return request<AutoReplyMessage>(params.baseUrl, "/admin/auto-reply-messages", {
    method: "POST",
    body: JSON.stringify(params.payload),
  });
}

export async function updateAutoReplyMessage(params: {
  baseUrl: string;
  id: string;
  payload: Partial<AutoReplyMessagePayload>;
}) {
  return request<AutoReplyMessage>(
    params.baseUrl,
    `/admin/auto-reply-messages/${params.id}`,
    {
      method: "PUT",
      body: JSON.stringify(params.payload),
    },
  );
}

export async function deleteAutoReplyMessage(params: {
  baseUrl: string;
  id: string;
}) {
  return request<{ status: string; id: string }>(
    params.baseUrl,
    `/admin/auto-reply-messages/${params.id}`,
    {
      method: "DELETE",
    },
  );
}

export async function testAutoReplyMessage(params: {
  baseUrl: string;
  payload: AutoReplyMessageTestPayload;
}) {
  return request<AutoReplyMessageTestResult>(
    params.baseUrl,
    "/admin/auto-reply-messages/test",
    {
      method: "POST",
      body: JSON.stringify(params.payload),
    },
  );
}

export async function uploadAutoReplyAttachment(params: {
  baseUrl: string;
  file: File;
  gmailId?: string | null;
  businessId?: string | null;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  if (params.gmailId?.trim()) {
    formData.append("gmailId", params.gmailId.trim());
  }
  if (params.businessId?.trim()) {
    formData.append("businessId", params.businessId.trim());
  }

  return request<AutoReplyAttachment>(
    params.baseUrl,
    "/admin/auto-reply-messages/attachments/upload",
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function getBusinessReplyConfig(params: {
  baseUrl: string;
  businessId: string;
}) {
  return request<BusinessReplyConfig>(
    params.baseUrl,
    `/admin/business-reply-config/${encodeURIComponent(params.businessId)}`,
  );
}

export async function updateBusinessReplyConfig(params: {
  baseUrl: string;
  businessId: string;
  payload: {
    disableAIReplies?: string[];
    autoReplyEnabled?: boolean;
    contextualReplyEnabled?: boolean;
    outputLanguage?: OutputLanguage;
    replyAim?: string;
  };
}) {
  return request<BusinessReplyConfig & { status: string }>(
    params.baseUrl,
    `/admin/business-reply-config/${encodeURIComponent(params.businessId)}`,
    {
      method: "PUT",
      body: JSON.stringify(params.payload),
    },
  );
}

export async function addDisabledNumber(params: {
  baseUrl: string;
  businessId: string;
  phone: string;
}) {
  return request<{ status: string; phone: string }>(
    params.baseUrl,
    `/admin/business-reply-config/${encodeURIComponent(params.businessId)}/add`,
    {
      method: "POST",
      body: JSON.stringify({ phone: params.phone }),
    },
  );
}

export async function removeDisabledNumber(params: {
  baseUrl: string;
  businessId: string;
  phone: string;
}) {
  return request<{ status: string; phone: string }>(
    params.baseUrl,
    `/admin/business-reply-config/${encodeURIComponent(params.businessId)}/remove`,
    {
      method: "POST",
      body: JSON.stringify({ phone: params.phone }),
    },
  );
}

export async function listChatConversationSummaries(params: {
  baseUrl: string;
  businessId: string;
}) {
  return request<ChatHistoryMessage[]>(
    params.baseUrl,
    `/admin/auto-reply-history/${encodeURIComponent(params.businessId)}/conversations`,
  );
}

export async function getChatConversationMessages(params: {
  baseUrl: string;
  businessId: string;
  customerPhoneNumber: string;
}) {
  const searchParams = new URLSearchParams({
    customerPhoneNumber: params.customerPhoneNumber,
  });

  return request<ChatHistoryMessage[]>(
    params.baseUrl,
    `/admin/auto-reply-history/${encodeURIComponent(
      params.businessId,
    )}/messages?${searchParams.toString()}`,
  );
}

