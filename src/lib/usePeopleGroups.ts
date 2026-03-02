"use client";

import { useEffect, useRef, useState } from "react";
import { PeopleGroup } from "@/data/types";

interface State {
  data: PeopleGroup[] | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, PeopleGroup[]>();

export function usePeopleGroups(fipsCode: string | null, limit: number): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!fipsCode) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const cacheKey = fipsCode ? `${fipsCode}:${limit}` : null;

    if (cache.has(cacheKey!)) {
      setState({ data: cache.get(cacheKey!) ?? [], loading: false, error: null });
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 9_000);
    abortRef.current = controller;
    setState({ data: null, loading: true, error: null });

    fetch(`/api/people-groups?fipsCode=${encodeURIComponent(fipsCode)}&limit=${limit}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

          try {
            const errorJson = (await response.json()) as {
              error?: string;
              detail?: string;
            };
            if (errorJson.error) {
              message = errorJson.detail
                ? `${errorJson.error} (${errorJson.detail})`
                : errorJson.error;
            }
          } catch {
            // Ignore JSON parse errors and keep fallback message.
          }

          throw new Error(message);
        }

        return response.json();
      })
      .then((json) => {
        const groups: PeopleGroup[] = Array.isArray(json.data) ? json.data : [];
        cache.set(cacheKey!, groups);
        setState({ data: groups, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") {
          if (!didTimeout) {
            return;
          }

          setState({
            data: null,
            loading: false,
            error: "Request timed out. Please try again.",
          });
          return;
        }

        const message =
          error instanceof Error && error.message
            ? error.message
            : "Failed to load people groups";

        setState({
          data: null,
          loading: false,
          error: message,
        });
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fipsCode, limit]);

  return state;
}
