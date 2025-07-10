import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from './offline-storage';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced API request with offline support
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Cache successful responses for offline use
    if (method === 'GET' && res.ok) {
      try {
        const responseData = await res.clone().json();
        await cacheResponse(url, responseData);
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }

    return res;
  } catch (error) {
    // If offline or network error, try to serve from cache for GET requests
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
        console.warn('Failed to get cached response:', cacheError);
      }
    }

    // For POST/PUT/PATCH requests when offline, queue for sync
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
        console.error('Failed to queue operation:', queueError);
      }
    }

    throw error;
  }
}

async function cacheResponse(url: string, data: any) {
  // Cache based on the endpoint type
  if (url.includes('/api/jobs/')) {
    const jobId = url.split('/').pop();
    if (jobId && jobId !== 'jobs') {
      await offlineStorage.saveJob({ id: jobId, ...data });
    }
  } else if (url.includes('/api/vhc/')) {
    const jobId = url.split('/').pop();
    if (jobId) {
      await offlineStorage.saveVhcData(jobId, data);
    }
  } else if (url.includes('/api/fit-finish/')) {
    const jobId = url.split('/').pop();
    if (jobId) {
      await offlineStorage.saveFitFinishData(jobId, data);
    }
  }
}

async function getCachedResponse(url: string) {
  // Get cached data based on endpoint type
  if (url.includes('/api/jobs/')) {
    const jobId = url.split('/').pop();
    if (jobId && jobId !== 'jobs') {
      return await offlineStorage.get('jobs', jobId);
    } else if (url === '/api/jobs') {
      return await offlineStorage.getAll('jobs');
    }
  } else if (url.includes('/api/vhc/')) {
    const jobId = url.split('/').pop();
    if (jobId) {
      return await offlineStorage.getVhcData(jobId);
    }
  } else if (url.includes('/api/fit-finish/')) {
    const jobId = url.split('/').pop();
    if (jobId) {
      return await offlineStorage.getFitFinishData(jobId);
    }
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
      
      // Cache the response
      try {
        await cacheResponse(queryKey[0] as string, data);
      } catch (cacheError) {
        console.warn('Failed to cache query response:', cacheError);
      }

      return data;
    } catch (error) {
      // Try to serve from cache if offline or network error
      if (!navigator.onLine || error.message.includes('fetch')) {
        try {
          const cachedData = await getCachedResponse(queryKey[0] as string);
          if (cachedData) {
            return { ...cachedData, _fromCache: true };
          }
        } catch (cacheError) {
          console.warn('Failed to get cached query response:', cacheError);
        }
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when back online
      refetchOnReconnect: true, // Refetch when reconnecting
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations if offline
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});
