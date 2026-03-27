const BACKEND_URL = 'http://168.231.78.113:8000';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '/');
  
  if (path === '/token' || path === '/health' || path === '/room' || path === '/logs' || path === '/debug') {
    const targetUrl = `${BACKEND_URL}${path === '/token' ? '/api/token' : path === '/health' ? '/health' : `/api${path}`}`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', request.headers.get('origin') || 'https://orbit-zoom.vercel.app');
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });
    
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
