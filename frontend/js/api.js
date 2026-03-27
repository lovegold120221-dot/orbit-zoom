/**
 * API client for backend communication
 */

const API_BASE_URL = (() => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return `${origin}`;
    }
    if (origin.includes('vercel.app') || origin.includes('github.io')) {
        return "http://168.231.78.113:8000";
    }
    return origin;
})();

console.log('API Base URL:', API_BASE_URL);

class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error [${response.status}]:`, errorText);
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const text = await response.text();
            if (!text) return {};
            
            return JSON.parse(text);
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    async getToken(identity, roomName) {
        return this.request('/api/token', {
            method: 'POST',
            body: JSON.stringify({
                identity,
                roomName,
                canPublish: true,
                canPublishData: true,
                canSubscribe: true,
            }),
        });
    }

    async createRoom(roomName) {
        return this.request('/api/room', {
            method: 'POST',
            body: JSON.stringify({ name: roomName }),
        });
    }

    async logEvent(event) {
        return this.request('/api/logs', {
            method: 'POST',
            body: JSON.stringify(event),
        });
    }

    async healthCheck() {
        return this.request('/health');
    }

    async debugInfo() {
        return this.request('/api/debug');
    }
}

const apiClient = new APIClient();
