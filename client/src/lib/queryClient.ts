import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get auth token (will be set by app initialization)
let getAuthToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(customHeaders || {}),
  };

  // Add auth token for protected routes
  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to get auth token:", error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from query key
    let url = "";
    let params = new URLSearchParams();

    if (Array.isArray(queryKey)) {
      // First element should be the base URL
      url = queryKey[0] as string;
      
      // Process additional elements
      for (let i = 1; i < queryKey.length; i++) {
        const element = queryKey[i];
        
        if (typeof element === 'string') {
          // Append string as path segment
          url += `/${element}`;
        } else if (typeof element === 'object' && element !== null) {
          // Convert object to query parameters
          Object.entries(element).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.append(key, String(value));
            }
          });
        }
      }
      
      // Add query parameters if they exist
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    } else if (typeof queryKey === 'string') {
      url = queryKey;
    } else {
      // Handle edge case where queryKey is neither array nor string
      url = String(queryKey);
    }

    const headers: Record<string, string> = {};
    
    // Add auth token for protected routes
    if (getAuthToken) {
      try {
        const token = await getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Failed to get auth token:", error);
      }
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
