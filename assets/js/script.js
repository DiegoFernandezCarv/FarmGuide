// ==========================================================================
// PokeMMO Farm Guide — script.js (Tema, navegación, búsqueda ES/EN y glow)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  /* ---- Tema oscuro por defecto + toggle con localStorage ---- */
  const themeToggle = document.getElementById('theme-toggle');
  const metaTheme = document.getElementById('meta-theme-color');

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem('pfg_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (metaTheme) {
      metaTheme.setAttribute('content', isLight ? '#f2f1ee' : '#101114');
    }
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.setAttribute(
        'aria-label',
        isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'
      );
      themeToggle.setAttribute(
        'title',
        isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'
      );
    }
  }

  applyTheme(getSavedTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem('pfg_theme', next);
      } catch {
        // Almacenamiento bloqueado: el cambio sigue activo en la sesión actual
      }
    });
  }

  /* ---- Menú móvil ---- */
  const siteHeader = document.querySelector('.site-header');
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  function setMenuOpen(open, restoreFocus = false) {
    if (!navToggle || !mainNav) return;
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (!open && restoreFocus) {
      navToggle.focus();
    }
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = !mainNav.classList.contains('open');
      setMenuOpen(isOpen);
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        setMenuOpen(false, true);
      }
    });

    document.addEventListener('click', (e) => {
      if (mainNav.classList.contains('open') && siteHeader && !siteHeader.contains(e.target)) {
        setMenuOpen(false);
      }
    });
  }

  /* ---- Bloqueo real de botones de video vacíos (.is-empty) ---- */
  document.querySelectorAll('a.is-empty, a[aria-disabled="true"]').forEach((link) => {
    link.addEventListener('click', (e) => e.preventDefault());
    link.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
      }
    });
  });

  /* ---- Seguimiento sutil del puntero en tarjetas (.glow-card) ---- */
  const canHoverFine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHoverFine) {
    document.querySelectorAll('.glow-card').forEach((card) => {
      let rafId = 0;
      let nextX = 0;
      let nextY = 0;

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        nextX = Math.round(e.clientX - rect.left);
        nextY = Math.round(e.clientY - rect.top);
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          card.style.setProperty('--gx', `${nextX}px`);
          card.style.setProperty('--gy', `${nextY}px`);
        });
      });
    });
  }

  /* ---- Buscador ES/EN de categorías (Home) ---- */
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const searchCount = document.getElementById('search-count');
  const resetSearch = document.getElementById('reset-search');
  const catCards = Array.from(document.querySelectorAll('#cat-grid .cat-card'));
  const noResults = document.getElementById('no-results');

  // Sinónimos en español e inglés para cada categoría
  const CATEGORY_SYNONYMS = {
    money:    ['money', 'dinero', 'plata', 'oro', 'gold', 'cash', 'efectivo'],
    berries:  ['berries', 'berry', 'bayas', 'baya', 'frutas', 'fruit'],
    items:    ['items', 'item', 'objetos', 'objeto', 'ítems', 'equipment', 'gear'],
    gym:      ['gym', 'gyms', 'gimnasio', 'gimnasios', 'badge', 'medalla', 'medallas', 'lider'],
    alpha:    ['alpha', 'alphas', 'alfa', 'alfas'],
    payday:   ['payday', 'paga', 'pago', 'dia de pago', 'día de pago'],
    pickup:   ['pickup', 'pick up', 'recoger', 'recolección', 'recoleccion', 'recolectar'],
    breeding: ['breeding', 'breed', 'crianza', 'criar', 'cria', 'cría', 'eggs', 'huevos', 'huevo'],
    farmeros: ['farmeros', 'farmero', 'herramienta', 'herramientas', 'tool', 'tools', 'utility', 'utilidad', 'smeargle'],
  };

  function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function updateSearchStatus(rawQuery, visibleCount) {
    if (searchClear) {
      searchClear.hidden = rawQuery.length === 0;
    }
    if (searchCount) {
      if (!rawQuery) {
        searchCount.textContent = `${catCards.length} categorías`;
      } else if (visibleCount === 0) {
        searchCount.textContent = 'Sin coincidencias';
      } else if (visibleCount === 1) {
        searchCount.textContent = '1 categoría';
      } else {
        searchCount.textContent = `${visibleCount} categorías`;
      }
    }
  }

  function filterCategories() {
    if (!searchInput) return;
    const rawQuery = searchInput.value.trim();
    const query = normalize(rawQuery.toLowerCase());
    let visibleCount = 0;

    catCards.forEach((card) => {
      const cat = card.dataset.cat;
      const nameEl = card.querySelector('h3');
      const descEl = card.querySelector('p');
      const name = normalize((nameEl ? nameEl.textContent : '').toLowerCase());
      const desc = normalize((descEl ? descEl.textContent : '').toLowerCase());
      const synonyms = (CATEGORY_SYNONYMS[cat] || []).map(normalize);

      const matches = !query
        || name.includes(query)
        || desc.includes(query)
        || synonyms.some((syn) => syn.includes(query) || query.includes(syn));

      card.hidden = !matches;
      if (matches) visibleCount++;
    });

    if (noResults) {
      noResults.hidden = visibleCount !== 0;
    }

    updateSearchStatus(rawQuery, visibleCount);
  }

  function clearSearch() {
    if (!searchInput) return;
    searchInput.value = '';
    filterCategories();
    searchInput.focus();
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterCategories);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        e.preventDefault();
        searchInput.value = '';
        filterCategories();
      }
    });

    // Atajo "/" sin animación (acción de teclado instantánea)
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      const isField = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable
      );
      if (isField) return;
      e.preventDefault();
      searchInput.focus();
    });

    filterCategories();
  }

  if (searchClear) {
    searchClear.addEventListener('click', clearSearch);
  }

  if (resetSearch) {
    resetSearch.addEventListener('click', clearSearch);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const visible = catCards.filter((c) => !c.hidden);
      if (visible.length === 1) {
        window.location.href = visible[0].getAttribute('href');
      } else {
        const target = document.getElementById('categorias');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
});
