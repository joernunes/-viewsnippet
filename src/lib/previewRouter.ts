export const PREVIEW_ROUTER_INJECT_SCRIPT = `
<script id="preview-router-script">
(function() {
  if (window.__previewRouterInjected) return;
  window.__previewRouterInjected = true;

  function notifyParent(data) {
    try {
      window.parent.postMessage({ source: 'preview-router', ...data }, '*');
    } catch(e) {}
  }

  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    let target = e.target;
    while (target && target !== document.body && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') return;

    const href = target.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) {
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        notifyParent({
          type: 'PREVIEW_NAV_CHANGE',
          url: '#top',
          path: '/#top',
          title: document.title || 'Top'
        });
      }
      return;
    }

    // External Links
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      e.preventDefault();
      try {
        window.open(href, '_blank', 'noopener,noreferrer');
        notifyParent({
          type: 'PREVIEW_NAV_TOAST',
          text: 'Opening external link: ' + href,
          toastType: 'info'
        });
      } catch(err) {
        console.warn('Failed to open external link', err);
      }
      return;
    }

    // Internal Anchor or Relative / Multi-page Links
    e.preventDefault();

    let elementId = '';
    if (href.startsWith('#')) {
      elementId = href.substring(1);
    } else if (href.includes('#')) {
      elementId = href.split('#')[1];
    } else {
      elementId = href.replace(/^\\/|^\\.\\/|\\.html$/g, '');
    }

    // Try finding target element in current DOM
    let targetEl = null;
    if (elementId) {
      targetEl = document.getElementById(elementId) || 
                 document.querySelector('[name="' + elementId + '"]') ||
                 document.querySelector('[data-page="' + elementId + '"]') ||
                 document.querySelector('[data-route="' + elementId + '"]') ||
                 document.querySelector('.' + elementId);
    }

    if (targetEl) {
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight effect on target element briefly
        const prevOutline = targetEl.style.outline;
        const prevTransition = targetEl.style.transition;
        targetEl.style.transition = 'outline 0.3s ease, box-shadow 0.3s ease';
        targetEl.style.outline = '2px solid #10b981';
        targetEl.style.boxShadow = '0 0 12px rgba(16,185,129,0.4)';
        setTimeout(function() {
          targetEl.style.outline = prevOutline;
          targetEl.style.boxShadow = '';
          targetEl.style.transition = prevTransition;
        }, 1500);
      } catch(err) {}

      notifyParent({
        type: 'PREVIEW_NAV_TOAST',
        text: 'Navigated to #' + elementId,
        toastType: 'success'
      });
    } else {
      notifyParent({
        type: 'PREVIEW_NAV_TOAST',
        text: 'Simulated navigation to: /' + elementId,
        toastType: 'info'
      });
    }

    // Update window history inside iframe
    try {
      window.history.pushState({ path: href }, '', href);
    } catch(err) {}

    // Notify parent frame of URL change
    notifyParent({
      type: 'PREVIEW_NAV_CHANGE',
      url: href,
      path: href.startsWith('/') || href.startsWith('#') ? href : '/' + href,
      title: document.title || href
    });

  }, true);

  // Intercept JS SPA pushState / replaceState
  var origPushState = window.history.pushState;
  if (origPushState) {
    window.history.pushState = function(state, title, url) {
      var res = origPushState.apply(this, arguments);
      if (url) {
        notifyParent({
          type: 'PREVIEW_NAV_CHANGE',
          url: String(url),
          path: String(url),
          title: document.title || String(url)
        });
      }
      return res;
    };
  }

  var origReplaceState = window.history.replaceState;
  if (origReplaceState) {
    window.history.replaceState = function(state, title, url) {
      var res = origReplaceState.apply(this, arguments);
      if (url) {
        notifyParent({
          type: 'PREVIEW_NAV_CHANGE',
          url: String(url),
          path: String(url),
          title: document.title || String(url)
        });
      }
      return res;
    };
  }

  window.addEventListener('hashchange', function() {
    notifyParent({
      type: 'PREVIEW_NAV_CHANGE',
      url: window.location.hash || '/',
      path: window.location.hash || '/',
      title: document.title || 'Preview'
    });
  });

  window.addEventListener('popstate', function() {
    notifyParent({
      type: 'PREVIEW_NAV_CHANGE',
      url: window.location.hash || window.location.pathname || '/',
      path: window.location.hash || window.location.pathname || '/',
      title: document.title || 'Preview'
    });
  });

  // Listen to messages from parent
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || data.target !== 'preview-iframe') return;

    if (data.type === 'PREVIEW_NAV_GO_BACK') {
      window.history.back();
    } else if (data.type === 'PREVIEW_NAV_GO_FORWARD') {
      window.history.forward();
    } else if (data.type === 'PREVIEW_NAV_GO_TO') {
      var targetPath = data.url;
      if (!targetPath) return;

      if (targetPath === '/' || targetPath === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        var targetId = targetPath.replace(/^#|^\\/|^\\.\\/|\\.html$/g, '');
        var el = document.getElementById(targetId) ||
                 document.querySelector('[data-page="' + targetId + '"]') ||
                 document.querySelector('.' + targetId);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      try {
        window.history.pushState({ path: targetPath }, '', targetPath);
      } catch(err) {}

      notifyParent({
        type: 'PREVIEW_NAV_CHANGE',
        url: targetPath,
        path: targetPath.startsWith('/') || targetPath.startsWith('#') ? targetPath : '/' + targetPath,
        title: document.title || targetPath
      });
    }
  });
})();
</script>
`;
