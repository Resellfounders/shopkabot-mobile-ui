export type SubscriptionPlan = {
  name: string;
  price: string;
  total: string;
  badge: string;
  description: string;
  highlight: boolean;
  bullets: string[];
  buttonLabel: string;
  planId?: string;
  totalCount?: number;
  contactUrl?: string;
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "authenticated",
  "completed",
]);

export const FRONTEND_APP_SUPPORT_WHATSAPP_LINK =
  "https://wa.me/919768260471?text=" +
  encodeURIComponent(
    "Hi, I need help with my ShopKaBot subscription and WhatsApp onboarding.",
  );

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: "Monthly",
    price: "Rs. 999/month",
    total: "Rs. 999",
    badge: "Good For Trying",
    description: "Best for getting started.",
    highlight: false,
    bullets: [
      "1 month billing",
      "Total: Rs. 999",
      "Great for a first setup",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_MONTHLY_ID,
    totalCount: 1,
    buttonLabel: "Start Monthly Plan",
  },
  {
    name: "6 Months",
    price: "Rs. 899/month",
    total: "Rs. 5,394",
    badge: "Better Value",
    description: "Saves Rs. 600 compared to monthly billing.",
    highlight: true,
    bullets: [
      "6 month billing",
      "Total: Rs. 5,394",
      "Better value for growing teams",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_6_MONTHS_ID,
    totalCount: 1,
    buttonLabel: "Start 6 Month Plan",
  },
  {
    name: "12 Months",
    price: "Rs. 799/month",
    total: "Rs. 9,588",
    badge: "Best Value",
    description: "Saves Rs. 2,400 compared to monthly billing.",
    highlight: false,
    bullets: [
      "12 month billing",
      "Total: Rs. 9,588",
      "Lowest long-term price",
    ],
    planId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_12_MONTHS_ID,
    totalCount: 1,
    buttonLabel: "Start 12 Month Plan",
  },
  {
    name: "Enterprise / Agentic AI",
    price: "Custom Pricing",
    total: "Built for advanced automation",
    badge: "Premium",
    description: "For advanced workflows and custom integrations.",
    highlight: false,
    bullets: [
      "Supports up to 100 customer conversations per day",
      "Need more than 100 conversations per day? Please connect with Enterprise",
      "Advanced agentic AI flows and business logic",
      "CRM, Shopify, API, and internal tool integrations",
    ],
    contactUrl:
      process.env.EXPO_PUBLIC_CONTACT_BOOKING_URL ||
      process.env.EXPO_PUBLIC_CONTACT_WHATSAPP_URL ||
      "",
    buttonLabel: "Talk To Sales",
  },
];

export const paidSubscriptionPlans = subscriptionPlans.filter(
  (plan) => plan.name !== "Enterprise / Agentic AI",
);

export const enterpriseSubscriptionPlan =
  subscriptionPlans.find((plan) => plan.name === "Enterprise / Agentic AI") ||
  null;
