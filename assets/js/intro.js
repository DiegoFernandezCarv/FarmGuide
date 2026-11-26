// ==========================================================================
// PokeMMO Farm Guide — intro.js (Coreografía de entrada, 1 vez por sesión)
// Solo transform y opacity · Saltable con clic o tecla · Omitida con reduced-motion
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alreadyPlayed = false;

  try {
    alreadyPlayed = sessionStorage.getItem('pfg_intro_played') === '1';
  } catch {
    alreadyPlayed = false;
  }

  if (prefersReducedMotion || alreadyPlayed) {
    overlay.remove();
    return;
  }

  const stage = overlay.querySelector('.intro-stage');
  const mark = overlay.querySelector('.intro-mark');
  const wordmark = overlay.querySelector('.intro-wordmark');
  const hint = overlay.querySelector('.intro-skip-hint');
  const headerSymbol = document.querySelector('#topbar-brand .brand-symbol');

  const timers = [];
  let finished = false;
  let initialOffsetX = 0;

  if (stage && mark) {
    const stageRect = stage.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const stageCenter = stageRect.left + stageRect.width / 2;
    const markCenter = markRect.left + markRect.width / 2;
    initialOffsetX = Math.round(stageCenter - markCenter);
    mark.style.transform = `translate3d(${initialOffsetX}px, 0, 0) scale(0.92)`;
  }

  function markPlayed() {
    try {
      sessionStorage.setItem('pfg_intro_played', '1');
    } catch {
      // Sin acceso a sessionStorage
    }
  }

  function finishIntro(immediate = false) {
    if (finished) return;
    finished = true;
    timers.forEach((id) => window.clearTimeout(id));
    document.removeEventListener('keydown', onSkipKey);
    markPlayed();

    overlay.classList.add('is-fading');
    window.setTimeout(() => overlay.remove(), immediate ? 180 : 280);
  }

  function onSkipKey() {
    finishIntro(true);
  }

  overlay.addEventListener('pointerdown', () => finishIntro(true));
  document.addEventListener('keydown', onSkipKey, { once: true });

  // Beat 1 (0ms): entra el símbolo centrado
  window.requestAnimationFrame(() => {
    overlay.classList.add('step-enter');
    if (mark) {
      mark.style.transform = `translate3d(${initialOffsetX}px, 0, 0) scale(1)`;
    }
  });

  // Beat 2 (340ms): el símbolo se desplaza hacia la derecha dejando ver POKEMMO FARM GUIDE
  timers.push(
    window.setTimeout(() => {
      if (finished) return;
      overlay.classList.add('step-reveal');
      if (mark) {
        mark.style.transform = 'translate3d(0, 0, 0) scale(1)';
      }
    }, 340)
  );

  // Beat 3 (960ms): viaje hacia la posición final en la cabecera
  timers.push(
    window.setTimeout(() => {
      if (finished) return;
      if (wordmark) {
        wordmark.style.opacity = '0';
        wordmark.style.transform = 'translate3d(10px, 0, 0)';
      }
      if (hint) {
        hint.style.opacity = '0';
      }

      if (mark && headerSymbol) {
        const fromRect = mark.getBoundingClientRect();
        const toRect = headerSymbol.getBoundingClientRect();
        const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
        const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
        const scale = Math.max(0.28, toRect.width / Math.max(1, fromRect.width));

        mark.style.transition = 'transform 440ms cubic-bezier(0.77, 0, 0.175, 1), opacity 240ms cubic-bezier(0.23, 1, 0.32, 1)';
        mark.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }
    }, 960)
  );

  // Beat 4 (1260ms -> 1540ms): cierre suave
  timers.push(
    window.setTimeout(() => finishIntro(false), 1260)
  );
});
