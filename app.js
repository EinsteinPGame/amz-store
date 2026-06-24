(() => {
  'use strict';

  const WHATSAPP_NUMBER = '6500000000';

  let products = [];
  let filteredProducts = [];
  let activeCategory = '';

  const grid = document.getElementById('product-grid');
  const searchInput = document.getElementById('search');
  const languageFilter = document.getElementById('filter-language');
  const sortSelect = document.getElementById('sort');
  const countEl = document.getElementById('product-count');
  const tabsContainer = document.getElementById('category-tabs');

  const waIcon = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  const CATEGORY_ORDER = ['ETB', 'Booster Box', 'Booster Bundle', 'Loose Pack', 'Special Box', 'UPC', 'Poster Bundle', 'Sleeve', 'Tech Sticker'];

  function formatIDR(amount) {
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
  }

  async function init() {
    try {
      const res = await fetch('products.json');
      products = await res.json();
      buildCategoryTabs();
      applyFilters();
      bindEvents();
    } catch (e) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">!</div><p>Gagal memuat produk.</p></div>`;
      console.error(e);
    }
  }

  function buildCategoryTabs() {
    const cats = [...new Set(products.map(p => p.category))];
    cats.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    const catCounts = {};
    cats.forEach(c => { catCounts[c] = products.filter(p => p.category === c).length; });

    let html = `<button class="tab active" data-cat="">Semua (${products.length})</button>`;
    cats.forEach(c => {
      html += `<button class="tab" data-cat="${escapeHtml(c)}">${escapeHtml(c)} (${catCounts[c]})</button>`;
    });
    tabsContainer.innerHTML = html;

    tabsContainer.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        applyFilters();
      });
    });
  }

  function bindEvents() {
    searchInput.addEventListener('input', debounce(applyFilters, 200));
    languageFilter.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const language = languageFilter.value;
    const sort = sortSelect.value;

    filteredProducts = products.filter(p => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (language && p.language !== language) return false;
      if (search && !p.name.toLowerCase().includes(search) && !(p.series || '').toLowerCase().includes(search)) return false;
      return true;
    });

    switch (sort) {
      case 'price-asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stock':
        filteredProducts.sort((a, b) => b.stock - a.stock);
        break;
    }

    render();
  }

  function getCategoryBadgeClass(cat) {
    const map = {
      'ETB': 'badge-etb', 'Booster Box': 'badge-box', 'Booster Bundle': 'badge-bundle',
      'Loose Pack': 'badge-loose', 'Special Box': 'badge-special', 'UPC': 'badge-upc',
      'Poster Bundle': 'badge-poster', 'Sleeve': 'badge-sleeve', 'Tech Sticker': 'badge-sticker'
    };
    return map[cat] || 'badge-default';
  }

  function getLangBadgeClass(lang) {
    if (!lang) return 'badge-lang';
    if (lang.toLowerCase().includes('english')) return 'badge-en';
    if (lang.toLowerCase().includes('japan')) return 'badge-jp';
    return 'badge-lang';
  }

  function render() {
    countEl.textContent = `${filteredProducts.length} produk`;

    if (filteredProducts.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">:/</div><p>Tidak ada produk yang cocok.</p></div>`;
      return;
    }

    grid.innerHTML = filteredProducts.map(p => {
      const stockClass = p.stock <= 3 ? 'stock-low' : 'stock-ok';
      const stockText = p.stock <= 3 ? `Sisa ${p.stock}` : `Stok: ${p.stock}`;
      const priceIDR = formatIDR(p.price);

      const waMessage = encodeURIComponent(
        `Halo! Saya tertarik untuk memesan:\n\n` +
        `*${p.name}*\n` +
        `Kategori: ${p.category}\n` +
        `Bahasa: ${p.language || '-'}\n` +
        `Harga: ${priceIDR}\n\n` +
        `Apakah masih tersedia?`
      );
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

      return `
        <div class="product-card">
          <div class="badges">
            <span class="badge ${getCategoryBadgeClass(p.category)}">${escapeHtml(p.category)}</span>
            ${p.language ? `<span class="badge ${getLangBadgeClass(p.language)}">${escapeHtml(p.language)}</span>` : ''}
          </div>
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="set-name">${escapeHtml(p.series || '')}</div>
          <div class="price">${priceIDR}</div>
          <div class="stock ${stockClass}">${stockText}</div>
          <a class="order-btn" href="${waUrl}" target="_blank" rel="noopener">
            ${waIcon} Pesan
          </a>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
