/**
 * Seed script: bulk-ingest top Indian creators into Creatorpedia.
 * Calls the local (or prod) ingest API for each handle, rate-limited
 * to avoid hitting YouTube API quota (10k units/day).
 *
 * Usage:
 *   node scripts/seed-creators.mjs             # hits localhost:3000
 *   node scripts/seed-creators.mjs prod        # hits creatorpedia.in
 *   node scripts/seed-creators.mjs prod 50     # start from index 50 (resume)
 */

const BASE_URL = process.argv[2] === 'prod'
  ? 'https://creatorpedia.in'
  : 'http://localhost:3000'

const RESUME_FROM = parseInt(process.argv[3] ?? '0', 10)

// Delay between requests (ms) — keep YouTube quota safe
// 10,000 units/day ÷ 3 units/creator ≈ 3,333 creators/day
// At 2s delay: 200 creators = ~7 min
const DELAY_MS = 2000

// ── Creator seed list ────────────────────────────────────────────────────────
// YouTube handles (without @). These are looked up by handle first;
// if not found, the ingest API falls back to Instagram.

const CREATORS = [
  // ── Beauty & Skincare ──────────────────────────────────────────────────────
  { handle: 'shreyajain26',         category: 'beauty' },
  { handle: 'malvikasitlani',       category: 'beauty' },
  { handle: 'debasreebanerjee',     category: 'beauty' },
  { handle: 'GiaKashyap',           category: 'beauty' },
  { handle: 'JovitaGeorge',         category: 'beauty' },
  { handle: 'nidhi_katiyar',        category: 'beauty' },
  { handle: 'BeautyByPriyanka',     category: 'beauty' },
  { handle: 'Corallista',           category: 'beauty' },
  { handle: 'Shruti.ArjunAnand',    category: 'beauty' },
  { handle: 'makeupandbeautyforever', category: 'beauty' },
  { handle: 'dearstamping',         category: 'beauty' },
  { handle: 'nancytyagi',           category: 'beauty' },
  { handle: 'beautywithsneha',      category: 'beauty' },
  { handle: 'Reetafabulous',        category: 'beauty' },
  { handle: 'colorfulldreams',      category: 'beauty' },

  // ── Fashion ───────────────────────────────────────────────────────────────
  { handle: 'KomalPandeyOfficial',  category: 'fashion' },
  { handle: 'KritikaKammer',        category: 'fashion' },
  { handle: 'MasoomMinawala',       category: 'fashion' },
  { handle: 'SejalkKumar',          category: 'fashion' },
  { handle: 'AashnaOfficial',       category: 'fashion' },
  { handle: 'SakshiSindwani',       category: 'fashion' },
  { handle: 'diipakhosla',          category: 'fashion' },
  { handle: 'The.Style.Saint',      category: 'fashion' },
  { handle: 'shivani.bafna9',       category: 'fashion' },
  { handle: 'DivyaTripathiii',      category: 'fashion' },
  { handle: 'vidhimundhra',         category: 'fashion' },
  { handle: 'thatbohogirl',         category: 'fashion' },
  { handle: 'harpersbazaarin',      category: 'fashion' },
  { handle: 'tanya.sharma55',       category: 'fashion' },
  { handle: 'ootdfashionblogger',   category: 'fashion' },

  // ── Lifestyle ─────────────────────────────────────────────────────────────
  { handle: 'RanveerAllahbadia',    category: 'lifestyle' },
  { handle: 'nikhilsharmaofficial', category: 'lifestyle' },
  { handle: 'GabrielleIndia',       category: 'lifestyle' },
  { handle: 'ADayInMyLife',         category: 'lifestyle' },
  { handle: 'simmi_das',            category: 'lifestyle' },
  { handle: 'trisha_dey',           category: 'lifestyle' },
  { handle: 'nancydessert',         category: 'lifestyle' },
  { handle: 'theurbanguide',        category: 'lifestyle' },
  { handle: 'shiveshmathur',        category: 'lifestyle' },
  { handle: 'itsrockygaming',       category: 'lifestyle' },

  // ── Food & Cooking ────────────────────────────────────────────────────────
  { handle: 'KabitasKitchen',       category: 'food' },
  { handle: 'NishaMadhulika',       category: 'food' },
  { handle: 'HebbarsKitchen',       category: 'food' },
  { handle: 'CookingShooking',      category: 'food' },
  { handle: 'PankajBhadouria',      category: 'food' },
  { handle: 'VahChef',              category: 'food' },
  { handle: 'YourFoodLab',          category: 'food' },
  { handle: 'FoodInsider',          category: 'food' },
  { handle: 'bengalicuisine',       category: 'food' },
  { handle: 'StreetByteIndia',      category: 'food' },
  { handle: 'FoodRangerTrevor',     category: 'food' },
  { handle: 'NehaDeepakShah',       category: 'food' },

  // ── Tech & Gadgets ────────────────────────────────────────────────────────
  { handle: 'TechnicalGuruji',      category: 'tech' },
  { handle: 'TrakinTech',           category: 'tech' },
  { handle: 'GeekyRanjit',         category: 'tech' },
  { handle: 'C4ETech',              category: 'tech' },
  { handle: 'TechBurner',           category: 'tech' },
  { handle: 'GadgetsToUse',         category: 'tech' },
  { handle: 'TechBar',              category: 'tech' },
  { handle: 'iGyaan',               category: 'tech' },
  { handle: 'ReviewsIn5',           category: 'tech' },
  { handle: 'SocialDilemma',        category: 'tech' },
  { handle: 'SuperchargedTech',     category: 'tech' },
  { handle: 'thetechchap',          category: 'tech' },

  // ── Finance & Investing ───────────────────────────────────────────────────
  { handle: 'CARachanaRanade',      category: 'finance' },
  { handle: 'PranjalKamra',         category: 'finance' },
  { handle: 'AkshatShrivastava',    category: 'finance' },
  { handle: 'ShankarNath',          category: 'finance' },
  { handle: 'LabourLawAdvisor',     category: 'finance' },
  { handle: 'SuGariyaFu',           category: 'finance' },
  { handle: 'warikoo',              category: 'finance' },
  { handle: 'AnkurWarikoo',         category: 'finance' },
  { handle: 'SahilBloom',           category: 'finance' },
  { handle: 'FinancewithSharan',    category: 'finance' },
  { handle: 'LearnToInvest',        category: 'finance' },

  // ── Travel ───────────────────────────────────────────────────────────────
  { handle: 'MumbikerNikhil',       category: 'travel' },
  { handle: 'TravelWithJo',         category: 'travel' },
  { handle: 'SolowayFarer',         category: 'travel' },
  { handle: 'BackpackerSteve',      category: 'travel' },
  { handle: 'SortedFood',           category: 'travel' },
  { handle: 'VijayTravels',         category: 'travel' },
  { handle: 'DesiTraveller',        category: 'travel' },
  { handle: 'GauravHebbar',         category: 'travel' },
  { handle: 'TravelWithSneha',      category: 'travel' },
  { handle: 'hikingrocks',          category: 'travel' },
  { handle: 'AkiwaraTravels',       category: 'travel' },

  // ── Fitness & Health ─────────────────────────────────────────────────────
  { handle: 'GarrisonFitness',      category: 'fitness' },
  { handle: 'RiteshBawri',          category: 'fitness' },
  { handle: 'GymRa',                category: 'fitness' },
  { handle: 'FitnessWithAman',      category: 'fitness' },
  { handle: 'YogaWithAdriene',      category: 'fitness' },
  { handle: 'SaraNutrition',        category: 'fitness' },
  { handle: 'ChetanLakhiani',       category: 'fitness' },
  { handle: 'VarunPruthi',          category: 'fitness' },
  { handle: 'VinyasaYogaShala',     category: 'fitness' },

  // ── Parenting & Family ────────────────────────────────────────────────────
  { handle: 'SupergirlinIndia',     category: 'parenting' },
  { handle: 'MomcomIndia',          category: 'parenting' },
  { handle: 'DesiMom',              category: 'parenting' },
  { handle: 'AaronsAnimals',        category: 'parenting' },
  { handle: 'NamitathaparIndia',    category: 'parenting' },

  // ── Entertainment & Comedy ────────────────────────────────────────────────
  { handle: 'BBKiVines',            category: 'entertainment' },
  { handle: 'AshishChanchlani',     category: 'entertainment' },
  { handle: 'CarryMinati',          category: 'entertainment' },
  { handle: 'Round2hell',           category: 'entertainment' },
  { handle: 'AmitBhadana',          category: 'entertainment' },
  { handle: 'ScoopWhoop',           category: 'entertainment' },
  { handle: 'FilterCopy',           category: 'entertainment' },
  { handle: 'theviralfever',        category: 'entertainment' },
  { handle: 'NikhilBanerjee',       category: 'entertainment' },
  { handle: 'SiddharthBatra',       category: 'entertainment' },
  { handle: 'SaurabhGhadge',        category: 'entertainment' },
  { handle: 'NicolaineOfficials',   category: 'entertainment' },
  { handle: 'SocialMediaStars',     category: 'entertainment' },

  // ── Gaming ────────────────────────────────────────────────────────────────
  { handle: 'MortaL',               category: 'gaming' },
  { handle: 'DynamoGaming',         category: 'gaming' },
  { handle: 'GyanSujan',            category: 'gaming' },
  { handle: 'SouLWaTeRz',          category: 'gaming' },
  { handle: 'NoobYT',               category: 'gaming' },
  { handle: 'FortNinja',            category: 'gaming' },
  { handle: 'LiveInsaan',           category: 'gaming' },
  { handle: 'RahulPandeyFPS',      category: 'gaming' },

  // ── Men's Grooming & Lifestyle ────────────────────────────────────────────
  { handle: 'BeYourBest',           category: 'lifestyle' },
  { handle: 'GentsCorner',          category: 'lifestyle' },
  { handle: 'ManBehindLens',        category: 'lifestyle' },
  { handle: 'theindiangroomer',     category: 'lifestyle' },
  { handle: 'GuyCodes',             category: 'lifestyle' },
  { handle: 'NickiNick',            category: 'lifestyle' },

  // ── Skincare Science / Dermatology ────────────────────────────────────────
  { handle: 'DermatologistReview',  category: 'beauty' },
  { handle: 'SkincarebyHyram',      category: 'beauty' },
  { handle: 'Dr.Dray',              category: 'beauty' },
  { handle: 'CriticalBeauty',       category: 'beauty' },
  { handle: 'SkincareSanitySarah',  category: 'beauty' },

  // ── Home & Decor ─────────────────────────────────────────────────────────
  { handle: 'VaastuShastraIndia',   category: 'lifestyle' },
  { handle: 'HomeMakerIndia',       category: 'lifestyle' },
  { handle: 'ApartmentTherapy',     category: 'lifestyle' },
  { handle: 'OrganizeWithSandra',   category: 'lifestyle' },

  // ── Regional creators ─────────────────────────────────────────────────────
  { handle: 'SureshGopi',           category: 'entertainment' },
  { handle: 'RjBalaji',             category: 'entertainment' },
  { handle: 'VikkstarBengali',      category: 'entertainment' },
  { handle: 'GujaratFoodExplorer',  category: 'food' },
  { handle: 'TamilCookingChannel',  category: 'food' },
  { handle: 'TeluguFoodie',         category: 'food' },
  { handle: 'KannadaVlogs',         category: 'lifestyle' },
  { handle: 'MaharashtraMaza',      category: 'lifestyle' },
  { handle: 'PunjabiTadka',         category: 'food' },
  { handle: 'BengaliCuisineOfficial', category: 'food' },
]

// ── Ingest function ──────────────────────────────────────────────────────────

async function ingest(handle, index, total) {
  const url = `${BASE_URL}/api/on-demand-ingest`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: handle }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`[${index}/${total}] ✓ ${handle} — ${data.name ?? handle} (${data.platform}, ${data.collab_count ?? 0} collabs)`)
    } else {
      console.log(`[${index}/${total}] ✗ ${handle} — ${data.error ?? res.status}`)
    }
  } catch (err) {
    console.log(`[${index}/${total}] ✗ ${handle} — ${err.message}`)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Main ─────────────────────────────────────────────────────────────────────

const list = CREATORS.slice(RESUME_FROM)
console.log(`Seeding ${list.length} creators (${RESUME_FROM} skipped) → ${BASE_URL}`)
console.log(`Delay: ${DELAY_MS}ms between requests`)
console.log(`Estimated time: ~${Math.round(list.length * DELAY_MS / 60000)} min\n`)

for (let i = 0; i < list.length; i++) {
  const globalIndex = RESUME_FROM + i + 1
  await ingest(list[i].handle, globalIndex, CREATORS.length)
  if (i < list.length - 1) await sleep(DELAY_MS)
}

console.log('\nDone.')
