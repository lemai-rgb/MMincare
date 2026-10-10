"use client";

import NextLink from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";

// The default runtime is the unchanged application. Only the /demo subtree
// supplies an in-memory transport/navigation adapter; no global fetch patch.
export type AppRuntime = {
  request: typeof fetch;
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (href: string, replace?: boolean) => void;
  refresh: () => void;
  href: (href: string) => string;
  attachmentUrl: (id: string) => string | null;
  reset: () => void;
};
export const AppRuntimeContext = createContext<AppRuntime | null>(null);
const browserRequest: typeof fetch = (...args) => fetch(...args);
export const useAppRuntime = () => useContext(AppRuntimeContext);
export function useRuntimeRequest() { return useAppRuntime()?.request ?? browserRequest; }
export function useRuntimeJson() {
  const request = useRuntimeRequest();
  return useMemo(() => (input: RequestInfo | URL, init?: RequestInit, timeout?: number) =>
    fetchJsonWithTimeout(input, init, timeout, request), [request]);
}
export function useRuntimeRouter() {
  const router = useRouter();
  const runtime = useAppRuntime();
  return useMemo(() => runtime ? {
    push: (href: string) => runtime.navigate(href),
    replace: (href: string) => runtime.navigate(href, true),
    refresh: runtime.refresh,
  } : router, [router, runtime]);
}
export function useRuntimePathname() {
  const pathname = usePathname();
  return useAppRuntime()?.pathname ?? pathname;
}
export function useRuntimeSearchParams() {
  const query = useSearchParams();
  return useAppRuntime()?.searchParams ?? query;
}
export function AppLink({ href, onClick, ...props }: ComponentProps<typeof NextLink>) {
  const runtime = useAppRuntime();
  if (!runtime || typeof href !== "string" || href === "/") return <NextLink {...props} href={href} onClick={onClick} />;
  return <NextLink {...props} href={runtime.href(href)} prefetch={false} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    event.preventDefault();
    runtime.navigate(href);
  }} />;
}
