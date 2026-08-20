// She Made - Application Logic, Cart Operations & WhatsApp Integration (Static / Client-Side)
window.App = {
  // 1. Cart LocalStorage Management
  getCart() {
    try {
      return JSON.parse(localStorage.getItem('shemade_cart') || '[]');
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem('shemade_cart', JSON.stringify(cart));
    if (typeof updateCartBadge === 'function') {
      updateCartBadge();
    }
  },

  addToCart(product, color, notes, quantity) {
    if (!color || color.trim() === '') {
      return false;
    }

    const finalNotes = (notes && notes.trim() !== '') ? notes.trim() : 'NAN';
    const cart = this.getCart();
    const qty = parseInt(quantity) || 1;

    const newItem = {
      cartItemId: Date.now() + '_' + Math.floor(Math.random() * 1000),
      productID: product.id || product.productID,
      productName: product.nameEn || product.productName,
      productNameAr: product.nameAr || product.productNameAr || product.nameEn || product.productName,
      price: product.price,
      mainImage: product.mainImage || 'images/index.jpg',
      color: color.trim(),
      notes: finalNotes,
      quantity: qty,
      totalPrice: (product.price * qty)
    };

    cart.push(newItem);
    this.saveCart(cart);

    const lang = window.CurrentLang || 'ar';
    const dict = window.I18N_DICTIONARY ? (window.I18N_DICTIONARY[lang] || window.I18N_DICTIONARY.ar) : null;
    const msg = dict ? dict.product_added : (lang === 'ar' ? 'تمت إضافة المنتج للسلة بنجاح!' : 'Product successfully added to cart!');
    const viewCartTxt = dict ? dict.view_cart : (lang === 'ar' ? 'عرض السلة' : 'View Cart');

    this.showToast(msg, 'cart.html', viewCartTxt);
    return true;
  },

  removeFromCart(cartItemId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.cartItemId != cartItemId);
    this.saveCart(cart);
    this.updateCartDisplay();
  },

  clearCart() {
    localStorage.removeItem('shemade_cart');
    if (typeof updateCartBadge === 'function') {
      updateCartBadge();
    }
  },

  showToast(message, linkUrl = 'cart.html', linkText = 'عرض السلة') {
    let container = document.getElementById('shemade-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shemade-toast-container';
      container.className = 'shemade-toast-container';
      document.body.appendChild(container);
    }

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const arrow = isAr ? '&larr;' : '&rarr;';

    const toast = document.createElement('div');
    toast.className = 'shemade-toast';
    toast.innerHTML = `
      <div class="shemade-toast-icon">
        <i class="fa-solid fa-bag-shopping"></i>
      </div>
      <div class="shemade-toast-body">
        <div class="shemade-toast-title">${message}</div>
        <a href="${linkUrl}" class="shemade-toast-btn">${linkText} ${arrow}</a>
      </div>
      <button type="button" class="shemade-toast-close" aria-label="Close">&times;</button>
      <div class="shemade-toast-progress"></div>
    `;

    container.appendChild(toast);

    const closeToast = () => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };

    toast.querySelector('.shemade-toast-close').addEventListener('click', closeToast);
    setTimeout(closeToast, 4500);
  },

  // 2. Cart Page Initialization & Live Calculation
  currentDeliveryFee: 0,
  currentDeliveryAreaName: '',
  availableDatesList: [],

  initCartPage() {
    this.updateCartDisplay();
    this.loadDeliveryDates();
    this.bindCartFormEvents();
  },

  updateCartDisplay() {
    const emptyContainer = document.getElementById('empty-cart-container');
    const populatedContainer = document.getElementById('populated-cart-container');
    const itemsList = document.getElementById('cart-items-list');

    if (!emptyContainer || !populatedContainer || !itemsList) return;

    const cart = this.getCart();

    if (!cart || cart.length === 0) {
      emptyContainer.classList.remove('d-none');
      populatedContainer.classList.add('d-none');
      return;
    }

    emptyContainer.classList.add('d-none');
    populatedContainer.classList.remove('d-none');

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const dict = (window.I18N_DICTIONARY && window.I18N_DICTIONARY[window.CurrentLang]) || window.I18N_DICTIONARY.ar;
    const currency = isAr ? 'ج.م' : 'EGP';

    let subtotal = 0;

    itemsList.innerHTML = cart.map(item => {
      subtotal += item.totalPrice;
      let displayName = item.productName;
      if (isAr) {
        displayName = (item.productNameAr && item.productNameAr !== item.productName)
          ? item.productNameAr
          : (window.getProductArabicName ? window.getProductArabicName(item.productName) : item.productName);
      }

      return `
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white product-cart-item-card">
          <div class="row align-items-center g-3">
            
            <!-- Image Column -->
            <div class="col-3 col-md-2">
              <img src="${item.mainImage}" alt="${displayName}" class="img-fluid rounded-3 object-fit-cover w-100 cart-item-img">
            </div>
            
            <!-- Product Info Column -->
            <div class="col-9 col-md-6">
              <h5 class="fw-bold mb-1 font-serif fs-6">${displayName}</h5>
              <p class="small text-muted mb-1"><strong>${dict.color_label || 'اللون'}:</strong> ${item.color}</p>
              <p class="small text-muted mb-0"><strong>${dict.notes_cart_label || 'ملاحظات'}:</strong> ${item.notes && item.notes !== 'NAN' ? item.notes : '-'}</p>
            </div>
            
            <!-- Quantity, Price & Remove Column -->
            <div class="col-12 col-md-4 mt-2 mt-md-0">
              <!-- Quantity and Price on Same Horizontal Line -->
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="small text-muted">${dict.qty_cart_label || 'الكمية'}: <strong class="text-dark">${item.quantity}</strong></span>
                <span class="fw-bold text-mauve fs-6">${Math.round(item.totalPrice)} ${currency}</span>
              </div>
              
              <!-- Remove Button Directly Underneath on Same Vertical Line -->
              <div class="text-end">
                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="App.removeFromCart('${item.cartItemId}')">
                  <i class="fa-solid fa-trash me-1"></i> ${dict.remove || 'إزالة'}
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
    }).join('');

    this.recalculateTotals(subtotal);
  },

  recalculateTotals(subtotalAmount) {
    const cart = this.getCart();
    let subtotal = subtotalAmount !== undefined ? subtotalAmount : cart.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const currency = isAr ? 'ج.م' : 'EGP';

    const deliveryFee = this.currentDeliveryFee || 0;
    const grandTotal = subtotal + deliveryFee;
    const deposit = Math.round(grandTotal * 0.5);
    const remaining = grandTotal - deposit;

    const subtotalEl = document.getElementById('cart-subtotal-val');
    const deliveryEl = document.getElementById('cart-delivery-val');
    const grandTotalEl = document.getElementById('cart-grand-total');
    const depositEl = document.getElementById('cart-deposit-val');
    const remainingEl = document.getElementById('cart-remaining-val');

    if (subtotalEl) subtotalEl.textContent = `${Math.round(subtotal)} ${currency}`;
    if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? (isAr ? '0 ج.م (مجاناً)' : '0 EGP (Free)') : `${deliveryFee} ${currency}`;
    if (grandTotalEl) grandTotalEl.textContent = `${Math.round(grandTotal)} ${currency}`;
    if (depositEl) depositEl.textContent = `${deposit} ${currency}`;
    if (remainingEl) remainingEl.textContent = `${remaining} ${currency}`;

    this.validateCheckoutForm();
  },

  // 3. Load Available Delivery Dates (Starts after 5 days lead time)
  loadDeliveryDates() {
    const dateSelect = document.getElementById('delivery-date-select');
    if (!dateSelect) return;

    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const chooseTxt = isAr ? '-- اختاري موعد التسليم المناسب --' : '-- Choose Delivery Date --';

    // Generate smart candidate dates starting from (Today + 5 full days)
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let candidateDates = [];
    let start = new Date();
    start.setDate(start.getDate() + 5); // 5 full preparation days

    for (let i = 0; i < 14; i++) {
      let cur = new Date();
      cur.setDate(start.getDate() + i);

      let iso = cur.toISOString().split('T')[0];
      let dayNameAr = daysAr[cur.getDay()];
      let monthNameAr = monthsAr[cur.getMonth()];
      let labelAr = `${dayNameAr} ${cur.getDate()} ${monthNameAr} ${cur.getFullYear()}`;

      let dayNameEn = daysEn[cur.getDay()];
      let monthNameEn = monthsEn[cur.getMonth()];
      let labelEn = `${dayNameEn}, ${cur.getDate()} ${monthNameEn} ${cur.getFullYear()}`;

      candidateDates.push({ isoDate: iso, labelAr: labelAr, labelEn: labelEn });
    }

    this.availableDatesList = candidateDates;

    dateSelect.innerHTML = `<option value="" disabled selected>${chooseTxt}</option>` +
      this.availableDatesList.map(d => {
        const label = isAr ? d.labelAr : d.labelEn;
        return `<option value="${d.isoDate}" data-label-ar="${d.labelAr}" data-label-en="${d.labelEn}">${label}</option>`;
      }).join('');
  },

  // 4. Form Events, Area Selection & Live Validation
  bindCartFormEvents() {
    const phoneInput = document.getElementById('customer-phone');
    const areaSelect = document.getElementById('delivery-area-select');
    const customAddressContainer = document.getElementById('custom-address-container');
    const customAddressText = document.getElementById('custom-address-text');
    const btnGps = document.getElementById('btn-detect-gps');
    const dateSelect = document.getElementById('delivery-date-select');
    const termsCheck = document.getElementById('terms-checkbox');
    const orderBtn = document.getElementById('whatsapp-order-btn');

    if (!areaSelect) return;

    // Delivery Area Change Handler
    areaSelect.addEventListener('change', () => {
      const selectedOption = areaSelect.options[areaSelect.selectedIndex];
      const fee = parseInt(selectedOption.getAttribute('data-fee')) || 0;
      const isAr = (window.CurrentLang || 'ar') === 'ar';
      this.currentDeliveryAreaName = isAr ? (selectedOption.getAttribute('data-ar') || selectedOption.text) : (selectedOption.getAttribute('data-en') || selectedOption.text);

      if (areaSelect.value === 'other') {
        customAddressContainer.classList.remove('d-none');
        this.currentDeliveryFee = 0;
        this.parseCustomAreaText(customAddressText ? customAddressText.value : '');
      } else {
        customAddressContainer.classList.add('d-none');
        this.currentDeliveryFee = fee;
      }

      this.recalculateTotals();
    });

    // Custom Address Text Input Listener for Area matching
    if (customAddressText) {
      customAddressText.addEventListener('input', () => {
        this.parseCustomAreaText(customAddressText.value);
        this.recalculateTotals();
      });
    }

    // GPS Geolocation Handler for Alexandria
    if (btnGps) {
      btnGps.addEventListener('click', () => {
        const gpsStatus = document.getElementById('gps-status');
        const isAr = (window.CurrentLang || 'ar') === 'ar';
        const dict = window.I18N_DICTIONARY ? (window.I18N_DICTIONARY[window.CurrentLang] || window.I18N_DICTIONARY.ar) : {};
        const currency = isAr ? 'ج.م' : 'EGP';

        if (!navigator.geolocation) {
          if (gpsStatus) gpsStatus.textContent = dict.gps_not_supported || (isAr ? 'متصفحك لا يدعم تحديد الموقع الجغرافي.' : 'Your browser does not support geolocation.');
          return;
        }

        if (gpsStatus) gpsStatus.textContent = dict.gps_detecting || (isAr ? 'جاري تحديد موقعك بالإسكندرية... ⏳' : 'Detecting your location in Alexandria... ⏳');

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            // Accurate Alexandria Geographic Zones Analysis
            let zoneName = '';
            let fee = 35;

            // 1. Far West: Borg El Arab & El Amreya (lng < 29.75)
            if (lng < 29.75) {
              zoneName = isAr ? 'برج العرب / العامرية' : 'Borg El Arab / El Amreya';
              fee = 75;
            }
            // 2. West Alex: Agamy, Bitash, Hanoville, Dekheila (29.75 <= lng < 29.87)
            else if (lng < 29.87) {
              zoneName = isAr ? 'غرب إسكندرية / العجمي والبيطاش' : 'West Alexandria / Agamy & Bitash';
              fee = 55;
            }
            // 3. Far East: Abu Qir & Tosson (lng > 30.07)
            else if (lng > 30.07) {
              zoneName = isAr ? 'أبو قير وطوسون' : 'Abu Qir & Tosson';
              fee = 45;
            }
            // 4. East Suburbs: Montaza & Maamoura (30.045 < lng <= 30.07)
            else if (lng > 30.045) {
              zoneName = isAr ? 'المنتزه والمعمورة' : 'Montaza & Maamoura';
              fee = 45;
            }
            // 5. East Coast Core: Sidi Bishr, Miami, Asafra, Mandara (29.98 <= lng <= 30.045)
            else if (lng >= 29.98) {
              zoneName = isAr ? 'سيدي بشر / ميامي والعصافرة' : 'Sidi Bishr / Miami & Asafra';
              fee = 35;
            }
            // 6. Central & East: Smouha, Sidi Gaber, San Stefano, Raml, Moharram Bek (29.87 <= lng < 29.98)
            else {
              zoneName = isAr ? 'وسط وشرق إسكندرية (سموحة / سيدي جابر / الرمل)' : 'Central & East Alex (Smouha / Sidi Gaber / Raml)';
              fee = 35;
            }

            this.currentDeliveryFee = fee;
            this.currentDeliveryAreaName = isAr ? `تحديد GPS (${zoneName})` : `GPS Location (${zoneName})`;

            const gpsInputPrefix = dict.gps_input_prefix || (isAr ? 'موقع GPS:' : 'GPS Location:');
            const gpsZonePrefix = dict.gps_zone_prefix || (isAr ? 'منطقة' : 'Zone:');
            const gpsDetectedPrefix = dict.gps_detected_prefix || (isAr ? 'تم تحديد المنطقة:' : 'Area detected:');
            const gpsFeeSuffix = dict.gps_fee_suffix || (isAr ? 'سعر التوصيل:' : 'Delivery fee:');

            if (customAddressText) {
              customAddressText.value = `${gpsInputPrefix} [${lat.toFixed(4)}, ${lng.toFixed(4)}] - ${gpsZonePrefix} ${zoneName}`;
            }

            if (gpsStatus) {
              gpsStatus.innerHTML = `<span class="text-success"><i class="fa-solid fa-check me-1"></i> ${gpsDetectedPrefix} ${zoneName} (${gpsFeeSuffix} ${fee} ${currency})</span>`;
            }

            this.recalculateTotals();
          },
          (err) => {
            if (gpsStatus) gpsStatus.textContent = dict.gps_failed || (isAr ? 'تعذر الحصول على الموقع، يرجى كتابة اسم منطقتك يدوياً.' : 'Unable to retrieve location, please type your area manually.');
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    // Phone Input Filtering & Strict Numeric 11 digits
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 11);
        this.validateCheckoutForm();
      });
    }

    // Form inputs validation triggering button state
    [dateSelect, termsCheck].forEach(el => {
      if (el) {
        el.addEventListener('input', () => this.validateCheckoutForm());
        el.addEventListener('change', () => this.validateCheckoutForm());
      }
    });

    // WhatsApp Order Action Trigger
    if (orderBtn) {
      orderBtn.addEventListener('click', () => {
        this.submitOrderAndOpenWhatsApp();
      });
    }
  },

  parseCustomAreaText(text) {
    if (!text || text.trim() === '') {
      this.currentDeliveryFee = 0;
      return;
    }
    const lower = text.trim().toLowerCase();
    const isAr = (window.CurrentLang || 'ar') === 'ar';
    const currency = isAr ? 'ج.م' : 'EGP';

    // Zone 4: Far West (75 EGP)
    if (lower.includes('برج العرب') || lower.includes('عامرية') || lower.includes('كينج') || lower.includes('مريوط') || lower.includes('مرغم') ||
        lower.includes('borg') || lower.includes('amreya') || lower.includes('king') || lower.includes('marriott') || lower.includes('merghem')) {
      this.currentDeliveryFee = 75;
      this.currentDeliveryAreaName = isAr ? `برج العرب والعامرية (75 ${currency})` : `Borg El Arab & El Amreya (75 ${currency})`;
    }
    // Zone 3: West Alex / Agamy (55 EGP)
    else if (lower.includes('عجمي') || lower.includes('بيطاش') || lower.includes('هانوفيل') || lower.includes('دخيلة') || lower.includes('أبو تلات') || lower.includes('مكس') || lower.includes('نخيل') || lower.includes('أكتوبر') || lower.includes('ورديان') || lower.includes('قبارى') ||
             lower.includes('agamy') || lower.includes('bitash') || lower.includes('hanoville') || lower.includes('dekeila') || lower.includes('talat') || lower.includes('max') || lower.includes('nakheel') || lower.includes('wardian') || lower.includes('qabbari')) {
      this.currentDeliveryFee = 55;
      this.currentDeliveryAreaName = isAr ? `غرب إسكندرية والعجمي (55 ${currency})` : `West Alexandria & Agamy (55 ${currency})`;
    }
    // Zone 2: Far East Suburbs (Montaza, Maamoura, Abu Qir, Tosson: 45 EGP)
    else if (lower.includes('أبو قير') || lower.includes('طوسون') || lower.includes('معمورة') || lower.includes('منتزه') || lower.includes('عوائد') || lower.includes('فلكي') || lower.includes('زويدة') ||
             lower.includes('abu qir') || lower.includes('abukir') || lower.includes('tosson') || lower.includes('mamoura') || lower.includes('montaza') || lower.includes('awayed') || lower.includes('falaki')) {
      this.currentDeliveryFee = 45;
      this.currentDeliveryAreaName = isAr ? `أطراف شرق (المنتزه / أبو قير) (45 ${currency})` : `East Suburbs (Montaza / Abu Qir) (45 ${currency})`;
    }
    // Zone 1: Core East (Sidi Bishr, Miami, Asafra, Mandara: 35 EGP)
    else if (lower.includes('سيدي بشر') || lower.includes('ميامي') || lower.includes('عصافرة') || lower.includes('مندرة') ||
             lower.includes('sidi bishr') || lower.includes('bishr') || lower.includes('miami') || lower.includes('asafra') || lower.includes('mandara')) {
      this.currentDeliveryFee = 35;
      this.currentDeliveryAreaName = isAr ? `سيدي بشر وميامي (35 ${currency})` : `Sidi Bishr & Miami (35 ${currency})`;
    }
    // Zone 1: Central & East (Smouha, Sidi Gaber, Raml, Loran, Stanley: 35 EGP)
    else {
      this.currentDeliveryFee = 35;
      this.currentDeliveryAreaName = isAr ? `وسط وشرق إسكندرية (35 ${currency})` : `Central & East Alexandria (35 ${currency})`;
    }
  },

  validateCheckoutForm() {
    const phoneInput = document.getElementById('customer-phone');
    const areaSelect = document.getElementById('delivery-area-select');
    const customAddressText = document.getElementById('custom-address-text');
    const dateSelect = document.getElementById('delivery-date-select');
    const termsCheck = document.getElementById('terms-checkbox');
    const orderBtn = document.getElementById('whatsapp-order-btn');
    const phoneError = document.getElementById('phone-error');

    if (!orderBtn) return;

    const phone = phoneInput ? phoneInput.value.trim() : '';
    // Strict Egyptian Mobile Regex: 010, 011, 012, 015 followed by 8 digits = 11 digits total
    const isPhoneValid = /^01[0125][0-9]{8}$/.test(phone);

    if (phoneError) {
      if (phone.length > 0 && !isPhoneValid) {
        phoneError.classList.remove('d-none');
        if (phoneInput) phoneInput.classList.add('is-invalid');
      } else {
        phoneError.classList.add('d-none');
        if (phoneInput) phoneInput.classList.remove('is-invalid');
      }
    }

    let isAreaValid = areaSelect && areaSelect.value !== '';
    if (areaSelect && areaSelect.value === 'other') {
      isAreaValid = customAddressText && customAddressText.value.trim() !== '';
    }

    const isDateValid = dateSelect && dateSelect.value !== '';
    const isTermsValid = termsCheck && termsCheck.checked;
    const hasItems = this.getCart().length > 0;

    const isValid = isPhoneValid && isAreaValid && isDateValid && isTermsValid && hasItems;
    orderBtn.disabled = !isValid;
  },

  // 5. Submit Order Client-Side & Generate WhatsApp Message
  submitOrderAndOpenWhatsApp() {
    const cart = this.getCart();
    if (!cart || cart.length === 0) return;

    const phoneInput = document.getElementById('customer-phone');
    const areaSelect = document.getElementById('delivery-area-select');
    const customAddressText = document.getElementById('custom-address-text');
    const dateSelect = document.getElementById('delivery-date-select');
    const orderBtn = document.getElementById('whatsapp-order-btn');

    const phone = phoneInput.value.trim();
    const isAr = (window.CurrentLang || 'ar') === 'ar';

    let deliveryArea = this.currentDeliveryAreaName || (areaSelect.options[areaSelect.selectedIndex]?.text || 'الإسكندرية');
    let detailedAddress = (areaSelect.value === 'other' && customAddressText) ? customAddressText.value.trim() : deliveryArea;

    let selectedDateOption = dateSelect.options[dateSelect.selectedIndex];
    let deliveryDate = isAr ? (selectedDateOption?.getAttribute('data-label-ar') || selectedDateOption?.text) : (selectedDateOption?.getAttribute('data-label-en') || selectedDateOption?.text);

    let subtotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);
    let deliveryFee = this.currentDeliveryFee || 0;
    let totalAmount = subtotal + deliveryFee;
    let depositAmount = Math.round(totalAmount * 0.5);
    let earnedCashback = Math.round(subtotal * 0.05);

    // Customer numbering starts from 1 per phone number
    let customersMap = JSON.parse(localStorage.getItem('shemade_customers_map') || '{}');
    if (!customersMap[phone]) {
      let nextCustomerNum = Object.keys(customersMap).length + 1;
      customersMap[phone] = nextCustomerNum;
      localStorage.setItem('shemade_customers_map', JSON.stringify(customersMap));
    }
    let customerNumber = customersMap[phone];

    // Order sequence starts from 1000
    let prevOrderSeq = localStorage.getItem('shemade_order_seq');
    let orderSeq = prevOrderSeq ? (parseInt(prevOrderSeq) + 1) : 1000;
    localStorage.setItem('shemade_order_seq', orderSeq.toString());

    let customerPoints = JSON.parse(localStorage.getItem('shemade_customer_points') || '{}');
    let currentBalance = (customerPoints[phone] || 0) + earnedCashback;
    customerPoints[phone] = currentBalance;
    localStorage.setItem('shemade_customer_points', JSON.stringify(customerPoints));

    // Open WhatsApp Message
    this.openWhatsAppMessage({
      orderId: orderSeq,
      customerNumber: customerNumber,
      cart: cart,
      deliveryArea: deliveryArea,
      detailedAddress: detailedAddress,
      deliveryDate: deliveryDate,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount,
      depositAmount: depositAmount,
      remainingAmount: totalAmount - depositAmount,
      earnedCashback: earnedCashback,
      totalBalance: currentBalance
    });

    // Clear cart after submitting
    this.clearCart();
    this.updateCartDisplay();
  },

  // 6. WhatsApp Message Construction
  openWhatsAppMessage(orderData) {
    let msg = "";

    msg += `*طلب جديد من العميل: #${orderData.customerNumber}*\n`;
    msg += `*رقم الطلب:* #${orderData.orderId}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*تفاصيل المنتجات:*\n`;
    orderData.cart.forEach((item, idx) => {
      let name = item.productNameAr && item.productNameAr !== item.productName ? item.productNameAr : item.productName;
      if (window.getProductArabicName) {
        name = window.getProductArabicName(name);
      }
      let notes = item.notes && item.notes !== 'NAN' && item.notes !== '-' ? item.notes : 'بدون ملاحظات إضافية';

      msg += `${idx + 1}- *${name}* (ID: ${item.productID})\n`;
      msg += `   • السعر للقطعة: ${Math.round(item.price)} ج.م\n`;
      msg += `   • الكمية: ${item.quantity}\n`;
      msg += `   • اللون المختار: ${item.color}\n`;
      msg += `   • المقاس/ملاحظات: ${notes}\n`;
      msg += `   • الإجمالي: ${Math.round(item.totalPrice)} ج.م\n`;
      msg += `─────────────────────\n`;
    });

    msg += `\n *تفاصيل التوصيل والاستلام:*\n`;
    msg += `• *المنطقة:* ${orderData.deliveryArea}\n`;
    msg += `• *العنوان:* ${orderData.detailedAddress}\n`;
    msg += `• *موعد التسليم المتفق عليه:* ${orderData.deliveryDate}\n\n`;

    msg += ` *الحساب المالي:*\n`;
    msg += `• *إجمالي المنتجات:* ${Math.round(orderData.subtotal)} ج.م\n`;
    msg += `• *تكلفة التوصيل:* ${orderData.deliveryFee === 0 ? '0 ج.م (مجاناً)' : orderData.deliveryFee + ' ج.م'}\n`;
    msg += `• *العربون قبل للبدء:* ${Math.round(orderData.depositAmount)} ج.م\n`;
    msg += `• *المتبقي عند الاستلام:* ${Math.round(orderData.remainingAmount)} ج.م\n\n`;

    msg += `رصيدك عندنا\n`;
    msg += `• الرصيد المكتسب من هذا الطلب: ${Math.round(orderData.earnedCashback)}ج.م\n`;
    msg += `• إجمالي الرصيد المتاح في المتجر: ${Math.round(orderData.totalBalance)}ج.م\n\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += ` *تمت الموافقة على الشروط والأحكام وتأكيد تفاصيل الطلب.*`;

    const phone = window.CONFIG?.WHATSAPP_NUMBER || '201558892266';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    window.open(whatsappUrl, '_blank');
  }
};
