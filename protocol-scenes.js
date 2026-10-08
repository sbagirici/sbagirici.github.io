
// Technical art studies: independent routes, deliberate states, ordinary scrolling.
const protocolStudies = [...document.querySelectorAll('.protocol-scene')];
if (protocolStudies.length) {
  const studyTr = document.documentElement.lang === 'tr';
  const stateNames = studyTr ? {
    healthy: 'Başlangıç · iletişim yolu açık',
    fault: 'Bağlantı kaybı · yeniden düzenleme',
    recovered: 'Alternatif yol etkin',
    seamless: 'Bağlantı kayıp · diğer kopya devam ediyor',
  } : {
    healthy: 'Initial state · communication path open',
    fault: 'Link lost · reconfiguration',
    recovered: 'Alternative path active',
    seamless: 'Link lost · the other copy continues',
  };
  const instances = protocolStudies.map(figure => {
    const protocol = figure.dataset.protocol;
    const dual = protocol === 'HSR' || protocol === 'PRP';
    const instance = { figure, protocol, dual, manual: false, playing: null, timer: null };
    const controls = figure.querySelector('.scene-controls');
    controls.hidden = false;
    const fault = controls.querySelector('.fault-toggle');
    const flow = controls.querySelector('.flow-toggle');
    const auto = controls.querySelector('.scene-auto');
    const setState = state => {
      figure.dataset.state = state;
      figure.querySelector('.scene-state').textContent = stateNames[state === 'healthy' ? 'healthy' : dual ? 'seamless' : state];
      fault.textContent = state === 'healthy' ? (studyTr ? 'Bağlantıyı kes' : 'Break the link') : (studyTr ? 'Bağlantıyı geri getir' : 'Restore the link');
      fault.setAttribute('aria-pressed', String(state !== 'healthy'));
    };
    instance.setState = setState;
    fault.addEventListener('click', () => {
      instance.manual = true;
      clearTimeout(instance.timer);
      if (figure.dataset.state !== 'healthy') setState('healthy');
      else {
        setState('fault');
        if (!dual) instance.timer = setTimeout(() => setState('recovered'), 900);
      }
    });
    flow.addEventListener('click', () => {
      const currentlyPlaying = instance.playing ?? document.body.classList.contains('is-motion-enabled');
      instance.playing = !currentlyPlaying;
      flow.setAttribute('aria-pressed', String(instance.playing));
      flow.textContent = instance.playing ? (studyTr ? 'Akışı durdur' : 'Pause the flow') : (studyTr ? 'Akışı oynat' : 'Play the flow');
      ensureAnimation();
    });
    auto.addEventListener('click', () => { instance.manual = false; clearTimeout(instance.timer); updateStudies(); });
    setState('healthy');
    return instance;
  });
  let studyQueued = false;
  function updateStudies() {
    studyQueued = false;
    instances.forEach(instance => {
      if (instance.manual) return;
      const top = instance.figure.getBoundingClientRect().top;
      const state = top > innerHeight * .53 ? 'healthy' : top > innerHeight * .17 ? 'fault' : instance.dual ? 'fault' : 'recovered';
      if (instance.figure.dataset.state !== state) instance.setState(state);
    });
  }
  addEventListener('scroll', () => { if (!studyQueued) { studyQueued = true; requestAnimationFrame(updateStudies); } }, { passive: true });
  addEventListener('resize', updateStudies);
  updateStudies();
  const paths = instances.map(instance => ({
    ...instance,
    source: instance,
    a: instance.figure.querySelector('.path-a'),
    b: instance.figure.querySelector('.path-b'),
    packetA: instance.figure.querySelector('.packet-a'),
    packetB: instance.figure.querySelector('.packet-b'),
  }));
  paths.forEach(instance => { instance.lengthA = instance.a.getTotalLength(); instance.lengthB = instance.b.getTotalLength(); });
  let animationRunning = false;
  function ensureAnimation() {
    if (!animationRunning) { animationRunning = true; requestAnimationFrame(animateStudies); }
  }
  function animateStudies(time) {
    let needsFrame = false;
    paths.forEach(instance => {
      const visible = instance.figure.getBoundingClientRect();
      const playing = document.body.classList.contains('is-motion-enabled') && (instance.source.playing ?? true);
      const state = instance.figure.dataset.state;
      const active = visible.top < innerHeight && visible.bottom > 0;
      if (active && playing) needsFrame = true;
      const travel = (time % 5000) * .18;
      const allowedPaths = [];
      [ ['a', instance.packetA, instance.a], ['b', instance.packetB, instance.b] ].forEach(([key, dot, path]) => {
        const allowed = instance.dual ? (state === 'healthy' || key === 'b') : (key === 'a' ? state === 'healthy' : state === 'recovered');
        const length = key === 'a' ? instance.lengthA : instance.lengthB;
        if (allowed) allowedPaths.push(length);
        dot.style.opacity = active && playing && allowed && travel <= length ? '1' : '0';
        if (active && playing && allowed) {
          const point = path.getPointAtLength(Math.min(length, travel));
          dot.setAttribute('cx', point.x);
          dot.setAttribute('cy', point.y);
        }
      });
      const delivery = instance.figure.querySelector('.delivery-state');
      let message = '';
      if (active && playing && allowedPaths.length) {
        if (travel < Math.min(...allowedPaths)) message = studyTr ? 'Çerçeve yolda' : 'Frame in transit';
        else if (instance.dual && allowedPaths.length === 2 && travel > Math.max(...allowedPaths)) message = studyTr ? 'İlk kopya teslim edildi · eş kopya elendi' : 'First copy delivered · duplicate discarded';
        else message = studyTr ? 'Geçerli kopya teslim edildi' : 'Valid copy delivered';
      }
      if (delivery.textContent !== message) delivery.textContent = message;
    });
    if (needsFrame) requestAnimationFrame(animateStudies);
    else animationRunning = false;
  }
  addEventListener('scroll', ensureAnimation, { passive: true });
  addEventListener('reader-motion', ensureAnimation);
  ensureAnimation();
}
