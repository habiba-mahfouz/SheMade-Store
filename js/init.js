// She Made - Instant Head Initializer
// Sets document language and direction immediately before first paint to prevent layout flicker
(function() {
  const savedLang = localStorage.getItem('shemade_lang') || 'ar';
  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
})();
