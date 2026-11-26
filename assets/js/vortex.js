// ==========================================================================
// PokeMMO Farm Guide — vortex.js (Órbitas concéntricas e íconos interactivos)
// Pausa fuera de pantalla (IntersectionObserver) y al ocultar pestaña
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('inicio');
  const stage = document.querySelector('.vortex-stage');
  if (!hero || !stage) return;

  const arms = Array.from(stage.querySelectorAll('.vortex-arm'));
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isHeroVisible = true;

  function updatePlayState() {
    const shouldPause = !isHeroVisible || document.hidden || prefersReducedMotion;
    stage.classList.toggle('is-paused', shouldPause);
  }

  function layoutOrbits() {
    const isMobile = window.innerWidth < 768;
    const width = hero.clientWidth || window.innerWidth;
    const height = hero.clientHeight || window.innerHeight;
    const maxRadius = Math.min(width * 0.43, height * 0.46, 415);
    const ringScales = [0.88, 0.96, 1.04];

    arms.forEach((arm, idx) => {
      const ringIndex = idx % 3;
      const groupSlot = Math.floor(idx / 3);
      const angle = groupSlot * 120 + ringIndex * 40;
      const duration = ringIndex === 0 ? 44 : ringIndex === 1 ? 60 : 76;
      const delay = -((angle / 360) * duration);

      const offset = arm.querySelector('.vortex-arm-offset');
      const node = arm.querySelector('.vortex-node');

      if (isMobile) {
        arm.style.transform = '';
        if (node) node.style.transform = '';
        return;
      }

      const minR = width >= 1120 ? 335 : 240;
      const radius = Math.max(minR, Math.round(maxRadius * ringScales[ringIndex]));
      if (offset) {
        offset.style.setProperty('--orbit-radius', `${radius}px`);
      }

      arm.style.setProperty('--arm-duration', `${duration}s`);
      arm.style.setProperty('--arm-delay', `${delay.toFixed(2)}s`);
      if (node) {
        node.style.setProperty('--arm-duration', `${duration}s`);
        node.style.setProperty('--arm-delay', `${delay.toFixed(2)}s`);
      }

      if (prefersReducedMotion) {
        arm.style.transform = `rotate(${angle}deg)`;
        if (node) {
          node.style.transform = `rotate(${-angle}deg)`;
        }
      } else {
        arm.style.transform = '';
        if (node) {
          node.style.transform = '';
        }
      }
    });
  }

  layoutOrbits();
  window.addEventListener('resize', layoutOrbits, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isHeroVisible = entry.isIntersecting;
          updatePlayState();
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(hero);
  }

  document.addEventListener('visibilitychange', updatePlayState);
  updatePlayState();
});
