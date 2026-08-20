// She Made - Page Controllers & Router
// Fully separated JavaScript controller for all site pages

window.PageController = {
  // 1. Home Page Controller (index.html)
  initHome() {
    const bsGrid = document.getElementById('best-seller-grid');
    const naGrid = document.getElementById('new-arrivals-grid');
    if (!bsGrid && !naGrid) return;

    const bestSellers = ProductDataService.getBestSellers();
    const newArrivals = ProductDataService.getNewArrivals();

    if (bsGrid) {
      bsGrid.innerHTML = bestSellers.slice(0, 4).map(p => ProductDataService.renderProductCardHtml(p)).join('');
    }

    if (naGrid) {
      naGrid.innerHTML = newArrivals.slice(0, 4).map(p => ProductDataService.renderProductCardHtml(p)).join('');
    }
  },

  // 2. Crochet Collection Controller (crochet.html)
  initCrochet() {
    const container = document.getElementById('crochet-sections-container');
    if (!container) return;

    const grouped = ProductDataService.getCrochetGrouped();
    const keys = Object.keys(grouped);
    if (keys.length === 0) {
      container.innerHTML = `<div class="text-center text-muted py-5"><h4>No crochet products found.</h4></div>`;
      return;
    }

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const showAllTxt = isAr ? 'عرض الكل ←' : 'SHOW ALL →';

    container.innerHTML = keys.map(subKey => {
      const items = grouped[subKey];
      const subAr = items[0]?.subCategoryAr || subKey;
      const sectionTitleEn = `Crochet / ${subKey}`;
      const sectionTitleAr = `كروشيه / ${subAr}`;
      const currentTitle = isAr ? sectionTitleAr : sectionTitleEn;

      return `
        <section class="mb-5">
          <div class="section-header">
            <h2 class="section-title" data-en="${sectionTitleEn}" data-ar="${sectionTitleAr}">${currentTitle}</h2>
            <a href="category.html?parent=Crochet&sub=${encodeURIComponent(subKey)}" class="show-all-link" data-i18n="show_all">${showAllTxt}</a>
          </div>
          <div class="row g-4">
            ${items.slice(0, 4).map(p => ProductDataService.renderProductCardHtml(p)).join('')}
          </div>
        </section>
      `;
    }).join('');
  },

  // 3. Beads Collection Controller (beads.html)
  initBeads() {
    const container = document.getElementById('bead-sections-container');
    if (!container) return;

    const grouped = ProductDataService.getBeadsGrouped();
    const keys = Object.keys(grouped);
    if (keys.length === 0) {
      container.innerHTML = `<div class="text-center text-muted py-5"><h4>No bead products found.</h4></div>`;
      return;
    }

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const showAllTxt = isAr ? 'عرض الكل ←' : 'SHOW ALL →';

    container.innerHTML = keys.map(subKey => {
      const items = grouped[subKey];
      const subAr = items[0]?.subCategoryAr || subKey;
      const sectionTitleEn = `Beads / ${subKey}`;
      const sectionTitleAr = `خرز / ${subAr}`;
      const currentTitle = isAr ? sectionTitleAr : sectionTitleEn;

      return `
        <section class="mb-5">
          <div class="section-header">
            <h2 class="section-title" data-en="${sectionTitleEn}" data-ar="${sectionTitleAr}">${currentTitle}</h2>
            <a href="category.html?parent=Beads&sub=${encodeURIComponent(subKey)}" class="show-all-link" data-i18n="show_all">${showAllTxt}</a>
          </div>
          <div class="row g-4">
            ${items.slice(0, 4).map(p => ProductDataService.renderProductCardHtml(p)).join('')}
          </div>
        </section>
      `;
    }).join('');
  },

  // 4. Category Controller (category.html)
  initCategory() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || '').toLowerCase();
    const parent = params.get('parent') || '';
    const sub = params.get('sub') || '';

    const allProducts = ProductDataService.getProducts();
    let filtered = allProducts;
    let titleEn = 'Collection';
    let titleAr = 'المجموعة';

    if (type === 'bestseller') {
      titleEn = 'Best Seller';
      titleAr = 'الأكثر مبيعاً';
      filtered = allProducts.filter(p => p.isBestSeller);
    } else if (type === 'newarrival') {
      titleEn = 'New Arrivals';
      titleAr = 'وصل حديثاً';
      filtered = allProducts.filter(p => p.isNewArrival);
    } else if (sub) {
      filtered = allProducts.filter(p => p.subCategory.toLowerCase() === sub.toLowerCase());
      if (parent) {
        filtered = filtered.filter(p => p.parentCategory.toLowerCase() === parent.toLowerCase());
      }
      const sample = filtered[0];
      const subAr = sample ? sample.subCategoryAr : sub;
      const parentAr = sample ? sample.parentCategoryAr : (parent.toLowerCase() === 'crochet' ? 'كروشيه' : 'خرز');

      titleEn = parent ? `${parent} / ${sub}` : sub;
      titleAr = parent ? `${parentAr} / ${subAr}` : subAr;
    } else if (parent) {
      filtered = allProducts.filter(p => p.parentCategory.toLowerCase() === parent.toLowerCase());
      const sample = filtered[0];
      titleEn = parent;
      titleAr = sample ? sample.parentCategoryAr : (parent.toLowerCase() === 'crochet' ? 'كروشيه' : 'خرز');
    }

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const titleEl = document.getElementById('category-title');
    if (titleEl) {
      titleEl.setAttribute('data-en', titleEn);
      titleEl.setAttribute('data-ar', titleAr);
      titleEl.textContent = isAr ? titleAr : titleEn;
    }

    document.title = `${isAr ? titleAr : titleEn} | SHE MADE`;

    if (filtered.length > 0) {
      grid.innerHTML = filtered.map(p => ProductDataService.renderProductCardHtml(p)).join('');
    } else {
      grid.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <h4>${isAr ? 'لم يتم العثور على أي منتجات في هذه الفئة.' : 'No products found in this category.'}</h4>
          <a href="index.html" class="btn btn-mauve mt-3" data-i18n="continue_shopping">${isAr ? 'متابعة التسوق' : 'Continue Shopping'}</a>
        </div>
      `;
    }
  },

  // 5. Product Details Controller (details.html)
  _detailProduct: null,
  _detailQuantity: 1,

  initDetails() {
    const detailTitle = document.getElementById('detail-title');
    if (!detailTitle) return;

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id') || '1');

    this._detailProduct = ProductDataService.getProductById(id);
    if (!this._detailProduct) {
      this._detailProduct = ProductDataService.getProductById(1);
    }
    if (!this._detailProduct) return;

    this._detailQuantity = 1;
    const unitPrice = this._detailProduct.price;
    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const currency = isAr ? 'ج.م' : 'EGP';

    // Title & Page Meta
    const titleName = isAr ? (this._detailProduct.nameAr || this._detailProduct.nameEn) : this._detailProduct.nameEn;
    document.title = `${titleName} | SHE MADE`;

    detailTitle.setAttribute('data-en', this._detailProduct.nameEn);
    detailTitle.setAttribute('data-ar', this._detailProduct.nameAr || this._detailProduct.nameEn);
    detailTitle.textContent = titleName;

    // Description
    const descEl = document.getElementById('detail-desc');
    if (descEl) {
      descEl.setAttribute('data-en', this._detailProduct.descriptionEn || '');
      descEl.setAttribute('data-ar', this._detailProduct.descriptionAr || this._detailProduct.descriptionEn || '');
      descEl.textContent = isAr ? (this._detailProduct.descriptionAr || this._detailProduct.descriptionEn) : this._detailProduct.descriptionEn;
    }

    // Main image & thumbs
    const mainImgEl = document.getElementById('detail-main-img');
    if (mainImgEl) {
      mainImgEl.src = this._detailProduct.mainImage || 'images/index.jpg';
      mainImgEl.alt = titleName;
    }

    const thumbsEl = document.getElementById('detail-gallery-thumbs');
    if (thumbsEl && this._detailProduct.images && this._detailProduct.images.length > 1) {
      thumbsEl.innerHTML = this._detailProduct.images.map((img, idx) => `
        <div class="col-3">
          <img src="${img}" class="thumb-img ${idx === 0 ? 'active' : ''}" data-thumb-src="${img}" alt="thumbnail">
        </div>
      `).join('');
    } else if (thumbsEl) {
      thumbsEl.innerHTML = '';
    }

    // Price
    const priceEl = document.getElementById('detail-price');
    if (priceEl) {
      priceEl.setAttribute('data-price', unitPrice);
      priceEl.textContent = `${Math.round(unitPrice)} ${currency}`;
    }

    this.updateDetailsPrice();

    // Related Products
    const related = ProductDataService.getRelatedProducts(this._detailProduct.id, this._detailProduct.parentCategory);
    const relatedGrid = document.getElementById('related-items-grid');
    const relatedSection = document.getElementById('related-items-section');

    if (relatedGrid && related.length > 0) {
      relatedGrid.innerHTML = related.map(p => ProductDataService.renderProductCardHtml(p)).join('');
      if (relatedSection) relatedSection.classList.remove('d-none');
    } else if (relatedSection) {
      relatedSection.classList.add('d-none');
    }

    this.bindDetailsEvents();
  },

  updateDetailsPrice() {
    if (!this._detailProduct) return;
    const qtyInput = document.getElementById('qty-input');
    const calcTotal = document.getElementById('calculated-total');
    if (qtyInput) qtyInput.value = this._detailQuantity;
    if (calcTotal) {
      const total = Math.round(this._detailProduct.price * this._detailQuantity);
      const isAr = (window.CurrentLang || 'ar') === 'ar';
      const currency = isAr ? 'ج.م' : 'EGP';
      calcTotal.textContent = `${total} ${currency}`;
      calcTotal.setAttribute('data-price', total);
    }
  },

  bindDetailsEvents() {
    const btnMinus = document.getElementById('qty-minus');
    const btnPlus = document.getElementById('qty-plus');
    const colorInput = document.getElementById('color-input');
    const colorErrorMsg = document.getElementById('color-error-msg');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const thumbsEl = document.getElementById('detail-gallery-thumbs');

    if (thumbsEl && thumbsEl.getAttribute && !thumbsEl.getAttribute('data-bound')) {
      thumbsEl.setAttribute('data-bound', 'true');
      thumbsEl.addEventListener('click', (e) => {
        const thumb = e.target.closest('[data-thumb-src]');
        if (thumb) {
          const src = thumb.getAttribute('data-thumb-src');
          const mainImg = document.getElementById('detail-main-img');
          if (mainImg) mainImg.src = src;
          thumbsEl.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        }
      });
    }

    if (btnMinus && btnMinus.getAttribute && !btnMinus.getAttribute('data-bound')) {
      btnMinus.setAttribute('data-bound', 'true');
      btnMinus.addEventListener('click', () => {
        if (this._detailQuantity > 1) {
          this._detailQuantity--;
          this.updateDetailsPrice();
        }
      });
    }

    if (btnPlus && btnPlus.getAttribute && !btnPlus.getAttribute('data-bound')) {
      btnPlus.setAttribute('data-bound', 'true');
      btnPlus.addEventListener('click', () => {
        this._detailQuantity++;
        this.updateDetailsPrice();
      });
    }

    if (colorInput && colorInput.getAttribute && !colorInput.getAttribute('data-bound')) {
      colorInput.setAttribute('data-bound', 'true');
      colorInput.addEventListener('input', () => {
        if (colorInput.value.trim() !== '') {
          colorInput.classList.remove('is-invalid');
          if (colorErrorMsg) colorErrorMsg.classList.add('d-none');
        }
      });
    }

    if (addToCartBtn && addToCartBtn.getAttribute && !addToCartBtn.getAttribute('data-bound')) {
      addToCartBtn.setAttribute('data-bound', 'true');
      addToCartBtn.addEventListener('click', () => {
        const color = colorInput ? colorInput.value.trim() : '';
        const notes = document.getElementById('notes-input')?.value || '';

        if (!color) {
          if (colorInput) colorInput.classList.add('is-invalid');
          if (colorErrorMsg) colorErrorMsg.classList.remove('d-none');
          if (colorInput) colorInput.focus();
          return;
        }

        if (colorInput) colorInput.classList.remove('is-invalid');
        if (colorErrorMsg) colorErrorMsg.classList.add('d-none');

        if (this._detailProduct && window.App) {
          App.addToCart(this._detailProduct, color, notes, this._detailQuantity);
        }
      });
    }
  },

  // 6. Search Page Controller (search.html)
  initSearch() {
    const resultsGrid = document.getElementById('search-results-grid');
    if (!resultsGrid) return;

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';

    const queryInput = document.getElementById('navbar-search');
    if (queryInput && q) {
      queryInput.value = q;
    }

    const emptyContainer = document.getElementById('no-results-container');
    const resultsContainer = document.getElementById('results-container');
    const emptyQueryText = document.getElementById('empty-query-text');

    if (!q.trim()) {
      if (emptyContainer) emptyContainer.classList.remove('d-none');
      if (resultsContainer) resultsContainer.classList.add('d-none');
      if (emptyQueryText) emptyQueryText.textContent = '';
      return;
    }

    const results = ProductDataService.searchProducts(q);

    if (results.length === 0) {
      if (emptyContainer) emptyContainer.classList.remove('d-none');
      if (resultsContainer) resultsContainer.classList.add('d-none');
      if (emptyQueryText) emptyQueryText.textContent = q;
    } else {
      if (emptyContainer) emptyContainer.classList.add('d-none');
      if (resultsContainer) resultsContainer.classList.remove('d-none');
      resultsGrid.innerHTML = results.map(p => ProductDataService.renderProductCardHtml(p)).join('');
    }
  },

  // 7. Cart Controller (cart.html)
  initCart() {
    if (document.getElementById('cart-items-list') && window.App) {
      App.initCartPage();
    }
  },

  // 8. Auto-Route based on DOM Presence
  route() {
    this.initHome();
    this.initCrochet();
    this.initBeads();
    this.initCategory();
    this.initDetails();
    this.initSearch();
    this.initCart();
  }
};

// Execute routing immediately
PageController.route();

// Hook language changes to re-render active page
window.onLanguageChanged = function() {
  PageController.route();
};
