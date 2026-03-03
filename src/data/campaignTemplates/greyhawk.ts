import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const greyhawkTemplate: CampaignTemplate = {
  id: 'greyhawk',
  name: 'Greyhawk',
  description: 'The original campaign setting — classic medieval fantasy with political intrigue and ancient empires.',
  icon: 'sword',
  accentColor: '#8B4513',
  recommendedWidth: 30,
  recommendedHeight: 25,
  calendarPreset: 'greyhawk',
  startYear: 591,
  terrainTypes: [
    { id: 'tpl-gh-plains', name: 'Plains', colorHex: '#C8D87E', icon: 'leaf', weight: 3, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
    { id: 'tpl-gh-forest', name: 'Forest', colorHex: '#2E7D32', icon: 'tree', weight: 2, moveCost: 2, elevation: 2, moisture: 3, temperature: 2, category: 'Temperate' },
    { id: 'tpl-gh-hills', name: 'Hills', colorHex: '#C9A96E', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, moisture: 2, temperature: 2, category: 'Temperate' },
    { id: 'tpl-gh-mountains', name: 'Mountains', colorHex: '#9E9E9E', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 1, temperature: 0, hazardLevel: 2, hazardType: 'Altitude', category: 'Highland' },
    { id: 'tpl-gh-swamp', name: 'Swamp', colorHex: '#4A6741', icon: 'drop', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 3, hazardLevel: 1, hazardType: 'Difficult Terrain', category: 'Aquatic' },
    { id: 'tpl-gh-desert', name: 'Desert', colorHex: '#E8C872', icon: 'sun', weight: 1, moveCost: 2, elevation: 1, moisture: 0, temperature: 5, hazardLevel: 1, hazardType: 'Extreme Heat', category: 'Arid' },
    { id: 'tpl-gh-coast', name: 'Coast', colorHex: '#80BFDD', icon: 'water', weight: 2, moveCost: 1, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-gh-grassland', name: 'Grassland', colorHex: '#A4C639', icon: 'wind', weight: 2, moveCost: 1, elevation: 1, moisture: 2, temperature: 3, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-gh-enc-plains', name: 'Plains Encounters', terrain: 'Plains',
      entries: [
        { id: 'tpl-gh-enc-p1', title: 'Orcish War Band', description: 'A raiding party from the Pomarj sweeps across the plains', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-gh-enc-p2', title: 'Merchant Train', description: 'Traders from Dyvers hauling goods along the old road', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-p3', title: 'Bandit Toll Station', description: 'Brigands demand payment at a narrow bridge crossing', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-gh-enc-p4', title: 'Griffon Hunting Pair', description: 'Two griffons circle overhead, eyeing horses and livestock', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-forest', name: 'Forest Encounters', terrain: 'Forest',
      entries: [
        { id: 'tpl-gh-enc-f1', title: 'Elven Border Patrol', description: 'High elven scouts challenge trespassers in the Vesve', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-f2', title: 'Owlbear Territory', description: 'A mated pair of owlbears defends their hunting ground', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-gh-enc-f3', title: 'Goblin Ambush', description: '2d6 goblins with shortbows hidden in the underbrush', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-gh-enc-f4', title: 'Druidic Conclave', description: 'Old Faith druids gather at a sacred oak', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-hills', name: 'Hills Encounters', terrain: 'Hills',
      entries: [
        { id: 'tpl-gh-enc-h1', title: 'Hill Giant Foragers', description: 'A pair of hill giants hurling boulders at anything that moves', difficulty: 'CR 7', weight: 1 },
        { id: 'tpl-gh-enc-h2', title: 'Gnomish Prospectors', description: 'Rock gnomes panning for gems in a hillside stream', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-h3', title: 'Troll Under the Bridge', description: 'A troll has claimed a stone bridge and demands tribute in meat', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-gh-enc-h4', title: 'Hobgoblin Scouts', description: 'Disciplined hobgoblin outriders surveying the territory', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-gh-enc-m1', title: 'Dwarven Sentinels', description: 'Armed dwarves guard the approach to a hidden mountain hold', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-m2', title: 'Wyvern Nest', description: 'A wyvern has made its lair on a high ledge above the pass', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-gh-enc-m3', title: 'Ogre Bandits', description: 'Ogres blockade a narrow defile demanding "toll rocks"', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-gh-enc-m4', title: 'Rockslide', description: 'Loose scree threatens to sweep travelers off the trail', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-swamp', name: 'Swamp Encounters', terrain: 'Swamp',
      entries: [
        { id: 'tpl-gh-enc-s1', title: 'Lizardfolk Warband', description: 'Lizardfolk emerge from the murk to defend their nesting grounds', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-gh-enc-s2', title: 'Will-o\'-Wisps', description: 'Flickering lights lure travelers deeper into the bog', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-gh-enc-s3', title: 'Green Hag', description: 'A hag offers bargains from her half-sunken hovel', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-desert', name: 'Desert Encounters', terrain: 'Desert',
      entries: [
        { id: 'tpl-gh-enc-d1', title: 'Nomad Horsemen', description: 'Baklunish riders offer water in exchange for news', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-d2', title: 'Giant Scorpions', description: '1d4 giant scorpions burst from the sand', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-gh-enc-d3', title: 'Sandstorm', description: 'A wall of blinding sand descends without warning', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-gh-enc-d4', title: 'Blue Dragon Flyover', description: 'A young blue dragon streaks across the sky, lightning crackling', difficulty: 'CR 6', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-coast', name: 'Coast Encounters', terrain: 'Coast',
      entries: [
        { id: 'tpl-gh-enc-c1', title: 'Pirate Landing Party', description: 'Sea Princes raiders come ashore in longboats', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-gh-enc-c2', title: 'Fishermen\'s Village', description: 'A small coastal hamlet offers hospitality and rumors', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-c3', title: 'Sahuagin Ambush', description: 'Sea devils surface to drag victims beneath the waves', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-enc-grassland', name: 'Grassland Encounters', terrain: 'Grassland',
      entries: [
        { id: 'tpl-gh-enc-g1', title: 'Centaur Herd', description: 'A band of centaurs canters past, wary but not hostile', difficulty: 'Social', weight: 2 },
        { id: 'tpl-gh-enc-g2', title: 'Ankheg Eruption', description: 'Burrowing ankhegs explode from the earth beneath the party', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-gh-enc-g3', title: 'Traveling Bard', description: 'A lone bard trades songs and stories for a meal', difficulty: 'Social', weight: 1 },
        { id: 'tpl-gh-enc-g4', title: 'Gnoll Raider Pack', description: 'Cackling gnolls fan out across the grass in a hunting formation', difficulty: 'CR 4', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-gh-lm-plains', name: 'Plains Landmarks', terrain: 'Plains',
      entries: [
        { id: 'tpl-gh-lm-p1', title: 'Oeridian Watchtower', description: 'A crumbling stone tower from the Great Kingdom era, still useful as a lookout', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-p2', title: 'Roadside Shrine', description: 'A weathered shrine to Fharlanghn, god of roads and travel', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-p3', title: 'Suel Boundary Marker', description: 'An ancient obelisk inscribed in the lost Suel tongue', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-forest', name: 'Forest Landmarks', terrain: 'Forest',
      entries: [
        { id: 'tpl-gh-lm-f1', title: 'Druidic Standing Stones', description: 'A circle of moss-covered menhirs radiating faint nature magic', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-gh-lm-f2', title: 'Elven Waymarker', description: 'A carved tree trunk marking safe passage through the forest', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-f3', title: 'Fey Crossing', description: 'The barrier between the Flanaess and the Feywild is gossamer-thin here', rarity: 'Rare', weight: 1 },
        { id: 'tpl-gh-lm-f4', title: 'Ruined Flan Shrine', description: 'Pre-Oeridian stonework hidden beneath centuries of growth', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-hills', name: 'Hills Landmarks', terrain: 'Hills',
      entries: [
        { id: 'tpl-gh-lm-h1', title: 'Ancient Barrow Mound', description: 'A burial tumulus from the Age of Migrations, sealed with rune-carved stone', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-gh-lm-h2', title: 'Shepherd\'s Cairn', description: 'A pile of stacked stones marking the trail to higher pastures', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-h3', title: 'Iron Mine Entrance', description: 'An abandoned mine shaft bored into the hillside', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-gh-lm-m1', title: 'Dwarven Hold Gate', description: 'Massive stone doors sealed since the fall of an ancient clan', rarity: 'Rare', weight: 1 },
        { id: 'tpl-gh-lm-m2', title: 'Hot Spring', description: 'A steaming pool on a high shelf, overlooking the valley below', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-m3', title: 'Ruins of Suel', description: 'Shattered columns and arches of the Suel Imperium, half-buried in snow', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-swamp', name: 'Swamp Landmarks', terrain: 'Swamp',
      entries: [
        { id: 'tpl-gh-lm-s1', title: 'Sunken Causeway', description: 'An old stone road barely visible beneath the muck', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-s2', title: 'Gas Vents', description: 'Bubbling pools of foul-smelling methane — one spark and the whole area ignites', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-gh-lm-s3', title: 'Hag\'s Cauldron', description: 'A massive iron pot sits atop a permanently smoldering peat fire', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-desert', name: 'Desert Landmarks', terrain: 'Desert',
      entries: [
        { id: 'tpl-gh-lm-d1', title: 'Oasis', description: 'A cluster of palms around a freshwater spring, a lifeline in the wastes', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-gh-lm-d2', title: 'Sand-Buried Pyramid', description: 'Only the capstone of an ancient pyramid protrudes from the dunes', rarity: 'Rare', weight: 1 },
        { id: 'tpl-gh-lm-d3', title: 'Wind-Carved Arch', description: 'A natural sandstone arch large enough to shelter a caravan', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-gh-lm-coast', name: 'Coast Landmarks', terrain: 'Coast',
      entries: [
        { id: 'tpl-gh-lm-c1', title: 'Wrecked Galleon', description: 'A barnacle-encrusted hulk beached on the rocks', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-gh-lm-c2', title: 'Sea Caves', description: 'Tide-carved grottos accessible only at low water', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-c3', title: 'Lighthouse of the Old Faith', description: 'An ancient beacon tower maintained by a reclusive hermit', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-gh-lm-grassland', name: 'Grassland Landmarks', terrain: 'Grassland',
      entries: [
        { id: 'tpl-gh-lm-g1', title: 'Standing Stone', description: 'A lone menhir carved with Flan astronomical symbols', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-g2', title: 'Nomad Camp Ring', description: 'A circle of blackened fire pits and flattened grass from seasonal gatherings', rarity: 'Common', weight: 2 },
        { id: 'tpl-gh-lm-g3', title: 'Chariot Burial', description: 'A grass-covered mound concealing an ancient warlord\'s war chariot', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.6,
    encounterDensity: 0.4,
    landmarkDensity: 0.25,
    terrainVariety: 0.55,
  },
  factions: [
    { name: 'Circle of Eight', description: 'A cabal of powerful archmages safeguarding the balance of power across the Flanaess', color: '#7B68EE', goals: 'Maintain the balance of power and prevent any one faction from dominating', tags: ['arcane', 'political'] },
    { name: 'Scarlet Brotherhood', description: 'Secretive Suel supremacists operating from the Tilvanot Peninsula', color: '#DC143C', goals: 'Restore the glory of the Suel Imperium and achieve dominion over all lesser peoples', tags: ['secret', 'expansionist'] },
    { name: 'Knights of the Hart', description: 'A chivalric order defending Furyondy, Veluna, and the Highfolk from evil', color: '#228B22', goals: 'Defend the free peoples of the Flanaess against Iuz and other tyrants', tags: ['military', 'chivalric'] },
    { name: 'Iuz the Old', description: 'The demigod of deceit and pain, ruling his empire of wickedness from Dorakaa', color: '#4B0082', goals: 'Conquer the Flanaess and establish an eternal reign of suffering', tags: ['evil', 'demonic'] },
  ],
  regions: [
    { name: 'Wild Coast', color: '#DAA520', description: 'A lawless strip of independent towns between the Woolly Bay and the Welkwood', tags: ['frontier', 'coastal'] },
    { name: 'Vesve Forest', color: '#2E7D32', description: 'A vast primeval woodland contested by elves, gnomes, and the forces of Iuz', tags: ['forest', 'contested'] },
    { name: 'Nyr Dyv Shores', color: '#4682B4', description: 'The fertile lands surrounding the Lake of Unknown Depths, breadbasket of the central Flanaess', tags: ['lake', 'civilized'] },
    { name: 'Barrier Peaks', color: '#9E9E9E', description: 'A forbidding mountain range rumored to hold alien ruins and strange technology', tags: ['mountain', 'mysterious'] },
  ],
  tags: ['classic', 'greyhawk', 'political'],
};
