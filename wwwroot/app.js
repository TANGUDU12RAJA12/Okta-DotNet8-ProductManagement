/**
 * Main Application Logic (Vanilla JavaScript ES6+) supporting Dual Hybrid Authentication
 */
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM Element Cache
    // ==========================================
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    // Auth Tabs & Forms
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authAlert = document.getElementById('auth-alert');
    const oktaHostedBtn = document.getElementById('okta-hosted-btn');

    // Dashboard Header & User Info
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Product Form Controls
    const formTitle = document.getElementById('form-title');
    const formModeBadge = document.getElementById('form-mode-badge');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productQtyInput = document.getElementById('product-quantity');
    const productSubmitBtn = document.getElementById('product-submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // Product Table Controls
    const searchForm = document.getElementById('search-form');
    const searchIdInput = document.getElementById('search-id-input');
    const reloadBtn = document.getElementById('reload-btn');
    const productsTbody = document.getElementById('products-tbody');
    const tableStateMsg = document.getElementById('table-state-msg');
    const stateMsgText = document.getElementById('state-msg-text');
    const toastContainer = document.getElementById('toast-container');

    // State Variable
    let currentEditingId = null;

    // ==========================================
    // 2. Initialization & Navigation
    // ==========================================
    initApp();

    async function initApp() {
        try {
            // First: Process Okta OAuth tokens if returning from Hosted Page Redirect
            const handled = await ApiService.handleRedirectCallback();
            if (handled) {
                showToast('Successfully authenticated via Okta!', 'success');
            }

            // Second: Check if user has active Bearer token (Okta or Local JWT)
            const isAuth = await ApiService.isAuthenticatedAsync();
            if (isAuth) {
                await showDashboard();
            } else {
                showAuth();
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
            showAuth();
        }

        // Listen for global 401 Unauthorized events from api.js
        window.addEventListener('unauthorized-access', (e) => {
            showToast(e.detail.message || 'Session expired. Please sign in.', 'danger');
            showAuth();
        });
    }

    function showAuth() {
        dashboardView.classList.remove('active');
        dashboardView.classList.add('hidden');

        authView.classList.remove('hidden');
        authView.classList.add('active');

        resetAuthForms();
    }

    async function showDashboard() {
        authView.classList.remove('active');
        authView.classList.add('hidden');

        dashboardView.classList.remove('hidden');
        dashboardView.classList.add('active');

        userDisplayName.textContent = await ApiService.getLoggedInUserAsync();
        
        resetProductForm();
        await loadProducts();
    }

    // ==========================================
    // 3. Auth UI Logic & Event Handlers
    // ==========================================
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        registerForm.classList.add('hidden');
        hideAlert(authAlert);
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        loginForm.classList.add('hidden');
        hideAlert(authAlert);
    });

    function resetAuthForms() {
        loginForm.reset();
        registerForm.reset();
        hideAlert(authAlert);
    }

    // 1. LOCAL SIGN IN (Submits credentials to /api/auth/login)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            showAlert(authAlert, 'Signing in...', 'info');
            
            // Call Local In-Memory Auth API
            const result = await ApiService.loginLocal(username, password);
            
            showToast(`Welcome back, ${result.username || username}!`, 'success');
            await showDashboard();
        } catch (err) {
            console.error('Local Sign In Error:', err);
            showAlert(authAlert, err.message || 'Invalid username or password.', 'danger');
        }
    });

    // 2. LOCAL REGISTER (Submits new credentials to /api/auth/register)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        try {
            showAlert(authAlert, 'Creating account...', 'info');
            await ApiService.registerLocal(username, password);
            
            // Switch to Sign In tab & prefill registered username
            tabLogin.click();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();

            showAlert(authAlert, 'Registration successful! Please sign in with your credentials.', 'success');
            showToast('Account created successfully! Please sign in.', 'success');
        } catch (err) {
            showAlert(authAlert, err.message || 'Registration failed.', 'danger');
        }
    });

    // 3. OKTA HOSTED PAGE REDIRECT BUTTON
    if (oktaHostedBtn) {
        oktaHostedBtn.addEventListener('click', async (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            try {
                showAlert(authAlert, 'Redirecting to Okta Sign-In page...', 'info');
                await ApiService.loginWithOktaRedirect();
            } catch (err) {
                console.error('Okta Redirect Error:', err);
                showAlert(authAlert, err.message || 'Failed to redirect to Okta.', 'danger');
            }
        });
    }

    // LOGOUT (Clears both Local & Okta sessions)
    logoutBtn.addEventListener('click', async () => {
        await ApiService.logout();
        showToast('Logged out successfully.', 'success');
        showAuth();
    });

    // ==========================================
    // 4. Products CRUD & Table Logic
    // ==========================================

    // LOAD ALL PRODUCTS
    async function loadProducts() {
        setTableState(true, 'Loading products from database...');
        try {
            const products = await ApiService.getProducts();
            renderProductsTable(products);
        } catch (err) {
            setTableState(true, `Error loading products: ${err.message}`);
        }
    }

    // RENDER PRODUCTS IN TABLE
    function renderProductsTable(products) {
        productsTbody.innerHTML = '';

        if (!products || products.length === 0) {
            setTableState(true, 'No products found. Add a product to get started!');
            return;
        }

        setTableState(false);

        products.forEach(product => {
            const tr = document.createElement('tr');
            
            const formattedPrice = typeof product.price === 'number' 
                ? `$${product.price.toFixed(2)}` 
                : `$${parseFloat(product.price || 0).toFixed(2)}`;

            const formattedDate = product.createdAt 
                ? new Date(product.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                  }) 
                : 'N/A';

            tr.innerHTML = `
                <td><strong>#${product.id}</strong></td>
                <td><strong>${escapeHtml(product.name)}</strong></td>
                <td>${escapeHtml(product.description || '-')}</td>
                <td><span class="badge badge-info">${formattedPrice}</span></td>
                <td>${product.quantity} units</td>
                <td><small>${formattedDate}</small></td>
                <td class="text-right">
                    <button type="button" class="btn-icon edit-btn" data-id="${product.id}" title="Edit Product">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon delete-btn" data-id="${product.id}" title="Delete Product">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </td>
            `;

            // Attach inline action button handlers
            tr.querySelector('.edit-btn').addEventListener('click', () => handleStartEdit(product));
            tr.querySelector('.delete-btn').addEventListener('click', () => handleDeleteProduct(product.id, product.name));

            productsTbody.appendChild(tr);
        });
    }

    // FORM SUBMIT (CREATE OR UPDATE)
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = productNameInput.value.trim();
        const description = productDescInput.value.trim();
        const price = parseFloat(productPriceInput.value);
        const quantity = parseInt(productQtyInput.value, 10);

        if (!name || isNaN(price) || isNaN(quantity)) {
            showToast('Please fill in all required fields accurately.', 'danger');
            return;
        }

        const productData = { name, description, price, quantity };

        try {
            if (currentEditingId) {
                // UPDATE STATE
                await ApiService.updateProduct(currentEditingId, productData);
                showToast(`Product #${currentEditingId} updated successfully!`, 'success');
            } else {
                // CREATE STATE
                const created = await ApiService.createProduct(productData);
                showToast(`Product '${created.name || name}' created successfully!`, 'success');
            }

            resetProductForm();
            await loadProducts();
        } catch (err) {
            showToast(err.message || 'Failed to save product.', 'danger');
        }
    });

    // EDIT PRODUCT PREFILL
    function handleStartEdit(product) {
        currentEditingId = product.id;
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productDescInput.value = product.description || '';
        productPriceInput.value = product.price;
        productQtyInput.value = product.quantity;

        // Update UI headers
        formTitle.textContent = `Edit Product #${product.id}`;
        formModeBadge.textContent = 'Edit State';
        formModeBadge.className = 'badge badge-warning';
        
        productSubmitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Update Product
        `;
        cancelEditBtn.classList.remove('hidden');

        // Scroll to form if on small screens
        productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // CANCEL EDIT
    cancelEditBtn.addEventListener('click', () => {
        resetProductForm();
    });

    function resetProductForm() {
        currentEditingId = null;
        productForm.reset();
        productIdInput.value = '';

        formTitle.textContent = 'Add New Product';
        formModeBadge.textContent = 'Create State';
        formModeBadge.className = 'badge badge-info';

        productSubmitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg> Save Product
        `;
        cancelEditBtn.classList.add('hidden');
    }

    // DELETE PRODUCT
    async function handleDeleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete Product #${id} ('${name}')?`)) {
            return;
        }

        try {
            await ApiService.deleteProduct(id);
            showToast(`Product #${id} deleted successfully.`, 'success');
            if (currentEditingId === id) {
                resetProductForm();
            }
            await loadProducts();
        } catch (err) {
            showToast(err.message || 'Failed to delete product.', 'danger');
        }
    }

    // SEARCH BY ID
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchId = searchIdInput.value.trim();
        if (!searchId) {
            await loadProducts();
            return;
        }

        setTableState(true, `Searching for Product #${searchId}...`);
        try {
            const product = await ApiService.getProductById(searchId);
            if (product) {
                renderProductsTable([product]);
            } else {
                setTableState(true, `No product found with ID #${searchId}.`);
            }
        } catch (err) {
            setTableState(true, `Product #${searchId} not found.`);
        }
    });

    // RELOAD ALL
    reloadBtn.addEventListener('click', async () => {
        searchIdInput.value = '';
        await loadProducts();
    });

    // ==========================================
    // 5. Helper UI Functions
    // ==========================================
    function setTableState(isLoadingOrEmpty, message = '') {
        if (isLoadingOrEmpty) {
            productsTbody.innerHTML = '';
            tableStateMsg.classList.remove('hidden');
            stateMsgText.textContent = message;
        } else {
            tableStateMsg.classList.add('hidden');
        }
    }

    function showAlert(alertEl, message, type = 'info') {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('hidden');
    }

    function hideAlert(alertEl) {
        alertEl.classList.add('hidden');
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${escapeHtml(message)}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
