/**
 * Centrally Managed API Service Module (Vanilla JavaScript ES6+)
 * Supports Dual Hybrid Authentication (Local In-Memory JWT Auth + Okta OIDC Auth)
 */
const ApiService = (function () {
    const API_BASE = window.location.origin;
    const LOCAL_TOKEN_KEY = 'jwt_token';
    const LOCAL_USERNAME_KEY = 'auth_username';

    // 1. Initialize Okta Auth JS SDK Instance (Client ID: 0oa16kyxhc2WWyWKS698)
    let oktaAuth = null;
    try {
        if (typeof OktaAuth !== 'undefined') {
            oktaAuth = new OktaAuth({
                issuer: 'https://trial-5762069.okta.com/oauth2/default',
                clientId: '0oa16kyxhc2WWyWKS698',
                redirectUri: API_BASE + '/index.html',
                scopes: ['openid', 'profile', 'email', 'api.read', 'api.write'],
                pkce: true
            });
        }
    } catch (e) {
        console.warn('Okta SDK initialization notice:', e);
    }

    // Local Storage Helpers for Manual Authentication
    function getLocalToken() {
        return localStorage.getItem(LOCAL_TOKEN_KEY);
    }

    function setLocalToken(token) {
        if (token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(LOCAL_TOKEN_KEY);
        }
    }

    function getLocalUsername() {
        return localStorage.getItem(LOCAL_USERNAME_KEY) || '';
    }

    function setLocalUsername(username) {
        if (username) {
            localStorage.setItem(LOCAL_USERNAME_KEY, username);
        } else {
            localStorage.removeItem(LOCAL_USERNAME_KEY);
        }
    }

    function removeLocalSession() {
        localStorage.removeItem(LOCAL_TOKEN_KEY);
        localStorage.removeItem(LOCAL_USERNAME_KEY);
    }

    // Get whichever token is currently active (Okta Access Token OR Local JWT Token)
    async function getActiveBearerToken() {
        // First priority: Check Okta Access Token
        if (oktaAuth) {
            try {
                const accessToken = await oktaAuth.tokenManager.get('accessToken');
                if (accessToken && accessToken.accessToken) {
                    return accessToken.accessToken;
                }
            } catch (e) {
                // Ignore Okta token lookup errors
            }
        }

        // Second priority: Check Local In-Memory JWT Token
        return getLocalToken();
    }

    // Generic HTTP Request Handler with Automatic Authorization Bearer Header
    async function request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const bearerToken = await getActiveBearerToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                removeLocalSession();
                if (oktaAuth) oktaAuth.tokenManager.clear();

                window.dispatchEvent(new CustomEvent('unauthorized-access', {
                    detail: { message: 'Session expired or unauthorized. Please sign in.' }
                }));
                throw new Error('Unauthorized. Please sign in.');
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return true;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.title || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    return {
        // 1. LOCAL MANUAL AUTHENTICATION METHODS
        registerLocal: async function (username, password) {
            return await request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
        },

        loginLocal: async function (username, password) {
            const data = await request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (data && data.token) {
                setLocalToken(data.token);
                setLocalUsername(data.username || username);
            }
            return data;
        },

        // 2. OKTA OIDC HOSTED REDIRECT AUTHENTICATION METHOD
        loginWithOktaRedirect: async function () {
            if (!oktaAuth) throw new Error('Okta SDK not initialized.');
            
            // Build authorization URL directly and navigate browser immediately
            try {
                const redirectUrl = await oktaAuth.token.getRedirectUrl({
                    scopes: ['openid', 'profile', 'email', 'api.read', 'api.write']
                });
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                    return;
                }
            } catch (e) {
                console.warn('getRedirectUrl notice:', e);
            }

            // Fallback to Okta Auth SDK standard redirect
            await oktaAuth.token.getWithRedirect({
                scopes: ['openid', 'profile', 'email', 'api.read', 'api.write']
            });
        },

        // Handle OAuth Redirect Callback on Return
        handleRedirectCallback: async function () {
            if (!oktaAuth) return false;
            
            if (window.location.hash.includes('token') || window.location.hash.includes('code') || window.location.search.includes('code')) {
                try {
                    const res = await oktaAuth.token.parseFromUrl();
                    const tokens = res.tokens || res;

                    if (tokens.accessToken) oktaAuth.tokenManager.add('accessToken', tokens.accessToken);
                    if (tokens.idToken) oktaAuth.tokenManager.add('idToken', tokens.idToken);
                    
                    // Clear hash and query tokens from address bar
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return true;
                } catch (err) {
                    console.error('Okta Token Exchange Error:', err);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    throw err;
                }
            }
            return false;
        },

        // Logout from both Local Session & Okta Session
        logout: async function () {
            removeLocalSession();

            if (oktaAuth) {
                await oktaAuth.tokenManager.clear();
                try {
                    await oktaAuth.signOut({ postLogoutRedirectUri: API_BASE + '/index.html' });
                } catch (e) {
                    console.log('Cleared local tokens.', e);
                }
            }
        },

        isAuthenticatedAsync: async function () {
            const token = await getActiveBearerToken();
            return !!token;
        },

        getLoggedInUserAsync: async function () {
            // Check Okta ID Token claim first
            if (oktaAuth) {
                try {
                    const idToken = await oktaAuth.tokenManager.get('idToken');
                    if (idToken && idToken.claims) {
                        return idToken.claims.name || idToken.claims.preferred_username || idToken.claims.sub || 'Okta User';
                    }
                } catch (e) {
                    // Ignore
                }
            }

            // Fallback to Local username
            return getLocalUsername() || 'User';
        },

        // Products CRUD API Methods
        getProducts: async function () {
            return await request('/api/products');
        },

        getProductById: async function (id) {
            return await request(`/api/products/${id}`);
        },

        createProduct: async function (productData) {
            return await request('/api/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        },

        updateProduct: async function (id, productData) {
            return await request(`/api/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        },

        deleteProduct: async function (id) {
            return await request(`/api/products/${id}`, {
                method: 'DELETE'
            });
        }
    };
})();
