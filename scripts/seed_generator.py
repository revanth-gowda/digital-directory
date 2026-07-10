"""Digital Directory seed generator v2 (fictional personas).
Run: python3 seed_generator.py  -> writes ../supabase/seed.sql
v2: profession-matched media pools, varied bios, idempotent re-runs."""
import random, uuid
random.seed(42)

def esc(s): return s.replace("'", "''")

CITIES = {
 'Tokyo': ('Tokyo, Japan', 35.68, 139.69), 'Kyoto': ('Kyoto, Japan', 35.01, 135.77),
 'Seoul': ('Seoul, South Korea', 37.57, 126.98), 'Singapore': ('Singapore', 1.35, 103.82),
 'Bangkok': ('Bangkok, Thailand', 13.76, 100.50), 'Bali': ('Bali, Indonesia', -8.34, 115.09),
 'Mumbai': ('Mumbai, India', 19.08, 72.88), 'Bangalore': ('Bangalore, India', 12.97, 77.59),
 'Dubai': ('Dubai, UAE', 25.20, 55.27), 'Istanbul': ('Istanbul, Turkey', 41.01, 28.98),
 'CapeTown': ('Cape Town, South Africa', -33.92, 18.42), 'Marrakech': ('Marrakech, Morocco', 31.63, -7.99),
 'Nairobi': ('Nairobi, Kenya', -1.29, 36.82), 'London': ('London, UK', 51.51, -0.13),
 'Paris': ('Paris, France', 48.86, 2.35), 'Berlin': ('Berlin, Germany', 52.52, 13.41),
 'Amsterdam': ('Amsterdam, Netherlands', 52.37, 4.90), 'Zurich': ('Zurich, Switzerland', 47.38, 8.54),
 'Lisbon': ('Lisbon, Portugal', 38.72, -9.14), 'Barcelona': ('Barcelona, Spain', 41.39, 2.17),
 'Rome': ('Rome, Italy', 41.90, 12.50), 'Reykjavik': ('Reykjavik, Iceland', 64.15, -21.94),
 'Stockholm': ('Stockholm, Sweden', 59.33, 18.07), 'Prague': ('Prague, Czechia', 50.08, 14.44),
 'Monaco': ('Monte Carlo, Monaco', 43.74, 7.43), 'NewYork': ('New York, USA', 40.71, -74.01),
 'SanFrancisco': ('San Francisco, USA', 37.77, -122.42), 'LosAngeles': ('Los Angeles, USA', 34.05, -118.24),
 'Seattle': ('Seattle, USA', 47.61, -122.33), 'Austin': ('Austin, USA', 30.27, -97.74),
 'Miami': ('Miami, USA', 25.76, -80.19), 'Toronto': ('Toronto, Canada', 43.65, -79.38),
 'Vancouver': ('Vancouver, Canada', 49.28, -123.12), 'MexicoCity': ('Mexico City, Mexico', 19.43, -99.13),
 'RioDeJaneiro': ('Rio de Janeiro, Brazil', -22.91, -43.17), 'BuenosAires': ('Buenos Aires, Argentina', -34.60, -58.38),
 'Lima': ('Lima, Peru', -12.05, -77.04), 'Sydney': ('Sydney, Australia', -33.87, 151.21),
 'Melbourne': ('Melbourne, Australia', -37.81, 144.96), 'Auckland': ('Auckland, New Zealand', -36.85, 174.76),
 'Queenstown': ('Queenstown, New Zealand', -45.03, 168.66), 'Doha': ('Doha, Qatar', 25.29, 51.53),
 'HongKong': ('Hong Kong', 22.32, 114.17), 'Osaka': ('Osaka, Japan', 34.69, 135.50),
}

U = lambda pid: f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w=900&q=80"
PORTRAITS = ['photo-1500648767791-00dcc994a43e','photo-1494790108377-be9c29b29330','photo-1507003211169-0a1dd7228f2d',
 'photo-1438761681033-6461ffad8d80','photo-1472099645785-5658abf4ff4e','photo-1544005313-94ddf0286df2',
 'photo-1534528741775-53994a69daeb','photo-1506794778202-cad84cf45f1d','photo-1517841905240-472988babdf9',
 'photo-1524504388940-b1c1722653e1','photo-1552058544-f2b08422138a','photo-1531123897727-8f129e1688ce']
VIDEOS = ['BigBuckBunny','ForBiggerBlazes','ForBiggerEscapes','Sintel','TearsOfSteel','ForBiggerFun',
 'ForBiggerJoyrides','ElephantsDream','SubaruOutbackOnStreetAndDirt']
VID = lambda n: f"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/{n}.mp4"

IMG = {
 'tech': ['photo-1518770660439-4636190af475','photo-1461749280684-dccba630e2f6','photo-1531297484001-80022131f5a1',
          'photo-1550745165-9bc0b252726f','photo-1496181133206-80ce9b88a853','photo-1519389950473-47ba0277781c'],
 'travel': ['photo-1503220317375-aaad61436b1b','photo-1476514525535-07fb3b4ae5f1','photo-1469474968028-56623f02e42e',
            'photo-1507525428034-b723cf961d3e','photo-1500530855697-b586d89ba3ee','photo-1540959733332-eab4deabeeaf',
            'photo-1513407030348-c983a97b98d8','photo-1480796927426-f609979314bd'],
 'football': ['photo-1522778119026-d647f0596c20','photo-1508098682722-e99c43a406b2','photo-1517927033932-b3d18e61fb3a',
              'photo-1575361204480-aadea25e6e68'],
 'basketball': ['photo-1546519638-68e109498ffc','photo-1519861531473-9200262188bf','photo-1504450758481-7338eba7524a'],
 'fitness': ['photo-1534438327276-14e5300c3a48','photo-1517836357463-d25dfeac3438','photo-1571019613454-1cb2f99b2d8b',
             'photo-1517963879433-6ad2b056d712'],
 'racing': ['photo-1583121274602-3e2820c69888','photo-1552519507-da3b142c6e3d','photo-1504707748692-419802cf939d'],
 'food': ['photo-1504674900247-0877df9cc836','photo-1414235077428-338989a2e8c0','photo-1476224203421-9ac39bcb3327'],
 'music': ['photo-1511671782779-c97d3d27a1d4','photo-1470225620780-dba8ba36b745','photo-1493225457124-a3eb161ffa5f'],
 'photo': ['photo-1502920917128-1aa500764cbd','photo-1516035069371-29a1b244cc32','photo-1452587925148-ce544e77e70d'],
 'space': ['photo-1446776811953-b23d57bd21aa','photo-1541185933-ef5d8ed016c2','photo-1457364887197-9150188c107b'],
 'gaming': ['photo-1542751371-adc38448a05e','photo-1511512578047-dfb367046420','photo-1493711662062-fa541adb3fc8'],
 'fashion': ['photo-1445205170230-053b83016050','photo-1483985988355-763728e1935b'],
 'nature': ['photo-1441974231531-c6227db76b6e','photo-1470071459604-3b5ec3a7fe05','photo-1469474968028-56623f02e42e'],
}

FIRST = ['Aiden','Luca','Mateo','Kenji','Haruto','Ravi','Arjun','Priya','Ananya','Mei','Yuna','Sofia','Elena','Ingrid',
 'Freya','Amara','Zainab','Omar','Tariq','Kwame','Thandiwe','Diego','Camila','Valentina','Rafael','Thiago','Nadia',
 'Lars','Henrik','Astrid','Chloe','Ella','Noah','Liam','Maya','Aria','Kai','Finn','Leila','Yasmin','Andrei','Katya',
 'Tomas','Marek','Sven','Emeka','Chidi','Sana','Hana','Riko','Daichi','Minjun','Jiwoo','Nikolai','Petra','Marta',
 'Ines','Joao','Beatriz','Santiago','Isabella','Gabriel','Lucia','Mikko','Aino','Eero','Siobhan','Declan','Niamh',
 'Ewan','Isla','Rhys','Carys','Anouk','Femke','Jasper','Milan','Zara','Imran','Farah','Dev','Kiran','Aditi','Rohan',
 'Ishaan','Akira','Sakura','Ren','Hiro','Amelie','Margaux','Theo','Hugo','Clara','Lena','Jonas','Emil','Alba','Nora',
 'Selim','Aylin']
LAST = ['Tanaka','Watanabe','Sato','Kimura','Nakamura','Sharma','Patel','Mehta','Iyer','Reddy','Kim','Park','Choi',
 'Chen','Wang','Nguyen','Tran','Okafor','Mensah','Abebe','Diallo','Silva','Santos','Oliveira','Costa','Rodriguez',
 'Garcia','Martinez','Lopez','Fernandez','Rossi','Ricci','Bianchi','Moretti','Dubois','Laurent','Moreau','Lefevre',
 'Muller','Schmidt','Weber','Fischer','Jansen','DeVries','Bakker','Visser','Andersson','Lindqvist','Berg','Holm',
 'Kowalski','Nowak','Novak','Horvat','Popescu','Ivanov','Petrov','Volkov','Yilmaz','Demir','Kaya','Hassan','Ali',
 'Rahman','Khan','Haddad','Nasser','OBrien','Murphy','Kelly','Walsh','MacLeod','Fraser','Campbell','Reid','Hughes',
 'Evans','Morgan','Rees','Larsen','Nielsen','Hansen','Berger','Keller','Frei','Baumann','Virtanen','Korhonen']

ARCH = {}
ARCH['tech_reviewer'] = dict(n=10, img='tech',
 bios=["Tech reviewer breaking down smartphones, laptops and camera gear for {aud} viewers",
       "Consumer tech critic. Honest reviews of phones, keyboards and desk setups",
       "I test gadgets so you do not have to",
       "Reviews without the hype: phones, laptops, cameras",
       "Making sense of consumer tech, one teardown at a time"],
 jobs=[("Tech Reviewer & Creator","{studio} Studio","Video reviews of smartphones, laptops and audio gear since {yr}"),
       ("Executive Producer","{studio} Media","Runs a tech review channel covering gadgets, EVs and smart home tech")],
 hobbies=[("mechanical keyboards","builds custom boards, lubed switches"),("photography","product photography and street shots"),
          ("cycling","weekend century rides"),("drone flying","FPV cinematic footage"),("gaming","PC and retro consoles")],
 projects=[("Desk Setup Guide","Interactive guide to ergonomic desk setups, monitors and cable management","https://desksetup.example.com/{u}"),
           ("Camera Gear Index","Database comparing mirrorless cameras and lenses for creators","https://gearindex.example.com/{u}"),
           ("EV Range Tracker","Crowd-sourced electric vehicle real-world range data","https://evrange.example.com/{u}")],
 blogs=[("My {yr} smartphone camera shootout",
   "I spent six weeks comparing flagship smartphone cameras in {city1} and {city2}: low light, portrait mode, video stabilization and RAW photography. The gap between computational photography pipelines keeps narrowing, but color science still separates the leaders. Full test methodology, sample galleries and my pick for creators inside."),
  ("Why I switched my entire desk setup",
   "New year, new studio. I rebuilt my desk setup around an ultrawide monitor, a custom mechanical keyboard and a proper audio interface. Cable management took a full day. Here is every product I kept, everything I returned, and what I would buy again for a video editing workflow.")],
 cities=['Tokyo','Seoul','SanFrancisco','NewYork','Berlin','HongKong'])
ARCH['ai_founder'] = dict(n=10, img='tech',
 bios=["Founder building AI products. Thinking about AI scaling, agents and developer tools",
       "Machine learning engineer turned founder. Shipping LLM apps and writing about AI scaling laws",
       "Turning research papers into products",
       "Betting my career on useful AI",
       "Ex-big tech, now shipping small fast AI tools"],
 jobs=[("Founder & CEO","{studio} AI","Building an AI platform for developer tools. Raised seed round in {yr}"),
       ("Head of Machine Learning","{studio} Labs","Led LLM fine-tuning, retrieval systems and GPU infrastructure")],
 hobbies=[("chess","rated 1900, studies endgames"),("rock climbing","bouldering V6"),("reading","history of computing"),
          ("running","training for a marathon"),("go","kyu-level, plays online")],
 projects=[("PromptBench","Open-source benchmark for evaluating LLM prompt robustness","https://github.com/{u}/promptbench"),
           ("AgentKit","Framework for building reliable AI agents with tool use","https://github.com/{u}/agentkit"),
           ("VectorLite","Tiny embedded vector database for on-device semantic search","https://github.com/{u}/vectorlite")],
 blogs=[("Notes on AI scaling in {yr}",
   "Everyone asks whether AI scaling laws are hitting a wall. After a year of training runs and inference optimization, my read: raw pretraining gains are slowing, but post-training, tool use and agent orchestration are compounding fast. GPU clusters, data quality and evaluation infrastructure matter more than parameter count now."),
  ("Shipping an LLM product people actually use",
   "We rebuilt our retrieval pipeline three times. Lessons from production: latency budgets shape UX more than model choice, hallucination is a product-design problem as much as a model problem, and fine-tuning beats prompt engineering only after you have real usage data. Written from a coworking space in {city1}.")],
 cities=['SanFrancisco','London','Bangalore','Singapore','Toronto','Berlin'])
ARCH['f1'] = dict(n=6, img='racing',
 bios=["Formula 1 analyst and motorsport journalist covering race strategy and aerodynamics",
       "Ex-karting racer turned Formula 1 content creator. Grand Prix travel, paddock stories, sim racing",
       "Lives by the race calendar",
       "Aerodynamics nerd with a press pass",
       "Explaining why the pit wall did that"],
 jobs=[("Motorsport Journalist","{studio} Racing Media","Covers Formula 1 race weekends, technical regulations and team strategy"),
       ("Race Strategy Analyst","{studio} Motorsport","Models pit stop windows, tyre degradation and safety car probability for F1 broadcasts")],
 hobbies=[("sim racing","iRacing endurance leagues"),("karting","weekend club races"),("photography","trackside motorsport shots"),
          ("cycling","altitude training camps")],
 projects=[("Pit Wall","Formula 1 strategy simulator: tyre models, undercut calculator, safety car odds","https://pitwall.example.com/{u}"),
           ("Grid Talk","Weekly motorsport podcast on Grand Prix weekends and driver moves","https://gridtalk.example.com/{u}")],
 blogs=[("What the Monaco Grand Prix still teaches us",
   "Monaco is the slowest race on the Formula 1 calendar and still the hardest ticket in motorsport. Overtaking is nearly impossible, so qualifying, pit stop timing and track position decide everything. I walked the circuit from Casino Square to the tunnel — notes on why street circuits punish modern aerodynamics."),
  ("Tyre strategy explained with real race data",
   "Soft, medium, hard: Formula 1 strategy sounds simple until degradation curves meet a mistimed safety car. Using lap time data from last season I break down undercuts, overcuts and why teams split strategies between drivers. Written on the flight home from the {city1} round.")],
 cities=['Monaco','Melbourne','Tokyo','Miami','Barcelona','Doha'])
ARCH['footballer'] = dict(n=6, img='football',
 bios=["Professional footballer. Midfielder. Faith, family and the beautiful game",
       "Former professional footballer turned coach and academy mentor",
       "Midfield brain, marathon lungs",
       "The game gave me everything; passing it on",
       "Ninety minutes is the easy part"],
 jobs=[("Professional Footballer","{studio} FC","Central midfielder, {yr} season. Youth academy graduate"),
       ("Academy Coach","{studio} FC Academy","Develops U17 players: pressing patterns, first touch, game intelligence")],
 hobbies=[("padel","offseason obsession"),("cooking","high-protein recipes"),("gaming","football sims and FPS"),
          ("chess","team bus games")],
 projects=[("First Touch Camp","Youth football clinics across three cities every summer","https://firsttouch.example.com/{u}"),
           ("Matchday Journal","Behind-the-scenes newsletter on training, recovery and matchday routines","https://matchday.example.com/{u}")],
 blogs=[("Recovery is the real training",
   "Everyone sees the ninety minutes. Nobody sees the ice baths, sleep tracking, mobility work and nutrition that make them possible. My full recovery protocol after a Champions League away trip to {city1}: cold exposure, compression, carbs timing and why I stopped scrolling at night."),
  ("What academy football taught me about pressure",
   "I signed my first academy contract at thirteen. The pitch teaches you fast: talent gets you noticed, habits keep you employed. Notes for young footballers on trials, setbacks and the season everything clicked.")],
 cities=['London','Barcelona','Paris','RioDeJaneiro','Istanbul','Amsterdam'])
ARCH['basketball'] = dict(n=4, img='basketball',
 bios=["Basketball trainer and skills coach. Footwork, shooting mechanics, hoops culture",
       "Pro basketball player. Guard. Buckets and film study",
       "Footwork first, highlights later",
       "Gym rat with a film habit"],
 jobs=[("Skills Trainer","{studio} Hoops","Trains guards on ball handling, shooting mechanics and film study"),
       ("Professional Basketball Player","{studio} BC","Point guard, EuroLeague. Career three-point percentage .38")],
 hobbies=[("sneaker collecting","two hundred pairs and counting"),("yoga","mobility for the season"),("photography","gym light portraits")],
 projects=[("Handle Lab","Video course on ball handling progressions and footwork","https://handlelab.example.com/{u}")],
 blogs=[("Film study: how guards create space",
   "Watched two hundred clips of pick-and-roll coverage this month. The best guards manipulate the second defender, not the first. Breakdowns of hesitation dribbles, snake dribbles and why shooting gravity changes everything about spacing in modern basketball.")],
 cities=['NewYork','LosAngeles','Toronto','Istanbul'])
ARCH['travel'] = dict(n=12, img='travel',
 bios=["Travel vlogger documenting slow travel, night trains and street food across {aud} countries",
       "Full-time traveler and storyteller. Backpacks, film cameras and long bus rides",
       "Forty countries, one backpack",
       "Collecting border stamps and grandma recipes",
       "The slow route, always"],
 jobs=[("Travel Creator","{studio} Journeys","Documentary-style travel films: markets, trains, homestays, borderlands"),
       ("Travel Writer","{studio} Atlas","Long-form travel essays and city guides for independent travelers")],
 hobbies=[("street food","eats everything once"),("hiking","multi-day treks"),("languages","five and counting"),
          ("film photography","35mm point and shoot"),("scuba diving","advanced open water")],
 projects=[("Night Train Atlas","Guide to overnight rail routes: booking, berths, border crossings","https://nighttrains.example.com/{u}"),
           ("Street Food Map","Crowdsourced map of legendary street food stalls","https://streetfood.example.com/{u}")],
 blogs=[("Three weeks in {city1} on a shoestring",
   "I gave myself twenty-one days and a small budget in {city1}. Slept in family-run guesthouses, ate at markets, took the slow ferry instead of the flight. The full cost breakdown, the neighborhood I would live in, and the one tourist trap that is actually worth it. Street photography set included."),
  ("Night trains are the best way to travel",
   "Flying is faster; night trains are better. You fall asleep in {city1} and wake up in {city2} with a window full of mountains. My ranking of sleeper routes, what to pack, and how to book berths without a local phone number. Slow travel is not slower, it is denser.")],
 cities=['Tokyo','Bangkok','Bali','Istanbul','Marrakech','Lima','Prague','Lisbon','Kyoto','CapeTown','Mumbai','Reykjavik'])
ARCH['photographer'] = dict(n=8, img='photo',
 bios=["Landscape and street photographer. Prints, workshops and long exposures",
       "Documentary photographer chasing light in {aud} cities",
       "Chasing light for a living",
       "Making ordinary streets look like cinema",
       "Prints available, excuses not"],
 jobs=[("Photographer","{studio} Studio","Editorial and documentary photography: portraits, cityscapes, assignments"),
       ("Photo Educator","{studio} Workshops","Teaches composition, color grading and street photography workshops")],
 hobbies=[("darkroom printing","silver gelatin prints"),("hiking","sunrise summits with a tripod"),("coffee","pour-over nerd"),
          ("bookbinding","handmade photo zines")],
 projects=[("City at Blue Hour","Photo book of thirty cities at dusk","https://bluehour.example.com/{u}"),
           ("Street Photography Course","From camera settings to storytelling sequences","https://streetcourse.example.com/{u}")],
 blogs=[("Street photography etiquette in {city1}",
   "One month shooting street photography in {city1}. Lessons: shoot with your feet, ask with your eyes, and learn ten words of the local language. Camera settings for fast light, my favorite focal length, and why I deleted half the archive. The best photographs happened while waiting for other photographs."),
  ("Why I still shoot film",
   "Film photography slows me down in the best way. Thirty-six frames force intention; digital invites hoarding. My hybrid workflow: 35mm for personal work in {city1}, mirrorless for assignments, one contact sheet review every Sunday.")],
 cities=['Tokyo','Paris','NewYork','Marrakech','HongKong','Lisbon','Prague','Seoul'])
ARCH['chef'] = dict(n=6, img='food',
 bios=["Chef and recipe developer. Regional cooking, fermentation and market-to-table menus",
       "Cook, writer and pop-up chef obsessed with noodles and fire",
       "Flavor first, plating second",
       "Feeding people is the whole point",
       "Fermenting something as we speak"],
 jobs=[("Head Chef","{studio} Kitchen","Seasonal tasting menus built on fermentation and open-fire cooking"),
       ("Recipe Developer","{studio} Test Kitchen","Develops and tests recipes for home cooks: weeknight dinners to project bakes")],
 hobbies=[("fermentation","koji, miso, hot sauce"),("gardening","kitchen herbs and chilies"),("food markets","first stop in every city")],
 projects=[("Noodle Atlas","Field notes and recipes from noodle shops across Asia","https://noodleatlas.example.com/{u}"),
           ("Ferment Club","Monthly fermentation recipes and troubleshooting guides","https://fermentclub.example.com/{u}")],
 blogs=[("Eating my way through {city1}",
   "Forty-eight hours, eleven meals, zero regrets. A chef's eating itinerary for {city1}: the market breakfast, the noodle counter with no sign, the dessert worth the queue. What I stole for my own menu and the technique I am still practicing."),
  ("Fermentation basics every home cook should know",
   "Salt, time and patience: fermentation is the cheapest flavor upgrade in cooking. Start with quick pickles, graduate to hot sauce, then attempt miso. Ratios, jars, safety and the troubleshooting chart I wish I had when my first batch went sideways.")],
 cities=['Tokyo','Bangkok','MexicoCity','Rome','Istanbul','Seoul'])
ARCH['musician'] = dict(n=6, img='music',
 bios=["Producer and live performer. Synths, modular rigs and world tours",
       "Singer-songwriter recording an album in {aud} cities",
       "Songs first, sleep later",
       "Synths, stages and sticky floors"],
 jobs=[("Music Producer","{studio} Records","Produces electronic and indie records; mixes in Dolby Atmos"),
       ("Touring Musician","{studio} Live","Performs {aud}+ shows a year across festivals and clubs")],
 hobbies=[("vinyl collecting","digging in every city"),("synthesizers","modular patching"),("skateboarding","transition beginner")],
 projects=[("Bedroom to Stage","Course on producing and performing electronic music live","https://bedroomstage.example.com/{u}"),
           ("Field Recordings","Sample pack recorded on tour: trains, markets, rain","https://fieldrec.example.com/{u}")],
 blogs=[("Recording an album on tour",
   "Hotel rooms are terrible studios and perfect ones. I tracked vocals in {city1}, synths in {city2}, and mixed everything on headphones on night trains. Gear list, gain staging on the move, and why constraints made the record better."),
  ("My live rig, explained",
   "People ask what is on stage: a laptop I do not trust, a synth I love, and a mixer that saved three shows. Full signal chain, redundancy plan and the soundcheck ritual I never skip.")],
 cities=['Berlin','London','Amsterdam','BuenosAires','Melbourne','Stockholm'])
ARCH['fitness'] = dict(n=6, img='fitness',
 bios=["Strength coach. Progressive overload, mobility and sustainable training",
       "Fitness creator making training simple: lift, walk, sleep, repeat",
       "Strong is a skill",
       "Helping desk workers deadlift"],
 jobs=[("Strength Coach","{studio} Performance","Coaches athletes and desk workers: strength, conditioning, return-to-sport"),
       ("Fitness Creator","{studio} Training","Programs and videos on strength training and mobility for busy people")],
 hobbies=[("powerlifting","500-pound deadlift club"),("trail running","ultras someday"),("cooking","meal prep sundays"),
          ("swimming","open water in cold lakes")],
 projects=[("Kitchen Gym","Bodyweight and kettlebell programs for small spaces","https://kitchengym.example.com/{u}")],
 blogs=[("Training on the road without losing progress",
   "Hotel gyms have two dumbbells and a broken cable machine. Fine. A traveling strength template: push, pull, hinge, squat, carry — thirty minutes, any equipment. I used it across {city1} and {city2} and came home stronger."),
  ("The boring fundamentals that actually work",
   "No secret protocol: progressive overload, protein, eight thousand steps, sleep. I tracked a year of training data to prove the boring stuff compounds. Charts and the three exercises I will never drop.")],
 cities=['Sydney','Vancouver','Austin','Stockholm','CapeTown','Zurich'])
ARCH['gaming'] = dict(n=8, img='gaming',
 bios=["Gaming creator and streamer. Strategy games, speedruns and cozy indies",
       "Esports commentator and gaming video essayist",
       "One more run",
       "Frame data and good vibes"],
 jobs=[("Streamer & Creator","{studio} Play","Daily streams: strategy, roguelikes, speedrun attempts and indie showcases"),
       ("Esports Caster","{studio} Esports","Play-by-play commentary for international tournaments")],
 hobbies=[("speedrunning","routing and glitch hunting"),("board games","heavy euros"),("keyboard building","group buys, endgame never"),
          ("pixel art","game jam assets")],
 projects=[("Patch Notes Weekly","Newsletter decoding balance patches across competitive games","https://patchnotes.example.com/{u}"),
           ("Indie Radar","Curated database of upcoming indie games with demos","https://indieradar.example.com/{u}")],
 blogs=[("What speedrunning taught me about mastery",
   "A speedrun is deliberate practice with a leaderboard. Routing, splits, resets at 2am: I spent a year chasing a record and learned more about focus than any productivity book taught me. The run, the grind and the community that checks your splits."),
  ("The indie games I could not stop playing this year",
   "Big budgets buy fidelity; small teams buy ideas. My favorite indies this year: a puzzle game about maps, a roguelike about tea, a platformer made by two people in {city1}. Demos linked for all of them.")],
 cities=['Seoul','Tokyo','LosAngeles','Berlin','Stockholm','Toronto','Osaka','Prague'])
ARCH['space'] = dict(n=4, img='space',
 bios=["Aerospace engineer working on reusable rockets. Space, orbital mechanics and big dumb optimism",
       "Astrophysics communicator making the universe make sense",
       "Eyes up",
       "Rocket engineer, part-time stargazer"],
 jobs=[("Propulsion Engineer","{studio} Aerospace","Works on engine test campaigns for reusable launch vehicles"),
       ("Science Communicator","{studio} Space Media","Explains orbital mechanics, telescopes and space missions to millions")],
 hobbies=[("amateur astronomy","8-inch dobsonian"),("model rocketry","L2 certified"),("hiking","dark sky sites")],
 projects=[("Orbit Visualizer","Interactive tool for plotting transfer orbits and launch windows","https://orbitviz.example.com/{u}")],
 blogs=[("Why reusable rockets changed everything",
   "Launch cost per kilogram is the whole ballgame. Reusability turned rockets from ammunition into aircraft, and the downstream effects — constellations, cheap science missions, lunar logistics — are still compounding. A propulsion engineer's view of the next decade of spaceflight."),
  ("Stargazing from {city1}: a light pollution survival guide",
   "City skies hide almost everything, but not quite everything. What you can actually see from a rooftop in {city1}, the two-hour drive that changes the sky completely, and the beginner telescope I recommend every single time.")],
 cities=['SanFrancisco','Seattle','Auckland','Reykjavik'])
ARCH['climate'] = dict(n=4, img='nature',
 bios=["Climate scientist and communicator. Data, solutions and stubborn hope",
       "Renewable energy analyst mapping the global grid transition",
       "Data-driven optimist",
       "Charting the grid transition"],
 jobs=[("Climate Researcher","{studio} Institute","Studies regional climate adaptation and publishes open datasets"),
       ("Energy Analyst","{studio} Energy","Models solar, wind and storage buildout across emerging markets")],
 hobbies=[("birdwatching","life list at 400"),("cycling","car-free since 2020"),("gardening","native plants only")],
 projects=[("Grid Watch","Live dashboard of renewable energy share by country","https://gridwatch.example.com/{u}")],
 blogs=[("The energy transition is faster than you think",
   "Solar deployment keeps beating every forecast, again. Batteries follow the same curve. I walk through the data on renewable energy costs, grid storage and why pessimism is out of date — plus the hard parts nobody should skip: transmission, permitting, minerals."),
  ("Field notes from a warming coastline",
   "Two weeks measuring erosion near {city1}. Climate adaptation is not abstract here: seawalls, relocated farms, mangrove replanting. What the data says, what the residents say, and where those two stories meet.")],
 cities=['Nairobi','Reykjavik','Amsterdam','Sydney'])
ARCH['fashion'] = dict(n=4, img='fashion',
 bios=["Fashion designer working on slow fashion and zero-waste patterns",
       "Style creator. Vintage sourcing, capsule wardrobes and fashion week diaries",
       "Fewer, better clothes",
       "Vintage racks and pattern paper"],
 jobs=[("Fashion Designer","{studio} Atelier","Designs a zero-waste capsule line manufactured in small batches"),
       ("Style Editor","{studio} Mode","Covers fashion weeks, vintage markets and sustainable brands")],
 hobbies=[("sewing","drafts own patterns"),("vintage hunting","flea markets worldwide"),("photography","lookbook shoots")],
 projects=[("Capsule Builder","App that plans a 30-piece wardrobe around your climate","https://capsule.example.com/{u}")],
 blogs=[("Fashion week, off the runway",
   "The shows are ten percent of fashion week. The rest happens on sidewalks, showrooms and 2am studio fittings in {city1}. Street style notes, the trend that will not survive, and the vintage store I almost kept secret.")],
 cities=['Paris','Rome','Tokyo','NewYork'])
ARCH['filmmaker'] = dict(n=6, img='photo',
 bios=["Documentary filmmaker telling stories about work, migration and food",
       "Director and editor. Short films, commercials and one stubborn feature",
       "Stories over specs",
       "Cutting rooms and coffee"],
 jobs=[("Documentary Director","{studio} Films","Directs character-driven documentaries screened at international festivals"),
       ("Editor & Colorist","{studio} Post","Cuts and grades commercials, music videos and indie features")],
 hobbies=[("film festivals","badge collector"),("analog video","hi8 experiments"),("cooking","crew meals on set")],
 projects=[("One Street","Documentary filmed entirely on a single street over one year","https://onestreet.example.com/{u}"),
           ("Cut Together","Editing course: story structure, pacing and sound design","https://cuttogether.example.com/{u}")],
 blogs=[("What a year of filming one street taught me",
   "I planted a camera on one street in {city1} for a year: the barber, the night bakery, the retired boxer who feeds cats at dawn. Documentary filmmaking is mostly waiting, then all at once. Festival plans and three scenes that almost broke me."),
  ("Editing is rewriting",
   "The film you shot is not the film you have. In the edit, scenes swap meaning, silence outperforms dialogue and your favorite shot dies first. My editing process from assembly to picture lock, with timelines as proof.")],
 cities=['MexicoCity','Lisbon','Mumbai','Berlin','BuenosAires','HongKong'])

STUDIOS = ['Northwind','Bluepeak','Kitsune','Meridian','Atlas','Ember','Volta','Solstice','Harbor','Nova','Cedar',
 'Kaleido','Zenith','Drift','Lumen','Origin','Summit','Fable','Anchor','Prism']
FLAVOR = ['Currently obsessed with {city1}.', 'Based between airports.', 'Ask me about {city1}.',
 'Building in public since {yr}.', 'Slow mornings, long projects.', 'Probably planning a trip right now.',
 'Documenting everything.', 'Here to find collaborators.', '', '', '']

used_names, used_users = set(), set()
def make_name():
    while True:
        f, l = random.choice(FIRST), random.choice(LAST)
        if (f, l) not in used_names:
            used_names.add((f, l))
            return f, l

def make_username(f, l):
    for sep in ['', '_', '-']:
        u = f"{f}{sep}{l}".lower()
        if u not in used_users:
            used_users.add(u)
            return u
    i = 2
    while f"{f}{l}{i}".lower() in used_users: i += 1
    u = f"{f}{l}{i}".lower(); used_users.add(u); return u

users = []
for key, a in ARCH.items():
    for _ in range(a['n']):
        f, l = make_name()
        uname = make_username(f, l)
        uid = str(uuid.uuid4())
        yr = random.choice(['2021','2022','2023','2024','2025'])
        aud = random.choice(['40','60','25','80','30'])
        studio = random.choice(STUDIOS)
        cities = random.sample(a['cities'], min(len(a['cities']), random.choice([2,3,3,4])))
        fmt = dict(u=uname, yr=yr, aud=aud, studio=studio,
                   city1=CITIES[cities[0]][0].split(',')[0],
                   city2=CITIES[cities[-1]][0].split(',')[0])
        bio = random.choice(a['bios']).format(**fmt)
        flavor = random.choice(FLAVOR).format(**fmt)
        if flavor: bio = f"{bio}. {flavor}"
        users.append(dict(key=key, a=a, uid=uid, uname=uname, full=f"{f} {l}",
                          bio=bio, fmt=fmt, cities=cities,
                          avatar=U(random.choice(PORTRAITS))))

random.shuffle(users)
assert len(users) == 100 and len(used_users) == 100

out = []
out.append("""-- =================================================================
-- DIGITAL DIRECTORY — SEED DATA v2: 100 fictional influencer profiles
-- All personas are FICTIONAL. Any resemblance to real people is
-- coincidental. Run in Supabase SQL Editor. Safe to re-run: it
-- deletes any previous seed first.
-- v2: profession-matched cover images, more varied bios.
-- =================================================================
begin;

-- remove any previous seed run (cascades through all tables)
delete from auth.users where email like 'seed-%@example.com';
""")

out.append("insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, created_at, updated_at) values")
rows = []
for u in users:
    rows.append(f"  ('00000000-0000-0000-0000-000000000000', '{u['uid']}', 'authenticated', 'authenticated', 'seed-{u['uname']}@example.com', '', now(), '{{\"provider\":\"email\",\"providers\":[\"email\"]}}', '{{\"full_name\":\"{esc(u['full'])}\"}}', '', '', '', '', now(), now())")
out.append(",\n".join(rows) + ";\n")

for u in users:
    out.append(f"update public.profiles set username='{u['uname']}', full_name='{esc(u['full'])}', bio='{esc(u['bio'])}', avatar_url='{u['avatar']}' where id='{u['uid']}';")
out.append("")

def multi_insert(table, cols, rows):
    if not rows: return
    out.append(f"insert into public.{table} ({cols}) values")
    out.append(",\n".join(rows) + ";\n")

rows = []
for u in users:
    for name, detail in random.sample(u['a']['hobbies'], min(len(u['a']['hobbies']), random.choice([2,3,3]))):
        rows.append(f"  ('{u['uid']}', '{esc(name)}', '{esc(detail)}')")
multi_insert('hobbies', 'user_id, name, detail', rows)

rows = []
for u in users:
    for title, company, detail in random.sample(u['a']['jobs'], min(len(u['a']['jobs']), random.choice([1,2,2]))):
        rows.append(f"  ('{u['uid']}', '{esc(title.format(**u['fmt']))}', '{esc(company.format(**u['fmt']))}', '{esc(detail.format(**u['fmt']))}')")
multi_insert('jobs', 'user_id, title, company, detail', rows)

TRAVEL_NOTES = ['two unforgettable weeks in {yr}','shot a full video series here','spoke at a conference, stayed a month',
 'annual trip, never gets old','came for work, stayed for the food','solo trip that changed my plans','offseason training block']
rows = []
for u in users:
    for ck in u['cities']:
        place, lat, lng = CITIES[ck]
        note = random.choice(TRAVEL_NOTES).format(**u['fmt'])
        rows.append(f"  ('{u['uid']}', '{esc(place)}', '{esc(note)}', {lat}, {lng})")
multi_insert('travels', 'user_id, place, detail, lat, lng', rows)

rows = []
for u in users:
    for name, detail, url in random.sample(u['a']['projects'], min(len(u['a']['projects']), random.choice([1,2,2]))):
        rows.append(f"  ('{u['uid']}', '{esc(name)}', '{esc(detail)}', '{url.format(u=u['uname'])}')")
multi_insert('projects', 'user_id, name, detail, url', rows)

rows = []
for u in users:
    for title, content in random.sample(u['a']['blogs'], min(len(u['a']['blogs']), random.choice([1,2,2]))):
        rows.append(f"  ('{u['uid']}', '{esc(title.format(**u['fmt']))}', '{esc(content.format(**u['fmt']))}')")
multi_insert('blogs', 'user_id, title, content', rows)

rows = []
for u in users:
    pool = IMG[u['a']['img']]
    for i, pid in enumerate(random.sample(pool, min(len(pool), random.choice([2,3,3])))):
        rows.append(f"  ('{u['uid']}', 'image', '{U(pid)}', 'seed/{u['uname']}/img{i}')")
    if random.random() < 0.3:
        v = random.choice(VIDEOS)
        rows.append(f"  ('{u['uid']}', 'video', '{VID(v)}', 'seed/{u['uname']}/vid0')")
multi_insert('media', 'user_id, kind, url, path', rows)

out.append("commit;")
sql = "\n".join(out)

bad = 0
for line in sql.split("\n"):
    t = line.strip()
    if (t.startswith("('") or t.startswith("update public.")) and t.rstrip(",;").count("'") % 2 != 0:
        print("QUOTE IMBALANCE:", t[:140]); bad += 1
if bad: raise SystemExit(f"{bad} bad lines")
assert sql.count("begin;") == 1 and sql.count("commit;") == 1

import os
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'supabase', 'seed.sql')
open(dest, 'w').write(sql)
print("users:", len(users), "| size KB:", len(sql)//1024)
