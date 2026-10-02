const products = [
  { id: 'spotify', name: 'Spotify Premium', category: 'Streaming', price: '$9.99', period: '/ month', status: 'Active', statusTone: 'green', icon: 'S', iconClass: 'spotify', detail: 'Individual · 1 seat', accent: '#1ed760' },
  { id: 'discord', name: 'Discord', category: 'Social', price: '$9.99', period: '/ month', status: 'Active', statusTone: 'green', icon: 'D', iconClass: 'discord', detail: 'Nitro · 1 account', accent: '#7d75ff' },
  { id: 'instagram', name: 'Instagram', category: 'Social', price: '$12.00', period: '/ month', status: 'Renew soon', statusTone: 'orange', icon: '◎', iconClass: 'instagram', detail: 'Pro · 1 profile', accent: '#ff5c8a' },
  { id: 'chatgpt', name: 'ChatGPT', category: 'AI & Tools', price: '$20.00', period: '/ month', status: 'Active', statusTone: 'green', icon: '✳', iconClass: 'chatgpt', detail: 'Plus · Priority access', accent: '#71d6be' },
  { id: 'ai', name: 'AI Tools Pro', category: 'AI & Tools', price: '$29.90', period: '/ month', status: 'Active', statusTone: 'green', icon: '✦', iconClass: 'ai', detail: 'All-in-one · 12 tools', accent: '#ff5361' },
  { id: 'adobe', name: 'Adobe Premium', category: 'Creative', price: '$54.99', period: '/ month', status: 'Active', statusTone: 'green', icon: 'A', iconClass: 'adobe', detail: 'All Apps · 1 seat', accent: '#fa3442' },
  { id: 'canva', name: 'Canva Pro', category: 'Creative', price: '$14.99', period: '/ month', status: 'Active', statusTone: 'green', icon: 'C', iconClass: 'canva', detail: 'Teams · 3 seats', accent: '#21c6a8' },
  { id: 'steam', name: 'Steam Account', category: 'Gaming', price: '$32.99', period: 'one-time', status: 'Active', statusTone: 'green', icon: 'S', iconClass: 'steam', detail: 'Premium library · 42 games', accent: '#8c9aa6' }
];

const icon = (name) => {
  const icons = {
    arrow: '<svg viewBox="0 0 20 20" fill="none"><path d="M5.5 14.5 14.5 5.5M7 5.5h7.5V13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<span class="card-dots">•••</span>',
    eye: '<svg viewBox="0 0 20 20" fill="none"><path d="M2.5 10s2.6-4.2 7.5-4.2 7.5 4.2 7.5 4.2-2.6 4.2-7.5 4.2S2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="1.9" stroke="currentColor" stroke-width="1.4"/></svg>'
  };
  return icons[name] || '';
};

const grid = document.querySelector('#productsGrid');
const emptyState = document.querySelector('#emptyState');
const searchInput = document.querySelector('#searchInput');
const filterPanel = document.querySelector('#filterPanel');
const currentView = document.querySelector('#currentView');
let activeFilter = 'all';

function productCard(product, index) {
  return `<article class="product-card card-surface" style="--product-accent:${product.accent};--delay:${index * 35}ms">
    <div class="product-top"><div class="product-brand ${product.iconClass}">${product.icon}</div><span class="status-pill ${product.statusTone}"><i></i>${product.status}</span>${icon('dots')}</div>
    <div class="product-info"><p class="product-category">${product.category}</p><h3>${product.name}</h3><p class="product-detail">${product.detail}</p></div>
    <div class="product-bottom"><div class="product-price"><strong>${product.price}</strong><span>${product.period}</span></div><button class="card-action" data-product="${product.name}" aria-label="Open ${product.name}">${icon('arrow')}</button></div>
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
  document.querySelectorAll('.card-action').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.product} opened`)));
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  document.querySelector('#toastMessage').textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(window.__eliteToast);
  window.__eliteToast = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

renderProducts();

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
  filterPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
document.querySelector('#addProductButton').addEventListener('click', () => showToast('Product creation is ready for your next drop'));
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
document.querySelector('#profileMenuButton').addEventListener('click', (event) => {
  event.stopPropagation();
  profileMenu.classList.toggle('visible');
});
document.addEventListener('click', () => profileMenu.classList.remove('visible'));

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
    filterPanel.classList.add('expanded');
  }
  if (event.key === 'Escape') closeSidebar();
});
