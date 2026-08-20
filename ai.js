/* ============================================================
   LEAN — food intelligence
   Layer 1: Open Food Facts  (free, no key, packaged products)
   Layer 2: Vision AI        (Gemini free tier / OpenAI / Claude)
   Layer 3: built-in DB      (always works, offline, no key)
   ============================================================ */

const AI = (() => {

  /* ---------- Layer 1: Open Food Facts (no key, no cost) ---------- */
  async function barcode(code) {
    code = String(code).replace(/\D/g, '');
    if (code.length < 8) throw new Error('Barcode looks too short');
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments,serving_size,quantity,image_front_small_url`;
    const r = await fetch(url, { headers: { 'User-Agent': 'LeanApp/1.0 (personal use)' } });
    if (!r.ok) throw new Error('Open Food Facts unreachable');
    const j = await r.json();
    if (j.status !== 1 || !j.product) throw new Error('Not in the Open Food Facts database');
    const n = j.product.nutriments || {};
    const g = k => (n[k + '_100g'] ?? n[k] ?? 0);
    const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0);
    if (!kcal) throw new Error('Product found but has no nutrition data');
    return {
      n: [j.product.brands, j.product.product_name].filter(Boolean).join(' — ') || 'Product ' + code,
      kcal: +(+kcal).toFixed(1),
      p: +(+g('proteins')).toFixed(1),
      c: +(+g('carbohydrates')).toFixed(1),
      f: +(+g('fat')).toFixed(1),
      fib: +(+g('fiber')).toFixed(1),
      cat: 'packaged', barcode: code, source: 'Open Food Facts',
      serv: j.product.serving_size ? [{ l: 'label serving', g: parseFloat(j.product.serving_size) || 100 }] : undefined,
    };
  }

  /* ---------- Layer 2: vision ---------- */
  const PROVIDERS = {
    gemini: { label: 'Google Gemini (free tier)', model: 'gemini-2.0-flash', keyUrl: 'https://aistudio.google.com/apikey' },
    openai: { label: 'OpenAI',  model: 'gpt-4o-mini',            keyUrl: 'https://platform.openai.com/api-keys' },
    claude: { label: 'Anthropic Claude', model: 'claude-sonnet-5', keyUrl: 'https://console.anthropic.com/settings/keys' },
  };

  const SYSTEM = `You are a nutrition analyst for a 24-year-old male, 70 kg, 170 cm, in a moderate calorie deficit, training 5x/week.
He eats a VEGETARIAN Nepali/Indian diet: no meat, no eggs, dairy is fine.

Return ONLY a JSON object, no markdown fence, no commentary:
{"items":[{"name":"...","grams":<number>,"kcal":<per 100 g>,"p":<per 100 g>,"c":<per 100 g>,"f":<per 100 g>,"fib":<per 100 g>,"confidence":"high|medium|low","note":"..."}],"summary":"one short sentence"}

CRITICAL RULES:
- kcal/p/c/f/fib are ALWAYS per 100 g of that food. "grams" is your estimate of how much is in the photo.
- If the user gave you a weight, use that weight exactly and do not re-estimate it.
- Split a plate into separate items (rice, dal, sabzi, roti, curd...) — never one blob called "meal".
- Account for cooking oil/ghee you can see (shine, floating oil, fried surfaces). Indian/Nepali home food usually carries 5-15 g oil per serving. Under-counting oil is the single most common logging error.
- Cooked vs raw matters: cooked rice ~130 kcal/100 g, raw rice ~360. Judge from the photo.
- kcal must be within ~10% of (p*4 + c*4 + f*9).
- Never invent meat or eggs.
- Be honest with "confidence". Portion size from a photo is genuinely hard — say "low" when you are guessing.`;

  const LABEL_PROMPT = `This is a packaged food NUTRITION LABEL (possibly Indian/Nepali, possibly in Hindi/Nepali/English).
Read it precisely and return ONLY this JSON, no fence:
{"name":"product name incl. brand if visible","per100":{"kcal":n,"p":n,"c":n,"f":n,"fib":n,"sugar":n,"sodium_mg":n},"servingGrams":n_or_null,"servingsPerPack":n_or_null,"packGrams":n_or_null,"warnings":["..."],"read_confidence":"high|medium|low"}

RULES:
- If the label gives "per serving" only, convert to per 100 g using the serving size and say so in warnings.
- If energy is in kJ, convert: kcal = kJ / 4.184.
- Indian labels often list "Added Sugars" separately — put TOTAL sugars in "sugar".
- warnings: flag anything above ~15 g sugar/100 g, ~20 g fat/100 g, trans fat > 0, palm oil, or "protein" claims that don't hold up.
- If a number is unreadable, use null rather than guessing.`;

  function key()  { return (state().settings.apiKey || '').trim(); }
  function prov() { return state().settings.provider || 'gemini'; }
  function model(){ return (state().settings.model || '').trim() || PROVIDERS[prov()].model; }
  function ready(){ return !!key(); }

  async function callVision(prompt, images, extra = '') {
    if (!ready()) throw new Error('NO_KEY');
    const p = prov();
    const full = prompt + (extra ? `\n\nUSER CONTEXT: ${extra}` : '');
    if (p === 'gemini') return gemini(full, images);
    if (p === 'openai') return openai(full, images);
    return claude(full, images);
  }

  /* Google renames and retires models fairly often, so rather than hard-coding one,
     ask the key which models it can actually use and cache the answer. */
  const GEMINI_FALLBACKS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
  async function geminiPickModel() {
    const s = state().settings;
    if (s.model) return s.model;
    if (s.resolvedModel) return s.resolvedModel;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key())}&pageSize=200`);
      const j = await r.json();
      if (r.ok && Array.isArray(j.models)) {
        const usable = j.models
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''))
          .filter(n => !/embedding|aqa|imagen|veo|tts|image-generation|native-audio|live-/i.test(n));
        // prefer a cheap fast "flash" model, and avoid preview/experimental builds
        const rank = n => (/flash/.test(n) ? 0 : 10) + (/lite/.test(n) ? 1 : 0)
                        + (/preview|exp|thinking/.test(n) ? 5 : 0) + (/1\.5/.test(n) ? 3 : 0);
        usable.sort((a, b) => rank(a) - rank(b));
        if (usable.length) { s.resolvedModel = usable[0]; save(); return usable[0]; }
      }
    } catch (_) { /* offline or blocked — fall through to the static list */ }
    return GEMINI_FALLBACKS[0];
  }

  async function geminiCall(m, prompt, images) {
    const parts = [{ text: prompt }];
    for (const im of images) parts.push({ inline_data: { mime_type: im.mime, data: im.b64 } });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key())}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' },
      }),
    });
    const j = await r.json().catch(() => ({}));
    return { r, j };
  }

  async function gemini(prompt, images) {
    const first = await geminiPickModel();
    const tries = [first, ...GEMINI_FALLBACKS.filter(m => m !== first)];
    let last = null;
    for (const m of tries) {
      const { r, j } = await geminiCall(m, prompt, images);
      if (r.ok) {
        const s = state().settings;
        if (!s.model && s.resolvedModel !== m) { s.resolvedModel = m; save(); }
        const txt = j?.candidates?.[0]?.content?.parts?.map(x => x.text).join('') || '';
        if (!txt) throw new Error('Gemini returned nothing — try a clearer photo');
        return parseJSON(txt);
      }
      last = j?.error?.message || `Gemini error ${r.status}`;
      // only a missing/unsupported model is worth retrying with a different one
      if (!(r.status === 404 || /not found|not supported|unsupported/i.test(last))) break;
    }
    throw new Error(friendly(last || 'Gemini call failed', 0));
  }

  async function openai(prompt, images) {
    const content = [{ type: 'text', text: prompt }];
    for (const im of images) content.push({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.b64}` } });
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key()}` },
      body: JSON.stringify({ model: model(), temperature: 0.2, max_tokens: 2048,
        response_format: { type: 'json_object' }, messages: [{ role: 'user', content }] }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(friendly(j?.error?.message || `OpenAI error ${r.status}`, r.status));
    return parseJSON(j.choices?.[0]?.message?.content || '');
  }

  async function claude(prompt, images) {
    const content = [];
    for (const im of images) content.push({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.b64 } });
    content.push({ type: 'text', text: prompt });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: {
        'Content-Type': 'application/json', 'x-api-key': key(),
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: model(), max_tokens: 2048, temperature: 0.2,
        messages: [{ role: 'user', content }] }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(friendly(j?.error?.message || `Claude error ${r.status}`, r.status));
    return parseJSON(j.content?.map(b => b.text).join('') || '');
  }

  function friendly(msg, status) {
    if (status === 401 || status === 403 || /API key not valid|invalid.*key|unauthorized/i.test(msg))
      return 'Your API key was rejected. Check it in Settings.';
    if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg))
      return 'Free-tier limit hit for now. Wait a minute, or log this one manually.';
    if (/fetch|network|Failed to fetch/i.test(msg))
      return 'No internet. Search the built-in food list instead — it works offline.';
    return msg;
  }

  function parseJSON(txt) {
    txt = txt.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { return JSON.parse(txt); } catch (_) {}
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
    throw new Error('Could not read the AI response — try again');
  }

  /* ---------- public ---------- */
  async function analyseMeal(images, note) {
    const out = await callVision(SYSTEM, images, note);
    const items = (out.items || []).map(normaliseItem).filter(Boolean);
    if (!items.length) throw new Error('No food recognised. Try better light, or log it manually.');
    return { items, summary: out.summary || '' };
  }

  async function analyseLabel(images, note) {
    const out = await callVision(LABEL_PROMPT, images, note);
    const p = out.per100 || {};
    if (!p.kcal) throw new Error('Could not read calories off that label — try a straighter, closer photo.');
    return {
      food: normaliseItem({ name: out.name || 'Packaged food', grams: out.servingGrams || 100,
                            kcal: p.kcal, p: p.p, c: p.c, f: p.f, fib: p.fib, confidence: out.read_confidence }),
      extra: { sugar: p.sugar, sodium: p.sodium_mg, servingGrams: out.servingGrams,
               servingsPerPack: out.servingsPerPack, packGrams: out.packGrams,
               warnings: out.warnings || [], confidence: out.read_confidence },
    };
  }

  // Trust but verify: if the AI's kcal disagrees with its own macros, macros win.
  function normaliseItem(it) {
    if (!it || !it.name) return null;
    const num = v => { const x = parseFloat(v); return Number.isFinite(x) && x >= 0 ? x : 0; };
    const o = { n: String(it.name).slice(0, 80), grams: Math.max(1, Math.round(num(it.grams) || 100)),
                kcal: num(it.kcal), p: num(it.p), c: num(it.c), f: num(it.f), fib: num(it.fib),
                confidence: it.confidence || 'medium', note: it.note || '', cat: 'ai', source: 'AI estimate' };
    const calc = o.p * 4 + o.c * 4 + o.f * 9;
    if (o.kcal <= 0 && calc > 0) o.kcal = +calc.toFixed(1);
    else if (calc > 0 && Math.abs(o.kcal - calc) / o.kcal > 0.28) { o.kcal = +calc.toFixed(1); o.adjusted = true; }
    if (o.kcal > 950) o.kcal = 950; // nothing edible exceeds pure fat
    return o;
  }

  /* ---------- image prep: shrink before upload ---------- */
  async function fileToImage(file, maxDim = 1100, quality = 0.82) {
    const bmp = await createImageBitmap(file).catch(async () => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      URL.revokeObjectURL(url); return img;
    });
    const w = bmp.width, h = bmp.height, sc = Math.min(1, maxDim / Math.max(w, h));
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const dataUrl = cv.toDataURL('image/jpeg', quality);
    return { mime: 'image/jpeg', b64: dataUrl.split(',')[1], dataUrl };
  }

  return { barcode, analyseMeal, analyseLabel, fileToImage, ready, PROVIDERS, normaliseItem };
})();
