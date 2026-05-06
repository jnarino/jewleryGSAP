/**
 * custom-jewelry.js
 *
 * Handles the custom jewelry creation request form.
 * Validates fields client-side and submits via fetch to a
 * configurable endpoint (or logs to console in demo mode).
 *
 * HOW TO CONFIGURE:
 * -----------------------------------------------------------------
 * Set SUBMIT_ENDPOINT to your server-side form handler URL.
 * The handler should accept a POST with JSON body and forward
 * the request to your CRM / email service.
 *
 * When SUBMIT_ENDPOINT is null the form runs in demo mode and
 * shows a success message without actually sending data.
 * -----------------------------------------------------------------
 */

(function (window, document) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONFIGURATION
  ───────────────────────────────────────────────────────── */
  var SUBMIT_ENDPOINT = null; // e.g. '/api/custom-request'

  /* ─────────────────────────────────────────────────────────
     VALIDATION RULES
  ───────────────────────────────────────────────────────── */
  var RULES = {
    name: {
      required: true,
      minLength: 2,
      message: 'Please enter your full name (at least 2 characters).',
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address.',
    },
    jewelryType: {
      required: true,
      message: 'Please select a jewelry type.',
    },
    description: {
      required: true,
      minLength: 20,
      message: 'Please describe your vision (at least 20 characters).',
    },
  };

  /* ─────────────────────────────────────────────────────────
     DOM HELPERS
  ───────────────────────────────────────────────────────── */
  function qs(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function setError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + '-error');
    if (input) {
      if (message) {
        input.classList.add('input--error');
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.classList.remove('input--error');
        input.removeAttribute('aria-invalid');
      }
    }
    if (error) {
      error.textContent = message || '';
    }
  }

  function clearErrors() {
    Object.keys(RULES).forEach(function (key) {
      setError('cf-' + (key === 'jewelryType' ? 'type' : key), '');
    });
  }

  /* ─────────────────────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────────────────────── */

  /**
   * Validate all required fields.
   * @param {Object} data  - key-value form data
   * @returns {boolean}    - true when all valid
   */
  function validate(data) {
    var valid = true;

    /* Name */
    if (!data.name || data.name.trim().length < (RULES.name.minLength || 1)) {
      setError('cf-name', RULES.name.message);
      valid = false;
    } else {
      setError('cf-name', '');
    }

    /* Email */
    if (!data.email || !RULES.email.pattern.test(data.email.trim())) {
      setError('cf-email', RULES.email.message);
      valid = false;
    } else {
      setError('cf-email', '');
    }

    /* Jewelry type */
    if (!data.jewelryType) {
      setError('cf-type', RULES.jewelryType.message);
      valid = false;
    } else {
      setError('cf-type', '');
    }

    /* Description */
    if (!data.description || data.description.trim().length < (RULES.description.minLength || 1)) {
      setError('cf-description', RULES.description.message);
      valid = false;
    } else {
      setError('cf-description', '');
    }

    return valid;
  }

  /* ─────────────────────────────────────────────────────────
     SUBMISSION
  ───────────────────────────────────────────────────────── */

  /**
   * Submit validated form data to the configured endpoint.
   * Falls back to demo mode (console log + artificial delay).
   * @param {Object} data
   * @returns {Promise<void>}
   */
  function submitRequest(data) {
    if (!SUBMIT_ENDPOINT) {
      /* Demo mode: simulate network latency */
      console.info('[CustomJewelry] Demo mode — request data:', data);
      return new Promise(function (resolve) {
        setTimeout(resolve, 1200);
      });
    }

    return fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function (res) {
      if (!res.ok) throw new Error('Submission failed with status ' + res.status);
    });
  }

  /* ─────────────────────────────────────────────────────────
     UI STATE
  ───────────────────────────────────────────────────────── */
  function setSubmitting(form, isSubmitting) {
    var btn      = form.querySelector('#customFormSubmit');
    var btnText  = btn && btn.querySelector('.btn__text');
    var btnLoad  = btn && btn.querySelector('.btn__loading');

    if (btn) btn.disabled = isSubmitting;
    if (btnText) btnText.classList.toggle('hidden', isSubmitting);
    if (btnLoad) btnLoad.classList.toggle('hidden', !isSubmitting);
  }

  function showSuccess(form) {
    var successEl = form.querySelector('#customFormSuccess');
    if (successEl) {
      successEl.classList.remove('hidden');
      /* Smooth scroll to success message */
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    form.reset();
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */
  function init() {
    var form = document.getElementById('customForm');
    if (!form) return;

    /* Live validation on blur */
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function (el) {
      el.addEventListener('blur', function () {
        /* Re-validate only touched field */
        var singleData = collectFormData(form);
        validateField(el.name, singleData);
      });

      /* Clear error on input */
      el.addEventListener('input', function () {
        var errorId = 'cf-' + mapFieldNameToId(el.name) + '-error';
        var errorEl = document.getElementById(errorId);
        if (errorEl) errorEl.textContent = '';
        el.classList.remove('input--error');
        el.removeAttribute('aria-invalid');
      });
    });

    /* Submit handler */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var data = collectFormData(form);
      if (!validate(data)) return;

      var successEl = form.querySelector('#customFormSuccess');
      if (successEl) successEl.classList.add('hidden');

      setSubmitting(form, true);

      submitRequest(data)
        .then(function () {
          showSuccess(form);
        })
        .catch(function (err) {
          console.error('[CustomJewelry] Submission error:', err);
          /* Surface generic error to user */
          var btn = form.querySelector('#customFormSubmit');
          if (btn) {
            btn.disabled = false;
            var btnText = btn.querySelector('.btn__text');
            var btnLoad = btn.querySelector('.btn__loading');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoad) btnLoad.classList.add('hidden');
          }
          /* Show error near submit button */
            var submitBtn = form.querySelector('#customFormSubmit');
            var errDiv = form.querySelector('.form-submit-error');
            if (!errDiv && submitBtn) {
              errDiv = document.createElement('p');
              errDiv.className = 'form-error form-submit-error';
              errDiv.style.marginTop = '12px';
              submitBtn.insertAdjacentElement('afterend', errDiv);
            }
            if (errDiv) {
              errDiv.textContent = 'Something went wrong. Please try again or contact us directly.';
            }
        })
        .finally(function () {
          setSubmitting(form, false);
        });
    });
  }

  /* ─────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────── */

  function collectFormData(form) {
    var fd = new FormData(form);
    var data = {};
    fd.forEach(function (value, key) {
      data[key] = value;
    });
    return data;
  }

  function mapFieldNameToId(name) {
    var map = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      jewelryType: 'type',
      metal: 'metal',
      stone: 'stone',
      budget: 'budget',
      description: 'description',
    };
    return map[name] || name;
  }

  function validateField(fieldName, data) {
    switch (fieldName) {
      case 'name':
        if (!data.name || data.name.trim().length < 2) {
          setError('cf-name', RULES.name.message);
        } else {
          setError('cf-name', '');
        }
        break;
      case 'email':
        if (!data.email || !RULES.email.pattern.test(data.email.trim())) {
          setError('cf-email', RULES.email.message);
        } else {
          setError('cf-email', '');
        }
        break;
      case 'jewelryType':
        if (!data.jewelryType) {
          setError('cf-type', RULES.jewelryType.message);
        } else {
          setError('cf-type', '');
        }
        break;
      case 'description':
        if (!data.description || data.description.trim().length < 20) {
          setError('cf-description', RULES.description.message);
        } else {
          setError('cf-description', '');
        }
        break;
    }
  }

  /* ─────────────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
