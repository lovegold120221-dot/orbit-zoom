/**
 * API client for backend communication
 */

const API_BASE_URL = (() => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
    }
    return 'https://pupils-manner-structures-julian.trycloudflare.com';
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

    async getToken(userId, roomId) {
        return this.request('/api/token', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                room_id: roomId,
            }),
        });
    }

    async healthCheck() {
        return this.request('/health');
    }
}

const apiClient = new APIClient();
