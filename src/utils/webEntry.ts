import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type PublicWebRoute = "sales" | "get-started" | "app";

function normalizePathname(pathname: string) {
  const normalized = pathname.trim().replace(/\/+$/, "");
  return normalized || "/";
}

export function resolvePublicWebRoute(pathname: string): PublicWebRoute {
  const normalized = normalizePathname(pathname).toLowerCase();

  if (normalized === "/") {
    return "app";
  }

  if (normalized === "/sales" || normalized.startsWith("/sales/")) {
    return "sales";
  }

  if (
    normalized === "/get-started" ||
    normalized === "/signup" ||
    normalized === "/pricing" ||
    normalized === "/checkout" ||
    normalized === "/plans"
  ) {
    return "get-started";
  }

  if (normalized === "/app" || normalized.startsWith("/app/")) {
    return "app";
  }

  return "sales";
}

export function getPublicWebRoutePath(route: PublicWebRoute) {
  if (route === "get-started") {
    return "/get-started";
  }

  if (route === "app") {
    return "/";
  }

  return "/sales";
}

export function navigateToPublicWebRoute(
  route: PublicWebRoute,
  options?: { replace?: boolean },
) {
  if (Platform.OS !== "web") {
    return;
  }

  const targetPath = getPublicWebRoutePath(route);
  const method = options?.replace ? "replaceState" : "pushState";
  window.history[method]({}, "", targetPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePublicWebRoute() {
  const [route, setRoute] = useState<PublicWebRoute>(() => {
    if (Platform.OS !== "web") {
      return "app";
    }

    return resolvePublicWebRoute(window.location.pathname);
  });

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const handleLocationChange = () => {
      setRoute(resolvePublicWebRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return route;
}
