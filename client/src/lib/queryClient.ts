import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from './offline-storage';

// Improved error handler with control plane failover
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    console.error('❌ API Error:', {
      url: res.url,
      status: res.status,
      message: text,
    });

    // Gracefully handle disabled control plane
    if (text.includes("Control plane request failed: endpoint is disabled")) {
      throw new Error(`503: Backend feature disabled — ${res.url}`);
    }

    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced API request with offline support
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);

    // Cache successful GET responses
    if (method === 'GET' && res.ok) {
      try {
        const responseData = await res.clone().json();
        await cacheResponse(url, responseData);
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache response:', cacheError);
      }
    }

    return res;
  } catch (error) {
    console.error('🌐 API Request Error:', error);

    if (method === 'GET' && (!navigator.onLine || error.message.includes('fetch'))) {
      try {
        const cachedData = await getCachedResponse(url);
        if (cachedData) {
          return new Response(JSON.stringify({ ...cachedData, _fromCache: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to get cached response:', cacheError);
      }
    }

    if (!navigator.onLine && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        await offlineStorage.addPendingOperation({
          type: getPendingOperationType(method, url),
          data: data,
          endpoint: url,
          method: method
        });
        return new Response(JSON.stringify({
          _queued: true,
          message: 'Request queued for sync when online'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (queueError) {
        console.error('❌ Failed to queue operation:', queueError);
      }
    }

    if (url.includes('/api/user') || url.includes('/api/auth') || url.includes('/api/logout')) {
      throw error;
    }

    throw error;
  }
}

async function cacheResponse(url: string, data: any) {
  const jobId = url.split('/').pop();

  if (url.includes('/api/jobs/') && jobId && jobId !== 'jobs') {
    await offlineStorage.saveJob({ id: jobId, ...data });
  } else if (url.includes('/api/vhc/') && jobId) {
    await offlineStorage.saveVhcData(jobId, data);
  } else if (url.includes('/api/fit-finish/') && jobId) {
    await offlineStorage.saveFitFinishData(jobId, data);
  }
}

async function getCachedResponse(url: string) {
  const jobId = url.split('/').pop();

  if (url.includes('/api/jobs/')) {
    return jobId && jobId !== 'jobs'
      ? await offlineStorage.get('jobs', jobId)
      : await offlineStorage.getAll('jobs');
  } else if (url.includes('/api/vhc/') && jobId) {
    return await offlineStorage.getVhcData(jobId);
  } else if (url.includes('/api/fit-finish/') && jobId) {
    return await offlineStorage.getFitFinishData(jobId);
  }

  return null;
}

function getPendingOperationType(method: string, url: string): any {
  if (url.includes('/api/jobs')) {
    return method === 'POST' ? 'CREATE_JOB' : 'UPDATE_JOB';
  } else if (url.includes('/api/vhc')) {
    return method === 'POST' ? 'CREATE_VHC' : 'UPDATE_VHC';
  } else if (url.includes('/api/fit-finish')) {
    return method === 'POST' ? 'CREATE_FIT_FINISH' : 'UPDATE_FIT_FINISH';
  }
  return 'UNKNOWN';
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();

      try {
        await cacheResponse(queryKey[0] as string, data);
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache query response:', cacheError);
      }

      return data;
    } catch (error) {
      const url = queryKey[0] as string;

      if (!navigator.onLine && !url.includes('/api/user') && !url.includes('/api/auth')) {
        try {
          const cachedData = await getCachedResponse(url);
          if (cachedData) {
            return { ...cachedData, _fromCache: true };
          }
        } catch (cacheError) {
          console.warn('⚠️ Failed to get cached query response:', cacheError);
        }
      }

      console.error('❌ Query error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const isAuthError = error.message.includes('401') || error.message.includes('Unauthorized');
        if (!navigator.onLine || isAuthError) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});
