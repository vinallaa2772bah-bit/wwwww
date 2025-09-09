(() => {
  'use strict';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function mobileMenu(){
    const menu = $('#mobile-menu');
    if (!menu) return;
    const summary = menu.querySelector('summary');
    const list    = menu.querySelector('ul');
    if (!summary || !list) return;
    const setAria = () => summary.setAttribute('aria-expanded', menu.open ? 'true' : 'false');
    setAria();
    on(summary, 'click', (e) => {
      e.preventDefault();
      menu.open = !menu.open;
      setAria();
      if (menu.open && !reduceMotion) {
        list.style.willChange = 'opacity,transform';
        list.style.opacity = '0';
        list.style.transform = 'translateY(8px) scale(.985)';
        requestAnimationFrame(() => {
          list.style.transition = 'opacity .26s ease, transform .32s cubic-bezier(.22,.61,.36,1)';
          list.style.opacity = '1';
          list.style.transform = 'translateY(0) scale(1)';
        });
        [...list.children].forEach((li, i) => {
          li.style.opacity = '0';
          li.style.transform = 'translateY(8px)';
          requestAnimationFrame(() => {
            const d = 60 + i*40;
            li.style.transition = `opacity .26s ease ${d}ms, transform .32s cubic-bezier(.22,.61,.36,1) ${d}ms`;
            li.style.opacity = '1';
            li.style.transform = 'translateY(0)';
          });
        });
      }
    });
    on(document, 'pointerdown', (e) => { if (menu.open && !menu.contains(e.target)) { menu.open = false; setAria(); }});
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && menu.open){ menu.open = false; setAria(); }});
    on(list, 'click', (e) => { if (e.target.closest('a') && menu.open){ menu.open = false; setAria(); }});
  })();
  /* ============= FX BACKGROUND (cheap canvas) ============= */
  (function fxBackground(){
    if (reduceMotion) return;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d', { alpha:true });
    Object.assign(cvs.style, { position:'fixed', inset:'0', width:'100%', height:'100%', zIndex:'0', pointerEvents:'none' });
    document.body.prepend(cvs);
    [['.site-header','1'],['main','1'],['.site-footer','1']].forEach(([sel,z])=>{
      $$(sel).forEach(el => {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        const cur = +(getComputedStyle(el).zIndex || 0);
        if (cur < +z) el.style.zIndex = z;
      });
    });
    let DPR=1, W=0, H=0;
    const fit = () => {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = cvs.clientWidth; H = cvs.clientHeight;
      cvs.width = Math.round(W*DPR); cvs.height = Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    };
    fit(); on(window, 'resize', fit, { passive:true });
    const SPRITES = [
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='36' r='22' fill='%23e01022'/><path d='M22 20c4 2 7 2 10-2 3 4 6 4 10 2-4 4-7 6-10 6s-6-2-10-6z' fill='%2385c757'/></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='26' fill='%231f8a46'/><circle cx='32' cy='32' r='18' fill='%2332b561'/><g fill='%23c7f3d8'><circle cx='32' cy='18' r='2.4'/><circle cx='44' cy='26' r='2.4'/><circle cx='44' cy='38' r='2.4'/><circle cx='32' cy='46' r='2.4'/><circle cx='20' cy='38' r='2.4'/><circle cx='20' cy='26' r='2.4'/></g></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='%23e01022'/><stop offset='.6' stop-color='%23ff8a00'/><stop offset='1' stop-color='%23ffd86b'/></linearGradient></defs><path d='M32 60c14 0 20-10 18-20-2-9-10-10-8-20-6 3-10 9-10 14-6-2-10-8-10-14C14 24 8 30 8 40c0 12 10 20 24 20z' fill='url(%23g)'/></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 24'><rect x='2' y='11' width='92' height='2' rx='1' fill='%23a08a7a'/><g><rect x='14' y='6' width='10' height='12' rx='3' fill='%23c56a2d'/><rect x='30' y='6' width='10' height='12' rx='3' fill='%238c3f23'/><rect x='46' y='6' width='10' height='12' rx='3' fill='%23cfa850'/><rect x='62' y='6' width='10' height='12' rx='3' fill='%238c3f23'/></g></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='22' fill='%23dca9ff'/><circle cx='32' cy='32' r='14' fill='%23b678ff'/><circle cx='32' cy='32' r='6' fill='%238a49e6'/></svg>"
    ].map(src => { const img = new Image(); img.decoding='async'; img.loading='eager'; img.src = src; return img; });
    const rand = (a,b)=>a+Math.random()*(b-a);
    const particles = [];
    const make = () => {
      const img = SPRITES[Math.floor(Math.random()*SPRITES.length)];
      const depth = rand(.35, 1);
      const base  = rand(28, 80) * depth;
      return { img, x:rand(-.15*W, 1.15*W), y:rand(-.15*H, 1.15*H), vx:rand(-.9,.9)*depth, vy:rand(-.9,.9)*depth, a:rand(0,Math.PI*2), w:base, h:base, depth, rot:rand(-.015,.015), r:rand(-Math.PI,Math.PI), alpha:.18 + .18*(1-depth) };
    };
    const seed = () => { particles.length = 0; const MAX = Math.round(Math.min(40, Math.max(18, Math.hypot(W,H)/15))); for (let i=0;i<MAX;i++) particles.push(make()); };
    seed(); on(window,'resize',()=>{ fit(); seed(); },{passive:true});
    let pointerX=0, pointerY=0, px=0, py=0;
    const onMove = (e) => {
      const t = 'touches' in e ? e.touches[0] : e;
      pointerX = (t.clientX / innerWidth)  * 2 - 1;
      pointerY = (t.clientY / innerHeight) * 2 - 1;
    };
    on(window,'pointermove',onMove,{passive:true});
    on(window,'touchmove',onMove,{passive:true});
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      px += (pointerX - px)*.06;
      py += (pointerY - py)*.06;
      ctx.clearRect(0,0,W,H);
      for (const p of particles){
        p.x += p.vx + Math.sin(p.a)*.09*p.depth;
        p.y += p.vy + Math.cos(p.a)*.09*p.depth;
        p.a += .01*p.depth;
        p.r += p.rot;

        const cx = (px*.5 + .5)*W, cy = (py*.5 + .5)*H;
        const dx = p.x-cx, dy=p.y-cy, d2 = dx*dx+dy*dy;
        if (d2<16000){ p.x += dx*.006; p.y += dy*.006; }

        if (p.x < -.2*W) p.x = 1.2*W; if (p.x > 1.2*W) p.x = -.2*W;
        if (p.y < -.2*H) p.y = 1.2*H; if (p.y > 1.2*H) p.y = -.2*H;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.drawImage(p.img, -p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      }

      const heroInner = $('.hero .hero-inner');
      if (heroInner){
        heroInner.style.transform = `translate3d(${px*10}px, ${py*8}px, 0) rotateX(${-py*3}deg) rotateY(${px*4.5}deg)`;
      }
    };
    loop();
    on(document,'visibilitychange',()=>{ if (document.hidden) cancelAnimationFrame(raf); else loop(); });
  })();

  /* ============= SIDEBAR + STRICT SINGLE-OPEN ACCORDION (desktop & mobile) ============= */
  (function sidebarAccordion(){
    const wrap = $('.menu .container');
    if (!wrap) return;

    const cats = $$('details[id]', wrap);
    if (!cats.length) return;

    let side = $('nav.menu-side', wrap);
    if (!side){
      side = document.createElement('nav');
      side.className = 'menu-side';
      side.setAttribute('aria-label','Категории');
      const ul = document.createElement('ul');
      cats.forEach(d=>{
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${d.id}`;
        a.textContent = (d.querySelector('summary')?.textContent || '').trim();
        li.appendChild(a); ul.appendChild(li);
      });
      side.appendChild(ul);
      wrap.prepend(side);
    }
    const links = $$('a', side);

    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;

    const highlight = (id) => links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));

    const scrollToCat = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - (headerH + 12);
      window.scrollTo({ top: y, behavior: 'smooth' });
    };

    const openOnly = (id, doScroll) => {
      cats.forEach(d => d.open = (d.id === id));
      highlight(id);
      if (doScroll) scrollToCat(id);
    };

    cats.forEach(d => d.open = false);
    const initId = (location.hash && cats.some(d => d.id === location.hash.slice(1)))
      ? location.hash.slice(1) : cats[0]?.id;
    if (initId) openOnly(initId, false);

    on(side, 'click', (e) => {
      const a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      openOnly(id, true);
      history.replaceState(null, '', `#${id}`);
    });

    const isDesktop = () => matchMedia('(min-width:960px)').matches;

    cats.forEach(d => {
      const sum = d.querySelector('summary');
      on(sum, 'click', (e) => {
        if (!isDesktop()) return;
        e.preventDefault();
        openOnly(d.id, true);
        history.replaceState(null, '', `#${d.id}`);
      });
    });

    on(window, 'hashchange', () => {
      const id = location.hash.replace('#','');
      if (cats.some(d => d.id === id)) openOnly(id, true);
    });

    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        let best=null;
        entries.forEach(en => { if (en.isIntersecting && (!best || en.boundingClientRect.top < best.boundingClientRect.top)) best=en; });
        if (best) highlight(best.target.id);
      }, { rootMargin: `-${headerH+16}px 0px -70% 0px`, threshold:[0,.25,.5,1] });
      cats.forEach(d => io.observe(d));
    }
  })();

})();

(() => {
  const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h1   = document.querySelector('.type-hero');
  const hero = h1?.closest('.hero');
  const part1 = h1?.querySelector('.type-metal');
  const part2 = h1?.querySelector('.type-gold');
  if (!h1 || !part1 || !part2) return;

  const t1 = (part1.textContent || part1.dataset.text || "").trimEnd();
  const t2 = (part2.textContent || part2.dataset.text || "").trim();

  if (prefersReduce) {
    part1.textContent = t1;
    part2.textContent = t2;
    hero?.classList.add('done');
    return;
  }

  hero?.classList.add('typing');
  h1.classList.add('is-typing');
  part1.textContent = '';
  part2.textContent = '';

  let i = 0, j = 0;
  const base = 28;
  const jitter = 18;

  const typeSecond = () => {
    if (j <= t2.length) {
      part2.textContent = t2.slice(0, j++);
      setTimeout(typeSecond, Math.max(8, base + (Math.random()*jitter - jitter/2)));
    } else {
      h1.classList.remove('is-typing');
      hero?.classList.remove('typing');
      hero?.classList.add('done');
      h1.classList.add('glow','sweep');
      setTimeout(() => h1.classList.remove('glow'), 600);
      setTimeout(() => h1.classList.remove('sweep'), 1200);
    }
  };

  const typeFirst = () => {
    if (i <= t1.length) {
      part1.textContent = t1.slice(0, i++);
      setTimeout(typeFirst, Math.max(8, base + (Math.random()*jitter - jitter/2)));
    } else {
      typeSecond();
    }
  };

  setTimeout(typeFirst, 120);
})();

(() => {
  const btn = document.querySelector('.hero-cta a');
  if (!btn) return;

  const noFX = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches;
  if (noFX) return;

  let raf = 0, tx = 0, ty = 0;
  const LIM = 6;

  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const y = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    tx = (Math.max(-1, Math.min(1, x)) * LIM).toFixed(2) + 'px';
    ty = (Math.max(-1, Math.min(1, y)) * LIM).toFixed(2) + 'px';

    if (!raf) raf = requestAnimationFrame(() => {
      btn.style.setProperty('--tx', tx);
      btn.style.setProperty('--ty', ty);
      raf = 0;
    });
  }, {passive:true});

  btn.addEventListener('pointerleave', () => {
    btn.style.setProperty('--tx','0px');
    btn.style.setProperty('--ty','0px');
  }, {passive:true});
})();
