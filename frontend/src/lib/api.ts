const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return envUrl || 'http://localhost:5001/api';
    }
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://backend-sigma-seven-41.vercel.app/api';
  }
  return envUrl || 'https://backend-sigma-seven-41.vercel.app/api';
};

const BASE_URL = getApiUrl();

export class ApiError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers);

  // Set Content-Type default
  if (!headers.has('Content-Type') && options.bodyData) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Send cookies automatically
  };

  if (options.bodyData) {
    config.body = JSON.stringify(options.bodyData);
  }

  try {
    const response = await fetch(url, config);
    
    let responseData: any = null;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData || 'API Request failed';
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error occurred', 500);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => 
    request<T>(path, { ...options, method: 'GET' }),
    
  post: <T>(path: string, body?: any, options?: RequestOptions) => 
    request<T>(path, { ...options, method: 'POST', bodyData: body }),
    
  put: <T>(path: string, body?: any, options?: RequestOptions) => 
    request<T>(path, { ...options, method: 'PUT', bodyData: body }),
    
  delete: <T>(path: string, options?: RequestOptions) => 
    request<T>(path, { ...options, method: 'DELETE' }),
};
