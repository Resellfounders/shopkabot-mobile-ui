import type { Analytics } from "firebase/analytics";
import { Platform } from "react-native";

import { app } from "./firebase";

type TrackingParams = Record<
  string,
  string | number | boolean | null | undefined
>;

interface FacebookPixel {
  (...args: any[]): void;
  callMethod?: (...args: any[]) => void;
  queue?: any[][];
  push?: FacebookPixel;
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: FacebookPixel;
    _fbq?: FacebookPixel;
  }
}

const FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.EXPO_PUBLIC_META_PIXEL_ID;

let analyticsPromise: Promise<Analytics | null> | null = null;
let metaPixelInitialized = false;

function isWebEnvironment() {
  return Platform.OS === "web" && typeof window !== "undefined";
}

function sanitizeTrackingParams(params?: TrackingParams) {
  if (!params) {
    return undefined;
  }

  const sanitized = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

async function getClientAnalytics() {
  if (!isWebEnvironment() || !FIREBASE_MEASUREMENT_ID) {
    return null;
  }

  if (!analyticsPromise) {
    analyticsPromise = import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        const supported = await isSupported();
        return supported ? getAnalytics(app) : null;
      })
      .catch((error) => {
        console.warn("Firebase analytics unavailable:", error);
        return null;
      });
  }

  return analyticsPromise;
}

function ensureMetaPixel() {
  if (!isWebEnvironment() || !META_PIXEL_ID || metaPixelInitialized) {
    return;
  }

  if (typeof window.fbq === "function") {
    window.fbq("init", META_PIXEL_ID);
    metaPixelInitialized = true;
    return;
  }

  const fbq: FacebookPixel = function (...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else if (fbq.queue) {
      fbq.queue.push(args);
    }
  };

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;

  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode?.insertBefore(script, firstScript);

  window.fbq("init", META_PIXEL_ID);
  metaPixelInitialized = true;
}

async function logFirebaseEvent(eventName: string, params?: TrackingParams) {
  const analytics = await getClientAnalytics();

  if (!analytics) {
    return;
  }

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, eventName, sanitizeTrackingParams(params));
}

function trackMetaEvent(
  method: "track" | "trackCustom",
  eventName: string,
  params?: TrackingParams,
) {
  ensureMetaPixel();

  if (!isWebEnvironment() || typeof window.fbq !== "function") {
    return;
  }

  const sanitized = sanitizeTrackingParams(params);
  if (sanitized) {
    window.fbq(method, eventName, sanitized);
    return;
  }

  window.fbq(method, eventName);
}

export function initializeWebTracking() {
  if (!isWebEnvironment()) {
    return;
  }

  ensureMetaPixel();
  void getClientAnalytics();
}

export function trackPageView(params: {
  pagePath: string;
  pageTitle?: string;
  pageLocation?: string;
}) {
  initializeWebTracking();

  const pageLocation =
    params.pageLocation ||
    (isWebEnvironment() ? window.location.href : undefined);

  void logFirebaseEvent("page_view", {
    page_path: params.pagePath,
    page_title: params.pageTitle,
    page_location: pageLocation,
  });
  trackMetaEvent("track", "PageView");
}

export function trackViewContent(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("view_item", params);
  trackMetaEvent("track", "ViewContent", params);
}

export function trackLead(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("generate_lead", params);
  trackMetaEvent("track", "Lead", params);
}

export function trackBeginCheckout(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("begin_checkout", params);
  trackMetaEvent("track", "InitiateCheckout", params);
}

export function trackPurchase(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("purchase", params);
  trackMetaEvent("track", "Purchase", params);
}

export function trackCustomerWon(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("customer_won", params);
  trackMetaEvent("trackCustom", "CUSTOMER_WON", params);
}

export function trackContact(params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent("contact", params);
  trackMetaEvent("track", "Contact", params);
}

export function trackCustomEvent(eventName: string, params?: TrackingParams) {
  initializeWebTracking();
  void logFirebaseEvent(eventName, params);
  trackMetaEvent("trackCustom", eventName, params);
}
