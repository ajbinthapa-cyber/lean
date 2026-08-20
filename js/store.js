/* ============================================================
   LEAN — state, persistence & target maths
   ============================================================ */
const KEY = 'lean.v1';
const todayISO = (d = new Date()) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_STATE = {
  profile: {
    name: 'Bushan',
    sex: 'male',
    age: 24,
    heightCm: 170,        // 5'7"
    weightKg: 70,
    activity: 1.5,        // 5 gym days + otherwise light daily activity
    deficitPct: 18,       // moderate cut — fast enough to see fat go, slow enough to keep muscle
    proteinPerKg: 2.0,    // high, to protect muscle in a deficit
    fatPerKg: 0.83,       // hormone floor
    cycleCarbs: true,     // more food on training days, less on rest days
    fiberTarget: 30,
    waterTargetMl: 3000,
    stepTarget: 8000,
    startWeight: 70,
    goalWeight: 65,
    startDate: todayISO(),
  },
  // Mon=1 ... Sun=0  (JS getDay order)
  split: {
    1: { name: 'Legs + Shoulders',   type: 'train' },
    2: { name: 'Chest + Triceps',    type: 'train' },
    3: { name: 'Back + Biceps',      type: 'train' },
    4: { name: 'Rest',               type: 'rest'  },
    5: { name: 'Back+Bi / Chest+Tri', type: 'train' },
    6: { name: 'Back+Bi / Chest+Tri', type: 'train' },
    0: { name: 'Rest or 3–5k run',   type: 'rest'  },
  },
  days: {},        // ISO date -> { entries[], water, steps, note, dayType }
  body: [],        // { date, weightKg, waistCm, chestCm, armCm, thighCm, photoIds[] }
  workouts: {},    // ISO date -> { name, exercises:[{name, sets:[{w,r}]}], cardio, note }
  custom: [],      // user-created / AI-created foods
  favorites: [],
  recents: [],
  settings: { provider: 'gemini', apiKey: '', model: '', resolvedModel: '', firstRun: true },
  streak: { last: null, count: 0 },
};

let S = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    S = raw ? deepMerge(structuredClone(DEFAULT_STATE), JSON.parse(raw)) : structuredClone(DEFAULT_STATE);
  } catch (e) {
    console.warn('load failed, starting fresh', e);
    S = structuredClone(DEFAULT_STATE);
  }
  return S;
}
function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      deepMerge(base[k], over[k]);
    } else base[k] = over[k];
  }
  return base;
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Storage full — export a backup in Settings', 'bad'); }
  }, 120);
}
const state = () => S;

/* ---------- target maths ---------- */
// Mifflin–St Jeor: the most accurate simple BMR equation for non-obese adults.
function bmr(p) {
  const s = p.sex === 'male' ? 5 : -161;
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + s;
}
function tdee(p) { return bmr(p) * p.activity; }

function dayTypeFor(iso) {
  const d = S.days[iso];
  if (d && d.dayType) return d.dayType;              // manual override wins
  const dow = new Date(iso + 'T12:00:00').getDay();
  return (S.split[dow] || {}).type === 'train' ? 'train' : 'rest';
}

/* Weekly calories are held constant; they're just distributed so training
   days get more fuel and rest days run a deeper deficit. Same weekly deficit,
   better training performance and better muscle retention. */
function targetsFor(iso) {
  const p = S.profile;
  const maint = tdee(p);
  const avg = maint * (1 - p.deficitPct / 100);

  let trainDays = 0;
  for (let dow = 0; dow < 7; dow++) if ((S.split[dow] || {}).type === 'train') trainDays++;
  const restDays = 7 - trainDays;

  let kcal = avg;
  if (p.cycleCarbs && trainDays > 0 && restDays > 0) {
    const shift = 300; // kcal moved off each rest day onto training days
    kcal = dayTypeFor(iso) === 'train'
      ? avg + (shift * restDays) / trainDays
      : avg - shift;
  }
  kcal = Math.round(kcal / 5) * 5;

  const protein = Math.round(p.weightKg * p.proteinPerKg);
  const fat     = Math.round(p.weightKg * p.fatPerKg);
  const carbs   = Math.max(40, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return {
    kcal, protein, carbs, fat,
    fiber: p.fiberTarget, water: p.waterTargetMl, steps: p.stepTarget,
    maint: Math.round(maint), avg: Math.round(avg), bmr: Math.round(bmr(p)),
    dayType: dayTypeFor(iso),
    weeklyDeficit: Math.round((maint - avg) * 7),
    lossPerWeek: +(((maint - avg) * 7) / 7700).toFixed(2), // 7700 kcal ≈ 1 kg fat
  };
}

/* ---------- day accessors ---------- */
function day(iso) {
  if (!S.days[iso]) S.days[iso] = { entries: [], water: 0, steps: 0, note: '' };
  const d = S.days[iso];
  d.entries ||= []; d.water ||= 0; d.steps ||= 0;
  return d;
}
function totals(iso) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  for (const e of day(iso).entries) {
    t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.f += e.f; t.fib += e.fib || 0;
  }
  for (const k in t) t[k] = Math.round(t[k] * 10) / 10;
  return t;
}
function mealTotals(iso, meal) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const e of day(iso).entries) if (e.meal === meal) {
    t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.f += e.f;
  }
  return t;
}

/* ---------- food lookup ---------- */
function allFoods() { return [...S.custom, ...FOODS]; }
function foodById(id) { return allFoods().find(f => f.id === id); }

function searchFoods(q, limit = 40) {
  q = (q || '').trim().toLowerCase();
  const list = allFoods();
  if (!q) {
    const favs = S.favorites.map(id => list.find(f => f.id === id)).filter(Boolean);
    const rec  = S.recents.map(id => list.find(f => f.id === id)).filter(Boolean);
    const seen = new Set(); const out = [];
    for (const f of [...favs, ...rec, ...list]) { if (!seen.has(f.id)) { seen.add(f.id); out.push(f); } }
    return out.slice(0, limit);
  }
  const scored = [];
  for (const f of list) {
    const n = f.n.toLowerCase();
    let sc = -1;
    if (n === q) sc = 100;
    else if (n.startsWith(q)) sc = 80;
    else if (n.includes(q)) sc = 60;
    else {
      const words = q.split(/\s+/);
      if (words.every(w => n.includes(w))) sc = 40;
    }
    if (sc < 0 && f.cat && f.cat.includes(q)) sc = 20;
    if (sc >= 0) {
      if (S.favorites.includes(f.id)) sc += 12;
      if (S.recents.includes(f.id)) sc += 6;
      if (f.custom) sc += 4;
      scored.push([sc, f]);
    }
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].n.length - b[1].n.length);
  return scored.slice(0, limit).map(x => x[1]);
}

/* ---------- logging ---------- */
function scale(food, grams) {
  const k = grams / 100;
  return {
    kcal: +(food.kcal * k).toFixed(1),
    p: +(food.p * k).toFixed(1),
    c: +(food.c * k).toFixed(1),
    f: +(food.f * k).toFixed(1),
    fib: +((food.fib || 0) * k).toFixed(1),
  };
}
function addEntry(iso, food, grams, meal) {
  const m = scale(food, grams);
  const e = { eid: uid(), foodId: food.id, name: food.n, grams: +grams, meal, ts: Date.now(), ...m };
  day(iso).entries.push(e);
  S.recents = [food.id, ...S.recents.filter(x => x !== food.id)].slice(0, 30);
  bumpStreak(iso);
  save();
  return e;
}
function addRawEntry(iso, obj, meal) {
  const e = { eid: uid(), foodId: obj.foodId || null, name: obj.name, grams: obj.grams || 0, meal,
              ts: Date.now(), kcal: +obj.kcal || 0, p: +obj.p || 0, c: +obj.c || 0, f: +obj.f || 0, fib: +obj.fib || 0 };
  day(iso).entries.push(e); bumpStreak(iso); save(); return e;
}
function removeEntry(iso, eid) {
  const d = day(iso); d.entries = d.entries.filter(e => e.eid !== eid); save();
}
function updateEntryGrams(iso, eid, grams) {
  const e = day(iso).entries.find(x => x.eid === eid); if (!e) return;
  const per100 = e.grams > 0
    ? { kcal: e.kcal / e.grams * 100, p: e.p / e.grams * 100, c: e.c / e.grams * 100, f: e.f / e.grams * 100, fib: (e.fib || 0) / e.grams * 100 }
    : foodById(e.foodId);
  if (!per100) return;
  Object.assign(e, scale(per100, grams), { grams: +grams });
  save();
}
function saveCustomFood(f) {
  f.id ||= 'c_' + uid(); f.custom = true;
  const i = S.custom.findIndex(x => x.id === f.id);
  if (i >= 0) S.custom[i] = f; else S.custom.unshift(f);
  save(); return f;
}
function toggleFav(id) {
  S.favorites = S.favorites.includes(id) ? S.favorites.filter(x => x !== id) : [id, ...S.favorites];
  save();
}
function bumpStreak(iso) {
  const st = S.streak;
  if (st.last === iso) return;
  const y = todayISO(new Date(new Date(iso + 'T12:00:00') - 864e5));
  st.count = st.last === y ? st.count + 1 : 1;
  st.last = iso;
}

/* ---------- history helpers ---------- */
function lastNDays(n, endISO = todayISO()) {
  const out = [], end = new Date(endISO + 'T12:00:00');
  for (let i = n - 1; i >= 0; i--) out.push(todayISO(new Date(end - i * 864e5)));
  return out;
}
function daySummary(iso) {
  const t = totals(iso), tg = targetsFor(iso);
  return { iso, ...t, target: tg, logged: day(iso).entries.length > 0, diff: Math.round(t.kcal - tg.kcal) };
}
function weeklyAvg(days) {
  const rows = days.map(daySummary).filter(r => r.logged);
  if (!rows.length) return null;
  const sum = k => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  return { n: rows.length, kcal: Math.round(sum('kcal')), p: Math.round(sum('p')),
           c: Math.round(sum('c')), f: Math.round(sum('f')), fib: Math.round(sum('fib')),
           targetKcal: Math.round(rows.reduce((a, r) => a + r.target.kcal, 0) / rows.length) };
}

/* ---------- body log ---------- */
function addBody(rec) {
  rec.date ||= todayISO();
  const i = S.body.findIndex(b => b.date === rec.date);
  if (i >= 0) Object.assign(S.body[i], rec); else S.body.push(rec);
  S.body.sort((a, b) => a.date.localeCompare(b.date));
  const w = [...S.body].reverse().find(b => b.weightKg);
  if (w) S.profile.weightKg = w.weightKg;
  save();
}
// Trailing average kills day-to-day water/food weight noise. The trend is the truth.
function weightTrend(n = 7) {
  const pts = S.body.filter(b => b.weightKg).slice(-n * 3);
  if (pts.length < 2) return null;
  const avgOf = arr => arr.reduce((a, b) => a + b.weightKg, 0) / arr.length;
  const recent = pts.slice(-n), prior = pts.slice(-n * 2, -n);
  if (!prior.length) return { recent: +avgOf(recent).toFixed(2), change: null };
  const change = avgOf(recent) - avgOf(prior);
  const days = (new Date(recent.at(-1).date) - new Date(prior[0].date)) / 864e5 || n;
  return { recent: +avgOf(recent).toFixed(2), change: +change.toFixed(2),
           perWeek: +(change / days * 7).toFixed(2) };
}

/* ---------- export / import ---------- */
function exportJSON() {
  return JSON.stringify({ app: 'lean', v: 1, exported: new Date().toISOString(), state: S }, null, 2);
}
function importJSON(txt) {
  const o = JSON.parse(txt);
  if (!o.state) throw new Error('Not a Lean backup file');
  S = deepMerge(structuredClone(DEFAULT_STATE), o.state);
  localStorage.setItem(KEY, JSON.stringify(S));
  return true;
}
