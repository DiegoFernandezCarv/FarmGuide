/* ==========================================================================
   PokeMMO Farm Guide — Regla lateral de navegación (reposo + vista compacta)
   - Reposo: regla absoluta a la altura del documento (0..100 SVG) + listas en esquinas.
   - Hover / Focus / Drag: capa fija compacta (0..100 ventana), recuadro de viewport,
     etiquetas proporcionales con brillo radial, scroll 1:1 interrumpible y teclado.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var MOBILE_BP = 768;
  var HOVER_LEAVE_MS = 90;
  var TOUCH_RELEASE_MS = 600;
  var TICK_INSET = 14;

  function initRuler() {
    var sectionEls = Array.prototype.slice.call(
      document.querySelectorAll('[data-ruler-section]')
    );
    if (!sectionEls.length) return;

    var reducedMotionQuery = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    var coarsePointerQuery = window.matchMedia
      ? window.matchMedia('(pointer: coarse)')
      : null;

    var sections = sectionEls.map(function (el, index) {
      var id = el.id || ('seccion-' + (index + 1));
      if (!el.id) el.id = id;
      var rawLabel = el.getAttribute('data-ruler-label') || el.textContent || id;
      var label = rawLabel.trim();
      if (!label) label = id;
      if (label.length > 48) label = label.slice(0, 48).trim() + '…';
      return {
        el: el,
        id: id,
        label: label,
        offsetTop: 0,
        accent: '',
        accentRgb: ''
      };
    });

    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll('[data-nav-section]')
    );
    var headerEl = document.querySelector('.site-header');

    /* --- Construcción del DOM de la regla --- */
    var nav = document.createElement('nav');
    nav.className = 'ruler-nav';
    nav.setAttribute('aria-label', 'Navegación de secciones');

    /* 1. Capa de reposo larga (position: absolute top/bottom 0 dentro de body) */
    var longWrap = document.createElement('div');
    longWrap.className = 'ruler-long';
    longWrap.setAttribute('aria-hidden', 'true');

    var longInner = document.createElement('div');
    longInner.className = 'ruler-long-inner';
    longInner.appendChild(buildTicksSvg());
    longInner.appendChild(buildNumbers());

    var longMarker = document.createElement('div');
    longMarker.className = 'ruler-long-marker';
    var longLine = document.createElement('span');
    longLine.className = 'ruler-long-line';
    var longReadout = document.createElement('span');
    longReadout.className = 'ruler-readout ruler-readout--long';
    longReadout.textContent = '000%';
    longMarker.appendChild(longLine);
    longMarker.appendChild(longReadout);
    longInner.appendChild(longMarker);
    longWrap.appendChild(longInner);

    /* 2. Listas de secciones en esquinas superior e inferior derechas (solo reposo) */
    var cornerTop = document.createElement('div');
    cornerTop.className = 'ruler-corner ruler-corner--top';
    cornerTop.setAttribute('aria-hidden', 'true');

    var cornerBottom = document.createElement('div');
    cornerBottom.className = 'ruler-corner ruler-corner--bottom';
    cornerBottom.setAttribute('aria-hidden', 'true');

    var cornerLinks = sections.map(function (sec, idx) {
      var link = document.createElement('a');
      link.className = 'ruler-corner-link';
      link.href = '#' + sec.id;
      link.setAttribute('tabindex', '-1');
      link.setAttribute('aria-hidden', 'true');
      link.textContent = sec.label;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToSection(idx);
      });
      return link;
    });

    /* 3. Zona interactiva fija derecha (hover desktop + teclado slider + arrastre 1:1) */
    var hotspot = document.createElement('div');
    hotspot.className = 'ruler-hotspot';
    hotspot.setAttribute('role', 'slider');
    hotspot.setAttribute('tabindex', '0');
    hotspot.setAttribute('aria-label', 'Posición en la página');
    hotspot.setAttribute('aria-valuemin', '0');
    hotspot.setAttribute('aria-valuemax', '100');
    hotspot.setAttribute('aria-valuenow', '0');
    hotspot.setAttribute('aria-valuetext', '0%');

    /* 4. Capa compacta fija (altura de ventana 0..100 + viewport box + etiquetas) */
    var compactWrap = document.createElement('div');
    compactWrap.className = 'ruler-compact';

    var compactScale = document.createElement('div');
    compactScale.className = 'ruler-compact-scale';

    var compactRail = document.createElement('div');
    compactRail.className = 'ruler-compact-rail';
    compactRail.setAttribute('aria-hidden', 'true');

    var compactInner = document.createElement('div');
    compactInner.className = 'ruler-compact-inner';
    compactInner.appendChild(buildTicksSvg());
    compactInner.appendChild(buildNumbers());

    var viewportBox = document.createElement('div');
    viewportBox.className = 'ruler-viewport-box';
    var viewportTop = document.createElement('span');
    viewportTop.className = 'ruler-viewport-top';
    var compactReadout = document.createElement('span');
    compactReadout.className = 'ruler-readout ruler-readout--compact';
    compactReadout.textContent = '000%';
    viewportTop.appendChild(compactReadout);
    var viewportBottom = document.createElement('span');
    viewportBottom.className = 'ruler-viewport-bottom';
    viewportBox.appendChild(viewportTop);
    viewportBox.appendChild(viewportBottom);

    compactInner.appendChild(viewportBox);
    compactRail.appendChild(compactInner);

    var compactLabels = document.createElement('div');
    compactLabels.className = 'ruler-compact-labels';

    var compactLinks = sections.map(function (sec, idx) {
      var link = document.createElement('a');
      link.className = 'ruler-compact-link';
      link.href = '#' + sec.id;
      link.setAttribute('data-ruler-index', String(idx));
      link.textContent = sec.label;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToSection(idx);
        if (touchActive || pointerOverCompact) {
          pointerOverCompact = false;
          scheduleTouchCollapse();
        }
      });

      link.addEventListener('keydown', function (e) {
        handleLabelKeydown(e, idx);
      });

      return link;
    });

    compactLinks.forEach(function (link) {
      compactLabels.appendChild(link);
    });

    compactScale.appendChild(compactRail);
    compactScale.appendChild(compactLabels);
    compactWrap.appendChild(compactScale);

    nav.appendChild(longWrap);
    nav.appendChild(cornerTop);
    nav.appendChild(cornerBottom);
    nav.appendChild(hotspot);
    nav.appendChild(compactWrap);
    document.body.appendChild(nav);

    /* --- Estado medido y de interacción --- */
    var metrics = {
      docH: 1,
      winH: 1,
      winW: 1,
      headerH: 52,
      compactTop: 0,
      compactH: 1,
      longInnerH: 1,
      compactInnerH: 1,
      boxH: 24,
      maxScroll: 0
    };

    var activeIdx = -1;
    var pointerOverHotspot = false;
    var pointerOverCompact = false;
    var focusInside = false;
    var isDragging = false;
    var touchActive = false;
    var activePointerId = null;
    var hoverLeaveTimer = 0;
    var touchCollapseTimer = 0;
    var measureRaf = 0;
    var scrollRaf = 0;
    var lastPctText = '';

    /* --- Construcción SVG nítido 0..100 y números HTML --- */
    function buildTicksSvg() {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'ruler-svg');
      svg.setAttribute('viewBox', '0 0 56 1000');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      for (var i = 0; i <= 100; i++) {
        var isMajor = i % 5 === 0;
        var y = i * 10;
        var line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', isMajor ? '39' : '47');
        line.setAttribute('x2', '56');
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        line.setAttribute(
          'class',
          isMajor ? 'ruler-tick ruler-tick--major' : 'ruler-tick'
        );
        svg.appendChild(line);
      }
      return svg;
    }

    function buildNumbers() {
      var nums = document.createElement('div');
      nums.className = 'ruler-nums';
      var frag = document.createDocumentFragment();
      for (var i = 0; i <= 100; i += 5) {
        var span = document.createElement('span');
        span.className = 'ruler-num';
        span.style.top = i + '%';
        span.textContent = String(i);
        frag.appendChild(span);
      }
      nums.appendChild(frag);
      return nums;
    }

    /* --- Colores por sección activa --- */
    function readSectionAccents() {
      var bodyStyles = window.getComputedStyle(document.body);
      var fallbackAccent = bodyStyles.getPropertyValue('--accent').trim();
      var fallbackRgb = bodyStyles.getPropertyValue('--accent-rgb').trim();

      sections.forEach(function (sec) {
        var s = window.getComputedStyle(sec.el);
        sec.accent = s.getPropertyValue('--accent').trim() || fallbackAccent;
        sec.accentRgb = s.getPropertyValue('--accent-rgb').trim() || fallbackRgb;
      });
    }

    function applyActiveAccent(idx) {
      var sec = sections[idx];
      if (!sec) return;
      if (sec.accent) nav.style.setProperty('--accent', sec.accent);
      if (sec.accentRgb) nav.style.setProperty('--accent-rgb', sec.accentRgb);
    }

    /* --- Medición completa sin bucles ni alturas fijas en la regla larga --- */
    function measure() {
      measureRaf = 0;
      var docEl = document.documentElement;
      var winW = window.innerWidth || docEl.clientWidth || 1024;
      var winH = window.innerHeight || docEl.clientHeight || 768;
      var scrollH = Math.max(winH, docEl.scrollHeight || 0, longWrap.offsetHeight || 0);
      var headerH = headerEl ? headerEl.getBoundingClientRect().height : 52;
      var compactRect = compactWrap.getBoundingClientRect();
      var compactTop = Math.max(0, compactRect.top || 0);
      var compactH = Math.max(1, compactRect.height || (winH - compactTop));

      var longInnerH = Math.max(1, longInner.clientHeight || (scrollH - compactTop - TICK_INSET * 2));
      var compactInnerH = Math.max(1, compactInner.clientHeight || (compactH - TICK_INSET * 2));
      var maxScroll = Math.max(0, scrollH - winH);
      var boxH = Math.max(24, Math.min(compactInnerH, (winH / Math.max(1, scrollH)) * compactInnerH));

      metrics.docH = scrollH;
      metrics.winH = winH;
      metrics.winW = winW;
      metrics.headerH = headerH;
      metrics.compactTop = compactTop;
      metrics.compactH = compactH;
      metrics.longInnerH = longInnerH;
      metrics.compactInnerH = compactInnerH;
      metrics.boxH = boxH;
      metrics.maxScroll = maxScroll;

      viewportBox.style.height = boxH.toFixed(2) + 'px';

      var compressScale = scrollH <= winH * 1.05 ? 1 : Math.min(4, scrollH / Math.max(1, winH));
      compactScale.style.setProperty('--compress-scale', compressScale.toFixed(4));

      sections.forEach(function (sec) {
        var rect = sec.el.getBoundingClientRect();
        sec.offsetTop = Math.max(0, rect.top + window.scrollY);
      });

      layoutCompactLabels();
      syncScroll();
    }

    function scheduleMeasure() {
      if (measureRaf) return;
      measureRaf = window.requestAnimationFrame(measure);
    }

    /* --- Posicionamiento proporcional anti-solape en modo compacto --- */
    function layoutCompactLabels() {
      var count = sections.length;
      if (!count) return;

      var compactH = metrics.compactH;
      var docH = Math.max(1, metrics.docH);
      var innerH = metrics.compactInnerH;
      var isCoarse = Boolean(coarsePointerQuery && coarsePointerQuery.matches) || metrics.winW < MOBILE_BP;
      var linkH = isCoarse ? 44 : 32;
      var halfH = linkH / 2;
      var headerClearLocal = Math.max(0, metrics.headerH - metrics.compactTop);
      var minY = Math.max(TICK_INSET + halfH, headerClearLocal + halfH + 8);
      var maxY = Math.max(minY, compactH - TICK_INSET - halfH);
      var span = Math.max(1, maxY - minY);
      var minGap = count > 1
        ? Math.min(linkH + 4, span / Math.max(1, count - 1))
        : 0;

      var ys = sections.map(function (sec) {
        var rawY = TICK_INSET + (sec.offsetTop / docH) * innerH;
        return Math.max(minY, Math.min(maxY, rawY));
      });

      for (var i = 1; i < count; i++) {
        if (ys[i] < ys[i - 1] + minGap) {
          ys[i] = ys[i - 1] + minGap;
        }
      }
      if (ys[count - 1] > maxY) {
        ys[count - 1] = maxY;
      }
      for (var j = count - 2; j >= 0; j--) {
        if (ys[j] > ys[j + 1] - minGap) {
          ys[j] = ys[j + 1] - minGap;
        }
      }
      if (ys[0] < minY) {
        ys[0] = minY;
        for (var k = 1; k < count; k++) {
          if (ys[k] < ys[k - 1] + minGap) {
            ys[k] = Math.min(maxY, ys[k - 1] + minGap);
          }
        }
      }

      compactLinks.forEach(function (link, idx) {
        link.style.setProperty('--label-y', ys[idx].toFixed(1) + 'px');
      });
    }

    /* --- Estado activo y listas de esquinas --- */
    function updateActiveSection(scrollY) {
      var nextIdx = 0;
      var maxScroll = metrics.maxScroll;

      if (scrollY <= 4 || maxScroll <= 0) {
        nextIdx = 0;
      } else if (scrollY >= maxScroll - 4) {
        nextIdx = sections.length - 1;
      } else {
        var probeY = scrollY + metrics.headerH + metrics.winH * 0.28;
        for (var i = sections.length - 1; i >= 0; i--) {
          if (sections[i].offsetTop <= probeY) {
            nextIdx = i;
            break;
          }
        }
      }

      if (nextIdx === activeIdx) return;
      activeIdx = nextIdx;

      applyActiveAccent(activeIdx);

      compactLinks.forEach(function (link, idx) {
        if (idx === activeIdx) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      var activeId = sections[activeIdx].id;
      navLinks.forEach(function (el) {
        var target = el.getAttribute('data-nav-section');
        el.classList.toggle('is-active', target === activeId);
      });

      /* Reparto de esquinas en reposo: arriba = pasadas + activa; abajo = restantes */
      cornerTop.textContent = '';
      cornerBottom.textContent = '';

      cornerLinks.forEach(function (link, idx) {
        var isCurrent = idx === activeIdx;
        link.classList.toggle('is-current', isCurrent);
        if (idx <= activeIdx) {
          cornerTop.appendChild(link);
        } else {
          cornerBottom.appendChild(link);
        }
      });

      cornerTop.classList.toggle('is-empty', cornerTop.childElementCount === 0);
      cornerBottom.classList.toggle('is-empty', cornerBottom.childElementCount === 0);
    }

    /* --- Sincronización 1:1 en scroll (solo transform en un rAF) --- */
    function formatPercent(progress) {
      var pct = Math.round(progress * 100);
      var clamped = Math.max(0, Math.min(100, pct));
      var padded = clamped < 10
        ? '00' + clamped
        : (clamped < 100 ? '0' + clamped : String(clamped));
      return { num: clamped, text: padded + '%' };
    }

    function syncScroll() {
      scrollRaf = 0;
      var scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      var maxScroll = metrics.maxScroll;
      var progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

      /* Posición del marcador en la regla larga y origen Y para scaleY */
      var longMarkerY = progress * metrics.longInnerH;
      longMarker.style.transform = 'translate3d(0, ' + longMarkerY.toFixed(2) + 'px, 0)';

      var viewportMarkerY = TICK_INSET + progress * Math.max(1, metrics.compactInnerH);
      compactScale.style.setProperty('--origin-y', viewportMarkerY.toFixed(1) + 'px');

      /* Recuadro de ventana visible en la regla compacta */
      var maxBoxY = Math.max(0, metrics.compactInnerH - metrics.boxH);
      var rawBoxY = (scrollY / Math.max(1, metrics.docH)) * metrics.compactInnerH;
      var boxY = Math.max(0, Math.min(maxBoxY, rawBoxY));
      viewportBox.style.transform = 'translate3d(0, ' + boxY.toFixed(2) + 'px, 0)';

      var fmt = formatPercent(progress);
      if (fmt.text !== lastPctText) {
        lastPctText = fmt.text;
        longReadout.textContent = fmt.text;
        compactReadout.textContent = fmt.text;
        hotspot.setAttribute('aria-valuenow', String(fmt.num));
        hotspot.setAttribute('aria-valuetext', fmt.num + '%');
      }

      updateActiveSection(scrollY);
    }

    function scheduleScrollSync() {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(syncScroll);
    }

    /* --- Alternancia reposo <-> compacto --- */
    function updateCompactState() {
      var compact = pointerOverHotspot || pointerOverCompact || focusInside || isDragging || touchActive;
      nav.classList.toggle('is-compact', compact);
      nav.classList.toggle('is-dragging', isDragging);
    }

    function cancelTimers() {
      if (hoverLeaveTimer) {
        window.clearTimeout(hoverLeaveTimer);
        hoverLeaveTimer = 0;
      }
      if (touchCollapseTimer) {
        window.clearTimeout(touchCollapseTimer);
        touchCollapseTimer = 0;
      }
    }

    function scheduleHoverClose() {
      if (hoverLeaveTimer) window.clearTimeout(hoverLeaveTimer);
      hoverLeaveTimer = window.setTimeout(function () {
        hoverLeaveTimer = 0;
        updateCompactState();
      }, HOVER_LEAVE_MS);
    }

    function scheduleTouchCollapse() {
      if (touchCollapseTimer) window.clearTimeout(touchCollapseTimer);
      touchCollapseTimer = window.setTimeout(function () {
        touchCollapseTimer = 0;
        touchActive = false;
        updateCompactState();
      }, TOUCH_RELEASE_MS);
    }

    /* --- Navegación y arrastre 1:1 --- */
    function scrubFromClientY(clientY) {
      var trackTop = metrics.compactTop + TICK_INSET;
      var trackH = Math.max(1, metrics.compactInnerH);
      var ratio = Math.max(0, Math.min(1, (clientY - trackTop) / trackH));
      var targetY = ratio * metrics.maxScroll;
      window.scrollTo({ top: targetY, behavior: 'instant' });
      syncScroll();
    }

    function scrollToSection(idx) {
      var sec = sections[idx];
      if (!sec) return;
      var isReduced = Boolean(reducedMotionQuery && reducedMotionQuery.matches);
      var rect = sec.el.getBoundingClientRect();
      var absTop = rect.top + window.scrollY;
      var targetY = idx === 0
        ? 0
        : Math.max(0, Math.min(metrics.maxScroll, absTop - metrics.headerH - 16));

      window.scrollTo({
        top: targetY,
        behavior: isReduced ? 'instant' : 'smooth'
      });
    }

    function handleLabelKeydown(e, idx) {
      var key = e.key;
      var targetIdx = -1;
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        targetIdx = Math.min(compactLinks.length - 1, idx + 1);
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        targetIdx = Math.max(0, idx - 1);
      } else if (key === 'Home') {
        targetIdx = 0;
      } else if (key === 'End') {
        targetIdx = compactLinks.length - 1;
      } else if (key === 'Escape') {
        e.preventDefault();
        closeFromEscape();
        return;
      }

      if (targetIdx >= 0) {
        e.preventDefault();
        compactLinks[targetIdx].focus();
      }
    }

    function closeFromEscape() {
      focusInside = false;
      pointerOverHotspot = false;
      pointerOverCompact = false;
      touchActive = false;
      if (document.activeElement && nav.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      updateCompactState();
    }

    /* --- Eventos de ratón / lápiz / táctil en zona derecha --- */
    hotspot.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      cancelTimers();
      pointerOverHotspot = true;
      updateCompactState();
    });

    hotspot.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      pointerOverHotspot = false;
      scheduleHoverClose();
    });

    compactLabels.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      cancelTimers();
      pointerOverCompact = true;
      updateCompactState();
    });

    compactLabels.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      pointerOverCompact = false;
      scheduleHoverClose();
    });

    hotspot.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;

      cancelTimers();
      activePointerId = e.pointerId;
      isDragging = true;
      if (e.pointerType !== 'mouse') {
        touchActive = true;
      }
      updateCompactState();

      if (typeof hotspot.setPointerCapture === 'function') {
        try {
          hotspot.setPointerCapture(e.pointerId);
        } catch (err) {
          /* sin captura en navegadores restringidos */
        }
      }

      e.preventDefault();
      scrubFromClientY(e.clientY);
    });

    hotspot.addEventListener('pointermove', function (e) {
      if (!isDragging || e.pointerId !== activePointerId) return;
      scrubFromClientY(e.clientY);
    });

    function finishPointerDrag(e) {
      if (!isDragging || e.pointerId !== activePointerId) return;
      isDragging = false;
      activePointerId = null;
      if (typeof hotspot.hasPointerCapture === 'function' && hotspot.hasPointerCapture(e.pointerId)) {
        try {
          hotspot.releasePointerCapture(e.pointerId);
        } catch (err) {
          /* ignorar */
        }
      }
      if (e.pointerType !== 'mouse') {
        scheduleTouchCollapse();
      }
      updateCompactState();
    }

    hotspot.addEventListener('pointerup', finishPointerDrag);
    hotspot.addEventListener('pointercancel', finishPointerDrag);

    /* Permitir interacción en enlaces táctiles sin cerrar prematuramente */
    compactLabels.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      if (touchCollapseTimer) {
        window.clearTimeout(touchCollapseTimer);
        touchCollapseTimer = 0;
      }
      touchActive = true;
      updateCompactState();
    });

    /* Tocar fuera de la regla cierra el estado táctil inmediatamente */
    document.addEventListener('pointerdown', function (e) {
      if (!touchActive || isDragging) return;
      if (!nav.contains(e.target)) {
        cancelTimers();
        touchActive = false;
        updateCompactState();
      }
    }, { passive: true });

    /* --- Teclado sobre el slider de la regla --- */
    hotspot.addEventListener('keydown', function (e) {
      var step = 0;
      if (e.key === 'ArrowDown') step = 0.05;
      else if (e.key === 'ArrowUp') step = -0.05;
      else if (e.key === 'PageDown') step = 0.2;
      else if (e.key === 'PageUp') step = -0.2;
      else if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'instant' });
        syncScroll();
        return;
      } else if (e.key === 'End') {
        e.preventDefault();
        window.scrollTo({ top: metrics.maxScroll, behavior: 'instant' });
        syncScroll();
        return;
      } else if (e.key === 'ArrowLeft' && compactLinks.length) {
        e.preventDefault();
        compactLinks[Math.max(0, activeIdx)].focus();
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeFromEscape();
        return;
      }

      if (step !== 0) {
        e.preventDefault();
        var nextY = Math.max(
          0,
          Math.min(metrics.maxScroll, window.scrollY + step * metrics.maxScroll)
        );
        window.scrollTo({ top: nextY, behavior: 'instant' });
        syncScroll();
      }
    });

    /* --- Foco de teclado en cualquier enlace compacto o hotspot --- */
    nav.addEventListener('focusin', function () {
      focusInside = true;
      updateCompactState();
    });

    nav.addEventListener('focusout', function (e) {
      if (e.relatedTarget && nav.contains(e.relatedTarget)) return;
      focusInside = false;
      updateCompactState();
    });

    /* --- Listeners globales de scroll, resize, tema y carga de fuentes --- */
    window.addEventListener('scroll', scheduleScrollSync, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('load', scheduleMeasure);

    if (typeof window.ResizeObserver === 'function') {
      var bodyObserver = new window.ResizeObserver(function () {
        scheduleMeasure();
      });
      bodyObserver.observe(document.body);
    }

    if (typeof window.MutationObserver === 'function') {
      var themeObserver = new window.MutationObserver(function () {
        readSectionAccents();
        if (activeIdx >= 0) applyActiveAccent(activeIdx);
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleMeasure).catch(function () {});
    }

    readSectionAccents();
    measure();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRuler);
  } else {
    initRuler();
  }
})();
