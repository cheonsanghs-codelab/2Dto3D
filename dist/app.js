(() => {
  const deck = document.querySelector('.deck');
  const slides = [...document.querySelectorAll('.slide')];
  const progressBar = document.getElementById('progressBar');
  const slideCount = document.getElementById('slideCount');
  const speakerLabel = document.getElementById('speakerLabel');
  const timerEl = document.getElementById('timer');
  const overviewPanel = document.getElementById('overviewPanel');
  const overviewList = document.getElementById('overviewList');
  let index = 0;
  let timerStarted = false;
  let startTime = Date.now();
  let touchStartX = 0;

  slides.forEach((slide, i) => {
    const title = (slide.querySelector('h1, h2')?.textContent || '2D 사진의 3D 복원').replace(/\s+/g, ' ').trim();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'overview-item';
    button.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><strong>${title}</strong><small>${slide.dataset.speaker}</small>`;
    button.addEventListener('click', () => {
      goTo(i);
      toggleOverview(false);
    });
    overviewList.append(button);
  });

  function updateUI() {
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
    slideCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    speakerLabel.textContent = slides[index].dataset.speaker;
    document.querySelectorAll('.overview-item').forEach((item, i) => item.classList.toggle('active', i === index));
  }

  function goTo(next) {
    const safe = Math.max(0, Math.min(slides.length - 1, next));
    if (safe === index) return;
    slides[index].classList.remove('active');
    index = safe;
    slides[index].classList.add('active');
    if (!timerStarted) {
      timerStarted = true;
      startTime = Date.now();
    }
    updateUI();
  }

  function toggleOverview(force) {
    const open = typeof force === 'boolean' ? force : !deck.classList.contains('overview-open');
    deck.classList.toggle('overview-open', open);
    overviewPanel.setAttribute('aria-hidden', String(!open));
  }

  function toggleNotes() {
    deck.classList.toggle('notes-open');
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  }

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'overview') toggleOverview();
    if (action === 'fullscreen') toggleFullscreen();
  });

  document.addEventListener('keydown', event => {
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goTo(index + 1);
    }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goTo(index - 1);
    }
    if (['s', 'n'].includes(event.key.toLowerCase())) toggleNotes();
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
    if (event.key === 'Escape') toggleOverview(false);
    if (event.key === 'Home') goTo(0);
    if (event.key === 'End') goTo(slides.length - 1);
  });

  document.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 55) goTo(index + (delta < 0 ? 1 : -1));
  }, { passive: true });

  setInterval(() => {
    const elapsed = timerStarted ? Math.floor((Date.now() - startTime) / 1000) : 0;
    timerEl.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  }, 500);

  function randomFactory(seed) {
    let value = seed >>> 0;
    return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width: rect.width, height: rect.height };
  }

  function drawCloud(canvas) {
    if (!canvas) return;
    const { context, width, height } = fitCanvas(canvas);
    const random = randomFactory(29);
    context.clearRect(0, 0, width, height);

    for (let i = 0; i < 430; i += 1) {
      const t = random();
      const vertical = t * 2 - 1;
      const body = .2 + .22 * Math.sin(Math.PI * t) + .045 * Math.sin(Math.PI * 3 * t);
      const angle = random() * Math.PI * 2;
      const radius = body * (.7 + random() * .35);
      const x = width * .7 + Math.cos(angle) * radius * Math.min(width, height);
      const y = height * .5 + vertical * height * .38;
      const opacity = .38 + random() * .57;
      const color = random() > .35 ? '0,239,117' : '0,189,221';
      context.fillStyle = 'rgba(' + color + ',' + opacity + ')';
      context.beginPath();
      context.arc(x, y, .8 + random() * 1.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function redrawClouds() {
    drawCloud(document.getElementById('sparseCloud'));
  }

  window.addEventListener('resize', redrawClouds);
  redrawClouds();
  updateUI();
})();
