import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const eberronTemplate: CampaignTemplate = {
  id: 'eberron',
  name: 'Eberron',
  description: 'A magitech noir setting of lightning rails, warforged soldiers, and dragonmarked houses vying for power in the aftermath of the Last War.',
  icon: 'sparkle',
  accentColor: '#FFD700',
  recommendedWidth: 30,
  recommendedHeight: 25,
  calendarPreset: 'eberron',
  startYear: 998,
  terrainTypes: [
    { id: 'tpl-eb-plains', name: 'Plains', colorHex: '#A8D08D', icon: 'leaf', weight: 3, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
    { id: 'tpl-eb-forest', name: 'Forest', colorHex: '#2E8B57', icon: 'tree', weight: 2, moveCost: 2, elevation: 2, moisture: 3, temperature: 2, category: 'Temperate' },
    { id: 'tpl-eb-hills', name: 'Hills', colorHex: '#C4A86C', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, moisture: 2, temperature: 2, category: 'Temperate' },
    { id: 'tpl-eb-mountains', name: 'Mountains', colorHex: '#8C8C9A', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 1, temperature: 1, hazardLevel: 2, hazardType: 'Altitude', hazardDescription: 'Thin air and treacherous passes challenge even seasoned travelers', category: 'Highland' },
    { id: 'tpl-eb-coast', name: 'Coast', colorHex: '#6DAEDB', icon: 'water', weight: 2, moveCost: 1, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-eb-swamp', name: 'Swamp', colorHex: '#4A6741', icon: 'drop', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 3, hazardLevel: 1, hazardType: 'Difficult Terrain', hazardDescription: 'Sucking mud and tangled roots slow progress to a crawl', category: 'Aquatic' },
    { id: 'tpl-eb-mournland', name: 'Mournland', colorHex: '#9B8FB4', icon: 'skull', weight: 1, moveCost: 3, elevation: 1, moisture: 0, temperature: 2, hazardLevel: 4, hazardType: 'Dead-Gray Mist', hazardDescription: 'The lingering magical devastation of the Mourning warps flesh, mind, and magic', category: 'Wasteland' },
    { id: 'tpl-eb-grassland', name: 'Grassland', colorHex: '#B5D56A', icon: 'wind', weight: 2, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
    { id: 'tpl-eb-urban', name: 'Urban', colorHex: '#808080', icon: 'shield', weight: 1, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-eb-enc-plains', name: 'Plains Encounters', terrain: 'Plains',
      entries: [
        { id: 'tpl-eb-enc-p1', title: 'Lightning Rail Crossing', description: 'A House Orien lightning rail streaks across the plains, offering passage or pursuit', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-p2', title: 'Bandit Veterans', description: 'Former soldiers turned highwaymen, still wearing Last War insignia', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-eb-enc-p3', title: 'Warforged Wanderer', description: 'A lone warforged walks the road, searching for purpose after the war', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-p4', title: 'Dragonmarked Courier', description: 'A House Sivis courier carries urgent sealed messages', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-forest', name: 'Forest Encounters', terrain: 'Forest',
      entries: [
        { id: 'tpl-eb-enc-f1', title: 'Eldeen Rangers', description: 'Wardens of the Eldeen Reaches patrol for aberrant threats', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-f2', title: 'Manifest Zone', description: 'A zone where Lamannia bleeds through — plants grow wild and animals speak', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-eb-enc-f3', title: 'Dire Bear', description: 'A massive bear warped by proximity to a manifest zone', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-eb-enc-f4', title: 'Ashbound Druids', description: 'Radical druids who view all arcane magic as an abomination', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-hills', name: 'Hills Encounters', terrain: 'Hills',
      entries: [
        { id: 'tpl-eb-enc-h1', title: 'Prospector Camp', description: 'Dragonmarked prospectors from House Tharashk survey for dragonshards', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-h2', title: 'Dolgrim Ambush', description: 'Aberrations from the depths pour out of a cave mouth', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-eb-enc-h3', title: 'Ruined Fortification', description: 'A Last War bunker, its defenses still partially active', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-eb-enc-m1', title: 'Daelkyr Cultists', description: 'Worshippers of the Lords of Madness perform dark rituals in a mountain shrine', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-eb-enc-m2', title: 'Aerial Patrol', description: 'House Lyrandar airship scouts the mountain passes', difficulty: 'Social', weight: 1 },
        { id: 'tpl-eb-enc-m3', title: 'Dragonshard Vein', description: 'Exposed Khyber dragonshards pulse with dark energy deep in a cave', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-eb-enc-m4', title: 'Wyvern Nest', description: 'A pair of wyverns roost on a high ledge, guarding their eggs', difficulty: 'CR 6', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-coast', name: 'Coast Encounters', terrain: 'Coast',
      entries: [
        { id: 'tpl-eb-enc-c1', title: 'Lhazaar Privateers', description: 'Pirate captains from the Lhazaar Principalities seek recruits or plunder', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-eb-enc-c2', title: 'Sahuagin Raid', description: 'Sea devils attack a coastal village under cover of fog', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-eb-enc-c3', title: 'Shipwright\'s Dock', description: 'A House Lyrandar shipyard where elemental galleons are bound', difficulty: 'Social', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-enc-swamp', name: 'Swamp Encounters', terrain: 'Swamp',
      entries: [
        { id: 'tpl-eb-enc-s1', title: 'Shadow Marches Patrol', description: 'Orc gatekeepers watch for aberrant incursions from Khyber', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-s2', title: 'Hag of the Marches', description: 'A powerful night hag brokers secrets and curses', difficulty: 'CR 7', weight: 1 },
        { id: 'tpl-eb-enc-s3', title: 'Dolgaunt Lurker', description: 'A blind aberration stalks the mist-shrouded waterways', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-eb-enc-s4', title: 'Dragonmark Aberrant', description: 'A rogue with an aberrant dragonmark hides from House Tarkanan', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-mournland', name: 'Mournland Encounters', terrain: 'Mournland',
      entries: [
        { id: 'tpl-eb-enc-ml1', title: 'Living Spells', description: 'Arcane magic given form drifts across the blasted landscape', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-eb-enc-ml2', title: 'Warforged Scavengers', description: 'Lord of Blades scouts strip a battlefield for parts and weapons', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-eb-enc-ml3', title: 'Mourning Anomaly', description: 'Reality warps — gravity shifts, time stutters, or objects animate spontaneously', difficulty: 'Exploration', weight: 2 },
        { id: 'tpl-eb-enc-ml4', title: 'Preserved Battlefield', description: 'Soldiers frozen mid-charge, their expressions locked in horror', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-eb-enc-ml5', title: 'Creation Forge Guardian', description: 'A massive warforged titan still patrols its ruined factory', difficulty: 'CR 10', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-enc-grassland', name: 'Grassland Encounters', terrain: 'Grassland',
      entries: [
        { id: 'tpl-eb-enc-g1', title: 'Halfling Dinosaur Riders', description: 'Talenta Plains halflings ride clawfoot raptors across the grass', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-g2', title: 'Fastieth Stampede', description: 'A herd of bipedal dinosaurs thunders across the plains', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-eb-enc-g3', title: 'Glidewing Flock', description: 'Pteranodons circle overhead — wild or escaped from a House Vadalis ranch', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-eb-enc-g4', title: 'Tribal Bonfire', description: 'Talenta halflings gather for a feast and tale-telling under the stars', difficulty: 'Social', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-enc-urban', name: 'Urban Encounters', terrain: 'Urban',
      entries: [
        { id: 'tpl-eb-enc-u1', title: 'Boromar Clan Shakedown', description: 'Halfling gangsters from the Boromar Clan demand a "protection" fee', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-eb-enc-u2', title: 'Dragonmarked Agent', description: 'A House Cannith or Deneith agent approaches with a discreet job offer', difficulty: 'Social', weight: 2 },
        { id: 'tpl-eb-enc-u3', title: 'Warforged Protest', description: 'Warforged march for recognition and rights in the city streets', difficulty: 'Social', weight: 1 },
        { id: 'tpl-eb-enc-u4', title: 'Dark Lanterns Surveillance', description: 'Breland\'s intelligence service shadows the party through the crowds', difficulty: 'CR 4', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-eb-lm-plains', name: 'Plains Landmarks', terrain: 'Plains',
      entries: [
        { id: 'tpl-eb-lm-p1', title: 'Lightning Rail Station', description: 'A small station with a platform and ticket office, connecting remote areas to the rail network', rarity: 'Common', weight: 2 },
        { id: 'tpl-eb-lm-p2', title: 'War Memorial', description: 'A monument listing the fallen of the Last War, draped with faded regimental banners', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-p3', title: 'Orien Trade Post', description: 'A House Orien waystation offering courier services and caravan supplies', rarity: 'Common', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-lm-forest', name: 'Forest Landmarks', terrain: 'Forest',
      entries: [
        { id: 'tpl-eb-lm-f1', title: 'Manifest Zone (Lamannia)', description: 'A clearing where the Twilight Forest bleeds through — flora grows to enormous size', rarity: 'Rare', weight: 1 },
        { id: 'tpl-eb-lm-f2', title: 'Druid Sanctuary', description: 'An Eldeen Reaches grove maintained by the Wardens of the Wood', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-f3', title: 'Logging Camp', description: 'A frontier camp where laborers harvest timber for distant cities', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-lm-hills', name: 'Hills Landmarks', terrain: 'Hills',
      entries: [
        { id: 'tpl-eb-lm-h1', title: 'Dragonshard Mine', description: 'A Tharashk-operated mine extracting Eberron dragonshards from the hillside', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-h2', title: 'Goblin Ruins', description: 'Crumbling remnants of the Dhakaani Empire, carved into the hills', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-h3', title: 'Shepherd\'s Hamlet', description: 'A tiny settlement of goatherds and their families', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-eb-lm-m1', title: 'Airship Mooring Tower', description: 'A tall spire where House Lyrandar airships dock for resupply', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-m2', title: 'Dhakaani Fortress', description: 'A massive goblinoid stronghold sealed for millennia', rarity: 'Rare', weight: 1 },
        { id: 'tpl-eb-lm-m3', title: 'Mountain Monastery', description: 'A remote monastery of the Silver Flame, perched on a cliff', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-m4', title: 'Collapsed Mine', description: 'An abandoned mine, its entrance partially blocked by a rockslide', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-lm-coast', name: 'Coast Landmarks', terrain: 'Coast',
      entries: [
        { id: 'tpl-eb-lm-c1', title: 'Elemental Galleon Dock', description: 'A reinforced pier where bound-elemental vessels take on cargo', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-c2', title: 'Fishing Village', description: 'A weathered coastal community that supplies fresh catch to nearby cities', rarity: 'Common', weight: 2 },
        { id: 'tpl-eb-lm-c3', title: 'Smuggler\'s Cove', description: 'A hidden inlet used for moving contraband past Breland customs', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-lm-swamp', name: 'Swamp Landmarks', terrain: 'Swamp',
      entries: [
        { id: 'tpl-eb-lm-s1', title: 'Gatekeeper Seal', description: 'An ancient druidic ward holding an entrance to Khyber shut', rarity: 'Rare', weight: 1 },
        { id: 'tpl-eb-lm-s2', title: 'Khyber Shard Cluster', description: 'Deep dragonshards exposed by erosion, pulsing with dark energy', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-s3', title: 'Stilt Village', description: 'An orc settlement built on wooden platforms above the waterline', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-lm-mournland', name: 'Mournland Landmarks', terrain: 'Mournland',
      entries: [
        { id: 'tpl-eb-lm-ml1', title: 'Creation Forge', description: 'A ruined factory where warforged were once mass-produced, its forges still glowing', rarity: 'Rare', weight: 1 },
        { id: 'tpl-eb-lm-ml2', title: 'Glass Plateau', description: 'The ground has been fused into a smooth glass surface by the Mourning', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-ml3', title: 'Frozen Lightning', description: 'Bolts of lightning hang suspended in the air, crackling with perpetual energy', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-ml4', title: 'Cyre Capital Ruins', description: 'The shattered remnants of a once-great Cyran city, eerily preserved', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-eb-lm-grassland', name: 'Grassland Landmarks', terrain: 'Grassland',
      entries: [
        { id: 'tpl-eb-lm-g1', title: 'Dinosaur Nesting Ground', description: 'A trampled clearing where massive reptiles lay their eggs', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-g2', title: 'Talenta Holy Site', description: 'A circle of painted stones sacred to the halfling ancestor spirits', rarity: 'Rare', weight: 1 },
        { id: 'tpl-eb-lm-g3', title: 'Watering Hole', description: 'A natural spring where herds of dinosaurs and wild horses gather', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-eb-lm-urban', name: 'Urban Landmarks', terrain: 'Urban',
      entries: [
        { id: 'tpl-eb-lm-u1', title: 'Sivis Message Station', description: 'A House Sivis speaking stone hub for long-distance communication', rarity: 'Common', weight: 2 },
        { id: 'tpl-eb-lm-u2', title: 'Cannith Workshop', description: 'A House Cannith workshop producing magical goods and artifice', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-eb-lm-u3', title: 'Manifest Zone (Syrania)', description: 'A district where the Azure Sky bleeds through — buildings float and flight comes easily', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.55,
    encounterDensity: 0.4,
    landmarkDensity: 0.3,
    terrainVariety: 0.6,
  },
  factions: [
    { name: 'House Cannith', description: 'The Dragonmarked House of Making — master artificers and creators of the warforged', color: '#D4A017', goals: 'Reunify the fractured house and reclaim dominance in arcane manufacturing', tags: ['dragonmarked', 'artifice'] },
    { name: 'House Deneith', description: 'The Dragonmarked House of Sentinel — elite mercenaries and bodyguards', color: '#8B0000', goals: 'Secure military contracts across the Five Nations and expand the Blademark guild', tags: ['dragonmarked', 'military'] },
    { name: 'The Twelve', description: 'An alliance of dragonmarked houses cooperating on magical research and policy', color: '#4169E1', goals: 'Advance magitech innovation and maintain dragonmarked house influence', tags: ['political', 'arcane'] },
    { name: 'Lord of Blades', description: 'A messianic warforged leader who seeks to forge a warforged nation from the Mournland', color: '#4A4A4A', goals: 'Unite warforged, claim the Mournland, and end organic dominance', tags: ['warforged', 'militant'] },
    { name: 'Droaam', description: 'A monstrous nation ruled by the Daughters of Sora Kell — hags of legendary power', color: '#6B3FA0', goals: 'Gain international recognition and expand monstrous influence beyond their borders', tags: ['monstrous', 'political'] },
  ],
  regions: [
    { name: 'Sharn Hinterlands', color: '#808080', description: 'The farmlands, villages, and trade roads surrounding the City of Towers', tags: ['civilized', 'urban'] },
    { name: 'Mournland Border', color: '#9B8FB4', description: 'The haunted frontier where the dead-gray mist marks the edge of lost Cyre', tags: ['wasteland', 'dangerous'] },
    { name: 'Eldeen Reaches', color: '#2E8B57', description: 'A vast frontier of ancient forests defended by druids and rangers', tags: ['forest', 'nature'] },
    { name: 'Talenta Plains', color: '#B5D56A', description: 'Sweeping grasslands where halfling tribes ride dinosaurs and follow ancestral ways', tags: ['grassland', 'tribal'] },
  ],
  tags: ['magitech', 'noir', 'eberron'],
};
