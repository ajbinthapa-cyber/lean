/* ============================================================
   LEAN — training
   Your split, an exercise library for it, and progressive-overload
   tracking (the only thing that actually builds muscle in a deficit).
   ============================================================ */

const EXERCISES = {
  'Legs + Shoulders': [
    'Barbell Squat','Leg Press','Romanian Deadlift','Walking Lunge','Leg Extension','Leg Curl','Standing Calf Raise',
    'Overhead Press','Dumbbell Shoulder Press','Lateral Raise','Cable Lateral Raise','Rear Delt Fly','Face Pull','Upright Row',
  ],
  'Chest + Triceps': [
    'Flat Barbell Bench Press','Incline Dumbbell Press','Flat Dumbbell Press','Incline Barbell Press','Machine Chest Press',
    'Cable Fly','Pec Deck','Push-Up','Dips',
    'Triceps Rope Pushdown','Overhead Cable Extension','Skull Crusher','Close-Grip Bench Press',
  ],
  'Back + Biceps': [
    'Deadlift','Pull-Up','Lat Pulldown','Barbell Row','Dumbbell Row','Seated Cable Row','Chest-Supported Row',
    'Straight-Arm Pulldown','Shrug',
    'Barbell Curl','Dumbbell Curl','Incline Dumbbell Curl','Hammer Curl','Preacher Curl','Cable Curl',
  ],
  'Back+Bi / Chest+Tri': [
    'Pull-Up','Lat Pulldown','Barbell Row','Seated Cable Row','Dumbbell Row','Barbell Curl','Hammer Curl','Incline Dumbbell Curl',
    'Incline Dumbbell Press','Flat Barbell Bench Press','Cable Fly','Dips','Triceps Rope Pushdown','Overhead Cable Extension',
  ],
  'Core & Conditioning': ['Hanging Leg Raise','Cable Crunch','Plank','Ab Wheel','Russian Twist','Incline Walk','Running','Cycling','Rowing Machine'],
};

const Train = (() => {

  function planFor(iso) {
    const dow = new Date(iso + 'T12:00:00').getDay();
    return state().split[dow] || { name: 'Rest', type: 'rest' };
  }
  function get(iso) {
    const w = state().workouts[iso];
    if (w) { w.exercises ||= []; return w; }
    return null;
  }
  function ensure(iso) {
    const S = state();
    if (!S.workouts[iso]) S.workouts[iso] = { name: planFor(iso).name, exercises: [], cardio: null, note: '' };
    S.workouts[iso].exercises ||= [];
    return S.workouts[iso];
  }
  function addExercise(iso, name) {
    const w = ensure(iso);
    if (!w.exercises.find(e => e.name === name)) w.exercises.push({ name, sets: [] });
    save(); return w;
  }
  function addSet(iso, name, weight, reps) {
    const w = ensure(iso);
    let ex = w.exercises.find(e => e.name === name);
    if (!ex) { ex = { name, sets: [] }; w.exercises.push(ex); }
    ex.sets.push({ w: +weight || 0, r: +reps || 0 });
    save(); return ex;
  }
  function removeSet(iso, name, i) {
    const ex = (get(iso) || { exercises: [] }).exercises.find(e => e.name === name);
    if (ex) { ex.sets.splice(i, 1); if (!ex.sets.length) {
      const w = get(iso); w.exercises = w.exercises.filter(e => e.name !== name); } save(); }
  }
  function removeExercise(iso, name) {
    const w = get(iso); if (!w) return;
    w.exercises = w.exercises.filter(e => e.name !== name); save();
  }

  const volume = ex => ex.sets.reduce((a, s) => a + s.w * s.r, 0);
  const best   = ex => ex.sets.reduce((b, s) => (s.w > (b?.w ?? -1) ? s : b), null);

  // Estimated 1RM (Epley). Lets you compare 60x8 against 70x5 honestly.
  const e1rm = s => s.r > 0 ? s.w * (1 + s.r / 30) : 0;
  function bestE1RM(ex) { return Math.max(0, ...ex.sets.map(e1rm)); }

  /* Find the last time you did this lift, so you know what to beat. */
  function lastTime(name, beforeISO) {
    const S = state();
    const dates = Object.keys(S.workouts).filter(d => d < beforeISO).sort().reverse();
    for (const d of dates) {
      const ex = (S.workouts[d].exercises || []).find(e => e.name === name && e.sets.length);
      if (ex) return { date: d, ex, volume: volume(ex), best: best(ex), e1rm: bestE1RM(ex) };
    }
    return null;
  }

  function overloadHint(name, iso) {
    const prev = lastTime(name, iso);
    if (!prev) return { text: 'First time logging this. Whatever you do today becomes the number to beat.', level: 'info' };
    const b = prev.best;
    const target = b.r >= 12
      ? `${(b.w + 2.5).toFixed(1)} kg × 8` // reps got high — add load, reset reps
      : `${b.w} kg × ${b.r + 1}`;
    return {
      text: `Last time (${fmtShort(prev.date)}): ${b.w} kg × ${b.r}. Beat it with ${target}.`,
      level: 'info', prev,
    };
  }

  /* Weekly hard sets per muscle — the main driver of growth.
     10–20 sets/muscle/week is the evidence-backed range. */
  const MUSCLE = [
    [/squat|leg press|lunge|leg extension|hack/i, 'Quads'],
    [/romanian|leg curl|hamstring|good morning/i, 'Hamstrings'],
    [/calf/i, 'Calves'],
    [/deadlift/i, 'Back'],
    [/press|push-up|dip|fly|pec/i, 'Chest'],
    [/overhead press|shoulder press|lateral|upright/i, 'Shoulders'],
    [/rear delt|face pull/i, 'Rear delts'],
    [/pull-up|pulldown|row|shrug|pullover|straight-arm/i, 'Back'],
    [/curl/i, 'Biceps'],
    [/triceps|skull|pushdown|close-grip/i, 'Triceps'],
    [/crunch|plank|leg raise|ab |twist/i, 'Core'],
  ];
  function muscleOf(name) {
    if (/overhead press|shoulder press|lateral|upright/i.test(name)) return 'Shoulders';
    if (/close-grip|skull|pushdown|triceps/i.test(name)) return 'Triceps';
    for (const [re, m] of MUSCLE) if (re.test(name)) return m;
    return 'Other';
  }
  function weeklySets(days) {
    const m = {};
    for (const iso of days) for (const ex of (state().workouts[iso]?.exercises || []))
      m[muscleOf(ex.name)] = (m[muscleOf(ex.name)] || 0) + ex.sets.length;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }

  function progressSeries(name, n = 12) {
    const S = state();
    return Object.keys(S.workouts).sort().map(d => {
      const ex = (S.workouts[d].exercises || []).find(e => e.name === name && e.sets.length);
      return ex ? { date: d, e1rm: +bestE1RM(ex).toFixed(1), vol: volume(ex), best: best(ex) } : null;
    }).filter(Boolean).slice(-n);
  }
  function allLoggedExercises() {
    const s = new Set();
    for (const d in state().workouts) for (const ex of (state().workouts[d].exercises || [])) s.add(ex.name);
    return [...s].sort();
  }

  return { planFor, get, ensure, addExercise, addSet, removeSet, removeExercise,
           volume, best, bestE1RM, lastTime, overloadHint, weeklySets, progressSeries,
           allLoggedExercises, muscleOf, EXERCISES };
})();
