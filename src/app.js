const DISCORD_INVITE_URL = 'https://discord.gg/QCE2422UxJ';
let products = [];
let activeFilter = 'all';
let csrfToken = '';

const grid = document.querySelector('#productsGrid');
const emptyState = document.querySelector('#emptyState');
const searchInput = document.querySelector('#searchInput');
const filterPanel = document.querySelector('#filterPanel');
const currentView = document.querySelector('#currentView');

const icon = (name) => {
  const icons = {
    arrow: '<svg viewBox="0 0 20 20" fill="none"><path d="M5.5 14.5 14.5 5.5M7 5.5h7.5V13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<span class="card-dots">•••</span>',
  };
  return icons[name] || '';
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function getCsrfToken() {
  const response = await fetch('/api/csrf');
  const payload = await response.json();
  csrfToken = payload.token || '';
  return csrfToken;
}

async function apiFetch(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) await getCsrfToken();
    headers.set('X-CSRF-Token', csrfToken);
  }
  return fetch(url, { ...options, method, headers, credentials: 'same-origin' });
}

function productCard(product, index) {
  return `<article class="product-card card-surface" data-product-id="${escapeHTML(product.id)}" tabindex="0" role="button" aria-label="Open ${escapeHTML(product.name)} on Discord" style="--product-accent:${escapeHTML(product.accent)};--delay:${index * 35}ms">
    <div class="product-top"><div class="product-brand ${escapeHTML(product.iconClass)}">${escapeHTML(product.icon)}</div><span class="status-pill ${escapeHTML(product.statusTone)}"><i></i>${escapeHTML(product.status)}</span>${icon('dots')}</div>
    <div class="product-info"><p class="product-category">${escapeHTML(product.category)}</p><h3>${escapeHTML(product.name)}</h3><p class="product-detail">${escapeHTML(product.detail)}</p></div>
    <div class="product-bottom"><div class="product-price"><strong>$${Number(product.price).toFixed(2)}</strong><span>${escapeHTML(product.period)}</span></div><button class="card-action" data-product="${escapeHTML(product.name)}" aria-label="Open ${escapeHTML(product.name)} on Discord">${icon('arrow')}</button></div>
  </article>`;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = products.filter((product) => {
    const filterMatch = activeFilter === 'all' || product.category === activeFilter;
    const queryMatch = !query || `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(query);
    return filterMatch && queryMatch;
  });
  grid.innerHTML = matches.map(productCard).join('');
  grid.hidden = matches.length === 0;
  emptyState.hidden = matches.length > 0;
  document.querySelectorAll('.product-card').forEach((card) => {
    const openProduct = () => openDiscord(card.querySelector('h3')?.textContent || 'Product');
    card.addEventListener('click', (event) => {
      if (!event.target.closest('.card-dots')) openProduct();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(); }
    });
  });
}

function openDiscord(productName) {
  showToast(`${productName} selected · opening Elite Discord`);
  window.open(DISCORD_INVITE_URL, '_blank', 'noopener,noreferrer');
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  document.querySelector('#toastMessage').textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(window.__eliteToast);
  window.__eliteToast = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Products unavailable');
    const payload = await response.json();
    products = payload.products || [];
    document.querySelector('#productTotal').textContent = String(products.length).padStart(2, '0');
    document.querySelector('#productsCount').textContent = `${products.length} total`;
    renderProducts();
  } catch (error) {
    products = [];
    renderProducts();
    showToast('Products are temporarily unavailable');
  }
}

searchInput.addEventListener('input', renderProducts);
document.querySelectorAll('.filter-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.filter-tab').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  activeFilter = tab.dataset.filter;
  renderProducts();
}));
document.querySelector('#clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'all';
  document.querySelectorAll('.filter-tab').forEach((item) => item.classList.toggle('active', item.dataset.filter === 'all'));
  renderProducts();
});
document.querySelector('#filterToggle').addEventListener('click', () => {
  filterPanel.classList.toggle('collapsed');
  if (!filterPanel.classList.contains('collapsed')) filterPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelector('#addProductButton').addEventListener('click', () => {
  if (document.body.classList.contains('admin-active')) {
    document.querySelector('#adminPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    resetProductForm();
  } else showLoginModal();
});
document.querySelector('#supportButton').addEventListener('click', () => showToast('Support request started'));
document.querySelector('#reviewButton').addEventListener('click', () => {
  document.querySelector('#notifications').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Notifications are up to date');
});
document.querySelector('#notificationButton').addEventListener('click', () => {
  document.querySelector('#notifications').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('3 notifications ready to review');
});

const sidebar = document.querySelector('#sidebar');
const overlay = document.querySelector('#sidebarOverlay');
const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); };
document.querySelector('#menuTrigger').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('visible'); });
document.querySelector('#sidebarClose').addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach((link) => link.classList.remove('active'));
  item.classList.add('active');
  currentView.textContent = item.dataset.view;
  if (window.innerWidth < 900) closeSidebar();
}));

const profileMenu = document.querySelector('#profileMenu');
document.querySelector('#accountButton').addEventListener('click', (event) => {
  event.stopPropagation();
  profileMenu.classList.toggle('visible');
});
document.addEventListener('click', () => profileMenu.classList.remove('visible'));
document.querySelector('#adminAccessMenu').addEventListener('click', (event) => {
  event.stopPropagation();
  profileMenu.classList.remove('visible');
  if (document.body.classList.contains('admin-active')) document.querySelector('#adminPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  else showLoginModal();
});
document.querySelector('#adminAccessInline').addEventListener('click', () => {
  if (document.body.classList.contains('admin-active')) document.querySelector('#adminPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  else showLoginModal();
});

document.querySelector('#guestButton').addEventListener('click', () => { hideLoginModal(); showToast('Continuing as guest · no account required'); });
const loginModal = document.querySelector('#loginModal');
function showLoginModal() { loginModal.classList.add('visible'); document.querySelector('#adminUsername').focus(); }
function hideLoginModal() { loginModal.classList.remove('visible'); document.querySelector('#loginError').hidden = true; }
document.querySelector('#closeLoginModal').addEventListener('click', hideLoginModal);
loginModal.addEventListener('click', (event) => { if (event.target === loginModal) hideLoginModal(); });
document.querySelector('#adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.target.querySelector('button[type="submit"]');
  const errorBox = document.querySelector('#loginError');
  button.disabled = true;
  try {
    const response = await apiFetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: document.querySelector('#adminUsername').value, password: document.querySelector('#adminPassword').value }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Login failed');
    hideLoginModal();
    showAdminMode(payload.username);
    showToast('Creator mode unlocked');
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  } finally { button.disabled = false; }
});

document.querySelector('#adminLogout').addEventListener('click', async () => {
  await apiFetch('/api/admin/logout', { method: 'POST' });
  document.body.classList.remove('admin-active');
  document.querySelector('#adminPanel').hidden = true;
  showToast('Signed out of creator mode');
});

function showAdminMode(username) {
  document.body.classList.add('admin-active');
  document.querySelector('#adminPanel').hidden = false;
  document.querySelector('#adminUserLabel').textContent = username;
  document.querySelector('#adminPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  loadAdminProducts();
}

function resetProductForm() {
  document.querySelector('#editProductId').value = '';
  document.querySelector('#productFormTitle').textContent = 'Add a product';
  document.querySelector('#productForm').reset();
  document.querySelector('#productStatus').value = 'Active';
  document.querySelector('#productPeriod').value = '/ month';
  document.querySelector('#productAccent').value = '#ff3d43';
}
function fillProductForm(product) {
  document.querySelector('#editProductId').value = product.id;
  document.querySelector('#productFormTitle').textContent = `Edit ${product.name}`;
  document.querySelector('#productName').value = product.name;
  document.querySelector('#productKey').value = product.product_key || product.name.toLowerCase().replace(/\s+/g, '-');
  document.querySelector('#productCategory').value = product.category;
  document.querySelector('#productPrice').value = product.price;
  document.querySelector('#productPeriod').value = product.period;
  document.querySelector('#productStatus').value = product.status;
  document.querySelector('#productDetail').value = product.detail;
  document.querySelector('#productAccent').value = product.accent;
  document.querySelector('#adminPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
async function loadAdminProducts() {
  const response = await fetch('/api/products');
  const payload = await response.json();
  const list = document.querySelector('#adminProductsList');
  list.innerHTML = (payload.products || []).map((product) => `<div class="admin-product-row"><div class="admin-product-icon ${escapeHTML(product.iconClass)}">${escapeHTML(product.icon)}</div><div class="admin-product-copy"><strong>${escapeHTML(product.name)}</strong><span>${escapeHTML(product.category)} · $${Number(product.price).toFixed(2)} ${escapeHTML(product.period)}</span></div><button class="admin-edit" data-edit="${escapeHTML(product.id)}">Edit</button><button class="admin-delete" data-delete="${escapeHTML(product.id)}">Delete</button></div>`).join('');
  list.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const product = products.find((item) => String(item.id) === String(button.dataset.edit));
    if (product) fillProductForm(product);
  }));
  list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Delete this product from Elite?')) return;
    const response = await apiFetch(`/api/products/${button.dataset.delete}`, { method: 'DELETE' });
    if (!response.ok) return showToast('Delete failed');
    await loadProducts();
    await loadAdminProducts();
    showToast('Product deleted');
  }));
}

document.querySelector('#cancelProductEdit').addEventListener('click', resetProductForm);
document.querySelector('#productForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#editProductId').value;
  const name = document.querySelector('#productName').value.trim();
  const payload = {
    product_key: document.querySelector('#productKey').value.trim(), name,
    category: document.querySelector('#productCategory').value,
    price: Number(document.querySelector('#productPrice').value || 0),
    period: document.querySelector('#productPeriod').value.trim(),
    status: document.querySelector('#productStatus').value,
    statusTone: document.querySelector('#productStatus').value === 'Renew soon' ? 'orange' : 'green',
    icon: name.slice(0, 1).toUpperCase(), iconClass: document.querySelector('#productCategory').value === 'Creative' ? 'canva' : 'ai',
    detail: document.querySelector('#productDetail').value.trim(), accent: document.querySelector('#productAccent').value
  };
  const response = await apiFetch(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) return showToast(result.error || 'Save failed');
  await loadProducts();
  await loadAdminProducts();
  resetProductForm();
  showToast(id ? 'Product updated' : 'Product added to Elite');
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchInput.focus(); filterPanel.classList.remove('collapsed'); }
  if (event.key === 'Escape') { closeSidebar(); hideLoginModal(); }
});

(async function bootstrap() {
  await getCsrfToken();
  await loadProducts();
  const response = await fetch('/api/me');
  const user = await response.json();
  if (user.authenticated && user.role === 'admin') showAdminMode(user.username);
})();
