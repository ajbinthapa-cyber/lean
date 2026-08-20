/* ============================================================
   LEAN — the coach
   Rules that look at your actual logged data and say something
   useful. Ordered by priority; the Today screen shows the top few.
   ============================================================ */

const Coach = (() => {

  const pct = (a, b) => b > 0 ? a / b : 0;

  /* ---------- what to eat with the calories you have left ---------- */
  function suggestions(iso) {
    const t = totals(iso), tg = targetsFor(iso);
    const leftK = tg.kcal - t.kcal, leftP = tg.protein - t.p;
    const out = [];
    if (leftK < 60 && leftP < 8) return out;

    // ready-to-eat only — never suggest raw dal or dry soya chunks as "eat this now"
    const pool = allFoods().filter(f => f.kcal > 0 && !f.dry && !['sweet', 'packaged', 'fat', 'drink'].includes(f.cat));
    const dislike = f => /soya chunk|bhatmas/i.test(f.n) ? 0.45 : 1;   // usable, but not a daily staple
    const density = f => (f.p * 4) / f.kcal;      // share of calories that is protein
    const hour = new Date().getHours();

    // Protein gap is the emergency. Fill it with the leanest sources that fit.
    if (leftP > 15) {
      const picks = pool.filter(f => density(f) > 0.28 && f.p >= 8)
        .map(f => {
          const gForP = (leftP / f.p) * 100;
          const grams = Math.min(gForP, leftK > 0 ? (leftK / f.kcal) * 100 : gForP, 300);
          return { f, grams: Math.round(grams / 5) * 5, p: +(f.p * grams / 100).toFixed(0), kcal: Math.round(f.kcal * grams / 100) };
        })
        .filter(x => x.grams >= 15 && x.p >= 6)
        .sort((a, b) => b.p * dislike(b.f) - a.p * dislike(a.f)).slice(0, 4);
      picks.forEach(x => out.push({
        kind: 'protein',
        text: `${x.grams} g ${x.f.n}`,
        sub: `+${x.p} g protein · ${x.kcal} kcal`,
      }));
    }

    if (leftK > 250 && leftP <= 15) {
      const picks = pool.filter(f => ['grain', 'fruit', 'veg', 'dal'].includes(f.cat) && f.kcal > 30)
        .sort((a, b) => (b.fib || 0) - (a.fib || 0)).slice(0, 3)
        .map(f => { const g = Math.min(200, Math.round((leftK * 0.5 / f.kcal) * 100 / 10) * 10);
                    return { kind: 'carbs', text: `${g} g ${f.n}`, sub: `${Math.round(f.kcal * g / 100)} kcal · ${(f.fib * g / 100).toFixed(0)} g fibre` }; });
      out.push(...picks);
    }

    if (leftK < -100) out.push({ kind: 'stop', text: 'You are over for today', sub: 'Water, black tea, or a walk. Tomorrow resets — do not "make up for it" by skipping breakfast.' });
    else if (leftK < 150 && leftP > 20 && hour >= 19) out.push({
      kind: 'protein', text: '30 g whey in water', sub: `~120 kcal, +23 g protein — cheapest way to close a protein gap this late` });
    return out.slice(0, 5);
  }

  /* ---------- insights ---------- */
  function insights(iso) {
    const I = [];
    const t = totals(iso), tg = targetsFor(iso);
    const d = day(iso);
    const hour = iso === todayISO() ? new Date().getHours() : 23;
    const week = lastNDays(7, iso), wk = weeklyAvg(week);
    const loggedDays = week.filter(x => day(x).entries.length).length;

    const add = (level, title, body, tag) => I.push({ level, title, body, tag });

    /* --- protein --- */
    const pLeft = tg.protein - t.p;
    if (hour >= 20 && pLeft > 30)
      add('bad', `${Math.round(pLeft)} g protein short`, `This is the number that decides whether you lose fat or lose muscle. In a deficit, low protein means the weight coming off is partly the muscle you spent 3 months building. Whey in water, or 150 g low-fat paneer, right now.`, 'protein');
    else if (hour >= 20 && pLeft <= 5)
      add('good', 'Protein target hit', `${Math.round(t.p)} g. Do this daily and your lifts keep climbing while the fat comes off.`, 'protein');
    else if (pLeft > 0 && hour >= 14)
      add('info', `${Math.round(pLeft)} g protein to go`, `Priority for the rest of the day. Everything else is negotiable, this isn't.`, 'protein');

    /* --- calories --- */
    const over = t.kcal - tg.kcal;
    if (over > 350)
      add('bad', `${Math.round(over)} kcal over`, `One day over does not undo anything — a week of days over does. Do not skip meals tomorrow to compensate; just hit the number.`, 'kcal');
    else if (over > 120)
      add('warn', `${Math.round(over)} kcal over target`, `Small overshoot. If it repeats 3–4 days a week, your deficit quietly disappears and the scale stalls.`, 'kcal');
    else if (hour >= 20 && t.kcal > 0 && t.kcal < tg.kcal - 500)
      add('warn', `${Math.round(tg.kcal - t.kcal)} kcal under target`, `Under-eating this hard is not faster fat loss — it is how you lose strength, sleep badly and end up bingeing. Eat the food.`, 'kcal');

    /* --- fat / oil --- */
    if (t.f > tg.fat * 1.4 && t.kcal > 600) {
      const oily = d.entries.filter(e => e.f * 9 > e.kcal * 0.45 && e.kcal > 60).sort((a, b) => b.f - a.f).slice(0, 2);
      add('warn', `Fat is ${Math.round(t.f)} g vs ${tg.fat} g target`, `Fat has 9 kcal/g — it is where hidden calories live. Usually cooking oil, ghee, or nuts eaten by the handful.${oily.length ? ' Biggest today: ' + oily.map(e => e.name).join(', ') + '.' : ''} Measure oil with a spoon, not by pouring.`, 'fat');
    }

    /* --- fibre --- */
    if (hour >= 20 && t.kcal > 800 && t.fib < tg.fiber * 0.6)
      add('info', `Fibre low (${Math.round(t.fib)} g of ${tg.fiber} g)`, `Fibre is what makes a deficit survivable — it keeps you full on fewer calories. Add sabzi, salad, a guava, or soak some chia.`, 'fiber');

    /* --- carb quality --- */
    const junk = d.entries.filter(e => { const f = foodById(e.foodId); return f && ['sweet', 'packaged'].includes(f.cat); });
    const junkK = junk.reduce((a, e) => a + e.kcal, 0);
    if (junkK > tg.kcal * 0.18)
      add('warn', `${Math.round(junkK)} kcal from packaged/sweet food`, `That is ${Math.round(pct(junkK, t.kcal) * 100)}% of today. These calories don't fill you up and don't build anything: ${junk.map(e => e.name).slice(0, 3).join(', ')}.`, 'quality');

    /* --- rest-day discipline --- */
    if (tg.dayType === 'rest' && t.kcal > tg.kcal + 200)
      add('warn', 'Rest day, training-day appetite', `Today's target is lower (${tg.kcal} kcal) because you're not training. Rest days are where most people erase their week.`, 'kcal');

    /* --- weekly view --- */
    if (wk && loggedDays >= 4) {
      const wOver = wk.kcal - wk.targetKcal;
      if (Math.abs(wOver) <= 80)
        add('good', 'Weekly average is on target', `${wk.kcal} kcal/day across ${wk.n} logged days. This is the number that actually moves the scale — and yours is right.`, 'week');
      else if (wOver > 80)
        add('bad', `Averaging +${Math.round(wOver)} kcal/day this week`, `That's ~${Math.round(wOver * 7 / 7700 * 1000)} g of fat loss cancelled per week. The fix is boring: measure the oil and the rice.`, 'week');
      else
        add('info', `Averaging ${Math.round(wOver)} kcal/day under`, `Slightly aggressive. Fine short-term, but if energy or lifts drop, eat closer to target.`, 'week');

      if (wk.p < tg.protein * 0.85)
        add('bad', `Weekly protein averaging ${wk.p} g`, `Target is ${tg.protein} g. Below ~85% of target in a deficit is where "skinny fat" stays skinny fat — you lose the weight but the shape doesn't change.`, 'protein');
    }
    if (loggedDays > 0 && loggedDays < 4 && iso === todayISO())
      add('info', `Only ${loggedDays} of 7 days logged`, `Partial logging tells you nothing. The days people skip are the days they'd rather not see.`, 'habit');

    /* --- weight trend vs plan --- */
    const tr = weightTrend(7);
    if (tr && tr.perWeek !== undefined && tr.perWeek !== null) {
      const want = -tg.lossPerWeek;
      if (tr.perWeek > want + 0.35 && tr.perWeek > -0.05)
        add('warn', `Weight trend flat (${tr.perWeek > 0 ? '+' : ''}${tr.perWeek} kg/wk)`, `Expected ~${want.toFixed(2)} kg/wk. Two honest possibilities: portions are bigger than logged, or your maintenance is lower than estimated. Log 5 strict days before changing anything.`, 'weight');
      else if (tr.perWeek < want - 0.4)
        add('warn', `Dropping fast (${tr.perWeek} kg/wk)`, `Above ~0.8 kg/week at your size starts costing muscle. Add ~150 kcal/day of carbs and watch your lifts.`, 'weight');
      else if (tr.change !== null)
        add('good', `Trend weight ${tr.recent} kg (${tr.perWeek > 0 ? '+' : ''}${tr.perWeek} kg/wk)`, `Right in the range that strips fat while your lifts keep going up.`, 'weight');
    }

    /* --- water --- */
    if (hour >= 18 && d.water < tg.water * 0.5)
      add('info', `Water at ${(d.water / 1000).toFixed(1)} L`, `Target ${(tg.water / 1000).toFixed(1)} L. Dehydration reads as hunger and flattens your pumps.`, 'water');

    /* --- training --- */
    if (tg.dayType === 'train' && hour >= 21 && !S_hasWorkout(iso))
      add('info', 'No workout logged today', `Today is ${state().split[new Date(iso + 'T12:00:00').getDay()].name}. If you trained, log it — progressive overload only works if you can see last week's numbers.`, 'train');

    const order = { bad: 0, warn: 1, good: 2, info: 3 };
    return I.sort((a, b) => order[a.level] - order[b.level]);
  }
  function S_hasWorkout(iso) { const w = state().workouts[iso]; return w && w.exercises && w.exercises.length; }

  /* ---------- "what am I eating too much of" ---------- */
  function excesses(days) {
    const bucket = {};
    for (const iso of days) for (const e of day(iso).entries) {
      const f = foodById(e.foodId);
      const cat = f ? f.cat : 'other';
      bucket[cat] ||= { kcal: 0, f: 0, items: {} };
      bucket[cat].kcal += e.kcal; bucket[cat].f += e.f;
      bucket[cat].items[e.name] = (bucket[cat].items[e.name] || 0) + e.kcal;
    }
    const totalK = Object.values(bucket).reduce((a, b) => a + b.kcal, 0) || 1;
    const rows = Object.entries(bucket).map(([cat, v]) => ({
      cat, kcal: Math.round(v.kcal), share: v.kcal / totalK,
      top: Object.entries(v.items).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
    })).sort((a, b) => b.kcal - a.kcal);

    const flags = [];
    const get = c => rows.find(r => r.cat === c) || { share: 0, kcal: 0, top: [] };
    if (get('fat').share > 0.16) flags.push({ t: 'Cooking oil & ghee', b: `${Math.round(get('fat').share * 100)}% of your calories. Aim under 12%. Use a spoon to measure oil into the pan — one "glug" is 2–3 tsp, about 100 kcal.` });
    if (get('sweet').share + get('packaged').share > 0.15) flags.push({ t: 'Sweets & packaged food', b: `${Math.round((get('sweet').share + get('packaged').share) * 100)}% of your calories. Mostly: ${[...get('sweet').top, ...get('packaged').top].slice(0, 3).join(', ')}. Cap these at 10% and the deficit gets much easier.` });
    if (get('grain').share > 0.42) flags.push({ t: 'Rice & roti', b: `${Math.round(get('grain').share * 100)}% of your calories. Not bad food — just a lot of it. Swap 100 g of rice for 150 g of sabzi and you lose 100 kcal without losing volume on the plate.` });
    if (get('nut').share > 0.14) flags.push({ t: 'Nuts & seeds', b: `${Math.round(get('nut').share * 100)}% of your calories. Nuts are excellent and extremely easy to over-eat — 1 handful is ~170 kcal. Weigh them once and you'll never guess again.` });
    return { rows, flags };
  }

  /* ---------- protein sources you're actually using ---------- */
  function proteinSources(days) {
    const m = {};
    for (const iso of days) for (const e of day(iso).entries) {
      if (e.p < 2) continue;
      m[e.name] = (m[e.name] || 0) + e.p;
    }
    const tot = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([n, p]) => ({ n, p: Math.round(p), share: p / tot }));
  }

  return { insights, suggestions, excesses, proteinSources };
})();
