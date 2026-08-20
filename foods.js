/* ============================================================
   LEAN — Built-in food database
   All values PER 100 g (or per 100 ml for liquids).
   Sources: USDA FoodData Central, IFCT 2017 (Indian Food
   Composition Tables), Nepal DFTQC food tables, brand labels.
   These are good averages — you can edit any of them in the app,
   and anything you edit is saved as your own custom version.
   ============================================================ */

// cat: grain | dal | dairy | protein | nut | veg | fruit | fat | dish | drink | sweet | packaged
const FOODS = [

/* ---------- GRAINS & STAPLES ---------- */
{id:'rice_white_cooked', n:'Rice, white, cooked', cat:'grain', kcal:130, p:2.7, c:28.2, f:0.3, fib:0.4, serv:[{l:'1 cup',g:158},{l:'1 small bowl',g:120},{l:'1 plate (bhat)',g:250}]},
{id:'rice_white_raw', dry:true, n:'Rice, white, raw/uncooked', cat:'grain', kcal:360, p:6.8, c:79.3, f:0.6, fib:1.3, serv:[{l:'1 cup',g:185}]},
{id:'rice_basmati_cooked', n:'Basmati rice, cooked', cat:'grain', kcal:121, p:3.5, c:25.2, f:0.4, fib:0.7, serv:[{l:'1 cup',g:158}]},
{id:'rice_brown_cooked', n:'Brown rice, cooked', cat:'grain', kcal:123, p:2.7, c:25.6, f:1.0, fib:1.6, serv:[{l:'1 cup',g:195}]},
{id:'roti', n:'Roti / Chapati (whole wheat, no oil)', cat:'grain', kcal:260, p:7.8, c:51.0, f:2.8, fib:4.5, serv:[{l:'1 medium roti',g:40},{l:'1 large roti',g:55}]},
{id:'roti_ghee', n:'Roti with ghee/oil', cat:'grain', kcal:320, p:7.5, c:48.0, f:10.5, fib:4.3, serv:[{l:'1 medium roti',g:45}]},
{id:'paratha', n:'Paratha, plain', cat:'grain', kcal:330, p:6.5, c:45.0, f:14.0, fib:4.0, serv:[{l:'1 paratha',g:70}]},
{id:'atta', dry:true, n:'Atta / whole wheat flour, raw', cat:'grain', kcal:340, p:12.0, c:72.0, f:1.7, fib:11.0, serv:[{l:'1 cup',g:120}]},
{id:'maida', dry:true, n:'Maida / refined flour, raw', cat:'grain', kcal:364, p:10.3, c:76.3, f:1.0, fib:2.7},
{id:'sel_roti', n:'Sel roti', cat:'grain', kcal:385, p:5.0, c:60.0, f:14.0, fib:1.2, serv:[{l:'1 piece',g:60}]},
{id:'chiura', n:'Chiura / Poha (beaten rice), dry', cat:'grain', kcal:346, p:6.6, c:77.3, f:1.2, fib:2.4, serv:[{l:'1 cup',g:50}]},
{id:'dhido', n:'Dhido (millet/buckwheat), cooked', cat:'grain', kcal:119, p:3.5, c:24.0, f:0.9, fib:3.0},
{id:'bread_white', n:'Bread, white', cat:'grain', kcal:265, p:9.0, c:49.0, f:3.2, fib:2.7, serv:[{l:'1 slice',g:28}]},
{id:'bread_brown', n:'Bread, brown / whole wheat', cat:'grain', kcal:247, p:13.0, c:41.0, f:3.4, fib:7.0, serv:[{l:'1 slice',g:32}]},
{id:'oats', n:'Oats, rolled, dry', cat:'grain', kcal:389, p:16.9, c:66.3, f:6.9, fib:10.6, serv:[{l:'1/2 cup',g:40},{l:'1 cup',g:80}]},
{id:'muesli', n:'Muesli (fruit & nut)', cat:'grain', kcal:380, p:10.0, c:66.0, f:8.0, fib:8.0, serv:[{l:'1/2 cup',g:45}]},
{id:'suji', dry:true, n:'Suji / Rava / Semolina, dry', cat:'grain', kcal:360, p:12.7, c:73.0, f:1.0, fib:3.9},
{id:'quinoa_cooked', n:'Quinoa, cooked', cat:'grain', kcal:120, p:4.4, c:21.3, f:1.9, fib:2.8},
{id:'pasta_cooked', n:'Pasta, cooked', cat:'grain', kcal:158, p:5.8, c:30.9, f:0.9, fib:1.8},
{id:'wai_wai', dry:true, n:'Instant noodles (Wai Wai / Maggi), dry', cat:'packaged', kcal:450, p:9.0, c:60.0, f:20.0, fib:2.5, serv:[{l:'1 packet',g:75}]},
{id:'corn_flakes', dry:true, n:'Corn flakes', cat:'grain', kcal:378, p:7.5, c:84.0, f:0.9, fib:3.0},

/* ---------- DALS, LEGUMES & PLANT PROTEIN ---------- */
{id:'dal_cooked_plain', n:'Dal, cooked plain (thin, no tadka)', cat:'dal', kcal:80, p:5.5, c:12.0, f:0.8, fib:3.0, serv:[{l:'1 bowl',g:200},{l:'1 katori',g:150}]},
{id:'dal_tadka', n:'Dal, cooked with tadka (jhaneko)', cat:'dal', kcal:118, p:5.5, c:12.0, f:5.0, fib:3.0, serv:[{l:'1 bowl',g:200},{l:'1 katori',g:150}]},
{id:'masoor_raw', dry:true, n:'Masoor dal (red lentil), raw', cat:'dal', kcal:352, p:25.0, c:60.0, f:1.1, fib:31.0, serv:[{l:'1/4 cup',g:48}]},
{id:'moong_raw', dry:true, n:'Moong dal, raw', cat:'dal', kcal:347, p:24.0, c:63.0, f:1.2, fib:16.3, serv:[{l:'1/4 cup',g:50}]},
{id:'chana_dal_raw', dry:true, n:'Chana dal, raw', cat:'dal', kcal:364, p:22.0, c:61.0, f:6.0, fib:16.0},
{id:'toor_raw', dry:true, n:'Toor / Arhar dal, raw', cat:'dal', kcal:343, p:22.0, c:63.0, f:1.5, fib:15.0},
{id:'rajma_cooked', n:'Rajma (kidney beans), cooked', cat:'dal', kcal:127, p:8.7, c:22.8, f:0.5, fib:6.4, serv:[{l:'1 bowl',g:180}]},
{id:'chana_boiled', n:'Chana / Chickpeas, boiled', cat:'dal', kcal:164, p:8.9, c:27.4, f:2.6, fib:7.6, serv:[{l:'1 bowl',g:160}]},
{id:'kala_chana', n:'Kala chana, boiled', cat:'dal', kcal:164, p:9.5, c:27.0, f:2.6, fib:8.5, serv:[{l:'1 bowl',g:160}]},
{id:'chana_roasted', n:'Roasted chana (bhuteko chana)', cat:'dal', kcal:387, p:22.0, c:58.0, f:5.5, fib:18.0, serv:[{l:'1 handful',g:30}]},
{id:'soybean_boiled', n:'Soybean, boiled', cat:'protein', kcal:172, p:18.2, c:8.4, f:9.0, fib:6.0, serv:[{l:'1 bowl',g:150}]},
{id:'soya_chunks', dry:true, n:'Soya chunks, dry', cat:'protein', kcal:345, p:52.0, c:33.0, f:0.5, fib:13.0, serv:[{l:'1 handful',g:25}], note:'Fine 2–3x/week. Isoflavones do not lower testosterone at normal intakes, but variety beats dependence.'},
{id:'bhatmas', n:'Bhatmas (fried soybean)', cat:'protein', kcal:450, p:35.0, c:25.0, f:22.0, fib:8.0, serv:[{l:'1 handful',g:30}]},
{id:'sprouts_moong', n:'Moong sprouts, raw', cat:'protein', kcal:30, p:3.0, c:5.9, f:0.2, fib:1.8, serv:[{l:'1 bowl',g:100}]},
{id:'tofu', n:'Tofu, firm', cat:'protein', kcal:144, p:15.8, c:2.8, f:8.7, fib:2.3, serv:[{l:'1 block',g:100}]},
{id:'green_peas', n:'Green peas', cat:'veg', kcal:81, p:5.4, c:14.5, f:0.4, fib:5.7},
{id:'peanuts', n:'Peanuts', cat:'nut', kcal:567, p:25.8, c:16.1, f:49.2, fib:8.5, serv:[{l:'1 handful',g:28}]},

/* ---------- DAIRY ---------- */
{id:'paneer', n:'Paneer, full fat', cat:'dairy', kcal:296, p:18.3, c:6.1, f:22.3, fib:0, serv:[{l:'small cube',g:15},{l:'1 serving',g:100}]},
{id:'paneer_lowfat', n:'Paneer, low fat / malai-less', cat:'dairy', kcal:206, p:22.0, c:4.0, f:11.0, fib:0, serv:[{l:'1 serving',g:100}], note:'Best paneer for a cut — same protein, ~half the fat.'},
{id:'milk_buffalo', n:'Milk, buffalo (full fat)', cat:'dairy', kcal:97, p:3.8, c:5.2, f:6.9, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'milk_cow_full', n:'Milk, cow, full cream', cat:'dairy', kcal:67, p:3.4, c:5.0, f:3.9, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'milk_toned', n:'Milk, toned', cat:'dairy', kcal:58, p:3.2, c:4.8, f:3.0, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'milk_skim', n:'Milk, double toned / skim', cat:'dairy', kcal:35, p:3.3, c:4.8, f:0.5, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'curd', n:'Curd / Dahi, full fat', cat:'dairy', kcal:61, p:3.5, c:4.7, f:3.3, fib:0, serv:[{l:'1 katori',g:150}]},
{id:'curd_lowfat', n:'Curd / Dahi, low fat', cat:'dairy', kcal:45, p:4.5, c:5.0, f:1.0, fib:0, serv:[{l:'1 katori',g:150}]},
{id:'greek_yogurt', n:'Greek yogurt, plain non-fat', cat:'dairy', kcal:59, p:10.0, c:3.6, f:0.4, fib:0, serv:[{l:'1 cup',g:170}]},
{id:'mohi', n:'Mohi / Buttermilk', cat:'dairy', kcal:40, p:3.3, c:4.8, f:0.9, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'lassi_sweet', n:'Lassi, sweet', cat:'dairy', kcal:90, p:2.6, c:15.0, f:2.3, fib:0, serv:[{l:'1 glass',g:250}]},
{id:'cheese_slice', n:'Cheese, processed slice', cat:'dairy', kcal:350, p:25.0, c:1.3, f:28.0, fib:0, serv:[{l:'1 slice',g:20}]},
{id:'chhurpi', n:'Chhurpi, hard (dried yak cheese)', cat:'dairy', kcal:380, p:60.0, c:10.0, f:8.0, fib:0, serv:[{l:'1 piece',g:20}]},
{id:'khoya', n:'Khoya / Mawa', cat:'dairy', kcal:421, p:14.6, c:25.0, f:31.0, fib:0},
{id:'ghee', n:'Ghee', cat:'fat', kcal:900, p:0, c:0, f:100, fib:0, serv:[{l:'1 tsp',g:5},{l:'1 tbsp',g:14}]},
{id:'butter', n:'Butter', cat:'fat', kcal:717, p:0.9, c:0.1, f:81.0, fib:0, serv:[{l:'1 tsp',g:5}]},
{id:'malai', n:'Malai / Cream', cat:'fat', kcal:340, p:2.1, c:3.0, f:35.0, fib:0},

/* ---------- SUPPLEMENTS ---------- */
{id:'whey_conc', n:'Whey protein concentrate (generic)', cat:'protein', kcal:400, p:75.0, c:10.0, f:7.0, fib:0, serv:[{l:'1 scoop',g:32}], note:'Check YOUR tub label — brands vary a lot. Edit this entry to match.'},
{id:'whey_iso', n:'Whey protein isolate (generic)', cat:'protein', kcal:373, p:87.0, c:3.5, f:1.5, fib:0, serv:[{l:'1 scoop',g:30}]},
{id:'creatine', n:'Creatine monohydrate', cat:'protein', kcal:0, p:0, c:0, f:0, fib:0, serv:[{l:'1 scoop',g:5}], note:'0 calories. Safest, most proven supplement for your goal. 5 g daily, any time.'},

/* ---------- NUTS & SEEDS ---------- */
{id:'almonds', n:'Almonds', cat:'nut', kcal:579, p:21.2, c:21.6, f:49.9, fib:12.5, serv:[{l:'10 almonds',g:12},{l:'1 handful',g:28}]},
{id:'walnuts', n:'Walnuts', cat:'nut', kcal:654, p:15.2, c:13.7, f:65.2, fib:6.7, serv:[{l:'4 halves',g:12},{l:'1 handful',g:28}]},
{id:'cashews', n:'Cashews', cat:'nut', kcal:553, p:18.2, c:30.2, f:43.8, fib:3.3, serv:[{l:'1 handful',g:28}]},
{id:'pumpkin_seeds', n:'Pumpkin seeds', cat:'nut', kcal:559, p:30.2, c:10.7, f:49.0, fib:6.0, serv:[{l:'1 tbsp',g:10}]},
{id:'chia', n:'Chia seeds', cat:'nut', kcal:486, p:16.5, c:42.1, f:30.7, fib:34.4, serv:[{l:'1 tbsp',g:12}]},
{id:'flax', n:'Flax seeds', cat:'nut', kcal:534, p:18.3, c:28.9, f:42.2, fib:27.3, serv:[{l:'1 tbsp',g:10}]},
{id:'sunflower_seeds', n:'Sunflower seeds', cat:'nut', kcal:584, p:20.8, c:20.0, f:51.5, fib:8.6, serv:[{l:'1 tbsp',g:9}]},
{id:'pistachio', n:'Pistachios', cat:'nut', kcal:560, p:20.2, c:27.2, f:45.3, fib:10.6, serv:[{l:'1 handful',g:28}]},
{id:'peanut_butter', n:'Peanut butter', cat:'nut', kcal:588, p:25.1, c:20.0, f:50.4, fib:6.0, serv:[{l:'1 tbsp',g:16}]},
{id:'raisins', n:'Raisins / Kishmish', cat:'fruit', kcal:299, p:3.1, c:79.2, f:0.5, fib:3.7, serv:[{l:'1 tbsp',g:15}]},
{id:'dates', n:'Dates / Chhuhara', cat:'fruit', kcal:277, p:1.8, c:75.0, f:0.2, fib:6.7, serv:[{l:'1 date',g:8}]},

/* ---------- VEGETABLES ---------- */
{id:'potato_boiled', n:'Potato, boiled', cat:'veg', kcal:87, p:1.9, c:20.1, f:0.1, fib:1.8, serv:[{l:'1 medium',g:150}]},
{id:'aloo_sabzi', n:'Aloo sabzi (with oil)', cat:'dish', kcal:130, p:2.2, c:18.0, f:5.5, fib:2.0, serv:[{l:'1 katori',g:150}]},
{id:'cauliflower', n:'Cauliflower, cooked', cat:'veg', kcal:25, p:1.9, c:5.0, f:0.3, fib:2.3},
{id:'cabbage', n:'Cabbage, raw', cat:'veg', kcal:25, p:1.3, c:5.8, f:0.1, fib:2.5},
{id:'spinach', n:'Spinach / Palak, raw', cat:'veg', kcal:23, p:2.9, c:3.6, f:0.4, fib:2.2},
{id:'saag', n:'Saag (greens cooked with oil)', cat:'dish', kcal:70, p:3.0, c:5.0, f:4.5, fib:3.0, serv:[{l:'1 katori',g:150}]},
{id:'gundruk', n:'Gundruk soup', cat:'dish', kcal:30, p:2.0, c:4.0, f:0.6, fib:2.5, serv:[{l:'1 bowl',g:200}]},
{id:'bhindi', n:'Bhindi / Okra sabzi', cat:'dish', kcal:90, p:2.0, c:8.0, f:5.5, fib:3.2, serv:[{l:'1 katori',g:150}]},
{id:'baingan', n:'Baingan / Brinjal, raw', cat:'veg', kcal:25, p:1.0, c:5.9, f:0.2, fib:3.0},
{id:'karela', n:'Karela / Bitter gourd', cat:'veg', kcal:17, p:1.0, c:3.7, f:0.2, fib:2.8},
{id:'lauki', n:'Lauki / Bottle gourd', cat:'veg', kcal:14, p:0.6, c:3.4, f:0.02, fib:0.5},
{id:'tomato', n:'Tomato', cat:'veg', kcal:18, p:0.9, c:3.9, f:0.2, fib:1.2},
{id:'onion', n:'Onion', cat:'veg', kcal:40, p:1.1, c:9.3, f:0.1, fib:1.7},
{id:'cucumber', n:'Cucumber', cat:'veg', kcal:15, p:0.7, c:3.6, f:0.1, fib:0.5},
{id:'carrot', n:'Carrot', cat:'veg', kcal:41, p:0.9, c:9.6, f:0.2, fib:2.8},
{id:'mushroom', n:'Mushroom', cat:'veg', kcal:22, p:3.1, c:3.3, f:0.3, fib:1.0},
{id:'broccoli', n:'Broccoli', cat:'veg', kcal:34, p:2.8, c:6.6, f:0.4, fib:2.6},
{id:'beans_green', n:'Green beans', cat:'veg', kcal:31, p:1.8, c:7.0, f:0.1, fib:3.4},
{id:'pumpkin', n:'Pumpkin / Farsi', cat:'veg', kcal:26, p:1.0, c:6.5, f:0.1, fib:0.5},
{id:'radish', n:'Radish / Mula', cat:'veg', kcal:16, p:0.7, c:3.4, f:0.1, fib:1.6},
{id:'mixed_sabzi', n:'Mixed veg sabzi / tarkari (with oil)', cat:'dish', kcal:95, p:2.5, c:10.0, f:5.0, fib:3.0, serv:[{l:'1 katori',g:150}]},
{id:'salad_plain', n:'Salad, plain (no dressing)', cat:'veg', kcal:20, p:1.0, c:4.0, f:0.2, fib:1.5, serv:[{l:'1 plate',g:150}]},

/* ---------- FRUITS ---------- */
{id:'banana', n:'Banana', cat:'fruit', kcal:89, p:1.1, c:22.8, f:0.3, fib:2.6, serv:[{l:'1 medium',g:118}]},
{id:'apple', n:'Apple', cat:'fruit', kcal:52, p:0.3, c:13.8, f:0.2, fib:2.4, serv:[{l:'1 medium',g:180}]},
{id:'orange', n:'Orange', cat:'fruit', kcal:47, p:0.9, c:11.8, f:0.1, fib:2.4, serv:[{l:'1 medium',g:140}]},
{id:'papaya', n:'Papaya', cat:'fruit', kcal:43, p:0.5, c:10.8, f:0.3, fib:1.7, serv:[{l:'1 bowl',g:150}]},
{id:'mango', n:'Mango', cat:'fruit', kcal:60, p:0.8, c:15.0, f:0.4, fib:1.6, serv:[{l:'1 medium',g:200}]},
{id:'guava', n:'Guava / Amba', cat:'fruit', kcal:68, p:2.6, c:14.3, f:1.0, fib:5.4, serv:[{l:'1 medium',g:110}]},
{id:'watermelon', n:'Watermelon', cat:'fruit', kcal:30, p:0.6, c:7.6, f:0.2, fib:0.4},
{id:'grapes', n:'Grapes', cat:'fruit', kcal:69, p:0.7, c:18.1, f:0.2, fib:0.9},
{id:'pomegranate', n:'Pomegranate', cat:'fruit', kcal:83, p:1.7, c:18.7, f:1.2, fib:4.0},
{id:'pear', n:'Pear', cat:'fruit', kcal:57, p:0.4, c:15.2, f:0.1, fib:3.1},

/* ---------- OILS & FATS ---------- */
{id:'oil_mustard', n:'Mustard oil', cat:'fat', kcal:884, p:0, c:0, f:100, fib:0, serv:[{l:'1 tsp',g:5},{l:'1 tbsp',g:14}]},
{id:'oil_sunflower', n:'Sunflower / vegetable oil', cat:'fat', kcal:884, p:0, c:0, f:100, fib:0, serv:[{l:'1 tsp',g:5},{l:'1 tbsp',g:14}]},
{id:'oil_olive', n:'Olive oil', cat:'fat', kcal:884, p:0, c:0, f:100, fib:0, serv:[{l:'1 tsp',g:5}]},
{id:'coconut_oil', n:'Coconut oil', cat:'fat', kcal:862, p:0, c:0, f:100, fib:0, serv:[{l:'1 tsp',g:5}]},

/* ---------- COOKED DISHES ---------- */
{id:'momo_veg', n:'Veg momo (steamed)', cat:'dish', kcal:175, p:5.0, c:25.0, f:5.5, fib:1.8, serv:[{l:'1 piece',g:22},{l:'1 plate (10 pc)',g:220}]},
{id:'momo_paneer', n:'Paneer momo (steamed)', cat:'dish', kcal:210, p:8.5, c:22.0, f:9.5, fib:1.5, serv:[{l:'1 piece',g:25},{l:'1 plate (10 pc)',g:250}]},
{id:'chowmein_veg', n:'Veg chowmein', cat:'dish', kcal:190, p:5.0, c:28.0, f:6.5, fib:2.0, serv:[{l:'1 plate',g:300}]},
{id:'samosa', n:'Samosa', cat:'dish', kcal:308, p:5.0, c:32.0, f:18.0, fib:2.5, serv:[{l:'1 piece',g:60}]},
{id:'pakoda', n:'Pakoda / Bhaji', cat:'dish', kcal:315, p:7.0, c:28.0, f:19.0, fib:3.0, serv:[{l:'1 piece',g:30}]},
{id:'puri', n:'Puri', cat:'dish', kcal:380, p:6.0, c:45.0, f:19.0, fib:2.5, serv:[{l:'1 puri',g:25}]},
{id:'idli', n:'Idli', cat:'dish', kcal:133, p:4.5, c:25.0, f:0.7, fib:1.2, serv:[{l:'1 idli',g:40}]},
{id:'dosa', n:'Dosa, plain', cat:'dish', kcal:168, p:4.0, c:28.0, f:4.5, fib:1.5, serv:[{l:'1 dosa',g:100}]},
{id:'upma', n:'Upma', cat:'dish', kcal:160, p:3.5, c:24.0, f:5.5, fib:2.0, serv:[{l:'1 bowl',g:200}]},
{id:'poha_cooked', n:'Poha, cooked', cat:'dish', kcal:130, p:2.6, c:24.0, f:3.0, fib:1.5, serv:[{l:'1 bowl',g:200}]},
{id:'khichdi', n:'Khichdi', cat:'dish', kcal:120, p:4.5, c:19.0, f:2.8, fib:2.0, serv:[{l:'1 bowl',g:250}]},
{id:'paneer_butter_masala', n:'Paneer butter masala', cat:'dish', kcal:265, p:9.0, c:10.0, f:21.0, fib:1.5, serv:[{l:'1 katori',g:150}]},
{id:'palak_paneer', n:'Palak paneer', cat:'dish', kcal:180, p:8.0, c:7.0, f:13.0, fib:2.5, serv:[{l:'1 katori',g:150}]},
{id:'shahi_paneer', n:'Shahi paneer', cat:'dish', kcal:280, p:8.5, c:12.0, f:22.0, fib:1.5, serv:[{l:'1 katori',g:150}]},
{id:'dal_makhani', n:'Dal makhani', cat:'dish', kcal:195, p:7.0, c:15.0, f:12.0, fib:5.0, serv:[{l:'1 katori',g:150}]},
{id:'chole', n:'Chole / Chana masala', cat:'dish', kcal:180, p:7.5, c:20.0, f:8.0, fib:6.0, serv:[{l:'1 katori',g:150}]},
{id:'rajma_masala', n:'Rajma masala', cat:'dish', kcal:155, p:7.5, c:19.0, f:5.5, fib:6.0, serv:[{l:'1 katori',g:150}]},
{id:'raita', n:'Raita', cat:'dish', kcal:60, p:2.8, c:5.0, f:3.2, fib:0.5, serv:[{l:'1 katori',g:120}]},
{id:'achar', n:'Achar / Pickle (oil-based)', cat:'dish', kcal:200, p:1.5, c:8.0, f:18.0, fib:2.0, serv:[{l:'1 tsp',g:8}]},
{id:'paneer_bhurji', n:'Paneer bhurji', cat:'dish', kcal:215, p:13.0, c:5.0, f:16.0, fib:1.0, serv:[{l:'1 katori',g:150}]},
{id:'paneer_tikka', n:'Paneer tikka (grilled)', cat:'dish', kcal:230, p:16.0, c:6.0, f:16.0, fib:1.0, serv:[{l:'1 plate',g:150}]},

/* ---------- DRINKS ---------- */
{id:'tea_milk_sugar', n:'Tea with milk & sugar', cat:'drink', kcal:60, p:1.5, c:8.0, f:2.2, fib:0, serv:[{l:'1 cup',g:150}]},
{id:'tea_black', n:'Black tea / coffee, no sugar', cat:'drink', kcal:2, p:0.1, c:0.3, f:0, fib:0, serv:[{l:'1 cup',g:200}]},
{id:'coffee_milk', n:'Coffee with milk & sugar', cat:'drink', kcal:65, p:1.8, c:9.0, f:2.2, fib:0, serv:[{l:'1 cup',g:150}]},
{id:'coke', n:'Coke / Soft drink', cat:'drink', kcal:42, p:0, c:10.6, f:0, fib:0, serv:[{l:'1 can',g:330}]},
{id:'juice_packaged', n:'Packaged fruit juice', cat:'drink', kcal:54, p:0.2, c:13.0, f:0.1, fib:0.1, serv:[{l:'1 glass',g:250}]},
{id:'water', n:'Water', cat:'drink', kcal:0, p:0, c:0, f:0, fib:0, serv:[{l:'1 glass',g:250}]},

/* ---------- SUGAR & SWEETS ---------- */
{id:'sugar', n:'Sugar', cat:'sweet', kcal:387, p:0, c:100, f:0, fib:0, serv:[{l:'1 tsp',g:5}]},
{id:'jaggery', n:'Jaggery / Gud / Sakhar', cat:'sweet', kcal:383, p:0.4, c:98.0, f:0.1, fib:0, serv:[{l:'1 tsp',g:6}]},
{id:'honey', n:'Honey', cat:'sweet', kcal:304, p:0.3, c:82.4, f:0, fib:0, serv:[{l:'1 tsp',g:7}]},
{id:'biscuit_marie', n:'Biscuit, Marie / digestive', cat:'packaged', kcal:416, p:7.0, c:78.0, f:9.0, fib:2.5, serv:[{l:'1 biscuit',g:6}]},
{id:'chips', n:'Potato chips', cat:'packaged', kcal:536, p:7.0, c:53.0, f:34.0, fib:4.4, serv:[{l:'small packet',g:30}]},
{id:'dark_choc', n:'Dark chocolate (70%)', cat:'sweet', kcal:546, p:7.8, c:45.9, f:31.3, fib:11.0, serv:[{l:'1 square',g:10}]},
{id:'milk_choc', n:'Milk chocolate', cat:'sweet', kcal:535, p:7.7, c:59.4, f:29.7, fib:3.4},
{id:'ice_cream', n:'Ice cream, vanilla', cat:'sweet', kcal:207, p:3.5, c:23.6, f:11.0, fib:0.7, serv:[{l:'1 scoop',g:65}]},
{id:'gulab_jamun', n:'Gulab jamun', cat:'sweet', kcal:330, p:4.5, c:45.0, f:15.0, fib:0.5, serv:[{l:'1 piece',g:45}]},
{id:'jalebi', n:'Jalebi', cat:'sweet', kcal:400, p:3.0, c:65.0, f:15.0, fib:0.3, serv:[{l:'1 piece',g:35}]},
{id:'ladoo', n:'Ladoo (besan)', cat:'sweet', kcal:420, p:7.0, c:52.0, f:20.0, fib:2.5, serv:[{l:'1 piece',g:40}]},
];

/* Composite "plate" shortcuts — one tap logs a whole typical meal.
   Every one is fully editable after you add it. */
const COMBOS = [
  {id:'combo_dalbhat', n:'Dal Bhat Tarkari (standard plate)', items:[
    {id:'rice_white_cooked', g:250},{id:'dal_tadka', g:180},{id:'mixed_sabzi', g:120},{id:'achar', g:10}]},
  {id:'combo_dalbhat_light', n:'Dal Bhat (cut version — less rice, more dal)', items:[
    {id:'rice_white_cooked', g:150},{id:'dal_tadka', g:220},{id:'mixed_sabzi', g:150},{id:'salad_plain', g:100},{id:'curd_lowfat', g:150}]},
  {id:'combo_oats_whey', n:'Oats + Whey + Milk + Seeds', items:[
    {id:'oats', g:50},{id:'whey_conc', g:32},{id:'milk_toned', g:200},{id:'chia', g:10},{id:'almonds', g:12}]},
  {id:'combo_roti_dal', n:'2 Roti + Dal + Sabzi + Curd', items:[
    {id:'roti', g:80},{id:'dal_tadka', g:180},{id:'mixed_sabzi', g:120},{id:'curd_lowfat', g:150}]},
  {id:'combo_paneer_meal', n:'Paneer bowl + 2 Roti + Salad', items:[
    {id:'paneer_lowfat', g:150},{id:'roti', g:80},{id:'salad_plain', g:150}]},
  {id:'combo_snack_nuts', n:'Nut & seed mix (evening snack)', items:[
    {id:'almonds', g:12},{id:'walnuts', g:12},{id:'pumpkin_seeds', g:10}]},
];

if (typeof window !== 'undefined') { window.FOODS = FOODS; window.COMBOS = COMBOS; }
