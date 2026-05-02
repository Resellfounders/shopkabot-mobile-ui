import { Linking, Platform } from "react-native";

type RazorpaySubscriptionCreatePayload = {
  planId: string;
  planName: string;
  totalCount: number;
  gmailId: string;
  businessId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  businessName?: string;
};

type RazorpaySubscriptionCreateResponse = {
  subscriptionId: string;
  planId: string;
  status: string;
  totalCount: number;
  chargeAt?: number | null;
  shortUrl?: string;
};

type RazorpayConfigResponse = {
  keyId: string;
};

export type RazorpaySubscriptionRecord = {
  id: string;
  provider: string;
  providerSubscriptionId: string;
  providerPaymentId?: string | null;
  status: string;
  planId: string;
  planName: string;
  totalCount: number;
  gmailId: string;
  businessId?: string | null;
  businessName?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
  chargeAt?: number | null;
  currentStart?: number | null;
  currentEnd?: number | null;
  startAt?: number | null;
  endAt?: number | null;
  endedAt?: number | null;
  paidCount?: number | null;
  remainingCount?: number | null;
  latestWebhookEvent?: string | null;
  latestWebhookEventId?: string | null;
  latestWebhookReceivedAt?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type RazorpayVerifyPayload = {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
};

type RazorpayAttachBusinessPayload = {
  gmailId: string;
  businessId: string;
  businessName?: string;
};

type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

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

  return response.json() as Promise<T>;
}

export async function getRazorpayConfig(baseUrl: string) {
  return request<RazorpayConfigResponse>(
    baseUrl,
    "/api/billing/razorpay/config",
  );
}

export async function createRazorpaySubscription(
  baseUrl: string,
  payload: RazorpaySubscriptionCreatePayload,
) {
  return request<RazorpaySubscriptionCreateResponse>(
    baseUrl,
    "/api/billing/razorpay/subscriptions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function verifyRazorpaySubscription(
  baseUrl: string,
  payload: RazorpayVerifyPayload,
) {
  return request<{ verified: boolean }>(
    baseUrl,
    "/api/billing/razorpay/verify",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function attachBusinessToCurrentSubscription(
  baseUrl: string,
  payload: RazorpayAttachBusinessPayload,
) {
  return request(baseUrl, "/api/billing/razorpay/subscriptions/attach-business", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentRazorpaySubscription(params: {
  baseUrl: string;
  gmailId: string;
  businessId?: string | null;
}) {
  const searchParams = new URLSearchParams({
    gmailId: params.gmailId,
  });

  if (params.businessId?.trim()) {
    searchParams.set("businessId", params.businessId.trim());
  }

  return request<RazorpaySubscriptionRecord>(
    params.baseUrl,
    `/api/billing/razorpay/subscriptions/current?${searchParams.toString()}`,
  );
}

export async function ensureRazorpayCheckoutScript() {
  if (Platform.OS !== "web") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("razorpay-checkout-js");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay checkout script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay checkout script."));
    document.body.appendChild(script);
  });

  return Boolean(window.Razorpay);
}

export async function openFallbackCheckoutLink(checkoutLink?: string) {
  if (!checkoutLink) {
    throw new Error("Razorpay checkout fallback link is not configured.");
  }

  if (Platform.OS === "web") {
    window.open(checkoutLink, "_blank", "noreferrer");
    return;
  }

  await Linking.openURL(checkoutLink);
}

export async function openRazorpaySubscriptionCheckout(params: {
  keyId: string;
  subscriptionId: string;
  planName: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  onDismiss?: () => void;
}) {
  if (Platform.OS !== "web") {
    throw new Error("Razorpay checkout is currently enabled in the web app.");
  }

  const loaded = await ensureRazorpayCheckoutScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Razorpay checkout is not available.");
  }

  return new Promise<RazorpayCheckoutSuccess>((resolve, reject) => {
    const razorpay = new window.Razorpay({
      key: params.keyId,
      subscription_id: params.subscriptionId,
      name: "ShopKaBot",
      description: params.description,
      image: "/favicon.ico",
      prefill: {
        name: params.customerName || "",
        email: params.customerEmail || "",
        contact: params.customerContact || "",
      },
      notes: {
        plan_name: params.planName,
        source: "shopkabot-mobile-app",
      },
      theme: {
        color: "#25D366",
      },
      handler: (response: unknown) => {
        resolve(response as RazorpayCheckoutSuccess);
      },
      modal: {
        ondismiss: () => {
          params.onDismiss?.();
          reject(new Error("Razorpay checkout was dismissed."));
        },
      },
    });

    razorpay.on("payment.failed", (response: unknown) => {
      reject(
        new Error(JSON.stringify(response) || "Razorpay payment failed."),
      );
    });

    razorpay.open();
  });
}

