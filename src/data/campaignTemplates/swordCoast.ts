import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const swordCoastTemplate: CampaignTemplate = {
  id: 'sword-coast',
  name: 'Sword Coast',
  description: 'The iconic Forgotten Realms frontier — from Waterdeep to Baldur\'s Gate, with wild coastline, deep forests, and ancient ruins.',
  icon: 'shield',
  accentColor: '#4a9eff',
  recommendedWidth: 30,
  recommendedHeight: 25,
  calendarPreset: 'forgotten-realms',
  startYear: 1492,
  terrainTypes: [
    { id: 'tpl-sc-plains', name: 'Plains', colorHex: '#90EE90', icon: 'leaf', weight: 3, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
    { id: 'tpl-sc-forest', name: 'Forest', colorHex: '#228B22', icon: 'tree', weight: 2, moveCost: 2, elevation: 2, moisture: 3, temperature: 2, category: 'Temperate' },
    { id: 'tpl-sc-hills', name: 'Hills', colorHex: '#DEB887', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, moisture: 2, temperature: 2, category: 'Temperate' },
    { id: 'tpl-sc-mountains', name: 'Mountains', colorHex: '#A0A0A0', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 1, temperature: 0, hazardLevel: 2, hazardType: 'Altitude', category: 'Highland' },
    { id: 'tpl-sc-coast', name: 'Coast', colorHex: '#87CEEB', icon: 'water', weight: 2, moveCost: 1, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-sc-farmland', name: 'Farmland', colorHex: '#DAA520', icon: 'leaf', weight: 2, moveCost: 1, elevation: 1, moisture: 3, temperature: 3, category: 'Temperate' },
    { id: 'tpl-sc-swamp', name: 'Swamp', colorHex: '#556B2F', icon: 'drop', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 3, hazardLevel: 1, hazardType: 'Difficult Terrain', category: 'Aquatic' },
    { id: 'tpl-sc-grassland', name: 'Grassland', colorHex: '#7CFC00', icon: 'wind', weight: 2, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
    { id: 'tpl-sc-desert', name: 'Desert', colorHex: '#F4A460', icon: 'sun', weight: 1, moveCost: 2, elevation: 1, moisture: 0, temperature: 5, hazardLevel: 1, hazardType: 'Extreme Heat', category: 'Arid' },
  ],
  encounterTables: [
    {
      id: 'tpl-sc-enc-plains', name: 'Plains Encounters', terrain: 'Plains',
      entries: [
        { id: 'tpl-sc-enc-p1', title: 'Zhentarim Patrol', description: 'A Black Network patrol questions travelers on the Trade Way', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-sc-enc-p2', title: 'Merchant Caravan', description: 'A well-guarded caravan travels between Waterdeep and Baldur\'s Gate', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-p3', title: 'Goblin Ambush', description: '2d4 goblins spring from hiding along the road', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-sc-enc-p4', title: 'Ruined Watchtower', description: 'An old Lords\' Alliance watchtower, now home to squatters', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-forest', name: 'Forest Encounters', terrain: 'Forest',
      entries: [
        { id: 'tpl-sc-enc-f1', title: 'Emerald Enclave Rangers', description: 'Druids tracking an unnatural blight through the woods', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-f2', title: 'Owlbear Den', description: 'A territorial owlbear guards its nest', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-sc-enc-f3', title: 'Elven Ruins', description: 'Crumbling elven structures overgrown with vines', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-sc-enc-f4', title: 'Bandit Hideout', description: 'Bandits have fortified a forest clearing', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-hills', name: 'Hills Encounters', terrain: 'Hills',
      entries: [
        { id: 'tpl-sc-enc-h1', title: 'Gnoll War Party', description: '1d6+3 gnolls raiding the countryside', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-sc-enc-h2', title: 'Halfling Village', description: 'A welcoming halfling settlement built into the hillside', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-h3', title: 'Ancient Barrow', description: 'A burial mound radiates necromantic energy', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-sc-enc-m1', title: 'Orc Stronghold', description: 'A fortified orc encampment blocks the mountain pass', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-sc-enc-m2', title: 'Dwarven Prospectors', description: 'Dwarves from Mithral Hall searching for ore veins', difficulty: 'Social', weight: 1 },
        { id: 'tpl-sc-enc-m3', title: 'White Dragon Sighting', description: 'A young white dragon circles overhead', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-sc-enc-m4', title: 'Mountain Pass Avalanche', description: 'Loose snow threatens to bury the trail', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-coast', name: 'Coast Encounters', terrain: 'Coast',
      entries: [
        { id: 'tpl-sc-enc-c1', title: 'Sahuagin Raiding Party', description: 'Sea devils emerge from the waves at dusk', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-sc-enc-c2', title: 'Shipwreck Survivors', description: 'Desperate sailors cling to wreckage on the shore', difficulty: 'Social', weight: 1 },
        { id: 'tpl-sc-enc-c3', title: 'Smuggler\'s Cove', description: 'A hidden cove used by the Zhentarim for illicit trade', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-farmland', name: 'Farmland Encounters', terrain: 'Farmland',
      entries: [
        { id: 'tpl-sc-enc-fl1', title: 'Scarecrow Sentinels', description: 'Animated scarecrows guard a cursed field', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-sc-enc-fl2', title: 'Harvest Festival', description: 'Villagers celebrate a bountiful harvest', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-fl3', title: 'Crop Blight', description: 'A mysterious disease withers the fields — fey or fiendish?', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-swamp', name: 'Swamp Encounters', terrain: 'Swamp',
      entries: [
        { id: 'tpl-sc-enc-s1', title: 'Lizardfolk Tribe', description: 'Lizardfolk defend their ancestral marsh territory', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-sc-enc-s2', title: 'Hag Coven', description: 'Three hags scheme in a rotting cottage', difficulty: 'CR 7', weight: 1 },
        { id: 'tpl-sc-enc-s3', title: 'Sunken Temple', description: 'Ancient stonework barely visible above the murky water', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-grassland', name: 'Grassland Encounters', terrain: 'Grassland',
      entries: [
        { id: 'tpl-sc-enc-g1', title: 'Wild Horse Herd', description: 'Magnificent wild horses gallop across the open grass', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-g2', title: 'Ankhegs', description: 'Giant burrowing insects erupt from the ground', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-sc-enc-g3', title: 'Standing Stones', description: 'A circle of ancient megaliths hums with residual magic', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-enc-desert', name: 'Desert Encounters', terrain: 'Desert',
      entries: [
        { id: 'tpl-sc-enc-d1', title: 'Sand Wyrm', description: 'A young purple worm bursts from the sand', difficulty: 'CR 8', weight: 1 },
        { id: 'tpl-sc-enc-d2', title: 'Bedine Nomads', description: 'Desert tribespeople offer water and guidance', difficulty: 'Social', weight: 2 },
        { id: 'tpl-sc-enc-d3', title: 'Buried Netherese Ruin', description: 'Wind has exposed ancient Netherese architecture', difficulty: 'Exploration', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-sc-lm-plains', name: 'Plains Landmarks', terrain: 'Plains',
      entries: [
        { id: 'tpl-sc-lm-p1', title: 'Milestone Marker', description: 'A weathered stone marker along the Trade Way', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-p2', title: 'Abandoned Farmstead', description: 'A deserted farm with an intact root cellar', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-p3', title: 'Harper Signal Stone', description: 'A stone carved with a hidden Harper cipher', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-forest', name: 'Forest Landmarks', terrain: 'Forest',
      entries: [
        { id: 'tpl-sc-lm-f1', title: 'Ancient Oak', description: 'A massive oak tree, possibly home to dryads', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-f2', title: 'Druid Grove', description: 'A sacred circle maintained by the Emerald Enclave', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-f3', title: 'Fey Crossing', description: 'The boundary between worlds is thin here', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-hills', name: 'Hills Landmarks', terrain: 'Hills',
      entries: [
        { id: 'tpl-sc-lm-h1', title: 'Shepherd\'s Lookout', description: 'A hilltop vantage point with carved stone seats', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-h2', title: 'Dwarven Waystation', description: 'A small rest stop carved into the hillside', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-h3', title: 'Buried Treasure Cache', description: 'Someone hid valuables beneath a distinctive boulder', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-sc-lm-m1', title: 'Mountain Spring', description: 'Crystal clear water flows from the rock face', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-m2', title: 'Giant\'s Staircase', description: 'Enormous stone steps carved into the mountainside', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-m3', title: 'Dragon\'s Perch', description: 'A high ledge with claw marks and scorch marks', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-coast', name: 'Coast Landmarks', terrain: 'Coast',
      entries: [
        { id: 'tpl-sc-lm-c1', title: 'Tidal Pools', description: 'Colorful pools teeming with small sea creatures', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-c2', title: 'Lighthouse Ruin', description: 'A crumbling lighthouse on a rocky headland', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-c3', title: 'Sea Cave', description: 'A cavern accessible only at low tide', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-farmland', name: 'Farmland Landmarks', terrain: 'Farmland',
      entries: [
        { id: 'tpl-sc-lm-fl1', title: 'Village Well', description: 'A communal well at a crossroads', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-fl2', title: 'Grain Silo', description: 'A large stone silo storing the region\'s harvest', rarity: 'Common', weight: 1 },
        { id: 'tpl-sc-lm-fl3', title: 'Shrine to Chauntea', description: 'A small roadside shrine to the harvest goddess', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-swamp', name: 'Swamp Landmarks', terrain: 'Swamp',
      entries: [
        { id: 'tpl-sc-lm-s1', title: 'Gnarled Cypress', description: 'An enormous, ancient cypress draped in moss', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-s2', title: 'Bubbling Bog', description: 'Methane vents create an eerie, flammable mist', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-s3', title: 'Sunken Statue', description: 'A massive stone head peers above the waterline', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-grassland', name: 'Grassland Landmarks', terrain: 'Grassland',
      entries: [
        { id: 'tpl-sc-lm-g1', title: 'Lone Tree', description: 'A single large tree visible for miles', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-g2', title: 'Ancient Cairn', description: 'A pile of stones marking a forgotten grave', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-g3', title: 'Fairy Ring', description: 'A perfect circle of mushrooms with faint magical aura', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-sc-lm-desert', name: 'Desert Landmarks', terrain: 'Desert',
      entries: [
        { id: 'tpl-sc-lm-d1', title: 'Rock Formation', description: 'Wind-carved sandstone pillars rise from the dunes', rarity: 'Common', weight: 2 },
        { id: 'tpl-sc-lm-d2', title: 'Desert Oasis', description: 'A small pool of fresh water surrounded by palms', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-sc-lm-d3', title: 'Netherese Obelisk', description: 'A floating obelisk inscribed with arcane runes', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.65,
    encounterDensity: 0.4,
    landmarkDensity: 0.25,
    terrainVariety: 0.6,
  },
  factions: [
    { name: 'Lords\' Alliance', description: 'A coalition of rulers maintaining order along the Sword Coast', color: '#4a9eff', goals: 'Protect civilization and ensure mutual prosperity', tags: ['political', 'military'] },
    { name: 'Zhentarim', description: 'The Black Network — a shadowy organization seeking wealth and influence', color: '#333333', goals: 'Expand trade networks and consolidate power', tags: ['criminal', 'mercantile'] },
    { name: 'Emerald Enclave', description: 'Druids and rangers dedicated to preserving the natural world', color: '#228B22', goals: 'Maintain the balance of nature', tags: ['nature', 'druidic'] },
    { name: 'Harpers', description: 'A secret network of spies and informants working against tyranny', color: '#9c27b0', goals: 'Promote goodness and equality, thwart evil', tags: ['secret', 'intelligence'] },
    { name: 'Order of the Gauntlet', description: 'Holy warriors dedicated to smiting evil', color: '#DAA520', goals: 'Destroy evil wherever it lurks', tags: ['religious', 'military'] },
  ],
  regions: [
    { name: 'Waterdeep Environs', color: '#4a9eff', description: 'The lands surrounding the City of Splendors', tags: ['urban', 'civilized'] },
    { name: 'Mere of Dead Men', color: '#556B2F', description: 'A vast, haunted salt marsh stretching along the coast', tags: ['swamp', 'dangerous'] },
    { name: 'Kryptgarden Forest', color: '#228B22', description: 'An ancient forest home to a fearsome green dragon', tags: ['forest', 'draconic'] },
    { name: 'Sword Mountains', color: '#A0A0A0', description: 'Rugged peaks harboring orc tribes and ancient mines', tags: ['mountain', 'frontier'] },
  ],
  tags: ['classic', 'forgotten-realms', 'frontier'],
};
