/**
 * main.js
 *
 * Orchestrates GSAP animations, catalog rendering, filtering,
 * pagination, modal, and navigation behaviour.
 *
 * Dependencies (loaded before this file):
 *   - GSAP 3 + ScrollTrigger + TextPlugin (CDN)
 *   - stuller-api.js  (window.StullerAPI)
 *   - custom-jewelry.js
 */

(function (window, document) {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     GSAP PLUGIN REGISTRATION
  ═══════════════════════════════════════════════════════ */
  gsap.registerPlugin(ScrollTrigger, TextPlugin);

  /* ═══════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════ */
  var state = {
    currentFilter: 'all',
    currentQuery: '',
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    products: [],    // cumulative products loaded so far
  };

  /* ═══════════════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════════════ */
  var nav            = document.getElementById('nav');
  var navHamburger   = document.getElementById('navHamburger');
  var catalogGrid    = document.getElementById('catalogGrid');
  var catalogLoading = document.getElementById('catalogLoading');
  var catalogError   = document.getElementById('catalogError');
  var loadMoreBtn    = document.getElementById('loadMoreBtn');
  var catalogSearch  = document.getElementById('catalogSearch');
  var catalogSearchBtn = document.getElementById('catalogSearchBtn');
  var productModal   = document.getElementById('productModal');
  var modalClose     = document.getElementById('modalClose');
  var modalBackdrop  = document.getElementById('modalBackdrop');
  var modalBody      = document.getElementById('modalBody');
  var footerYear     = document.getElementById('footerYear');
  var filterBtns     = document.querySelectorAll('.filter-btn');
  var collectionBtns = document.querySelectorAll('.collection-card__btn');

  /* ═══════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var ctx  = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  /* ═══════════════════════════════════════════════════════
     NAVIGATION — scroll shadow + mobile hamburger
  ═══════════════════════════════════════════════════════ */

  function initNav() {
    /* Scroll shadow */
    window.addEventListener('scroll', function () {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    }, { passive: true });

    /* Mobile hamburger */
    if (navHamburger) {
      navHamburger.addEventListener('click', function () {
        nav.classList.toggle('nav--open');
        var isOpen = nav.classList.contains('nav--open');
        navHamburger.setAttribute('aria-expanded', isOpen);
      });
    }

    /* Close mobile menu on nav link click */
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('nav--open');
      });
    });

    /* GSAP nav entrance */
    gsap.from(nav, {
      yPercent: -100,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2,
    });
  }

  /* ═══════════════════════════════════════════════════════
     HERO ANIMATIONS
  ═══════════════════════════════════════════════════════ */

  function initHeroAnimations() {
    var tl = gsap.timeline({ delay: 0.6 });

    /* Floating background shapes */
    gsap.to('.hero__bg-shape--1', {
      y: -40,
      x: 20,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to('.hero__bg-shape--2', {
      y: 30,
      x: -15,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1,
    });
    gsap.to('.hero__bg-shape--3', {
      y: -20,
      x: 25,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2,
    });

    /* Eyebrow */
    tl.to('.hero__eyebrow', {
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
    });

    /* Title lines staggered */
    tl.to('.hero__title-line', {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
    }, '-=0.3');

    /* Subtitle */
    tl.to('.hero__subtitle', {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.4');

    /* CTAs */
    tl.to('.hero__ctas', {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
    }, '-=0.3');

    /* Scroll indicator */
    tl.to('.hero__scroll-indicator', {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
    }, '-=0.1');
  }

  /* ═══════════════════════════════════════════════════════
     SCROLL ANIMATIONS (ScrollTrigger)
  ═══════════════════════════════════════════════════════ */

  function initScrollAnimations() {

    /* Section headers */
    gsap.utils.toArray('.section-header').forEach(function (el) {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
      tl.from(el.querySelector('.section-header__eyebrow'), {
        opacity: 0, y: 20, duration: 0.5, ease: 'power2.out',
      });
      tl.from(el.querySelector('.section-header__title'), {
        opacity: 0, y: 30, duration: 0.7, ease: 'power3.out',
      }, '-=0.2');
      if (el.querySelector('.section-header__body')) {
        tl.from(el.querySelector('.section-header__body'), {
          opacity: 0, y: 20, duration: 0.5, ease: 'power2.out',
        }, '-=0.3');
      }
    });

    /* Collection cards */
    gsap.utils.toArray('.collection-card').forEach(function (card, i) {
      gsap.to(card, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        delay: i * 0.1,
      });
    });

    /* Custom jewelry section */
    gsap.from('.custom__info', {
      opacity: 0,
      x: -50,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.custom__layout',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    gsap.from('.custom__form-wrap', {
      opacity: 0,
      x: 50,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.custom__layout',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    /* Custom features stagger */
    gsap.from('.custom__features li', {
      opacity: 0,
      y: 24,
      duration: 0.5,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.custom__features',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    /* About section */
    gsap.from('.about__badge', {
      opacity: 0,
      scale: 0.7,
      rotation: -15,
      duration: 1,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: '.about__visual',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    gsap.from('.about__text', {
      opacity: 0,
      x: 40,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about__layout',
        start: 'top 78%',
        toggleActions: 'play none none none',
      },
    });

    gsap.from('.about__list li', {
      opacity: 0,
      x: 20,
      duration: 0.4,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.about__list',
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });

    /* Contact items */
    gsap.from('.contact__item', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.contact__details',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    /* Footer */
    gsap.from('.footer__brand, .footer__links, .footer__social', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  }

  /* ═══════════════════════════════════════════════════════
     CATALOG RENDERING
  ═══════════════════════════════════════════════════════ */

  var CATEGORY_ICONS = {
    rings: '💍',
    necklaces: '📿',
    earrings: '✨',
    bracelets: '🔗',
    other: '◆',
  };

  function buildCardHTML(product) {
    var icon      = CATEGORY_ICONS[product.category] || '◆';
    var badgeHTML = product.badge
      ? '<span class="jewelry-card__badge">' + escapeHtml(product.badge) + '</span>'
      : '';

    var imageHTML = product.imageUrl
      ? '<img src="' + escapeHtml(product.imageUrl) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" />'
      : '<span class="jewelry-card__image-placeholder">' + icon + '</span>';

    var tagsHTML = product.tags.length
      ? product.tags.slice(0, 3).map(function (t) {
          return '<span class="jewelry-card__tag">' + escapeHtml(t) + '</span>';
        }).join('')
      : '';

    return [
      '<article class="jewelry-card" data-product-id="' + escapeHtml(product.id) + '" tabindex="0" role="button" aria-label="View details for ' + escapeHtml(product.name) + '">',
      '  <div class="jewelry-card__image">',
      '    ' + badgeHTML,
      '    ' + imageHTML,
      '  </div>',
      '  <div class="jewelry-card__body">',
      '    <p class="jewelry-card__category">' + escapeHtml(product.category) + '</p>',
      '    <h3 class="jewelry-card__name">' + escapeHtml(product.name) + '</h3>',
      '    <p class="jewelry-card__style">Style #' + escapeHtml(product.styleNumber) + ' &nbsp;·&nbsp; ' + escapeHtml(product.metal) + '</p>',
      '    <div class="jewelry-card__meta">' + tagsHTML + '</div>',
      '  </div>',
      '  <div class="jewelry-card__footer">',
      '    <button class="jewelry-card__action" data-product-id="' + escapeHtml(product.id) + '">View Details →</button>',
      '  </div>',
      '</article>',
    ].join('\n');
  }

  function animateCards(cards) {
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out',
    });
  }

  function renderProducts(products, append) {
    if (!append) {
      catalogGrid.innerHTML = '';
    }

    if (products.length === 0 && !append) {
      catalogGrid.innerHTML = '<p class="catalog__no-results">No pieces found. Try a different search or filter.</p>';
      return;
    }

    var fragment = document.createDocumentFragment();
    products.forEach(function (product) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = buildCardHTML(product);
      fragment.appendChild(wrapper.firstChild);
    });

    catalogGrid.appendChild(fragment);

    /* Animate newly added cards */
    var newCards = catalogGrid.querySelectorAll('.jewelry-card[style=""], .jewelry-card:not(.gsap-animated)');
    var toAnimate = Array.from(catalogGrid.querySelectorAll('.jewelry-card')).slice(-products.length);
    toAnimate.forEach(function (c) { c.classList.add('gsap-animated'); });
    animateCards(toAnimate);

    /* Attach card click listeners */
    toAnimate.forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.productId;
        openProductModal(id);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProductModal(card.dataset.productId);
        }
      });
    });

    /* Detail buttons inside cards */
    toAnimate.forEach(function (card) {
      var btn = card.querySelector('.jewelry-card__action');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openProductModal(btn.dataset.productId);
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     CATALOG DATA LOADING
  ═══════════════════════════════════════════════════════ */

  function setLoadingState(loading) {
    state.isLoading = loading;
    catalogLoading.classList.toggle('hidden', !loading);
    if (loadMoreBtn) loadMoreBtn.disabled = loading;
  }

  function loadCatalog(options) {
    var append = options && options.append;
    if (!append) {
      setLoadingState(true);
      catalogError.classList.add('hidden');
    }

    return window.StullerAPI.fetchProducts({
      category: state.currentFilter,
      query: state.currentQuery,
      page: state.currentPage,
    })
      .then(function (result) {
        state.totalPages = result.totalPages;

        if (append) {
          state.products = state.products.concat(result.products);
        } else {
          state.products = result.products;
          setLoadingState(false);
        }

        renderProducts(result.products, append);

        /* Show/hide "Load More" */
        if (loadMoreBtn) {
          if (state.currentPage >= state.totalPages) {
            loadMoreBtn.style.display = 'none';
          } else {
            loadMoreBtn.style.display = '';
          }
        }
      })
      .catch(function (err) {
        console.error('[Catalog] Load failed:', err);
        setLoadingState(false);
        catalogError.classList.remove('hidden');
      });
  }

  function resetAndLoad() {
    state.currentPage = 1;
    state.products = [];
    loadCatalog();
  }

  /* ═══════════════════════════════════════════════════════
     FILTER & SEARCH
  ═══════════════════════════════════════════════════════ */

  function initFilters() {
    /* Category filter buttons */
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('filter-btn--active'); });
        btn.classList.add('filter-btn--active');
        state.currentFilter = btn.dataset.filter || 'all';
        resetAndLoad();
      });
    });

    /* Collection card browse buttons */
    collectionBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.dataset.filter || 'all';
        state.currentFilter = filter;

        /* Sync filter bar */
        filterBtns.forEach(function (fb) {
          fb.classList.toggle('filter-btn--active', fb.dataset.filter === filter);
        });

        /* Scroll to catalog */
        var catalogEl = document.getElementById('catalog');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }

        resetAndLoad();
      });
    });
  }

  function initSearch() {
    if (!catalogSearch) return;

    var doSearch = debounce(function () {
      state.currentQuery = catalogSearch.value.trim();
      resetAndLoad();
    }, 400);

    catalogSearch.addEventListener('input', doSearch);

    if (catalogSearchBtn) {
      catalogSearchBtn.addEventListener('click', function () {
        state.currentQuery = catalogSearch.value.trim();
        resetAndLoad();
      });
    }

    catalogSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        state.currentQuery = catalogSearch.value.trim();
        resetAndLoad();
      }
    });
  }

  function initLoadMore() {
    if (!loadMoreBtn) return;
    loadMoreBtn.addEventListener('click', function () {
      if (state.isLoading || state.currentPage >= state.totalPages) return;
      state.currentPage += 1;
      loadCatalog({ append: true });
    });
  }

  /* ═══════════════════════════════════════════════════════
     PRODUCT MODAL
  ═══════════════════════════════════════════════════════ */

  function openProductModal(productId) {
    var product = state.products.find(function (p) { return p.id === productId; });
    if (!product) return;

    renderModalContent(product);
    productModal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeProductModal() {
    productModal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  function renderModalContent(product) {
    var icon = CATEGORY_ICONS[product.category] || '◆';

    var imageHTML = product.imageUrl
      ? '<img src="' + escapeHtml(product.imageUrl) + '" alt="' + escapeHtml(product.name) + '" />'
      : '<span class="modal-product__image-placeholder">' + icon + '</span>';

    var specsHTML = [
      buildSpec('Metal', product.metal),
      buildSpec('Stone', product.primaryStone),
      buildSpec('Collection', product.collection),
      buildSpec('Gender', product.gender),
      buildSpec('Style #', product.styleNumber),
    ].filter(Boolean).join('');

    var tagsHTML = product.tags.length
      ? '<div class="jewelry-card__meta" style="margin-bottom:20px">' +
        product.tags.map(function (t) {
          return '<span class="jewelry-card__tag">' + escapeHtml(t) + '</span>';
        }).join('') +
        '</div>'
      : '';

    modalBody.innerHTML = [
      '<div class="modal-product__image">' + imageHTML + '</div>',
      '<p class="modal-product__category">' + escapeHtml(product.category) + '</p>',
      '<h2 class="modal-product__name" id="modalTitle">' + escapeHtml(product.name) + '</h2>',
      '<p class="modal-product__style">Style #' + escapeHtml(product.styleNumber) + '</p>',
      '<p class="modal-product__description">' + escapeHtml(product.description) + '</p>',
      tagsHTML,
      '<div class="modal-product__specs">' + specsHTML + '</div>',
      '<p class="modal-product__no-price">Pricing is available upon consultation. Contact us for a personalized quote.</p>',
      '<div class="modal-product__cta">',
      '  <a href="#custom" class="btn btn--primary" id="modalCustomBtn">Request This Style</a>',
      '  <button class="btn btn--outline" id="modalCloseFooter">Close</button>',
      '</div>',
    ].join('\n');

    /* "Request This Style" pre-fills the custom form */
    var requestBtn = document.getElementById('modalCustomBtn');
    if (requestBtn) {
      requestBtn.addEventListener('click', function () {
        closeProductModal();
        setTimeout(function () {
          var typeSelect = document.getElementById('cf-type');
          if (typeSelect && product.category) {
            var map = { rings: 'ring', necklaces: 'necklace', earrings: 'earrings', bracelets: 'bracelet' };
            var val = map[product.category] || '';
            typeSelect.value = val;
          }
          var desc = document.getElementById('cf-description');
          if (desc && !desc.value) {
            desc.value = 'I am interested in a piece similar to the "' + product.name + '" (Style #' + product.styleNumber + ').';
          }
          var customSection = document.getElementById('custom');
          if (customSection) customSection.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      });
    }

    var closeFoot = document.getElementById('modalCloseFooter');
    if (closeFoot) closeFoot.addEventListener('click', closeProductModal);
  }

  function buildSpec(label, value) {
    if (!value) return '';
    return [
      '<div class="modal-product__spec">',
      '  <span class="modal-product__spec-label">' + escapeHtml(label) + '</span>',
      '  <span class="modal-product__spec-value">' + escapeHtml(value) + '</span>',
      '</div>',
    ].join('\n');
  }

  function initModal() {
    if (modalClose) modalClose.addEventListener('click', closeProductModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeProductModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && productModal.classList.contains('modal--open')) {
        closeProductModal();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     SMOOTH ANCHOR LINKS (offset for fixed nav)
  ═══════════════════════════════════════════════════════ */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = anchor.getAttribute('href').slice(1);
        var target   = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        var navH = nav ? nav.offsetHeight : 72;
        var top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     FOOTER YEAR
  ═══════════════════════════════════════════════════════ */
  function initFooterYear() {
    if (footerYear) footerYear.textContent = new Date().getFullYear();
  }

  /* ═══════════════════════════════════════════════════════
     PARALLAX (subtle on hero shapes)
  ═══════════════════════════════════════════════════════ */
  function initParallax() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      onUpdate: function (self) {
        var p = self.progress;
        gsap.set('.hero__content', { y: p * 80 });
        gsap.set('.hero__bg-shape--1', { y: p * -60 });
        gsap.set('.hero__bg-shape--2', { y: p * 40 });
      },
    });
  }

  /* ═══════════════════════════════════════════════════════
     CATALOG SCROLL ANIMATION REFRESH
     Called each time new cards are added to the grid.
  ═══════════════════════════════════════════════════════ */
  function refreshScrollTrigger() {
    ScrollTrigger.refresh();
  }

  /* ═══════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════ */
  function init() {
    initFooterYear();
    initNav();
    initHeroAnimations();
    initScrollAnimations();
    initParallax();
    initFilters();
    initSearch();
    initLoadMore();
    initModal();
    initSmoothScroll();

    /* Initial catalog load */
    loadCatalog().then(refreshScrollTrigger);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
