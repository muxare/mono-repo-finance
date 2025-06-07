import type { ApiCall } from '../components/ApiTrafficMonitor';

let originalFetch: typeof fetch;
let isInterceptorSetup = false;

export const setupApiInterceptor = () => {
  if (isInterceptorSetup) return;
  
  originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : 
               resource instanceof Request ? resource.url : 
               resource.toString();
    const method = config?.method || 'GET';
    
    // Create API call record
    const apiCall: ApiCall = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      method: method.toUpperCase(),
      url,
      requestData: config?.body ? await parseRequestBody(config.body) : undefined,
    };
    
    const startTime = performance.now();
    
    try {
      // Make the actual request
      const response = await originalFetch(resource, config);
      const endTime = performance.now();
      
      // Clone the response to read the body without consuming it
      const responseClone = response.clone();
      let responseData;
      
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          responseData = await responseClone.json();
        } else if (contentType.includes('text/')) {
          responseData = await responseClone.text();
        }
      } catch {
        // Failed to parse response, that's okay
        responseData = 'Unable to parse response';
      }
      
      // Update API call with response data
      apiCall.status = response.status;
      apiCall.duration = Math.round(endTime - startTime);
      apiCall.responseData = responseData;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('api-call', { detail: apiCall }));
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      
      // Update API call with error
      apiCall.duration = Math.round(endTime - startTime);
      apiCall.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('api-call', { detail: apiCall }));
      
      throw error;
    }
  };
  
  isInterceptorSetup = true;
};

export const removeApiInterceptor = () => {
  if (!isInterceptorSetup || !originalFetch) return;
  
  window.fetch = originalFetch;
  isInterceptorSetup = false;
};

async function parseRequestBody(body: BodyInit | null | undefined): Promise<any> {
  if (!body) return undefined;
  
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  
  if (body instanceof FormData) {
    const formObject: Record<string, any> = {};
    body.forEach((value, key) => {
      if (value instanceof File) {
        formObject[key] = `[File: ${value.name} (${value.size} bytes)]`;
      } else {
        formObject[key] = value;
      }
    });
    return formObject;
  }
  
  if (body instanceof URLSearchParams) {
    const params: Record<string, string> = {};
    body.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }
  
  // For other types, try to convert to string
  try {
    return body.toString();
  } catch {
    return '[Unable to parse request body]';
  }
}
