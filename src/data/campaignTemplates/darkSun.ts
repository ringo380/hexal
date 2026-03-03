import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const darkSunTemplate: CampaignTemplate = {
  id: 'dark-sun',
  name: 'Dark Sun',
  description: 'The dying world of Athas \u2014 a brutal desert wasteland ruled by sorcerer-kings where metal is scarce and psionic power is common.',
  icon: 'sun',
  accentColor: '#FF4500',
  recommendedWidth: 30,
  recommendedHeight: 25,
  calendarPreset: 'simple',
  startYear: 1,
  terrainTypes: [
    { id: 'tpl-ds-sandy-waste', name: 'Sandy Waste', colorHex: '#EDC9AF', icon: 'sun', weight: 4, moveCost: 2, elevation: 1, moisture: 0, temperature: 5, category: 'Arid', hazardLevel: 2, hazardType: 'Extreme Heat' },
    { id: 'tpl-ds-rocky-badlands', name: 'Rocky Badlands', colorHex: '#A0522D', icon: 'mountain', weight: 2, moveCost: 3, elevation: 4, moisture: 0, temperature: 4, category: 'Arid' },
    { id: 'tpl-ds-salt-flat', name: 'Salt Flat', colorHex: '#F5F5DC', icon: 'sun', weight: 2, moveCost: 2, elevation: 1, moisture: 0, temperature: 5, category: 'Arid', hazardLevel: 1, hazardType: 'Blinding Glare' },
    { id: 'tpl-ds-scrubland', name: 'Scrubland', colorHex: '#9B8B5A', icon: 'leaf', weight: 2, moveCost: 2, elevation: 2, moisture: 2, temperature: 4, category: 'Arid' },
    { id: 'tpl-ds-stony-barrens', name: 'Stony Barrens', colorHex: '#8B7D6B', icon: 'triangle', weight: 3, moveCost: 2, elevation: 2, moisture: 0, temperature: 4, category: 'Arid' },
    { id: 'tpl-ds-oasis', name: 'Oasis', colorHex: '#2E8B57', icon: 'drop', weight: 1, moveCost: 1, elevation: 1, moisture: 3, temperature: 3, category: 'Temperate' },
    { id: 'tpl-ds-silt-sea', name: 'Silt Sea', colorHex: '#C4B59B', icon: 'water', weight: 1, moveCost: 4, elevation: 0, moisture: 1, temperature: 4, category: 'Aquatic', hazardLevel: 4, hazardType: 'Suffocation' },
    { id: 'tpl-ds-obsidian-plain', name: 'Obsidian Plain', colorHex: '#1C1C1C', icon: 'skull', weight: 1, moveCost: 3, elevation: 1, moisture: 0, temperature: 5, category: 'Arid', hazardLevel: 2, hazardType: 'Razor Sharp Terrain' },
    { id: 'tpl-ds-mesa', name: 'Mesa', colorHex: '#CD853F', icon: 'mountain', weight: 2, moveCost: 3, elevation: 4, moisture: 1, temperature: 4, category: 'Arid' },
  ],
  encounterTables: [
    {
      id: 'tpl-ds-enc-sandy-waste', name: 'Sandy Waste Encounters', terrain: 'Sandy Waste',
      entries: [
        { id: 'tpl-ds-enc-sw1', title: 'Thri-Kreen Hunting Party', description: 'A pack of thri-kreen mantis warriors stalks prey across the dunes', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-sw2', title: 'Silt Runner Ambush', description: 'Silt runners burst from the sand in a coordinated attack', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-ds-enc-sw3', title: 'Defiler\'s Aftermath', description: 'A ring of ash marks where a defiler drained the land of life', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ds-enc-sw4', title: 'Sand Bride', description: 'A psionic undead lures travelers with mirages of water', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-rocky-badlands', name: 'Rocky Badlands Encounters', terrain: 'Rocky Badlands',
      entries: [
        { id: 'tpl-ds-enc-rb1', title: 'Gith Raider Band', description: 'Savage gith warriors descend from the crags to raid passing caravans', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-rb2', title: 'Braxat Lair', description: 'A braxat guards its territory among the boulders with psionic fury', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-ds-enc-rb3', title: 'Escaped Slave Band', description: 'Desperate escaped slaves beg for supplies or threaten violence', difficulty: 'Social', weight: 1 },
        { id: 'tpl-ds-enc-rb4', title: 'Tembo on the Prowl', description: 'A tembo drains life force from anything in its path', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-salt-flat', name: 'Salt Flat Encounters', terrain: 'Salt Flat',
      entries: [
        { id: 'tpl-ds-enc-sf1', title: 'Salt Golem', description: 'A crystalline construct animated by ancient psionic energy', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ds-enc-sf2', title: 'Mirage Lure', description: 'Heat shimmer resolves into belgoi using psionic trickery', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-sf3', title: 'Salt Caravan', description: 'Traders hauling precious salt to market under heavy guard', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-scrubland', name: 'Scrubland Encounters', terrain: 'Scrubland',
      entries: [
        { id: 'tpl-ds-enc-sc1', title: 'Half-Giant Nomads', description: 'Wandering half-giants seek direction and purpose', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ds-enc-sc2', title: 'Defiler Wizard', description: 'A lone defiler practices forbidden magic, withering the scrub to ash', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ds-enc-sc3', title: 'Cilops Nest', description: 'Burrowing psionic insects erupt from beneath the thorny brush', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ds-enc-sc4', title: 'Herder Camp', description: 'Villagers graze erdlu among the sparse vegetation', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-stony-barrens', name: 'Stony Barrens Encounters', terrain: 'Stony Barrens',
      entries: [
        { id: 'tpl-ds-enc-sb1', title: 'Belgoi Ambush', description: 'Belgoi use telepathic lures to draw travelers into a killing field', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-sb2', title: 'Mul Gladiator Deserter', description: 'A formidable mul escaped from the arena seeks allies or solitude', difficulty: 'Social', weight: 1 },
        { id: 'tpl-ds-enc-sb3', title: 'Id Fiend Pack', description: 'Psionic beasts overwhelm minds before consuming flesh', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-oasis', name: 'Oasis Encounters', terrain: 'Oasis',
      entries: [
        { id: 'tpl-ds-enc-oa1', title: 'Territorial Druid', description: 'A guardian druid challenges those who would exploit the oasis', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ds-enc-oa2', title: 'Poisoned Water', description: 'Something has tainted the water \u2014 sabotage or natural corruption?', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ds-enc-oa3', title: 'Caravan Rest Stop', description: 'Multiple groups converge on the oasis, tensions rising over water rights', difficulty: 'Social', weight: 2 },
      ]
    },
    {
      id: 'tpl-ds-enc-silt-sea', name: 'Silt Sea Encounters', terrain: 'Silt Sea',
      entries: [
        { id: 'tpl-ds-enc-ss1', title: 'Silt Horror', description: 'Massive tentacles erupt from the choking silt', difficulty: 'CR 7', weight: 1 },
        { id: 'tpl-ds-enc-ss2', title: 'Silt Skimmer Pirates', description: 'Raiders on silt skimmers demand tribute or attack', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-ss3', title: 'Floating Island', description: 'A drifting chunk of earth hosts a small ecosystem', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ds-enc-ss4', title: 'Silt Runner Colony', description: 'An organized colony of silt runners builds crude structures on silt banks', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-enc-obsidian-plain', name: 'Obsidian Plain Encounters', terrain: 'Obsidian Plain',
      entries: [
        { id: 'tpl-ds-enc-op1', title: 'Obsidian Golem', description: 'An ancient construct of black glass patrols endlessly', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-ds-enc-op2', title: 'Psionic Storm', description: 'The obsidian amplifies wild psionic energy into a devastating storm', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ds-enc-op3', title: 'Scavenger Band', description: 'Desperate scavengers mine obsidian for weapons, wary of strangers', difficulty: 'Social', weight: 2 },
      ]
    },
    {
      id: 'tpl-ds-enc-mesa', name: 'Mesa Encounters', terrain: 'Mesa',
      entries: [
        { id: 'tpl-ds-enc-me1', title: 'Thri-Kreen Hive', description: 'An organized thri-kreen community occupies a mesa top fortress', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ds-enc-me2', title: 'Cliff Ambush', description: 'Gith raiders push boulders from the mesa edge onto travelers below', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ds-enc-me3', title: 'Hermit Psionicist', description: 'A reclusive psionicist offers wisdom \u2014 for a price', difficulty: 'Social', weight: 1 },
        { id: 'tpl-ds-enc-me4', title: 'Aarakocra Scouts', description: 'Bird-people observe from the heights, wary of surface dwellers', difficulty: 'Social', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-ds-lm-sandy-waste', name: 'Sandy Waste Landmarks', terrain: 'Sandy Waste',
      entries: [
        { id: 'tpl-ds-lm-sw1', title: 'Bleached Bone Field', description: 'The skeletal remains of an enormous creature half-buried in sand', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-sw2', title: 'Petrified Forest', description: 'Stone trees stand as monuments to the world that once was', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ds-lm-sw3', title: 'Buried Ziggurat', description: 'Wind has exposed the tip of an ancient sorcerer-king\'s ziggurat', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-rocky-badlands', name: 'Rocky Badlands Landmarks', terrain: 'Rocky Badlands',
      entries: [
        { id: 'tpl-ds-lm-rb1', title: 'Wind-Carved Arch', description: 'A massive natural stone arch spanning a dry ravine', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-rb2', title: 'Preserver Cache', description: 'A hidden cave containing preserved scrolls and dried herbs', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ds-lm-rb3', title: 'Slave Tribe Cairn', description: 'Stacked stones marking a free tribe\'s territory boundary', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-salt-flat', name: 'Salt Flat Landmarks', terrain: 'Salt Flat',
      entries: [
        { id: 'tpl-ds-lm-sf1', title: 'Crystal Formation', description: 'Towering salt crystals catch the light in blinding prismatic displays', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-sf2', title: 'Dried Lake Bed', description: 'Cracked earth where an ancient lake once stood, psionic echoes linger', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ds-lm-sf3', title: 'Sorcerer-King Monument', description: 'A towering obsidian statue of a sorcerer-king, fused to the salt', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-scrubland', name: 'Scrubland Landmarks', terrain: 'Scrubland',
      entries: [
        { id: 'tpl-ds-lm-sc1', title: 'Agafari Copse', description: 'A rare stand of agafari trees jealously guarded by local druids', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-ds-lm-sc2', title: 'Abandoned Village', description: 'Sun-bleached mud-brick walls crumble around an empty well', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-sc3', title: 'Psionic Resonance Site', description: 'The ground hums with psionic energy \u2014 wild talents manifest unpredictably', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-stony-barrens', name: 'Stony Barrens Landmarks', terrain: 'Stony Barrens',
      entries: [
        { id: 'tpl-ds-lm-sb1', title: 'Ancient Road Markers', description: 'Carved stones from a long-fallen civilization mark a forgotten road', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-sb2', title: 'Erdlu Nesting Grounds', description: 'A depression littered with giant eggshells and feathers', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-sb3', title: 'Defiler\'s Ash Circle', description: 'A perfect circle of lifeless ash where a powerful defiling spell was cast', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-oasis', name: 'Oasis Landmarks', terrain: 'Oasis',
      entries: [
        { id: 'tpl-ds-lm-oa1', title: 'Sacred Spring', description: 'A natural spring revered by druids and guarded by ancient wards', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-ds-lm-oa2', title: 'Trader\'s Rest', description: 'A permanent camp with shade structures and a crude market', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-oa3', title: 'Sunken Garden', description: 'A lush garden sunk below ground level, fed by underground water', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-silt-sea', name: 'Silt Sea Landmarks', terrain: 'Silt Sea',
      entries: [
        { id: 'tpl-ds-lm-ss1', title: 'Silt Island', description: 'A small rocky island jutting from the choking silt', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-ds-lm-ss2', title: 'Submerged Ruins', description: 'Stone walls and arches visible beneath the silt surface', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ds-lm-ss3', title: 'Silt Buoy', description: 'A weathered marker pole indicating a navigable channel', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-ds-lm-obsidian-plain', name: 'Obsidian Plain Landmarks', terrain: 'Obsidian Plain',
      entries: [
        { id: 'tpl-ds-lm-op1', title: 'Obsidian Spire', description: 'A jagged volcanic glass pillar reflects the crimson sun', rarity: 'Common', weight: 2 },
        { id: 'tpl-ds-lm-op2', title: 'Rajaat\'s Footprint', description: 'A massive depression in the obsidian, radiating ancient defiling energy', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ds-lm-op3', title: 'Glass Maze', description: 'Obsidian walls form a disorienting labyrinth of reflections', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ds-lm-mesa', name: 'Mesa Landmarks', terrain: 'Mesa',
      entries: [
        { id: 'tpl-ds-lm-me1', title: 'Cliff Dwellings', description: 'Ancient carved chambers honeycomb the mesa walls', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-ds-lm-me2', title: 'Mesa-Top Garden', description: 'A preserver tends a hidden garden atop an isolated mesa', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ds-lm-me3', title: 'Lookout Cairn', description: 'A stone pile marking the highest point with views for miles', rarity: 'Common', weight: 2 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.6,
    encounterDensity: 0.5,
    landmarkDensity: 0.2,
    terrainVariety: 0.5,
  },
  factions: [
    { name: 'Templars of Tyr', description: 'Bureaucratic enforcers serving the sorcerer-king of Tyr, wielding divine magic granted by their master', color: '#DAA520', goals: 'Maintain order and enforce the sorcerer-king\'s will across the Tablelands', tags: ['political', 'religious'] },
    { name: 'Veiled Alliance', description: 'A secret network of preservers working to protect arcane magic and oppose the sorcerer-kings', color: '#7B68EE', goals: 'Overthrow the sorcerer-kings and restore life to Athas through preserver magic', tags: ['secret', 'arcane'] },
    { name: 'Elven Traders', description: 'Nomadic elven merchant tribes who run the trade routes between city-states', color: '#CD853F', goals: 'Profit from trade and maintain the freedom of the open desert', tags: ['mercantile', 'nomadic'] },
    { name: 'Thri-Kreen Clutch', description: 'An organized clutch of mantis warriors expanding their hunting territory into settled lands', color: '#556B2F', goals: 'Secure hunting grounds and expand clutch territory', tags: ['predatory', 'alien'] },
  ],
  regions: [
    { name: 'Tyr Region', color: '#DAA520', description: 'The lands surrounding the free city of Tyr, recently liberated from its sorcerer-king', tags: ['urban', 'liberated'] },
    { name: 'Sea of Silt Coast', color: '#C4B59B', description: 'The treacherous shore of the vast Sea of Silt, home to horrors and hidden ports', tags: ['coastal', 'dangerous'] },
    { name: 'Ringing Mountains', color: '#A0522D', description: 'A rugged mountain range sheltering halfling villages and ancient secrets', tags: ['mountain', 'frontier'] },
    { name: 'Tablelands', color: '#EDC9AF', description: 'The vast arid plateau between the city-states, crossed by trade routes and raiding parties', tags: ['desert', 'trade'] },
  ],
  tags: ['post-apocalyptic', 'desert', 'survival', 'psionic'],
};
