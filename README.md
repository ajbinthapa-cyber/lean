# Lean

A personal calorie / macro / training / body tracker, built for one person:
24 M, 70 kg, 170 cm, vegetarian (dairy yes, no egg, no meat), 5 gym days a week,
cutting fat while holding muscle.

Runs as a **home-screen web app on iPhone**. No App Store, no Xcode, no expiry,
no account, no subscription. All data stays on the phone.

---

## Get it on your iPhone

### Option A — permanent, works offline (do this one)

You need a free GitHub account. Ten minutes, once.

The repo is already created and committed — you do **not** need `git init`
or `git commit`. There is exactly one command to run.

1. Create an account at <https://github.com> if you don't have one.
2. Create a new **public** repository called `lean`.
   Leave "Add a README file" **unticked** and .gitignore/licence set to **None**.
3. Copy your GitHub username. Then run this, replacing `bushan123` with it —
   the username must be your real one, not left as-is:

```bash
cd ~/Desktop/lean-app && git remote add origin https://github.com/bushan123/lean.git && git push -u origin main
```

   GitHub will ask you to sign in. If it asks for a *password*, it actually wants a
   **personal access token** — easiest path is to let the browser window it opens
   handle it, or create one at <https://github.com/settings/tokens> with `repo` scope.

4. On GitHub: your repo → **Settings** → **Pages** → Source: **Deploy from a branch**
   → Branch: **main**, folder **/ (root)** → **Save**.
5. Wait ~2 minutes. Your app is at `https://YOUR-USERNAME.github.io/lean/`
6. Open that URL **in Safari on your iPhone** (not Chrome — Chrome on iOS can't
   install home-screen apps properly).
7. Tap the **Share** button (square with an arrow) → scroll down →
   **Add to Home Screen** → **Add**.

### If a command fails

| Message | What it means | Fix |
|---|---|---|
| `remote origin already exists` | You already ran the command once | `git remote remove origin` then run it again |
| `Please tell me who you are` | Git has no name/email | Already set for this repo — you shouldn't see it |
| `Repository not found` | Username typo, or repo not created yet | Check step 2, then `git remote remove origin` and retry |
| `src refspec main does not match any` | Nothing committed | `git add -A && git commit -m "Lean v1"` |

Done. It now behaves like a normal app: own icon, fullscreen, no browser bar,
and it works with no signal.

> Public repo just means the *code* is public. Your food log, weight and photos
> never leave your phone — they are not in the repo and never get uploaded.

### Option B — try it right now, 30 seconds

Your Mac and iPhone on the same Wi-Fi:

```bash
cd ~/Desktop/lean-app && node serve.js
```

Open the `http://192.168.x.x:8899` address it prints, on your iPhone.
Good for a look. Not for daily use — it only works while the Mac is on, and
iOS won't cache it offline over plain HTTP. Also, data saved here does **not**
carry over to Option A, so switch before you start logging for real.

---

## Turn on photo recognition (free)

1. Open <https://aistudio.google.com/apikey> and sign in with Google.
2. **Create API key**. No credit card, no billing setup.
3. In Lean: **⚙︎ → API key** → paste → **Save key** → **Test it**.

Free-tier quota is far above what this app uses. If Google ever changes model
names, Lean asks your key which models it can use and picks one automatically.

Everything except photo recognition works with no key at all: the 143-food
database, barcode lookup, manual entry, all the coaching, all the maths.

---

## What each screen does

| Screen | What it's for |
|---|---|
| **Today** | Calories left, macro bars, your meals, and the coach telling you what to do about it |
| **History** | 7/14/30/90-day averages, where your calories leak, where your protein comes from |
| **Train** | Log sets, see last week's numbers, weekly sets per muscle, estimated 1RM over time |
| **Body** | Weight with a 7-day trend line, waist, chest, arm |
| **Plan** | Your targets, the maths behind them, and why the plan is what it is |

### Four ways to log food
- **📷 Snap a meal** — AI splits the plate into rice / dal / sabzi and estimates each
- **🏷️ Scan a label** — reads any nutrition panel, flags high sugar / fat / palm oil
- **🔍 Search** — 143 Nepali & Indian vegetarian foods, works offline
- **⚡ Quick add** — meal combos, copy yesterday, favourites, or just a calorie number

Typing a weight into the photo screen ("180 g rice") makes the AI use *your*
number instead of guessing. Portion size is the biggest source of error —
that one habit removes most of it.

---

## Your data

Stored in this app on this phone, and nowhere else. No account, no server,
nothing uploaded.

That also means: **clear Safari's data or lose the phone and it's gone.**
Settings → **Export backup** writes a `.json` you can drop in Files or iCloud.
Do it once a month. Import restores everything.

---

## Files

```
index.html              screens
app.css                 styles
js/foods.js             143-food database (edit freely)
js/store.js             state, storage, target maths
js/ai.js                Gemini / OpenAI / Claude vision + Open Food Facts
js/coach.js             the rules that generate advice
js/workouts.js          split, exercise library, progressive overload
js/ui.js                rendering and events
sw.js                   offline cache
serve.js                local test server
gen-icons.js            regenerates the app icons
```

To change a food's numbers: edit `js/foods.js`, or just edit it inside the app —
in-app edits are saved as your own version and survive updates.

---

Calorie and macro targets here are calculated estimates, not medical advice.
Adjust them from what the scale actually does over 2–3 weeks. Talk to a doctor
before big dietary changes if you have any health condition.
