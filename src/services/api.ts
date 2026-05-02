import {
  AutoReplyMessage,
  AutoReplyMessagePayload,
  AutoReplyMessageTestPayload,
  AutoReplyMessageTestResult,
  BusinessReplyConfig,
  ChatHistoryMessage,
} from "../types/autoReply";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

async function request<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
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

export async function getBusinessReplyConfig(params: {
  baseUrl: string;
  businessId: string;
}) {
  return request<BusinessReplyConfig>(
    params.baseUrl,
    `/admin/business-reply-config/${encodeURIComponent(params.businessId)}`,
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
  businessPhoneNumber: string;
}) {
  return request<ChatHistoryMessage[]>(
    params.baseUrl,
    `/api/v1/chat/${encodeURIComponent(params.businessPhoneNumber)}/conversations`,
  );
}

export async function getChatConversationMessages(params: {
  baseUrl: string;
  businessPhoneNumber: string;
  customerPhoneNumber: string;
}) {
  const searchParams = new URLSearchParams({
    customerPhoneNumber: params.customerPhoneNumber,
  });

  return request<ChatHistoryMessage[]>(
    params.baseUrl,
    `/api/v1/chat/conversation/${encodeURIComponent(
      params.businessPhoneNumber,
    )}?${searchParams.toString()}`,
  );
}

