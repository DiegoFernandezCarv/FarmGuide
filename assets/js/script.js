// ============================================
// PokeMMO Farm Guide — script.js
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Menú móvil ---- */
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Cierra el menú al elegir un enlace (mejor experiencia en móvil)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Buscador de categorías ---- */
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const catCards = Array.from(document.querySelectorAll('.cat-card'));
  const noResults = document.getElementById('no-results');

  // Sinónimos en español e inglés para cada categoría, así el buscador
  // reconoce términos relacionados aunque no coincidan con el nombre exacto.
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

  // Quita tildes para que "crianza" y "cría" también matcheen entre sí.
  function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filterCategories() {
    const query = normalize(searchInput.value.trim().toLowerCase());
    let visibleCount = 0;

    catCards.forEach(card => {
      const cat = card.dataset.cat;
      const name = normalize(card.querySelector('h3').textContent.toLowerCase());
      const desc = normalize(card.querySelector('p').textContent.toLowerCase());
      const synonyms = (CATEGORY_SYNONYMS[cat] || []).map(normalize);

      const matches = !query
        || name.includes(query)
        || desc.includes(query)
        || synonyms.some(syn => syn.includes(query) || query.includes(syn));

      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    if (noResults) {
      noResults.hidden = visibleCount !== 0;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterCategories);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Si hay una sola categoría visible, navega directo a ella
      const visible = catCards.filter(c => c.style.display !== 'none');
      if (visible.length === 1) {
        window.location.href = visible[0].getAttribute('href');
      } else {
        document.getElementById('categorias').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

});
