(() => {
  document.documentElement.classList.add('js');
  const tr = document.documentElement.lang === 'tr';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.querySelector('#motion');
  let enabled = !reduced.matches;
  const setMotion = () => {
    document.body.classList.toggle('motion-enabled', enabled);
    motion.setAttribute('aria-pressed', String(enabled));
    motion.textContent = enabled ? (tr ? 'Hareketi durdur' : 'Pause motion') : (tr ? 'Hareketi başlat' : 'Start motion');
  };
  motion.addEventListener('click', () => { enabled = !enabled; setMotion(); });
  reduced.addEventListener('change', () => { enabled = !reduced.matches; setMotion(); });
  setMotion();
  const study = document.querySelector('.study');
  let manual = false;
  const choices = [...study.querySelectorAll('[data-choice]')];
  function select(state) {
    if (!choices.some(button => button.dataset.choice === state)) return;
    study.dataset.state = state;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === state)));
    study.querySelectorAll('[data-caption]').forEach(caption => { caption.hidden = caption.dataset.caption !== state; });
  }
  choices.forEach(button => button.addEventListener('click', () => { manual = true; select(button.dataset.choice); }));
  study.querySelector('.follow-reading').addEventListener('click', () => { manual = false; update(); });
  new IntersectionObserver(entries => study.classList.toggle('in-view', entries[0].isIntersecting)).observe(study);
  const headings = [...document.querySelectorAll('.article h2')];
  const toc = document.querySelector('.reading-tools details');
  const links = [...toc.querySelectorAll('a')];
  links.forEach(link => link.addEventListener('click', () => { toc.open = false; }));
  const tools = document.querySelector('.reading-tools');
  let queued = false;
  function update() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    tools.style.setProperty('--progress', `${max > 0 ? Math.max(0,Math.min(100,scrollY/max*100)) : 0}%`);
    let active = headings[0];
    for (const heading of headings) if (heading.getBoundingClientRect().top <= innerHeight * .4) active = heading;
    links.forEach(link => link.setAttribute('aria-current', String(link.hash === '#' + active?.id)));
    if (!manual && active?.dataset.study) select(active.dataset.study);
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
})();
