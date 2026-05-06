/**
 * stuller-api.js
 *
 * Stuller API integration for the jewelry catalog.
 *
 * HOW TO CONFIGURE:
 * -----------------------------------------------------------------
 * 1. Obtain an API key from Stuller's developer portal:
 *    https://developer.stuller.com
 *
 * 2. Set your credentials in the STULLER_CONFIG object below.
 *
 * 3. Due to browser CORS restrictions, Stuller API calls should be
 *    proxied through your own server-side endpoint. Set
 *    USE_PROXY: true and point PROXY_BASE_URL at your backend.
 *
 * 4. When credentials are not configured, the module automatically
 *    falls back to the built-in demo dataset.
 * -----------------------------------------------------------------
 *
 * Stuller API Docs: https://developer.stuller.com/apis
 */

(function (window) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONFIGURATION  — update these values for production use
  ───────────────────────────────────────────────────────── */
  var STULLER_CONFIG = {
    /** Set to true once you have valid credentials */
    ENABLED: false,

    /** Your Stuller API client ID */
    CLIENT_ID: 'YOUR_CLIENT_ID',

    /** Your Stuller API client secret (use proxy to keep this private) */
    CLIENT_SECRET: 'YOUR_CLIENT_SECRET',

    /**
     * Route all API calls through a server-side proxy to keep
     * credentials out of the browser and avoid CORS issues.
     * Set to true in production.
     */
    USE_PROXY: false,

    /**
     * Base URL for your server-side proxy.
     * Example Express route: GET /api/stuller/products?category=rings
     */
    PROXY_BASE_URL: '/api/stuller',

    /**
     * Stuller production base URL (used when USE_PROXY is false,
     * e.g. during local server-side development).
     */
    STULLER_BASE_URL: 'https://api.stuller.com',

    /** Items to load per page */
    PAGE_SIZE: 12,

    /** Never show pricing to end users */
    SHOW_PRICES: false,
  };

  /* ─────────────────────────────────────────────────────────
     DEMO / FALLBACK DATA
     Shown when STULLER_CONFIG.ENABLED is false or API fails.
     Reflects realistic Stuller product structures.
  ───────────────────────────────────────────────────────── */
  var DEMO_PRODUCTS = [
    {
      id: 'demo-001',
      styleNumber: 'LS6796',
      name: 'Diamond Solitaire Engagement Ring',
      category: 'rings',
      description: 'A timeless six-prong solitaire setting in 14K white gold, designed to showcase a center diamond of your choice. Comfort-fit shank.',
      metal: '14K White Gold',
      primaryStone: 'Diamond (Center Not Included)',
      collection: 'Bridal',
      gender: 'Ladies',
      imageUrl: null,
      badge: 'Bestseller',
      tags: ['Bridal', 'Solitaire', 'Diamond'],
    },
    {
      id: 'demo-002',
      styleNumber: 'LS5923',
      name: 'Emerald-Cut Halo Ring',
      category: 'rings',
      description: 'An elegant emerald-cut halo ring featuring a pavé diamond band in 18K yellow gold. A statement piece for any occasion.',
      metal: '18K Yellow Gold',
      primaryStone: 'Diamond',
      collection: 'Signature',
      gender: 'Ladies',
      imageUrl: null,
      badge: 'New',
      tags: ['Halo', 'Pavé', 'Emerald Cut'],
    },
    {
      id: 'demo-003',
      styleNumber: 'LN8204',
      name: 'Diamond Tennis Necklace',
      category: 'necklaces',
      description: '16-inch tennis necklace featuring 3 ct. t.w. round diamonds in a four-prong setting. Crafted in 14K white gold with a box clasp.',
      metal: '14K White Gold',
      primaryStone: 'Diamond',
      collection: 'Classic',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Tennis', 'Diamond', '16"'],
    },
    {
      id: 'demo-004',
      styleNumber: 'LN7841',
      name: 'Ruby Drop Pendant',
      category: 'necklaces',
      description: 'A vibrant oval ruby suspended in a delicate diamond halo, finished in 14K rose gold. Includes an 18-inch cable chain.',
      metal: '14K Rose Gold',
      primaryStone: 'Ruby',
      collection: 'Color',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Ruby', 'Pendant', 'Halo'],
    },
    {
      id: 'demo-005',
      styleNumber: 'LE9310',
      name: 'Diamond Stud Earrings',
      category: 'earrings',
      description: 'Classic round brilliant diamond studs, 1 ct. t.w., in four-prong martini settings. Available in 14K white, yellow, or rose gold.',
      metal: '14K White Gold',
      primaryStone: 'Diamond',
      collection: 'Everyday',
      gender: 'Ladies',
      imageUrl: null,
      badge: 'Popular',
      tags: ['Studs', 'Diamond', '1 ctw'],
    },
    {
      id: 'demo-006',
      styleNumber: 'LE8762',
      name: 'Sapphire & Diamond Hoop Earrings',
      category: 'earrings',
      description: 'Inside-out hoop earrings featuring alternating blue sapphires and round diamonds in 14K white gold. Hinged closure.',
      metal: '14K White Gold',
      primaryStone: 'Sapphire & Diamond',
      collection: 'Color',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Hoops', 'Sapphire', 'Diamond'],
    },
    {
      id: 'demo-007',
      styleNumber: 'LB6024',
      name: 'Diamond Bangle Bracelet',
      category: 'bracelets',
      description: 'Hinged bangle with 1.5 ct. t.w. of channel-set round diamonds in 14K yellow gold. Polished interior finish for all-day comfort.',
      metal: '14K Yellow Gold',
      primaryStone: 'Diamond',
      collection: 'Classic',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Bangle', 'Channel Set', 'Diamond'],
    },
    {
      id: 'demo-008',
      styleNumber: 'LB7193',
      name: 'Emerald Tennis Bracelet',
      category: 'bracelets',
      description: '7-inch tennis bracelet featuring 5 ct. t.w. of prong-set oval emeralds accented with round diamonds in 18K white gold.',
      metal: '18K White Gold',
      primaryStone: 'Emerald & Diamond',
      collection: 'Color',
      gender: 'Ladies',
      imageUrl: null,
      badge: 'New',
      tags: ['Tennis', 'Emerald', 'Diamond'],
    },
    {
      id: 'demo-009',
      styleNumber: 'GR5501',
      name: "Men's Diamond Band",
      category: 'rings',
      description: "A bold 10mm comfort-fit band with 1 ct. t.w. of channel-set diamonds in 14K yellow gold. Ideal as a men's wedding band.",
      metal: '14K Yellow Gold',
      primaryStone: 'Diamond',
      collection: "Men's",
      gender: 'Gents',
      imageUrl: null,
      badge: null,
      tags: ["Men's", 'Wedding Band', 'Channel Set'],
    },
    {
      id: 'demo-010',
      styleNumber: 'LN9003',
      name: 'Pearl & Diamond Pendant',
      category: 'necklaces',
      description: 'A cultured Akoya pearl suspended in a scalloped diamond frame, crafted in 14K white gold. Includes 18-inch rope chain.',
      metal: '14K White Gold',
      primaryStone: 'Pearl & Diamond',
      collection: 'Pearl',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Pearl', 'Diamond', 'Pendant'],
    },
    {
      id: 'demo-011',
      styleNumber: 'LE6620',
      name: 'Opal Drop Earrings',
      category: 'earrings',
      description: 'Oval Australian opal drops in a bezel setting with diamond accents. Crafted in 14K rose gold with lever-back closure.',
      metal: '14K Rose Gold',
      primaryStone: 'Opal',
      collection: 'Color',
      gender: 'Ladies',
      imageUrl: null,
      badge: null,
      tags: ['Opal', 'Drop', 'Bezel'],
    },
    {
      id: 'demo-012',
      styleNumber: 'LR8851',
      name: 'Three-Stone Sapphire Ring',
      category: 'rings',
      description: 'A classic three-stone ring featuring an oval sapphire center flanked by round diamonds, all in platinum. Timeless elegance.',
      metal: 'Platinum',
      primaryStone: 'Sapphire & Diamond',
      collection: 'Signature',
      gender: 'Ladies',
      imageUrl: null,
      badge: 'Featured',
      tags: ['Three-Stone', 'Sapphire', 'Platinum'],
    },
  ];

  /* ─────────────────────────────────────────────────────────
     TOKEN MANAGEMENT (OAuth 2.0 client_credentials flow)
  ───────────────────────────────────────────────────────── */
  var _tokenCache = {
    accessToken: null,
    expiresAt: 0,
  };

  /**
   * Retrieve a valid OAuth access token from Stuller.
   * Tokens are cached until expiry.
   * @returns {Promise<string>} access token
   */
  function getAccessToken() {
    var now = Date.now();
    if (_tokenCache.accessToken && now < _tokenCache.expiresAt) {
      return Promise.resolve(_tokenCache.accessToken);
    }

    var tokenUrl = STULLER_CONFIG.USE_PROXY
      ? STULLER_CONFIG.PROXY_BASE_URL + '/token'
      : STULLER_CONFIG.STULLER_BASE_URL + '/oauth2/token';

    return fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: STULLER_CONFIG.CLIENT_ID,
        client_secret: STULLER_CONFIG.CLIENT_SECRET,
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Token request failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        _tokenCache.accessToken = data.access_token;
        /* Buffer 60 s before real expiry */
        _tokenCache.expiresAt = now + (data.expires_in - 60) * 1000;
        return data.access_token;
      });
  }

  /* ─────────────────────────────────────────────────────────
     API HELPERS
  ───────────────────────────────────────────────────────── */

  /**
   * Make an authenticated GET request to the Stuller (or proxy) API.
   * @param {string} endpoint  - path relative to base URL
   * @param {Object} [params]  - query string parameters
   */
  function apiGet(endpoint, params) {
    return getAccessToken().then(function (token) {
      var base = STULLER_CONFIG.USE_PROXY
        ? STULLER_CONFIG.PROXY_BASE_URL
        : STULLER_CONFIG.STULLER_BASE_URL;

      var url = new URL(base + endpoint, window.location.href);
      if (params) {
        Object.keys(params).forEach(function (k) {
          if (params[k] !== undefined && params[k] !== null) {
            url.searchParams.set(k, params[k]);
          }
        });
      }

      return fetch(url.toString(), {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      });
    }).then(function (res) {
      if (!res.ok) throw new Error('Stuller API error: ' + res.status);
      return res.json();
    });
  }

  /* ─────────────────────────────────────────────────────────
     NORMALIZATION
     Maps raw Stuller API responses to the internal product
     schema used by the rest of the application.
  ───────────────────────────────────────────────────────── */

  /**
   * Derive a simple category string from a Stuller product type.
   * Stuller uses numeric type IDs; adjust mapping as needed.
   * @param {Object} raw - raw Stuller product object
   * @returns {string}
   */
  function deriveCategory(raw) {
    var type = (raw.ProductType || raw.Type || '').toLowerCase();
    var desc = (raw.Name || raw.Description || '').toLowerCase();
    var combined = type + ' ' + desc;
    if (combined.indexOf('ring') !== -1) return 'rings';
    if (combined.indexOf('necklace') !== -1 || combined.indexOf('pendant') !== -1) return 'necklaces';
    if (combined.indexOf('earring') !== -1) return 'earrings';
    if (combined.indexOf('bracelet') !== -1 || combined.indexOf('bangle') !== -1) return 'bracelets';
    return 'other';
  }

  /**
   * Normalize a single raw Stuller product to internal schema.
   * @param {Object} raw
   * @returns {Object}
   */
  function normalizeProduct(raw) {
    var images = raw.Images || raw.MediaItems || [];
    var imageUrl = images.length
      ? (images[0].LargeUrl || images[0].Url || images[0].MediumUrl || null)
      : null;

    return {
      id: String(raw.StyleNumber || raw.Id || raw.SKU || Math.random()),
      styleNumber: raw.StyleNumber || raw.SKU || '',
      name: raw.Name || raw.Title || raw.Description || 'Fine Jewelry',
      category: deriveCategory(raw),
      description: raw.LongDescription || raw.Description || raw.ShortDescription || '',
      metal: raw.MetalType || raw.Metal || '',
      primaryStone: raw.PrimaryStone || raw.MainStone || '',
      collection: raw.Collection || raw.Line || '',
      gender: raw.Gender || '',
      imageUrl: imageUrl,
      badge: raw.IsNew ? 'New' : (raw.IsFeatured ? 'Featured' : null),
      tags: raw.Keywords ? raw.Keywords.split(',').map(function (t) { return t.trim(); }) : [],
    };
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────── */

  /**
   * Fetch products from the Stuller catalog.
   *
   * Falls back to demo data when:
   *   - STULLER_CONFIG.ENABLED is false, OR
   *   - the API call fails for any reason.
   *
   * @param {Object} options
   * @param {string}  [options.category]   - 'rings'|'necklaces'|'earrings'|'bracelets'|'all'
   * @param {string}  [options.query]      - free-text search term
   * @param {number}  [options.page=1]     - 1-based page number
   * @param {number}  [options.pageSize]   - items per page
   * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
   */
  function fetchProducts(options) {
    options = options || {};
    var category = options.category && options.category !== 'all' ? options.category : null;
    var query    = options.query    || null;
    var page     = options.page     || 1;
    var pageSize = options.pageSize || STULLER_CONFIG.PAGE_SIZE;

    if (!STULLER_CONFIG.ENABLED) {
      return Promise.resolve(_filterDemoData(category, query, page, pageSize));
    }

    /* Build Stuller API query parameters.
       Endpoint and param names may vary; adjust to match the
       specific Stuller API version you have access to.        */
    var params = {
      pageNumber: page,
      pageSize: pageSize,
    };
    if (category) params.productType = category;
    if (query)    params.searchTerms = query;

    return apiGet('/v2/products', params)
      .then(function (data) {
        var rawItems = data.Items || data.Products || data.Results || [];
        var products = rawItems.map(normalizeProduct);
        var total    = data.TotalCount || data.Total || products.length;
        return {
          products: products,
          total: total,
          page: page,
          totalPages: Math.ceil(total / pageSize),
        };
      })
      .catch(function (err) {
        console.warn('[StullerAPI] Live API failed, falling back to demo data.', err);
        return _filterDemoData(category, query, page, pageSize);
      });
  }

  /**
   * Fetch details for a single product by style number / ID.
   * @param {string} styleNumber
   * @returns {Promise<Object>}
   */
  function fetchProductDetail(styleNumber) {
    /* Demo fallback */
    if (!STULLER_CONFIG.ENABLED) {
      var found = DEMO_PRODUCTS.filter(function (p) { return p.styleNumber === styleNumber || p.id === styleNumber; })[0];
      return Promise.resolve(found || null);
    }

    return apiGet('/v2/products/' + encodeURIComponent(styleNumber))
      .then(function (data) { return normalizeProduct(data); })
      .catch(function (err) {
        console.warn('[StullerAPI] Detail fetch failed.', err);
        return null;
      });
  }

  /* ─────────────────────────────────────────────────────────
     INTERNAL — demo data filtering / pagination
  ───────────────────────────────────────────────────────── */
  function _filterDemoData(category, query, page, pageSize) {
    var filtered = DEMO_PRODUCTS.slice();

    if (category) {
      filtered = filtered.filter(function (p) { return p.category === category; });
    }

    if (query) {
      var q = query.toLowerCase();
      filtered = filtered.filter(function (p) {
        return (
          p.name.toLowerCase().indexOf(q) !== -1 ||
          p.description.toLowerCase().indexOf(q) !== -1 ||
          p.metal.toLowerCase().indexOf(q) !== -1 ||
          p.primaryStone.toLowerCase().indexOf(q) !== -1 ||
          p.styleNumber.toLowerCase().indexOf(q) !== -1
        );
      });
    }

    var total      = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var start      = (page - 1) * pageSize;
    var items      = filtered.slice(start, start + pageSize);

    return {
      products: items,
      total: total,
      page: page,
      totalPages: totalPages,
    };
  }

  /* ─────────────────────────────────────────────────────────
     EXPORT
  ───────────────────────────────────────────────────────── */
  window.StullerAPI = {
    fetchProducts: fetchProducts,
    fetchProductDetail: fetchProductDetail,
    config: STULLER_CONFIG,
  };

}(window));
