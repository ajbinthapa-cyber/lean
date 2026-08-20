/* ============================================================
   LEAN — UI
   ============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const r0 = n => Math.round(n || 0);
const r1 = n => Math.round((n || 0) * 10) / 10;
const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
const MEAL_ICON = { Breakfast:'🌅', Lunch:'🍚', Snack:'🥜', Dinner:'🌙' };

let cur = todayISO();          // the day being viewed
let tab = 'today';

function fmtShort(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtLong(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
function relDay(iso) {
  const t = todayISO();
  if (iso === t) return 'Today';
  if (iso === todayISO(new Date(Date.now() - 864e5))) return 'Yesterday';
  if (iso === todayISO(new Date(Date.now() + 864e5))) return 'Tomorrow';
  return fmtShort(iso);
}
function guessMeal() {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  if (h < 19) return 'Snack';
  return 'Dinner';
}

let toastT;
function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast on ' + kind;
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast ' + kind, 2600);
}

/* ---------- sheet ---------- */
let sheetOnClose = null;
function sheet(title, bodyHTML, { sub = '', foot = '', onClose = null } = {}) {
  $('#sh-title').textContent = title;
  $('#sh-sub').innerHTML = sub;
  $('#sh-sub').classList.toggle('hide', !sub);
  $('#sh-body').innerHTML = bodyHTML;
  $('#sh-foot').innerHTML = foot;
  $('#sh-foot').classList.toggle('hide', !foot);
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
  sheetOnClose = onClose;
  $('#sh-body').scrollTop = 0;
}
function closeSheet() {
  $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on');
  if (sheetOnClose) { const f = sheetOnClose; sheetOnClose = null; f(); }
}
function sheetBody(html) { $('#sh-body').innerHTML = html; }
function sheetFoot(html) { $('#sh-foot').innerHTML = html; $('#sh-foot').classList.toggle('hide', !html); }
function sheetLoading(msg, note = '') {
  sheetBody(`<div class="load"><div class="spin"></div><div><b>${esc(msg)}</b>
    ${note ? `<p class="tiny" style="margin-top:6px;max-width:280px">${esc(note)}</p>` : ''}</div></div>`);
  sheetFoot('');
}

/* ---------- tabs ---------- */
function go(name) {
  tab = name;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
  $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  window.scrollTo(0, 0);
  render();
}
function render() {
  if (tab === 'today') renderToday();
  else if (tab === 'log') renderHistory();
  else if (tab === 'train') renderTrain();
  else if (tab === 'body') renderBody();
  else if (tab === 'coach') renderPlan();
}

/* ============================================================
   TODAY
   ============================================================ */
function renderToday() {
  const t = totals(cur), tg = targetsFor(cur), d = day(cur);

  $('#t-greet').textContent = relDay(cur);
  $('#t-date').textContent = fmtLong(cur);
  $('#t-next').style.visibility = cur >= todayISO() ? 'hidden' : 'visible';

  const left = tg.kcal - t.kcal;
  $('#r-left').textContent = Math.abs(r0(left));
  $('#r-lbl').textContent = left >= 0 ? 'kcal left' : 'kcal over';
  const C = 2 * Math.PI * 52;
  const p = Math.min(1.35, t.kcal / tg.kcal || 0);
  $('#r-fill').style.strokeDasharray = C;
  $('#r-fill').style.strokeDashoffset = C * (1 - Math.min(1, p));
  $('#r-fill').style.stroke = p > 1.06 ? 'var(--bad)' : p > 0.94 ? 'var(--acc)' : p > 0.5 ? 'var(--acc-d)' : 'var(--acc-d)';
  $('#r-left').style.color = left < 0 ? 'var(--bad)' : 'var(--fg)';

  const bar = (id, val, tgt, over = 1.08) => {
    $('#m-' + id).textContent = r0(val);
    $('#m-' + id).parentElement.querySelector('.muted').textContent = `/ ${r0(tgt)} g`;
    const b = $('#b-' + id);
    b.style.width = Math.min(100, (val / tgt) * 100 || 0) + '%';
    b.classList.toggle('over', val > tgt * over);
  };
  bar('p', t.p, tg.protein, 1.35); bar('c', t.c, tg.carbs); bar('f', t.f, tg.fat);
  bar('fib', t.fib, tg.fiber, 99);

  const plan = Train.planFor(cur);
  const dt = $('#t-daytype');
  dt.textContent = (tg.dayType === 'train' ? '💪 ' : '🛌 ') + plan.name;
  dt.className = 'pill ' + (tg.dayType === 'train' ? 'good' : 'info');
  $('#t-eaten').textContent = `${r0(t.kcal)} eaten · ${tg.kcal} target`;

  /* meals */
  const box = $('#t-meals');
  if (!d.entries.length) {
    box.innerHTML = `<div class="empty">Nothing logged yet.<br><span class="tiny">Snap a photo of your next meal — it takes about five seconds.</span></div>`;
  } else {
    box.innerHTML = MEALS.map(m => {
      const items = d.entries.filter(e => e.meal === m);
      if (!items.length) return '';
      const mt = mealTotals(cur, m);
      return `<div class="meal-h"><span>${MEAL_ICON[m]} ${m}</span><span>${r0(mt.kcal)} kcal · P${r0(mt.p)}</span></div>` +
        items.map(e => `
        <div class="item" data-eid="${e.eid}">
          <div class="txt">
            <div class="nm">${esc(e.name)}</div>
            <div class="mt">${r0(e.grams)} g · P ${r1(e.p)} · C ${r1(e.c)} · F ${r1(e.f)}</div>
          </div>
          <div class="kc">${r0(e.kcal)}<small>kcal</small></div>
        </div>`).join('');
    }).join('');
  }

  /* coach */
  const ins = Coach.insights(cur);
  const sug = Coach.suggestions(cur);
  const ICO = { good:'✓', warn:'!', bad:'⚠', info:'i' };
  let html = ins.slice(0, 4).map(i => `
    <div class="ins ${i.level}"><div class="ic">${ICO[i.level]}</div>
      <div><b>${esc(i.title)}</b><p>${esc(i.body)}</p></div></div>`).join('');
  if (sug.length) {
    html += `<div class="card" style="margin-top:4px"><h3>What to eat with what's left</h3>` +
      sug.map(s => `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div style="font-size:14px;font-weight:600">${esc(s.text)}</div>
        <div class="tiny" style="margin-top:2px">${esc(s.sub)}</div></div>`).join('') +
      `<p class="tiny" style="margin:10px 0 0">Pick one, not all — these are alternatives.</p></div>`;
  }
  $('#t-coach').innerHTML = html || `<div class="ins good"><div class="ic">✓</div><div><b>Nothing to flag</b><p>Log a few meals and this fills up with things worth knowing.</p></div></div>`;

  /* water + steps */
  $('#w-val').textContent = (d.water / 1000).toFixed(2).replace(/0$/, '') + ' L';
  $('#w-tgt').textContent = `of ${(tg.water / 1000).toFixed(1)} L`;
  $('#w-bar').style.width = Math.min(100, d.water / tg.water * 100) + '%';
  if ($('#t-steps') !== document.activeElement) $('#t-steps').value = d.steps || '';
}

/* ============================================================
   ADD FOOD — shared confirm screen
   ============================================================ */
let pending = { items: [], meal: guessMeal(), img: null, note: '' };

function mealPicker(sel) {
  return `<div class="seg" id="meal-seg">` +
    MEALS.map(m => `<button data-meal="${m}" class="${m === sel ? 'on' : ''}">${m}</button>`).join('') + `</div>`;
}

function confirmScreen() {
  const it = pending.items;
  const sum = it.reduce((a, x) => {
    const k = x.grams / 100;
    a.kcal += x.kcal * k; a.p += x.p * k; a.c += x.c * k; a.f += x.f * k; a.fib += (x.fib || 0) * k; return a;
  }, { kcal:0, p:0, c:0, f:0, fib:0 });

  sheetBody(`
    ${pending.img ? `<img class="thumb" src="${pending.img}" style="margin-bottom:14px;max-height:180px;object-fit:cover">` : ''}
    ${pending.summary ? `<p class="tiny" style="margin:0 0 14px">${esc(pending.summary)}</p>` : ''}

    <label class="fl">Meal</label>
    ${mealPicker(pending.meal)}

    <h3 style="margin:18px 0 8px">Items — check the weights</h3>
    <p class="hint" style="margin:-4px 0 12px">Tap a weight to change it. Use your food scale where you can; a corrected estimate beats a confident guess.</p>
    <div id="pi-list"></div>

    <button class="btn ghost sm" id="pi-add" style="width:100%;margin-top:10px">＋ Add another item</button>

    <div class="card" style="margin-top:16px;background:var(--card2)">
      <div class="kv"><span>Total</span><b>${r0(sum.kcal)} kcal</b></div>
      <div class="kv"><span>Protein</span><b style="color:var(--p)">${r1(sum.p)} g</b></div>
      <div class="kv"><span>Carbs</span><b style="color:var(--c)">${r1(sum.c)} g</b></div>
      <div class="kv"><span>Fat</span><b style="color:var(--f)">${r1(sum.f)} g</b></div>
      <div class="kv"><span>Fibre</span><b>${r1(sum.fib)} g</b></div>
    </div>`);

  sheetFoot(`<button class="btn pri" id="pi-save">Log ${it.length} item${it.length === 1 ? '' : 's'} · ${r0(sum.kcal)} kcal</button>`);
  drawItems();
}

function drawItems() {
  $('#pi-list').innerHTML = pending.items.map((x, i) => {
    const k = x.grams / 100;
    return `
    <div class="card" style="padding:13px;margin-bottom:9px;background:var(--card2)">
      <div class="row between" style="align-items:flex-start;gap:8px">
        <input value="${esc(x.n)}" data-nm="${i}" style="border:0;background:none;padding:0;font-weight:700;font-size:14.5px">
        <button class="btn sm ghost" data-del="${i}" style="padding:2px 8px;color:var(--dim2)">✕</button>
      </div>
      ${x.confidence ? `<span class="conf ${x.confidence}">${x.confidence} confidence</span>` : ''}
      ${x.note ? `<p class="tiny" style="margin:6px 0 0">${esc(x.note)}</p>` : ''}
      ${x.adjusted ? `<p class="tiny" style="margin:6px 0 0;color:var(--warn)">Calories recalculated from the macros — the AI's two numbers disagreed.</p>` : ''}
      <div class="step" style="margin-top:10px">
        <button data-g="${i}:-10">−</button>
        <input type="number" inputmode="decimal" value="${r0(x.grams)}" data-gi="${i}">
        <button data-g="${i}:10">＋</button>
        <span class="tiny" style="flex:none;width:26px">g</span>
      </div>
      ${x.serv?.length ? `<div class="chips" style="margin:9px 0 0;padding:0">${x.serv.map(s => `<button class="chip" data-serv="${i}:${s.g}" style="padding:5px 11px;font-size:12px">${esc(s.l)} (${s.g}g)</button>`).join('')}</div>` : ''}
      <div class="tiny" style="margin-top:9px">
        <b style="color:var(--fg)">${r0(x.kcal * k)} kcal</b> ·
        P ${r1(x.p * k)} · C ${r1(x.c * k)} · F ${r1(x.f * k)}
        <span style="color:var(--dim2)"> — ${r0(x.kcal)} kcal/100g</span>
      </div>
    </div>`;
  }).join('') || `<div class="empty">No items</div>`;
}

/* ---------- capture ---------- */
let captureMode = 'meal';
function startCapture(mode) {
  captureMode = mode;
  pending = { items: [], meal: guessMeal(), img: null, note: '', summary: '' };
  if (!AI.ready()) {
    sheet(mode === 'meal' ? 'Snap a meal' : 'Scan a label', aiSetupHTML(), { sub: 'One-time setup, no card needed' });
    return;
  }
  sheet(mode === 'meal' ? 'Snap a meal' : 'Scan a label', `
    <div class="tiles">
      <button class="tile" id="cap-cam"><span class="ic">📷</span><b>Take photo</b><span>Opens the camera</span></button>
      <button class="tile" id="cap-lib"><span class="ic">🖼️</span><b>From library</b><span>Pick an existing photo</span></button>
    </div>
    <div class="field" style="margin-top:16px">
      <label class="fl">Anything the photo can't show <span style="text-transform:none;font-weight:400">(optional)</span></label>
      <input id="cap-note" placeholder="${mode === 'meal' ? 'e.g. 180 g rice, cooked in 2 tsp mustard oil' : 'e.g. I ate half the pack'}">
      <p class="hint">${mode === 'meal'
        ? 'If you weighed anything, type it here — the AI will use your number instead of guessing. Portion size is the biggest source of error, and this removes it.'
        : 'Get the whole nutrition panel in frame, straight-on, in good light.'}</p>
    </div>
    ${mode === 'label' ? `
    <div class="divider"></div>
    <label class="fl">Or type the barcode</label>
    <div class="row"><input id="cap-bc" inputmode="numeric" placeholder="8901234567890">
      <button class="btn sm pri" id="cap-bcgo" style="flex:none">Look up</button></div>
    <p class="hint">Checks Open Food Facts — free, no key, and it knows a lot of Indian & Nepali packaged products.</p>` : ''}
  `, { sub: mode === 'meal' ? 'Works best with the whole plate in frame, from above' : '' });
}

async function handleFiles(files) {
  if (!files || !files.length) return;
  const note = ($('#cap-note')?.value || '').trim();
  pending.note = note;
  sheetLoading(captureMode === 'meal' ? 'Reading your plate…' : 'Reading the label…',
    captureMode === 'meal' ? 'Identifying each item and estimating weights.' : 'Pulling the numbers off the panel.');
  try {
    const imgs = [];
    for (const f of [...files].slice(0, 3)) imgs.push(await AI.fileToImage(f));
    pending.img = imgs[0].dataUrl;
    if (captureMode === 'meal') {
      const res = await AI.analyseMeal(imgs, note);
      pending.items = res.items; pending.summary = res.summary;
      confirmScreen();
    } else {
      const res = await AI.analyseLabel(imgs, note);
      pending.items = [res.food];
      const x = res.extra;
      pending.summary = [
        x.servingGrams ? `Label serving: ${x.servingGrams} g` : '',
        x.packGrams ? `Pack: ${x.packGrams} g` : '',
        x.sugar != null ? `Sugar: ${x.sugar} g/100 g` : '',
      ].filter(Boolean).join(' · ');
      confirmScreen();
      if (x.warnings?.length) {
        $('#pi-list').insertAdjacentHTML('beforebegin',
          x.warnings.map(w => `<div class="ins warn"><div class="ic">!</div><div><p>${esc(w)}</p></div></div>`).join(''));
      }
      if (x.packGrams) {
        $('#pi-list').insertAdjacentHTML('afterend',
          `<button class="btn sm ghost" data-serv="0:${x.packGrams}" style="width:100%;margin-top:8px">I ate the whole pack (${x.packGrams} g)</button>`);
      }
    }
  } catch (e) {
    sheetBody(`<div class="ins bad"><div class="ic">⚠</div><div><b>Couldn't read that</b><p>${esc(e.message)}</p></div></div>
      <button class="btn" id="err-retry" style="margin-top:10px">Try another photo</button>
      <button class="btn ghost" id="err-manual" style="margin-top:8px">Log it manually instead</button>`);
    sheetFoot('');
  }
}

/* ---------- search ---------- */
function openSearch(preset = '') {
  sheet('Search food', `
    <input id="sr-q" placeholder="Search rice, paneer, dal, whey…" autocomplete="off" value="${esc(preset)}">
    <div class="chips" style="margin-top:12px">
      <button class="chip" data-cat="">All</button>
      <button class="chip" data-cat="protein">Protein</button>
      <button class="chip" data-cat="dal">Dal</button>
      <button class="chip" data-cat="dairy">Dairy</button>
      <button class="chip" data-cat="grain">Grain</button>
      <button class="chip" data-cat="veg">Veg</button>
      <button class="chip" data-cat="fruit">Fruit</button>
      <button class="chip" data-cat="nut">Nuts</button>
      <button class="chip" data-cat="dish">Dishes</button>
      <button class="chip" data-cat="fat">Fats</button>
    </div>
    <div id="sr-res" style="margin-top:12px"></div>
    <button class="btn ghost sm" id="sr-new" style="width:100%;margin-top:12px">＋ Create a food that isn't here</button>
  `, { sub: 'Works offline — no key, no internet needed' });
  drawSearch(preset);
  setTimeout(() => $('#sr-q')?.focus(), 260);
}
function drawSearch(q, cat = '') {
  let res = searchFoods(q, 60);
  if (cat) res = res.filter(f => f.cat === cat);
  $('#sr-res').innerHTML = res.length ? `<div class="card flush">` + res.map(f => `
    <div class="item" data-food="${esc(f.id)}">
      <div class="txt"><div class="nm">${esc(f.n)}${f.custom ? ' <span class="tiny">· yours</span>' : ''}</div>
        <div class="mt">P ${f.p} · C ${f.c} · F ${f.f} <span style="color:var(--dim2)">per 100 g</span></div></div>
      <div class="kc">${r0(f.kcal)}<small>/100g</small></div>
    </div>`).join('') + `</div>`
    : `<div class="empty">Nothing found.<br><span class="tiny">Create it once and it's yours forever.</span></div>`;
}

function openPortion(food) {
  const def = food.serv?.[0]?.g || 100;
  sheet(food.n, `
    <label class="fl">Meal</label>${mealPicker(guessMeal())}
    <label class="fl" style="margin-top:16px">Weight</label>
    <div class="step">
      <button data-pg="-10">−</button>
      <input id="pt-g" type="number" inputmode="decimal" value="${def}">
      <button data-pg="10">＋</button><span class="tiny" style="flex:none;width:26px">g</span>
    </div>
    ${food.serv?.length ? `<div class="chips" style="margin-top:10px;padding:0">
      ${food.serv.map(s => `<button class="chip" data-pset="${s.g}">${esc(s.l)} · ${s.g} g</button>`).join('')}</div>` : ''}
    ${food.note ? `<p class="hint" style="margin-top:12px">${esc(food.note)}</p>` : ''}
    ${food.source ? `<p class="tiny" style="margin-top:8px">Source: ${esc(food.source)}</p>` : ''}
    <div class="card" id="pt-sum" style="margin-top:16px;background:var(--card2)"></div>
    <button class="btn ghost sm" id="pt-edit" style="width:100%;margin-top:10px">Edit this food's nutrition values</button>
  `, { sub: `${food.kcal} kcal · P ${food.p} · C ${food.c} · F ${food.f} per 100 g` });

  const upd = () => {
    const g = parseFloat($('#pt-g').value) || 0, m = scale(food, g);
    $('#pt-sum').innerHTML = `
      <div class="kv"><span>Calories</span><b>${r0(m.kcal)} kcal</b></div>
      <div class="kv"><span>Protein</span><b style="color:var(--p)">${m.p} g</b></div>
      <div class="kv"><span>Carbs</span><b style="color:var(--c)">${m.c} g</b></div>
      <div class="kv"><span>Fat</span><b style="color:var(--f)">${m.f} g</b></div>`;
    sheetFoot(`<div class="row" style="gap:8px">
      <button class="btn sm ghost" id="pt-fav" style="flex:none;padding:14px 16px">${state().favorites.includes(food.id) ? '★' : '☆'}</button>
      <button class="btn pri" id="pt-save">Add ${r0(g)} g · ${r0(m.kcal)} kcal</button></div>`);
  };
  upd();
  $('#sh-body').dataset.foodId = food.id;
  $('#sh-body').__upd = upd;
}

/* ---------- quick add ---------- */
function openQuick() {
  const S = state();
  const favs = S.favorites.map(foodById).filter(Boolean);
  const recs = S.recents.map(foodById).filter(Boolean).slice(0, 12);
  const yest = todayISO(new Date(new Date(cur + 'T12:00:00') - 864e5));
  const yEntries = day(yest).entries;

  sheet('Quick add', `
    <h3>Meal combos</h3>
    <p class="hint" style="margin:-2px 0 10px">Whole plates in one tap. Everything stays editable after.</p>
    <div class="card flush">${COMBOS.map(c => {
      const t = c.items.reduce((a, i) => { const f = foodById(i.id); if (!f) return a;
        const m = scale(f, i.g); a.kcal += m.kcal; a.p += m.p; return a; }, { kcal:0, p:0 });
      return `<div class="item" data-combo="${c.id}">
        <div class="txt"><div class="nm">${esc(c.n)}</div>
        <div class="mt">${c.items.map(i => (foodById(i.id)||{}).n).filter(Boolean).join(' · ')}</div></div>
        <div class="kc">${r0(t.kcal)}<small>P ${r0(t.p)}</small></div></div>`;
    }).join('')}</div>

    ${yEntries.length ? `<h3 style="margin-top:20px">Copy from ${relDay(yest)}</h3>
    <div class="card flush">
      ${MEALS.filter(m => yEntries.some(e => e.meal === m)).map(m => {
        const t = mealTotals(yest, m);
        return `<div class="item" data-copy="${yest}|${m}">
          <div class="txt"><div class="nm">${MEAL_ICON[m]} ${m}</div>
          <div class="mt">${yEntries.filter(e => e.meal === m).map(e => e.name).join(', ')}</div></div>
          <div class="kc">${r0(t.kcal)}<small>kcal</small></div></div>`;
      }).join('')}</div>` : ''}

    ${favs.length ? `<h3 style="margin-top:20px">★ Favourites</h3><div class="card flush">${favs.map(f =>
      `<div class="item" data-food="${esc(f.id)}"><div class="txt"><div class="nm">${esc(f.n)}</div>
      <div class="mt">P ${f.p} · C ${f.c} · F ${f.f} per 100 g</div></div>
      <div class="kc">${r0(f.kcal)}<small>/100g</small></div></div>`).join('')}</div>` : ''}

    ${recs.length ? `<h3 style="margin-top:20px">Recent</h3><div class="card flush">${recs.map(f =>
      `<div class="item" data-food="${esc(f.id)}"><div class="txt"><div class="nm">${esc(f.n)}</div>
      <div class="mt">P ${f.p} · C ${f.c} · F ${f.f} per 100 g</div></div>
      <div class="kc">${r0(f.kcal)}<small>/100g</small></div></div>`).join('')}</div>` : ''}

    <h3 style="margin-top:20px">Just calories</h3>
    <p class="hint" style="margin:-2px 0 10px">Ate out and have no idea? A rough number beats an empty log — never skip a meal because you can't measure it.</p>
    <div class="row"><input id="qk-n" placeholder="What was it?"><input id="qk-k" type="number" inputmode="numeric" placeholder="kcal" style="width:100px">
      <button class="btn sm pri" id="qk-go" style="flex:none">Add</button></div>
  `);
}

/* ---------- create / edit a food ---------- */
function openFoodEditor(f = null) {
  const v = f || { n:'', kcal:'', p:'', c:'', f:'', fib:'', cat:'dish' };
  sheet(f ? 'Edit food' : 'New food', `
    <div class="field"><label class="fl">Name</label><input id="fe-n" value="${esc(v.n)}" placeholder="e.g. Aama's aloo tarkari"></div>
    <p class="hint" style="margin:-6px 0 14px">All values are <b>per 100 g</b>. If your packet lists "per serving", divide by the serving size and multiply by 100 — or just scan the label instead.</p>
    <div class="grid2">
      <div class="field"><label class="fl">Calories</label><input id="fe-k" type="number" inputmode="decimal" value="${v.kcal}"></div>
      <div class="field"><label class="fl">Protein g</label><input id="fe-p" type="number" inputmode="decimal" value="${v.p}"></div>
      <div class="field"><label class="fl">Carbs g</label><input id="fe-c" type="number" inputmode="decimal" value="${v.c}"></div>
      <div class="field"><label class="fl">Fat g</label><input id="fe-f" type="number" inputmode="decimal" value="${v.f}"></div>
      <div class="field"><label class="fl">Fibre g</label><input id="fe-fib" type="number" inputmode="decimal" value="${v.fib || ''}"></div>
      <div class="field"><label class="fl">Category</label><select id="fe-cat">
        ${['protein','dal','dairy','grain','veg','fruit','nut','dish','fat','drink','sweet','packaged']
          .map(c => `<option ${c === v.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    </div>
    <div id="fe-chk" class="tiny"></div>
  `, { foot: `<button class="btn pri" id="fe-save">Save food</button>` });

  const chk = () => {
    const k = +$('#fe-k').value, p = +$('#fe-p').value, c = +$('#fe-c').value, ff = +$('#fe-f').value;
    const calc = p * 4 + c * 4 + ff * 9;
    $('#fe-chk').innerHTML = (k && calc && Math.abs(k - calc) / k > 0.15)
      ? `<div class="ins warn" style="margin-top:4px"><div class="ic">!</div><div><b>Numbers don't add up</b>
         <p>You typed ${r0(k)} kcal but the macros come to ${r0(calc)} kcal. One of them is probably a typo.</p></div></div>` : '';
  };
  ['fe-k','fe-p','fe-c','fe-f'].forEach(id => $('#' + id).addEventListener('input', chk));
}

/* ============================================================
   HISTORY
   ============================================================ */
let histN = 7;
function renderHistory() {
  const days = lastNDays(histN);
  const rows = days.map(daySummary);
  const wk = weeklyAvg(days);
  const logged = rows.filter(r => r.logged);

  const maxK = Math.max(...rows.map(r => Math.max(r.kcal, r.target.kcal)), 1);
  const bars = rows.map(r => {
    const h = Math.max(3, (r.kcal / maxK) * 100);
    const cls = !r.logged ? '' : r.kcal > r.target.kcal * 1.07 ? 'over' : r.kcal < r.target.kcal * 0.8 ? 'under' : 'ok';
    return `<div class="b ${cls}" style="height:${h}%" title="${r.iso}: ${r0(r.kcal)}"></div>`;
  }).join('');
  const labels = rows.map(r => `<span>${histN <= 14 ? new Date(r.iso + 'T12:00:00').toLocaleDateString('en-GB',{weekday:'narrow'}) : ''}</span>`).join('');

  const ex = Coach.excesses(days);
  const psrc = Coach.proteinSources(days);
  const CATNAME = { protein:'Protein foods', dal:'Dal & legumes', dairy:'Dairy', grain:'Grains', veg:'Vegetables',
    fruit:'Fruit', nut:'Nuts & seeds', dish:'Cooked dishes', fat:'Oils & fats', drink:'Drinks',
    sweet:'Sweets', packaged:'Packaged', ai:'AI-logged', other:'Other' };

  $('#h-body').innerHTML = `
    ${wk ? `<div class="card">
      <div class="row between"><h3 style="margin:0">Daily average</h3>
        <span class="pill ${Math.abs(wk.kcal - wk.targetKcal) <= 80 ? 'good' : wk.kcal > wk.targetKcal ? 'bad' : 'info'}">
          ${wk.kcal > wk.targetKcal ? '+' : ''}${wk.kcal - wk.targetKcal} kcal</span></div>
      <div class="grid4" style="margin-top:14px;text-align:center">
        <div><div style="font-size:21px;font-weight:800">${wk.kcal}</div><div class="tiny">kcal</div></div>
        <div><div style="font-size:21px;font-weight:800;color:var(--p)">${wk.p}</div><div class="tiny">protein</div></div>
        <div><div style="font-size:21px;font-weight:800;color:var(--c)">${wk.c}</div><div class="tiny">carbs</div></div>
        <div><div style="font-size:21px;font-weight:800;color:var(--f)">${wk.f}</div><div class="tiny">fat</div></div>
      </div>
      <p class="tiny" style="margin:12px 0 0">Based on ${wk.n} logged day${wk.n === 1 ? '' : 's'} out of ${histN}. Target averages ${wk.targetKcal} kcal.</p>
    </div>` : `<div class="empty card">No days logged in this range yet.</div>`}

    <div class="card"><h3>Calories per day</h3>
      <div class="bars">${bars}</div><div class="blabels">${labels}</div>
      <div class="row" style="gap:14px;margin-top:12px;font-size:11px;color:var(--dim)">
        <span><i style="display:inline-block;width:9px;height:9px;background:var(--acc-d);border-radius:2px"></i> on target</span>
        <span><i style="display:inline-block;width:9px;height:9px;background:var(--bad);border-radius:2px"></i> over</span>
        <span><i style="display:inline-block;width:9px;height:9px;background:var(--info);border-radius:2px"></i> well under</span>
      </div>
    </div>

    ${ex.flags.length ? `<h2>Where your calories are leaking</h2>
      ${ex.flags.map(f => `<div class="ins warn"><div class="ic">!</div><div><b>${esc(f.t)}</b><p>${esc(f.b)}</p></div></div>`).join('')}` : ''}

    ${ex.rows.length ? `<h2>Calories by food type</h2><div class="card">
      ${ex.rows.slice(0, 8).map(r => `
        <div class="macro"><div class="mh"><span>${esc(CATNAME[r.cat] || r.cat)}</span>
          <span><b>${Math.round(r.share * 100)}%</b> <span class="muted">${r.kcal}</span></span></div>
          <div class="bar"><i style="background:var(--acc-d);width:${r.share * 100}%"></i></div>
          <div class="tiny" style="margin-top:3px;color:var(--dim2)">${esc(r.top.join(' · '))}</div></div>`).join('')}
    </div>` : ''}

    ${psrc.length ? `<h2>Where your protein comes from</h2><div class="card">
      ${psrc.map(s => `<div class="kv"><span>${esc(s.n)}</span><b>${s.p} g <span class="tiny muted">${Math.round(s.share*100)}%</span></b></div>`).join('')}
      <p class="tiny" style="margin-top:10px">Spread across 4+ sources is better than leaning on one. If whey is over 40%, get more from real food.</p>
    </div>` : ''}

    <h2>Day by day</h2>
    <div class="card flush">${rows.slice().reverse().map(r => `
      <div class="item" data-goday="${r.iso}">
        <div class="txt"><div class="nm">${relDay(r.iso)} <span class="tiny muted">· ${r.target.dayType === 'train' ? 'training' : 'rest'}</span></div>
          <div class="mt">${r.logged ? `P ${r0(r.p)} · C ${r0(r.c)} · F ${r0(r.f)}` : 'not logged'}</div></div>
        <div class="kc" style="color:${!r.logged ? 'var(--dim2)' : Math.abs(r.diff) < 100 ? 'var(--acc)' : r.diff > 0 ? 'var(--bad)' : 'var(--info)'}">
          ${r.logged ? r0(r.kcal) : '—'}<small>${r.logged ? (r.diff > 0 ? '+' : '') + r.diff : `${r.target.kcal} target`}</small></div>
      </div>`).join('')}</div>`;
}

/* ============================================================
   TRAIN
   ============================================================ */
function renderTrain() {
  const plan = Train.planFor(cur), w = Train.get(cur);
  $('#tr-plan').textContent = `${relDay(cur)} · ${plan.name}`;
  const lib = EXERCISES[plan.name] || EXERCISES['Core & Conditioning'];
  const wsets = Train.weeklySets(lastNDays(7, cur));

  $('#tr-body').innerHTML = `
    ${plan.type === 'rest' ? `<div class="ins info"><div class="ic">i</div><div><b>Rest day</b>
      <p>Muscle is built on rest days, not in the gym. If you feel like moving, a 3–5 k easy run or a long walk is perfect — it burns fat without eating into recovery.</p></div></div>` : ''}

    ${w?.exercises?.length ? `<div class="card flush" style="margin-top:12px">
      ${w.exercises.map(ex => {
        const hint = Train.overloadHint(ex.name, cur);
        const prev = hint.prev;
        const vol = Train.volume(ex), pv = prev?.volume || 0;
        return `<div style="padding:14px 16px;border-bottom:1px solid var(--line)">
          <div class="row between"><b style="font-size:14.5px">${esc(ex.name)}</b>
            <button class="btn sm ghost" data-exdel="${esc(ex.name)}" style="padding:2px 8px;color:var(--dim2)">✕</button></div>
          <div class="tiny" style="margin:5px 0 9px">${esc(hint.text)}</div>
          <div class="chips" style="padding:0;margin:0 0 9px">
            ${ex.sets.map((s, i) => `<button class="chip" data-setdel="${esc(ex.name)}|${i}">${s.w} kg × ${s.r}</button>`).join('')}
          </div>
          <div class="row" style="gap:7px">
            <input type="number" inputmode="decimal" placeholder="kg" data-sw="${esc(ex.name)}" style="padding:9px">
            <input type="number" inputmode="numeric" placeholder="reps" data-sr="${esc(ex.name)}" style="padding:9px">
            <button class="btn sm pri" data-setadd="${esc(ex.name)}" style="flex:none">Add set</button>
          </div>
          <div class="tiny" style="margin-top:8px;color:${vol > pv && pv ? 'var(--acc)' : 'var(--dim2)'}">
            Volume ${r0(vol)} kg${pv ? ` · last time ${r0(pv)} kg (${vol > pv ? '+' : ''}${Math.round((vol - pv) / pv * 100)}%)` : ''}
          </div>
        </div>`;
      }).join('')}</div>` : `<div class="empty card" style="margin-top:12px">No exercises logged for this day.</div>`}

    <h2>Add an exercise</h2>
    <div class="chips">${lib.map(e => `<button class="chip" data-exadd="${esc(e)}">${esc(e)}</button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><input id="tr-custom" placeholder="Or type any exercise">
      <button class="btn sm pri" id="tr-customgo" style="flex:none">Add</button></div>

    <h2>Weekly sets per muscle</h2>
    <div class="card">
      <p class="tiny" style="margin:0 0 12px">10–20 hard sets per muscle per week is the range that grows muscle. Under 8 is maintenance at best — and in a deficit, maintenance sets is how you lose size.</p>
      ${wsets.length ? wsets.map(([m, n]) => `
        <div class="macro"><div class="mh"><span>${esc(m)}</span>
          <span><b style="color:${n < 8 ? 'var(--bad)' : n > 22 ? 'var(--warn)' : 'var(--acc)'}">${n}</b> <span class="muted">sets</span></span></div>
          <div class="bar"><i style="background:${n < 8 ? 'var(--bad)' : n > 22 ? 'var(--warn)' : 'var(--acc)'};width:${Math.min(100, n / 22 * 100)}%"></i></div></div>`).join('')
        : `<p class="tiny">Log a few sessions and this fills in.</p>`}
    </div>

    <h2>Your split</h2>
    <div class="card flush">${[1,2,3,4,5,6,0].map(d => {
      const s = state().split[d];
      const nm = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];
      return `<div class="item"><div class="txt"><div class="nm">${nm}</div>
        <div class="mt">${esc(s.name)}</div></div>
        <span class="pill ${s.type === 'train' ? 'good' : 'info'}">${s.type === 'train' ? 'train' : 'rest'}</span></div>`;
    }).join('')}</div>
    <p class="tiny" style="margin-top:8px">Edit this in Settings → Training split.</p>`;
}

function openProgress() {
  const names = Train.allLoggedExercises();
  if (!names.length) return toast('Log some sets first');
  sheet('Strength progress', `
    <select id="pg-sel">${names.map(n => `<option>${esc(n)}</option>`).join('')}</select>
    <div id="pg-out" style="margin-top:16px"></div>`, { sub: 'Estimated 1-rep max over time — the honest way to compare 60×8 against 70×5' });
  const draw = () => {
    const n = $('#pg-sel').value, s = Train.progressSeries(n, 14);
    if (s.length < 2) { $('#pg-out').innerHTML = `<div class="empty">Need at least two sessions of ${esc(n)}.</div>`; return; }
    const vals = s.map(x => x.e1rm), mn = Math.min(...vals) * 0.94, mx = Math.max(...vals) * 1.06;
    const W = 320, H = 140, pad = 8;
    const X = i => pad + i * ((W - pad * 2) / (s.length - 1));
    const Y = v => H - pad - ((v - mn) / (mx - mn || 1)) * (H - pad * 2);
    const d = s.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x.e1rm).toFixed(1)}`).join(' ');
    const first = s[0].e1rm, last = s.at(-1).e1rm, ch = last - first;
    $('#pg-out').innerHTML = `
      <div class="card">
        <div class="row between"><div><div style="font-size:25px;font-weight:800">${last.toFixed(1)} kg</div>
          <div class="tiny">estimated 1RM</div></div>
          <span class="pill ${ch > 0 ? 'good' : ch < 0 ? 'bad' : 'info'}">${ch > 0 ? '+' : ''}${ch.toFixed(1)} kg</span></div>
        <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="margin-top:12px">
          <path class="ln" d="${d}"/>
          ${s.map((x, i) => `<circle class="dot" cx="${X(i).toFixed(1)}" cy="${Y(x.e1rm).toFixed(1)}" r="3"/>`).join('')}
        </svg>
        <div class="row between tiny"><span>${fmtShort(s[0].date)}</span><span>${fmtShort(s.at(-1).date)}</span></div>
      </div>
      <div class="card flush">${s.slice().reverse().map(x => `<div class="item">
        <div class="txt"><div class="nm">${fmtShort(x.date)}</div><div class="mt">best set ${x.best.w} kg × ${x.best.r}</div></div>
        <div class="kc">${x.e1rm.toFixed(1)}<small>e1RM</small></div></div>`).join('')}</div>
      <p class="tiny" style="margin-top:10px">In a calorie deficit, holding your e1RM steady is already a win. Climbing is excellent.</p>`;
  };
  $('#pg-sel').addEventListener('change', draw); draw();
}

/* ============================================================
   BODY
   ============================================================ */
function renderBody() {
  const S = state(), b = S.body, tr = weightTrend(7);
  const last = [...b].reverse().find(x => x.weightKg);
  const waistPts = b.filter(x => x.waistCm);
  const lastWaist = waistPts.at(-1), firstWaist = waistPts[0];
  const p = S.profile;
  // "since start" means since your first logged weigh-in, not since the app's default
  const firstW = b.find(x => x.weightKg)?.weightKg ?? p.startWeight;
  const lostTotal = firstW - (tr?.recent ?? last?.weightKg ?? p.weightKg);

  const series = b.filter(x => x.weightKg).slice(-40);
  let chart = `<div class="empty">Log your weight for a few days and the trend line appears here.</div>`;
  if (series.length >= 2) {
    const vals = series.map(x => x.weightKg);
    const mn = Math.min(...vals) - 0.6, mx = Math.max(...vals) + 0.6;
    const W = 320, H = 150, pad = 10;
    const X = i => pad + i * ((W - pad * 2) / (series.length - 1));
    const Y = v => H - pad - ((v - mn) / (mx - mn || 1)) * (H - pad * 2);
    const raw = series.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x.weightKg).toFixed(1)}`).join(' ');
    // 5-point moving average — the line that actually tells you what's happening
    const sm = series.map((_, i) => {
      const w = series.slice(Math.max(0, i - 4), i + 1);
      return w.reduce((a, x) => a + x.weightKg, 0) / w.length;
    });
    const smooth = sm.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path class="ln2" d="${raw}"/><path class="ln" d="${smooth}"/></svg>
      <div class="row between tiny"><span>${fmtShort(series[0].date)}</span>
        <span style="color:var(--dim2)">— daily · <span style="color:var(--acc)">— trend</span></span>
        <span>${fmtShort(series.at(-1).date)}</span></div>`;
  }

  $('#bd-body').innerHTML = `
    <div class="card">
      <div class="row between">
        <div><div style="font-size:33px;font-weight:800;letter-spacing:-1.4px">${(tr?.recent ?? last?.weightKg ?? p.weightKg).toFixed(1)} <span style="font-size:16px;font-weight:600;color:var(--dim)">kg</span></div>
          <div class="tiny">${tr ? '7-day trend weight' : 'current weight'}</div></div>
        ${tr?.perWeek != null ? `<span class="pill ${tr.perWeek < -0.15 ? 'good' : tr.perWeek > 0.15 ? 'bad' : 'info'}">
          ${tr.perWeek > 0 ? '+' : ''}${tr.perWeek} kg / week</span>` : ''}
      </div>
      <div style="margin-top:14px">${chart}</div>
      <div class="divider"></div>
      <div class="grid3" style="text-align:center">
        <div><div style="font-size:18px;font-weight:800;color:${lostTotal > 0.05 ? 'var(--acc)' : lostTotal < -0.05 ? 'var(--warn)' : 'var(--fg)'}">${lostTotal >= 0 ? '−' : '+'}${Math.abs(lostTotal).toFixed(1)}</div><div class="tiny">kg since ${fmtShort(b.find(x => x.weightKg)?.date || p.startDate)}</div></div>
        <div><div style="font-size:18px;font-weight:800">${p.goalWeight}</div><div class="tiny">goal kg</div></div>
        <div><div style="font-size:18px;font-weight:800">${lastWaist?.waistCm ? lastWaist.waistCm.toFixed(1) : '—'}</div><div class="tiny">waist cm</div></div>
      </div>
    </div>

    ${lastWaist && firstWaist && lastWaist !== firstWaist ? `<div class="ins ${lastWaist.waistCm < firstWaist.waistCm ? 'good' : 'info'}">
      <div class="ic">${lastWaist.waistCm < firstWaist.waistCm ? '✓' : 'i'}</div><div>
      <b>Waist ${lastWaist.waistCm < firstWaist.waistCm ? 'down' : 'up'} ${Math.abs(lastWaist.waistCm - firstWaist.waistCm).toFixed(1)} cm</b>
      <p>For your goal this number matters more than bodyweight. Waist shrinking while weight holds steady means you are swapping fat for muscle — exactly what a recomp looks like.</p></div></div>` : ''}

    <div class="ins info"><div class="ic">i</div><div><b>How to weigh yourself</b>
      <p>Every morning, after the toilet, before eating or drinking, same clothes. Single days swing 1–2 kg on water and food weight alone — that is why this screen shows a 7-day trend and not yesterday's number.</p></div></div>

    <h2>Measurements</h2>
    <p class="tiny" style="margin:-6px 0 10px">Measure waist at the navel, relaxed, don't suck in. Weekly is enough.</p>
    <div class="card flush">${b.slice().reverse().slice(0, 20).map(x => `
      <div class="item" data-bedit="${x.date}">
        <div class="txt"><div class="nm">${relDay(x.date)}</div>
          <div class="mt">${[x.waistCm && `waist ${x.waistCm}`, x.chestCm && `chest ${x.chestCm}`,
            x.armCm && `arm ${x.armCm}`, x.thighCm && `thigh ${x.thighCm}`].filter(Boolean).join(' · ') || '—'}</div></div>
        <div class="kc">${x.weightKg ? x.weightKg.toFixed(1) : '—'}<small>kg</small></div></div>`).join('')
      || `<div class="empty">Nothing logged yet.</div>`}</div>`;
}

function openBodyEditor(date = todayISO()) {
  const rec = state().body.find(x => x.date === date) || { date };
  sheet('Log body', `
    <div class="field"><label class="fl">Date</label><input id="bd-date" type="date" value="${date}"></div>
    <div class="grid2">
      <div class="field"><label class="fl">Weight kg</label><input id="bd-w" type="number" inputmode="decimal" step="0.1" value="${rec.weightKg ?? ''}" placeholder="70.0"></div>
      <div class="field"><label class="fl">Waist cm</label><input id="bd-waist" type="number" inputmode="decimal" step="0.1" value="${rec.waistCm ?? ''}" placeholder="at navel"></div>
      <div class="field"><label class="fl">Chest cm</label><input id="bd-chest" type="number" inputmode="decimal" step="0.1" value="${rec.chestCm ?? ''}"></div>
      <div class="field"><label class="fl">Arm cm</label><input id="bd-arm" type="number" inputmode="decimal" step="0.1" value="${rec.armCm ?? ''}" placeholder="flexed"></div>
      <div class="field"><label class="fl">Thigh cm</label><input id="bd-thigh" type="number" inputmode="decimal" step="0.1" value="${rec.thighCm ?? ''}"></div>
      <div class="field"><label class="fl">Neck cm</label><input id="bd-neck" type="number" inputmode="decimal" step="0.1" value="${rec.neckCm ?? ''}"></div>
    </div>
    <p class="hint">Waist and weight are the two that matter. The rest are optional — but arm and chest going up while waist goes down is the clearest proof a recomp is working.</p>
  `, { foot: `<button class="btn pri" id="bd-save">Save</button>` });
}

/* ============================================================
   PLAN
   ============================================================ */
function renderPlan() {
  const p = state().profile, tg = targetsFor(cur);
  const trainT = targetsFor(nextOfType('train')), restT = targetsFor(nextOfType('rest'));
  const wk = weeklyAvg(lastNDays(14));
  const toGoal = (p.weightKg - p.goalWeight);
  const weeksLeft = tg.lossPerWeek > 0 ? Math.ceil(toGoal / tg.lossPerWeek) : null;

  $('#cc-body').innerHTML = `
    <div class="card">
      <h3>Your daily targets</h3>
      <div class="kv"><span>Training days (${countType('train')}/week)</span><b>${trainT.kcal} kcal</b></div>
      <div class="kv"><span>Rest days (${countType('rest')}/week)</span><b>${restT.kcal} kcal</b></div>
      <div class="kv"><span>Protein — every day</span><b style="color:var(--p)">${tg.protein} g</b></div>
      <div class="kv"><span>Fat — floor, every day</span><b style="color:var(--f)">${tg.fat} g</b></div>
      <div class="kv"><span>Carbs — training / rest</span><b style="color:var(--c)">${trainT.carbs} / ${restT.carbs} g</b></div>
      <div class="kv"><span>Fibre</span><b>${tg.fiber} g</b></div>
      <div class="kv"><span>Water</span><b>${(tg.water/1000).toFixed(1)} L</b></div>
    </div>

    <div class="card">
      <h3>Where those numbers come from</h3>
      <div class="kv"><span>BMR (Mifflin–St Jeor)</span><b>${tg.bmr} kcal</b></div>
      <div class="kv"><span>× activity ${p.activity}</span><b>${tg.maint} kcal maintenance</b></div>
      <div class="kv"><span>− ${p.deficitPct}% deficit</span><b>${tg.avg} kcal average</b></div>
      <div class="kv"><span>Weekly deficit</span><b>${tg.weeklyDeficit} kcal</b></div>
      <div class="kv"><span>Expected fat loss</span><b>${tg.lossPerWeek} kg / week</b></div>
      ${weeksLeft ? `<div class="kv"><span>To ${p.goalWeight} kg</span><b>~${weeksLeft} weeks</b></div>` : ''}
      <p class="tiny" style="margin-top:12px">Calories are cycled: training days get ~${trainT.kcal - restT.kcal} kcal more than rest days, but the weekly total is unchanged. Same fat loss, better lifts.</p>
    </div>

    <h2>Why this plan, for your body</h2>
    <div class="ins info"><div class="ic">1</div><div><b>Skinny fat is a body-composition problem, not a weight problem</b>
      <p>At ${p.heightCm} cm and ${p.weightKg} kg you are not overweight. Losing weight fast would make you smaller, not leaner — the belly and chest would still be the last places to go, and you'd have less muscle underneath. So the plan is a slow deficit with very high protein and hard training. You will lose fat and gain (or at minimum keep) muscle at the same time. This is the one situation where a genuine recomp works well: your training age is low, so you still have the beginner window.</p></div></div>
    <div class="ins info"><div class="ic">2</div><div><b>${tg.protein} g protein is the non-negotiable</b>
      <p>That is ${p.proteinPerKg} g per kg. In a deficit, protein is what tells your body to burn fat instead of breaking down muscle. On a vegetarian diet it takes deliberate effort — plant proteins are lower and less complete, so you have to plan it rather than hope for it. Miss calories occasionally; do not miss protein.</p></div></div>
    <div class="ins info"><div class="ic">3</div><div><b>You cannot choose where fat comes off</b>
      <p>There is no exercise that burns belly or chest fat specifically. Those are simply your body's last-to-go stores, which is why they look stubborn. They go when overall body fat drops — which is a matter of months, not weeks. Keep the deficit, keep lifting, and they will move.</p></div></div>
    <div class="ins info"><div class="ic">4</div><div><b>Chest fat: give it time before anything else</b>
      <p>Soft tissue behind the nipple can be either plain fat, or gynecomastia (glandular tissue), which does not respond to dieting. Do not try to self-diagnose from a mirror — it is genuinely hard to tell. Get through this cut, and if a firm, disc-like lump under the nipple is still there at a clearly lower body fat, that is worth a doctor's opinion rather than another six months of guessing.</p></div></div>
    <div class="ins info"><div class="ic">5</div><div><b>Toned is not a training style, it is a body fat percentage</b>
      <p>"Toned and aesthetic" means visible muscle at low body fat. There is no light-weights-high-reps route to it — that just builds less muscle. You train heavy to build the shape, and you diet to reveal it. Which is exactly what this app is for: the training screen makes the muscle, the food screen reveals it.</p></div></div>

    <h2>Hitting ${tg.protein} g on a veg diet</h2>
    <div class="card">
      <p class="tiny" style="margin:0 0 12px">Roughly how a ${tg.protein} g day can be built from what you already eat:</p>
      ${[['Whey, 1 scoop (32 g)','24 g','~128 kcal'],
         ['Low-fat paneer, 150 g','33 g','~309 kcal'],
         ['Curd, 200 g','9 g','~90 kcal'],
         ['Dal, 1 large bowl (250 g)','14 g','~295 kcal'],
         ['Milk, 500 ml toned','16 g','~290 kcal'],
         ['Oats, 60 g','10 g','~233 kcal'],
         ['Roasted chana, 40 g','9 g','~155 kcal'],
         ['Nuts & seeds, 35 g','8 g','~200 kcal'],
         ['Rice, sabzi, roti (the rest)','~15 g','—']]
        .map(([a,b,c]) => `<div class="kv"><span>${a}</span><b>${b} <span class="tiny muted">${c}</span></b></div>`).join('')}
      <p class="tiny" style="margin-top:12px"><b style="color:var(--fg)">Rank your protein sources:</b> low-fat paneer, whey and curd give you the most protein per calorie. Nuts and full-fat paneer give you protein but carry a lot of fat with it — good food, easy to overshoot on. Dal and rice give protein but mostly carbs; they are your base, not your protein plan.</p>
    </div>

    <h2>What to cut first</h2>
    <div class="card">
      ${[['Cooking oil','The single biggest hidden cost in Nepali/Indian food. One generous pour is 3 tsp = 135 kcal. Measure it with a spoon and you can save 200–300 kcal a day without changing a single food you eat.'],
         ['Sugar in tea','4 cups a day at 2 tsp each is ~150 kcal of nothing. Cut to 1 tsp, then to none. Nobody misses it after two weeks.'],
         ['Fried snacks','Samosa, pakoda, puri — 300–380 kcal per 100 g, all of it oil. Not forbidden, but once a week, logged, not daily and unlogged.'],
         ['Handfuls of nuts','Genuinely healthy and genuinely 550–650 kcal per 100 g. You own a scale. Weigh 30 g, put the packet away.'],
         ['Full-fat paneer as the default','Swap to low-fat paneer: same 20+ g protein, roughly half the calories. Easiest single upgrade in your diet.']]
        .map(([a,b]) => `<div style="padding:11px 0;border-bottom:1px solid var(--line)"><b style="font-size:14px">${a}</b><p class="tiny" style="margin:4px 0 0">${b}</p></div>`).join('')}
    </div>

    <h2>What NOT to do</h2>
    <div class="card">
      ${['Do not drop below ~1500 kcal. Faster is not better — it costs muscle, sleep and strength, and it always ends in a binge.',
         'Do not do endless cardio to burn off food. Cardio is for heart health and a small calorie buffer; your deficit comes from the kitchen.',
         'Do not do 500 crunches for the belly. Abs are built by training them heavy and revealed by the deficit — spot reduction is not a thing.',
         'Do not weigh yourself daily and panic. Use the 7-day trend on the Body screen.',
         'Do not skip meals to "make up" for a heavy day. Just return to target the next day.',
         'Do not chase supplements. Whey and creatine are worth it. Fat burners are not — none of them work, and some are dangerous.']
        .map(t => `<div class="kv"><span style="color:var(--fg)">✕ ${t}</span></div>`).join('')}
    </div>

    ${wk ? `<div class="card"><h3>Reality check — last 14 days</h3>
      <div class="kv"><span>Average intake</span><b>${wk.kcal} kcal</b></div>
      <div class="kv"><span>Average target</span><b>${wk.targetKcal} kcal</b></div>
      <div class="kv"><span>Average protein</span><b style="color:${wk.p >= tg.protein * .9 ? 'var(--acc)' : 'var(--bad)'}">${wk.p} g of ${tg.protein} g</b></div>
      <div class="kv"><span>Days logged</span><b>${wk.n} of 14</b></div>
    </div>` : ''}

    <p class="tiny" style="margin-top:18px;line-height:1.6">These targets are calculated estimates, not medical advice. Adjust them from what actually happens on the scale over 2–3 weeks, and talk to a doctor before big changes if you have any health condition.</p>`;
}
function countType(t) { let n = 0; for (let d = 0; d < 7; d++) if (state().split[d].type === t) n++; return n; }
function nextOfType(t) {
  for (let i = 0; i < 8; i++) { const iso = todayISO(new Date(Date.now() + i * 864e5)); if (dayTypeFor(iso) === t) return iso; }
  return todayISO();
}

/* ============================================================
   SETTINGS
   ============================================================ */
function aiSetupHTML() {
  const P = AI.PROVIDERS, s = state().settings;
  return `
    <div class="ins info"><div class="ic">i</div><div><b>Free, and no card required</b>
      <p>Google AI Studio gives you a free API key with a daily quota far above what this app will ever use. It takes about a minute and you never have to touch it again.</p></div></div>
    <ol style="padding-left:20px;font-size:13.5px;line-height:1.9;color:var(--dim)">
      <li>Open <a href="${P.gemini.keyUrl}" target="_blank" rel="noopener">aistudio.google.com/apikey</a></li>
      <li>Sign in with your Google account</li>
      <li>Tap <b style="color:var(--fg)">Create API key</b></li>
      <li>Copy it and paste below</li>
    </ol>
    <div class="field" style="margin-top:14px">
      <label class="fl">Provider</label>
      <select id="st-prov">${Object.entries(P).map(([k, v]) =>
        `<option value="${k}" ${s.provider === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
    </div>
    <div class="field"><label class="fl">API key</label>
      <input id="st-key" type="password" placeholder="AIza…" value="${esc(s.apiKey)}" autocomplete="off" autocapitalize="off" spellcheck="false">
      <p class="hint">Stored only on this phone, in this app. It is never sent anywhere except directly to the provider you picked.</p></div>
    <div class="field"><label class="fl">Model <span style="text-transform:none;font-weight:400">(optional)</span></label>
      <input id="st-model" placeholder="${esc(P[s.provider || 'gemini'].model)}" value="${esc(s.model)}"></div>
    <button class="btn pri" id="st-savekey">Save key</button>
    <button class="btn ghost" id="st-testkey" style="margin-top:8px">Test it</button>
    <p class="hint" style="margin-top:14px">You can skip this entirely. Searching the built-in food list, barcodes and manual logging all work without a key — you just won't get photo recognition.</p>`;
}

function openSettings() {
  const p = state().profile, s = state().settings;
  sheet('Settings', `
    <h3>You</h3>
    <div class="grid2">
      <div class="field"><label class="fl">Age</label><input id="sp-age" type="number" inputmode="numeric" value="${p.age}"></div>
      <div class="field"><label class="fl">Height cm</label><input id="sp-h" type="number" inputmode="decimal" value="${p.heightCm}"></div>
      <div class="field"><label class="fl">Weight kg</label><input id="sp-w" type="number" inputmode="decimal" step="0.1" value="${p.weightKg}"></div>
      <div class="field"><label class="fl">Goal weight kg</label><input id="sp-gw" type="number" inputmode="decimal" step="0.5" value="${p.goalWeight}"></div>
    </div>

    <h3 style="margin-top:8px">Activity level</h3>
    <select id="sp-act">
      ${[[1.2,'Sedentary — desk job, no training'],[1.375,'Light — training 1–3 days'],
         [1.5,'Moderate — training 5 days, otherwise sitting'],[1.65,'High — training 5–6 days + on your feet'],
         [1.8,'Very high — physical job + training']]
        .map(([v, l]) => `<option value="${v}" ${Math.abs(p.activity - v) < 0.02 ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    <p class="hint">This is the number most people get wrong, in the optimistic direction. If the scale doesn't move for 2–3 weeks of honest logging, this is what to lower.</p>

    <h3 style="margin-top:18px">Deficit</h3>
    <div class="field"><label class="fl">Deficit — <span id="sp-defv">${p.deficitPct}</span>%</label>
      <input id="sp-def" type="range" min="0" max="30" step="1" value="${p.deficitPct}" style="padding:0;background:none;border:0">
      <p class="hint" id="sp-defh"></p></div>

    <div class="grid2">
      <div class="field"><label class="fl">Protein g/kg</label><input id="sp-ppk" type="number" inputmode="decimal" step="0.1" value="${p.proteinPerKg}"></div>
      <div class="field"><label class="fl">Fat g/kg</label><input id="sp-fpk" type="number" inputmode="decimal" step="0.01" value="${p.fatPerKg}"></div>
      <div class="field"><label class="fl">Fibre g</label><input id="sp-fib" type="number" inputmode="numeric" value="${p.fiberTarget}"></div>
      <div class="field"><label class="fl">Water ml</label><input id="sp-wat" type="number" inputmode="numeric" value="${p.waterTargetMl}"></div>
    </div>
    <div class="row between card" style="background:var(--card2)">
      <div style="flex:1"><b style="font-size:14px">Cycle carbs</b>
        <p class="tiny" style="margin:3px 0 0">More food on training days, less on rest days. Same weekly total.</p></div>
      <label class="sw"><input type="checkbox" id="sp-cyc" ${p.cycleCarbs ? 'checked' : ''}><i></i></label>
    </div>
    <button class="btn pri" id="sp-save">Save profile</button>

    <div class="divider"></div>
    <h3>Training split</h3>
    <div id="sp-split">${[1,2,3,4,5,6,0].map(d => {
      const sp = state().split[d], nm = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d];
      return `<div class="row" style="margin-bottom:8px">
        <span style="width:38px;flex:none;font-weight:700;font-size:13px">${nm}</span>
        <input value="${esc(sp.name)}" data-splitname="${d}" style="padding:9px">
        <button class="btn sm ${sp.type === 'train' ? 'pri' : ''}" data-splittype="${d}" style="flex:none;width:72px">${sp.type === 'train' ? 'Train' : 'Rest'}</button>
      </div>`;
    }).join('')}</div>

    <div class="divider"></div>
    <h3>AI food recognition</h3>
    <div id="sp-ai">${aiSetupHTML()}</div>

    <div class="divider"></div>
    <h3>Your data</h3>
    <p class="hint" style="margin:0 0 12px">Everything lives on this phone only. Nothing is uploaded, there is no account, and nobody else can see it. That also means <b>if you lose the phone or clear Safari's data, it is gone</b> — so export a backup now and then.</p>
    <button class="btn" id="sd-export">Export backup (.json)</button>
    <button class="btn" id="sd-import" style="margin-top:8px">Import a backup</button>
    <button class="btn danger" id="sd-reset" style="margin-top:8px">Erase everything</button>
    <p class="tiny" style="margin-top:16px">Lean v1 · ${allFoods().length} foods · ${Object.keys(state().days).length} days logged</p>
  `);
  const dh = () => {
    const v = +$('#sp-def').value; $('#sp-defv').textContent = v;
    const tg = { ...state().profile, deficitPct: v };
    const kcal = Math.round(bmr(tg) * tg.activity * (1 - v / 100));
    const wk = (bmr(tg) * tg.activity - kcal) * 7 / 7700;
    $('#sp-defh').innerHTML = v === 0 ? 'Maintenance — no fat loss, but good for a diet break.'
      : `≈ <b style="color:var(--fg)">${kcal} kcal/day average</b>, about ${wk.toFixed(2)} kg/week.
         ${v > 25 ? '<span style="color:var(--bad)">Too aggressive — you will lose muscle and strength.</span>'
         : v > 20 ? '<span style="color:var(--warn)">Aggressive. Fine for a few weeks, not for months.</span>'
         : v >= 15 ? '<span style="color:var(--acc)">The sweet spot for keeping muscle while losing fat.</span>'
         : '<span style="color:var(--info)">Gentle. Slower, but very sustainable and very muscle-friendly.</span>'}`;
  };
  $('#sp-def').addEventListener('input', dh); dh();
}

/* ---------- onboarding ---------- */
function onboard() {
  sheet('Welcome', `
    <p style="font-size:15px;line-height:1.6;margin-top:0">This is set up for you already — 24, 70 kg, 170 cm, vegetarian, 5 training days a week, cutting fat while holding muscle.</p>
    <div class="card" style="background:var(--card2)">
      <div class="kv"><span>Training days</span><b>${targetsFor(nextOfType('train')).kcal} kcal</b></div>
      <div class="kv"><span>Rest days</span><b>${targetsFor(nextOfType('rest')).kcal} kcal</b></div>
      <div class="kv"><span>Protein, daily</span><b>${targetsFor(cur).protein} g</b></div>
    </div>
    <h3 style="margin-top:20px">Three things worth knowing</h3>
    <div class="ins info"><div class="ic">1</div><div><b>Weigh your food for two weeks</b>
      <p>You already own a scale. Two weeks of weighing teaches your eye what 150 g of rice looks like — then you can estimate for the rest of your life. This is the highest-value habit in the whole app.</p></div></div>
    <div class="ins info"><div class="ic">2</div><div><b>Log the bad days too</b>
      <p>The days people skip logging are exactly the days that explain a stalled scale. An honest bad day is useful data. A missing day is nothing.</p></div></div>
    <div class="ins info"><div class="ic">3</div><div><b>Everything is editable</b>
      <p>Every food value, every target, your whole split. The AI estimates portions from photos and it will sometimes be wrong — correct it, and correct numbers are what you keep.</p></div></div>
  `, { foot: `<button class="btn pri" id="ob-done">Start</button>` });
}

/* ============================================================
   EVENTS
   ============================================================ */
function addPendingToLog() {
  let n = 0;
  for (const x of pending.items) {
    // Anything the AI, a label or a barcode found becomes a reusable food —
    // but only once. Items that already exist in the database are left alone.
    let fid = x.id && foodById(x.id) ? x.id : null;
    if (!fid) {
      const dupe = allFoods().find(f => f.n.toLowerCase() === x.n.trim().toLowerCase());
      fid = dupe ? dupe.id
                 : saveCustomFood({ n: x.n.trim(), kcal: x.kcal, p: x.p, c: x.c, f: x.f,
                                    fib: x.fib || 0, cat: x.cat === 'ai' ? 'dish' : (x.cat || 'dish'),
                                    source: x.source, serv: x.serv }).id;
    }
    addRawEntry(cur, { foodId: fid, name: x.n, grams: x.grams, ...scale(x, x.grams) }, pending.meal);
    n++;
  }
  closeSheet(); render();
  toast(`Logged ${n} item${n === 1 ? '' : 's'}`, 'good');
}

document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-tab],[data-water],[data-food],[data-combo],[data-copy],[data-goday],[data-cat],[data-n],[data-serv],[data-del],[data-g],[data-pg],[data-pset],[data-meal],[data-exadd],[data-exdel],[data-setadd],[data-setdel],[data-bedit],[data-splittype],button');
  if (!t) return;
  const d = t.dataset;

  /* nav */
  if (d.tab) return go(d.tab);
  if (t.id === 't-settings') return openSettings();
  if (t.id === 'sh-close') return closeSheet();
  if (t.id === 't-prev') { cur = todayISO(new Date(new Date(cur + 'T12:00:00') - 864e5)); return render(); }
  if (t.id === 't-next') { const n = todayISO(new Date(+new Date(cur + 'T12:00:00') + 864e5)); if (n <= todayISO()) cur = n; return render(); }
  if (d.goday) { cur = d.goday; return go('today'); }

  /* today actions */
  if (t.id === 'a-photo')  return startCapture('meal');
  if (t.id === 'a-label')  return startCapture('label');
  if (t.id === 'a-search') return openSearch();
  if (t.id === 'a-quick')  return openQuick();
  if (d.water) {
    const dd = day(cur); dd.water = Math.max(0, dd.water + +d.water); save(); return renderToday();
  }

  /* capture */
  if (t.id === 'cap-cam') return $('#file-cam').click();
  if (t.id === 'cap-lib') return $('#file-lib').click();
  if (t.id === 'err-retry') return startCapture(captureMode);
  if (t.id === 'err-manual') return openSearch();
  if (t.id === 'cap-bcgo') {
    const code = $('#cap-bc').value.trim();
    if (!code) return toast('Type a barcode first');
    sheetLoading('Looking up ' + code, 'Checking the Open Food Facts database.');
    try {
      const f = await AI.barcode(code);
      pending = { items: [{ ...f, grams: f.serv?.[0]?.g || 100, confidence: 'high' }], meal: guessMeal(), img: null, summary: 'From Open Food Facts — label data, not an estimate.' };
      confirmScreen();
    } catch (e) {
      sheetBody(`<div class="ins warn"><div class="ic">!</div><div><b>Not found</b><p>${esc(e.message)}</p></div></div>
        <button class="btn" id="err-retry" style="margin-top:10px">Back</button>
        <button class="btn ghost" id="err-manual" style="margin-top:8px">Add it manually</button>`);
    }
    return;
  }

  /* pending items */
  if (d.meal) { pending.meal = d.meal; $$('#meal-seg button').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (d.del != null) { pending.items.splice(+d.del, 1); return confirmScreen(); }
  if (d.g) {
    const [i, dg] = d.g.split(':').map(Number);
    pending.items[i].grams = Math.max(1, pending.items[i].grams + dg);
    return confirmScreen();
  }
  if (d.serv && pending.items.length) {
    const [i, g] = d.serv.split(':').map(Number);
    if (pending.items[i]) { pending.items[i].grams = g; return confirmScreen(); }
  }
  if (t.id === 'pi-add') { closeSheet(); return openSearch(); }
  if (t.id === 'pi-save') return addPendingToLog();

  /* search */
  if (d.cat != null && t.classList.contains('chip')) {
    $$('#sh-body .chip').forEach(c => c.classList.remove('on')); t.classList.add('on');
    return drawSearch($('#sr-q').value, d.cat);
  }
  if (d.food) { const f = foodById(d.food); if (f) return openPortion(f); }
  if (t.id === 'sr-new') return openFoodEditor();

  /* portion */
  if (d.pg)   { const el = $('#pt-g'); el.value = Math.max(1, (+el.value || 0) + +d.pg); return $('#sh-body').__upd(); }
  if (d.pset) { $('#pt-g').value = d.pset; return $('#sh-body').__upd(); }
  if (t.id === 'pt-fav') { toggleFav($('#sh-body').dataset.foodId); return $('#sh-body').__upd(); }
  if (t.id === 'pt-edit') { const f = foodById($('#sh-body').dataset.foodId); return openFoodEditor({ ...f }); }
  if (t.id === 'pt-save') {
    const f = foodById($('#sh-body').dataset.foodId);
    const g = parseFloat($('#pt-g').value) || 0;
    const meal = $('#meal-seg .on')?.dataset.meal || guessMeal();
    if (g <= 0) return toast('Enter a weight');
    addEntry(cur, f, g, meal); closeSheet(); render();
    return toast(`${r0(g)} g ${f.n} logged`, 'good');
  }

  /* quick add */
  if (d.combo) {
    const c = COMBOS.find(x => x.id === d.combo);
    pending = { items: c.items.map(i => { const f = foodById(i.id); return { ...f, grams: i.g }; }).filter(x => x.id),
                meal: guessMeal(), img: null, summary: `Typical portions for "${c.n}" — adjust to what you actually ate.` };
    return confirmScreen();
  }
  if (d.copy) {
    const [iso, meal] = d.copy.split('|');
    const src = day(iso).entries.filter(e => e.meal === meal);
    pending = { items: src.map(e => ({ n: e.name, grams: e.grams,
      kcal: e.grams ? e.kcal / e.grams * 100 : e.kcal, p: e.grams ? e.p / e.grams * 100 : e.p,
      c: e.grams ? e.c / e.grams * 100 : e.c, f: e.grams ? e.f / e.grams * 100 : e.f,
      fib: e.grams ? (e.fib || 0) / e.grams * 100 : 0, cat: 'ai' })),
      meal, img: null, summary: `Copied from ${relDay(iso)}.` };
    return confirmScreen();
  }
  if (t.id === 'qk-go') {
    const n = $('#qk-n').value.trim() || 'Quick entry', k = +$('#qk-k').value;
    if (!k) return toast('Enter calories');
    addRawEntry(cur, { name: n, grams: 0, kcal: k, p: 0, c: 0, f: 0 }, guessMeal());
    closeSheet(); render(); return toast(`${k} kcal logged`, 'good');
  }

  /* food editor */
  if (t.id === 'fe-save') {
    const f = { n: $('#fe-n').value.trim(), kcal: +$('#fe-k').value, p: +$('#fe-p').value,
                c: +$('#fe-c').value, f: +$('#fe-f').value, fib: +$('#fe-fib').value || 0, cat: $('#fe-cat').value };
    if (!f.n) return toast('Give it a name');
    if (!f.kcal && !(f.p || f.c || f.f)) return toast('Add at least the calories');
    if (!f.kcal) f.kcal = f.p * 4 + f.c * 4 + f.f * 9;
    saveCustomFood(f); closeSheet(); toast('Saved — search for it any time', 'good');
    return openPortion(state().custom[0]);
  }

  /* training */
  if (d.exadd) { Train.addExercise(cur, d.exadd); return renderTrain(); }
  if (t.id === 'tr-customgo') { const v = $('#tr-custom').value.trim(); if (v) { Train.addExercise(cur, v); renderTrain(); } return; }
  if (d.exdel) { Train.removeExercise(cur, d.exdel); return renderTrain(); }
  if (d.setadd) {
    const w = $(`[data-sw="${CSS.escape(d.setadd)}"]`), r = $(`[data-sr="${CSS.escape(d.setadd)}"]`);
    if (!r.value) return toast('Reps?');
    Train.addSet(cur, d.setadd, w.value, r.value);
    return renderTrain();
  }
  if (d.setdel) { const [n, i] = d.setdel.split('|'); Train.removeSet(cur, n, +i); return renderTrain(); }
  if (t.id === 'tr-prog') return openProgress();

  /* body */
  if (t.id === 'b-add') return openBodyEditor();
  if (d.bedit) return openBodyEditor(d.bedit);
  if (t.id === 'bd-save') {
    const g = id => { const v = parseFloat($('#' + id).value); return Number.isFinite(v) ? v : undefined; };
    addBody({ date: $('#bd-date').value, weightKg: g('bd-w'), waistCm: g('bd-waist'), chestCm: g('bd-chest'),
              armCm: g('bd-arm'), thighCm: g('bd-thigh'), neckCm: g('bd-neck') });
    closeSheet(); render(); return toast('Saved', 'good');
  }

  /* history range */
  if (d.n) { histN = +d.n; $$('#h-range .chip').forEach(c => c.classList.toggle('on', c === t)); return renderHistory(); }

  /* settings */
  if (t.id === 'sp-save') {
    const p = state().profile, g = (id, dflt) => { const v = parseFloat($('#' + id).value); return Number.isFinite(v) ? v : dflt; };
    p.age = g('sp-age', p.age); p.heightCm = g('sp-h', p.heightCm); p.weightKg = g('sp-w', p.weightKg);
    p.goalWeight = g('sp-gw', p.goalWeight); p.activity = +$('#sp-act').value;
    p.deficitPct = +$('#sp-def').value; p.proteinPerKg = g('sp-ppk', p.proteinPerKg);
    p.fatPerKg = g('sp-fpk', p.fatPerKg); p.fiberTarget = g('sp-fib', p.fiberTarget);
    p.waterTargetMl = g('sp-wat', p.waterTargetMl); p.cycleCarbs = $('#sp-cyc').checked;
    save(); render(); return toast('Targets updated', 'good');
  }
  if (d.splittype) {
    const s = state().split[d.splittype];
    s.type = s.type === 'train' ? 'rest' : 'train';
    t.textContent = s.type === 'train' ? 'Train' : 'Rest';
    t.classList.toggle('pri', s.type === 'train');
    save(); return;
  }
  if (t.id === 'st-savekey') {
    const s = state().settings;
    const changed = s.provider !== $('#st-prov').value || s.apiKey !== $('#st-key').value.trim();
    s.provider = $('#st-prov').value; s.apiKey = $('#st-key').value.trim(); s.model = $('#st-model').value.trim();
    if (changed) s.resolvedModel = '';
    save(); return toast(s.apiKey ? 'Key saved' : 'Key cleared', 'good');
  }
  if (t.id === 'st-testkey') {
    const s = state().settings;
    if (s.provider !== $('#st-prov').value || s.apiKey !== $('#st-key').value.trim()) s.resolvedModel = '';
    s.provider = $('#st-prov').value; s.apiKey = $('#st-key').value.trim(); s.model = $('#st-model').value.trim(); save();
    if (!s.apiKey) return toast('Paste a key first', 'bad');
    t.innerHTML = '<span class="spin"></span> Testing…';
    // 1×1 white pixel — cheapest possible round-trip that still proves vision works
    const px = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    try { await AI.analyseMeal([{ mime: 'image/png', b64: px }], 'test'); toast('Key works ✓', 'good'); }
    catch (e) { toast(/No food recognised|read the AI/i.test(e.message) ? 'Key works ✓' : e.message, /No food|read the AI/i.test(e.message) ? 'good' : 'bad'); }
    t.textContent = 'Test it'; return;
  }
  if (t.id === 'sd-export') {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `lean-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    state().settings.lastExport = Date.now(); save();
    return toast('Save it to Files or mail it to yourself', 'good');
  }
  if (t.id === 'sd-import') return $('#file-json').click();
  if (t.id === 'sd-reset') {
    if (!confirm('Erase every meal, weight and workout you have logged? This cannot be undone.')) return;
    if (!confirm('Really erase everything? Export a backup first if you are not sure.')) return;
    localStorage.removeItem(KEY); location.reload(); return;
  }
  if (t.id === 'ob-done') { state().settings.firstRun = false; save(); return closeSheet(); }
});

/* scrim / inputs */
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'sr-q') drawSearch(t.value, $('#sh-body .chip.on')?.dataset.cat || '');
  if (t.id === 'pt-g') $('#sh-body').__upd?.();
  if (t.dataset.gi != null) { const i = +t.dataset.gi, v = parseFloat(t.value); if (v > 0) { pending.items[i].grams = v; } }
  if (t.dataset.nm != null) pending.items[+t.dataset.nm].n = t.value;
  if (t.dataset.splitname != null) { state().split[t.dataset.splitname].name = t.value; save(); }
  if (t.id === 't-steps') { day(cur).steps = +t.value || 0; save(); }
  if (t.id === 'st-prov') { const m = AI.PROVIDERS[t.value]; if (m) $('#st-model').placeholder = m.model; }
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  if (t.id === 'file-cam' || t.id === 'file-lib') { await handleFiles(t.files); t.value = ''; }
  if (t.id === 'file-json') {
    const f = t.files[0]; t.value = '';
    if (!f) return;
    try { importJSON(await f.text()); toast('Backup restored', 'good'); setTimeout(() => location.reload(), 700); }
    catch (e) { toast(e.message, 'bad'); }
  }
});

/* tap a logged item to edit or delete it */
document.addEventListener('click', ev => {
  const it = ev.target.closest('#t-meals .item[data-eid]');
  if (!it) return;
  const e = day(cur).entries.find(x => x.eid === it.dataset.eid);
  if (!e) return;
  sheet(e.name, `
    <label class="fl">Weight</label>
    <div class="step"><button data-eg="-10">−</button>
      <input id="ed-g" type="number" inputmode="decimal" value="${r0(e.grams)}">
      <button data-eg="10">＋</button><span class="tiny" style="flex:none;width:26px">g</span></div>
    <div class="card" id="ed-sum" style="margin-top:16px;background:var(--card2)"></div>
    <button class="btn danger" id="ed-del" style="margin-top:14px">Delete this entry</button>`,
    { foot: `<button class="btn pri" id="ed-save">Save</button>` });
  const upd = () => {
    const g = parseFloat($('#ed-g').value) || 0;
    const k = e.grams ? g / e.grams : 0;
    $('#ed-sum').innerHTML = `<div class="kv"><span>Calories</span><b>${r0(e.kcal * k)} kcal</b></div>
      <div class="kv"><span>Protein</span><b>${r1(e.p * k)} g</b></div>
      <div class="kv"><span>Carbs</span><b>${r1(e.c * k)} g</b></div>
      <div class="kv"><span>Fat</span><b>${r1(e.f * k)} g</b></div>`;
  };
  upd();
  $('#sh-body').addEventListener('input', upd);
  $('#sh-body').addEventListener('click', x => {
    if (x.target.dataset.eg) { $('#ed-g').value = Math.max(1, (+$('#ed-g').value || 0) + +x.target.dataset.eg); upd(); }
    if (x.target.id === 'ed-del') { removeEntry(cur, e.eid); closeSheet(); render(); toast('Deleted'); }
  });
  $('#sh-foot').addEventListener('click', x => {
    if (x.target.id === 'ed-save') { updateEntryGrams(cur, e.eid, parseFloat($('#ed-g').value) || 0); closeSheet(); render(); toast('Updated', 'good'); }
  });
}, true);

/* sticky header shadow */
addEventListener('scroll', () => {
  const st = scrollY > 6;
  $$('header.top').forEach(h => h.classList.toggle('stuck', st));
}, { passive: true });

/* ---------- boot ---------- */
load();
if (!state().days[todayISO()]) day(todayISO());
go('today');
if (state().settings.firstRun) setTimeout(onboard, 400);
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
// ask iOS not to evict this app's data when storage gets tight
navigator.storage?.persist?.().catch(() => {});

/* Gentle backup nudge — everything lives on this phone only, so a lost phone
   is a lost log unless a backup exists somewhere. */
addEventListener('load', () => {
  const S = state(), n = Object.keys(S.days).length;
  const lastX = S.settings.lastExport ? (Date.now() - S.settings.lastExport) / 864e5 : 999;
  if (n >= 14 && lastX > 30) setTimeout(() => toast('Worth exporting a backup — Settings → Export'), 3000);
});
// day rolls over while the app sits open in the background
addEventListener('visibilitychange', () => {
  if (!document.hidden && cur !== todayISO() && cur < todayISO()) { cur = todayISO(); render(); }
});
