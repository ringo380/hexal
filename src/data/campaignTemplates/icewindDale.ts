import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const icewindDaleTemplate: CampaignTemplate = {
  id: 'icewind-dale',
  name: 'Icewind Dale',
  description: 'Rime of the Frostmaiden-inspired frozen tundra — eternal winter, isolated settlements clinging to survival, and ancient evils stirring beneath the ice.',
  icon: 'snowflake',
  accentColor: '#00CED1',
  recommendedWidth: 25,
  recommendedHeight: 20,
  calendarPreset: 'forgotten-realms',
  startYear: 1489,
  terrainTypes: [
    { id: 'tpl-id-tundra', name: 'Tundra', colorHex: '#B0D4E8', icon: 'wind', weight: 3, moveCost: 2, elevation: 1, moisture: 1, temperature: 0, hazardLevel: 2, hazardType: 'Extreme Cold', hazardDescription: 'Biting winds and sub-zero temperatures threaten exposure', category: 'Arctic' },
    { id: 'tpl-id-frozen-forest', name: 'Frozen Forest', colorHex: '#2F6B6B', icon: 'tree', weight: 2, moveCost: 3, elevation: 2, moisture: 2, temperature: 0, hazardLevel: 2, hazardType: 'Extreme Cold', hazardDescription: 'Dense frost-covered pines conceal predators and deaden sound', category: 'Arctic' },
    { id: 'tpl-id-glacier', name: 'Glacier', colorHex: '#A8E0F0', icon: 'mountain', weight: 1, moveCost: 5, elevation: 4, moisture: 0, temperature: 0, hazardLevel: 3, hazardType: 'Crevasse', hazardDescription: 'Hidden crevasses split the ancient ice, swallowing the unwary', category: 'Arctic' },
    { id: 'tpl-id-mountains', name: 'Mountains', colorHex: '#8B8FAF', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 1, temperature: 0, hazardLevel: 2, hazardType: 'Avalanche', hazardDescription: 'Unstable snowpack threatens deadly slides', category: 'Highland' },
    { id: 'tpl-id-frozen-coast', name: 'Frozen Coast', colorHex: '#6AA5C4', icon: 'water', weight: 2, moveCost: 2, elevation: 0, moisture: 4, temperature: 0, hazardLevel: 1, hazardType: 'Thin Ice', hazardDescription: 'Coastal ice shifts and cracks without warning', category: 'Aquatic' },
    { id: 'tpl-id-snow-plains', name: 'Snow Plains', colorHex: '#D6E8F0', icon: 'wind', weight: 3, moveCost: 2, elevation: 1, moisture: 1, temperature: 0, hazardLevel: 1, hazardType: 'Blizzard', hazardDescription: 'Open terrain offers no shelter from sudden whiteout storms', category: 'Arctic' },
    { id: 'tpl-id-hills', name: 'Hills', colorHex: '#9FAFBF', icon: 'triangle', weight: 2, moveCost: 3, elevation: 3, moisture: 1, temperature: 0, hazardLevel: 1, hazardType: 'Extreme Cold', category: 'Highland' },
    { id: 'tpl-id-hot-springs', name: 'Hot Springs', colorHex: '#5FAF9F', icon: 'drop', weight: 1, moveCost: 1, elevation: 1, moisture: 5, temperature: 3, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-id-enc-tundra', name: 'Tundra Encounters', terrain: 'Tundra',
      entries: [
        { id: 'tpl-id-enc-t1', title: 'Frost Giant Patrol', description: 'A pair of frost giants march across the tundra, dragging a mammoth carcass', difficulty: 'CR 8', weight: 1 },
        { id: 'tpl-id-enc-t2', title: 'Yeti Ambush', description: 'A yeti bursts from a snowdrift, its white fur nearly invisible against the terrain', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-id-enc-t3', title: 'Arctic Fox Pack', description: 'A skulk of arctic foxes follows the party, scavenging scraps', difficulty: 'Social', weight: 2 },
        { id: 'tpl-id-enc-t4', title: 'Frozen Corpse', description: 'A perfectly preserved body clutches a map to a forgotten cache', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-enc-frozen-forest', name: 'Frozen Forest Encounters', terrain: 'Frozen Forest',
      entries: [
        { id: 'tpl-id-enc-ff1', title: 'Cold Wight Pack', description: 'Undead risen from a frozen battlefield stalk between the trees', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-id-enc-ff2', title: 'Awakened Trees', description: 'Frost druids have awakened the pines to guard their territory', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-id-enc-ff3', title: 'Trapped Hunter', description: 'A Ten-Towns hunter caught in a snare calls for help', difficulty: 'Social', weight: 2 },
        { id: 'tpl-id-enc-ff4', title: 'Ice Mephit Swarm', description: '2d4 ice mephits caper through the branches, pelting intruders with sleet', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-enc-glacier', name: 'Glacier Encounters', terrain: 'Glacier',
      entries: [
        { id: 'tpl-id-enc-g1', title: 'Remorhaz Eruption', description: 'The ice cracks and a remorhaz explodes from below, radiating searing heat', difficulty: 'CR 11', weight: 1 },
        { id: 'tpl-id-enc-g2', title: 'Ice Troll', description: 'A frost-adapted troll lurks in a crevasse, luring prey with echoed cries', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-id-enc-g3', title: 'Frozen Tomb', description: 'An ancient burial site entombed within the glacier, visible through the blue ice', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-id-enc-m1', title: 'White Dragon Flyby', description: 'A young white dragon surveys its territory from above, circling menacingly', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-id-enc-m2', title: 'Goliath Hunters', description: 'A goliath hunting party shares a fire and tales of recent prey', difficulty: 'Social', weight: 2 },
        { id: 'tpl-id-enc-m3', title: 'Avalanche!', description: 'A thunderous wall of snow cascades down the mountainside', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-id-enc-m4', title: 'Crag Cat Stalker', description: 'An invisible crag cat pads silently behind the party', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-enc-frozen-coast', name: 'Frozen Coast Encounters', terrain: 'Frozen Coast',
      entries: [
        { id: 'tpl-id-enc-fc1', title: 'Merrow Raiders', description: 'Aquatic ogres smash through the shore ice to attack', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-id-enc-fc2', title: 'Shipwreck on the Ice', description: 'A vessel trapped in the frozen sea, its crew long dead', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-id-enc-fc3', title: 'Seal Hunters', description: 'Reghed fishermen haul their catch from a breathing hole', difficulty: 'Social', weight: 2 },
      ]
    },
    {
      id: 'tpl-id-enc-snow-plains', name: 'Snow Plains Encounters', terrain: 'Snow Plains',
      entries: [
        { id: 'tpl-id-enc-sp1', title: 'Mammoth Herd', description: 'A herd of woolly mammoths trudges across the plains, guarded by Reghed riders', difficulty: 'Social', weight: 2 },
        { id: 'tpl-id-enc-sp2', title: 'Chardalyn Berserkers', description: 'Corrupted warriors driven mad by chardalyn exposure attack on sight', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-id-enc-sp3', title: 'Whiteout Blizzard', description: 'A sudden blizzard reduces visibility to nothing', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-id-enc-sp4', title: 'Winter Wolf Pack', description: 'Intelligent winter wolves coordinate an ambush', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-enc-hills', name: 'Hills Encounters', terrain: 'Hills',
      entries: [
        { id: 'tpl-id-enc-h1', title: 'Verbeeg Marauders', description: 'Verbeeg giants have set up camp in a sheltered hollow', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-id-enc-h2', title: 'Duergar Scouts', description: 'Gray dwarves survey the surface, plotting an incursion', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-id-enc-h3', title: 'Mountain Goat Trail', description: 'A narrow goat trail offers a shortcut through treacherous terrain', difficulty: 'Exploration', weight: 2 },
      ]
    },
    {
      id: 'tpl-id-enc-hot-springs', name: 'Hot Springs Encounters', terrain: 'Hot Springs',
      entries: [
        { id: 'tpl-id-enc-hs1', title: 'Steam Mephit Colony', description: 'Steam mephits bask in the thermal vents, territorial but negotiable', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-id-enc-hs2', title: 'Hermit Druid', description: 'A frost druid exile tends the hot springs and offers cryptic wisdom', difficulty: 'Social', weight: 2 },
        { id: 'tpl-id-enc-hs3', title: 'Elemental Rift', description: 'The boundary to the Elemental Plane of Water is thin here', difficulty: 'Exploration', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-id-lm-tundra', name: 'Tundra Landmarks', terrain: 'Tundra',
      entries: [
        { id: 'tpl-id-lm-t1', title: 'Aurora Stone', description: 'A standing stone that glows faintly when the aurora borealis dances overhead', rarity: 'Rare', weight: 1 },
        { id: 'tpl-id-lm-t2', title: 'Frost-Rimed Cairn', description: 'A burial cairn of the Reghed tribes, draped in permanent frost', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-t3', title: 'Chardalyn Deposit', description: 'Dark crystals jut from the frozen ground, radiating faint corruption', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-frozen-forest', name: 'Frozen Forest Landmarks', terrain: 'Frozen Forest',
      entries: [
        { id: 'tpl-id-lm-ff1', title: 'Petrified Treant', description: 'An enormous treant frozen mid-stride, its bark encased in ice', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-ff2', title: 'Wolf Den', description: 'A cave beneath ancient roots shelters a pack of arctic wolves', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-ff3', title: 'Druid Circle', description: 'A ring of frost-covered menhirs humming with primal magic', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-glacier', name: 'Glacier Landmarks', terrain: 'Glacier',
      entries: [
        { id: 'tpl-id-lm-g1', title: 'Ice Cave', description: 'A cavern of translucent blue ice, impossibly beautiful and treacherous', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-g2', title: 'Frozen Waterfall', description: 'A towering cascade of water suspended in mid-flow', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-g3', title: 'Giant\'s Skeleton', description: 'The bones of an ancient giant protrude from the glacier face', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-id-lm-m1', title: 'Dwarven Watchpost', description: 'An abandoned dwarven outpost carved into the cliff face', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-m2', title: 'Dragon\'s Perch', description: 'A high ledge scarred with claw marks and littered with frozen bones', rarity: 'Rare', weight: 1 },
        { id: 'tpl-id-lm-m3', title: 'Wind-Carved Pass', description: 'A narrow mountain pass sculpted by centuries of howling wind', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-id-lm-frozen-coast', name: 'Frozen Coast Landmarks', terrain: 'Frozen Coast',
      entries: [
        { id: 'tpl-id-lm-fc1', title: 'Iceberg Graveyard', description: 'A stretch of coast choked with beached icebergs', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-fc2', title: 'Frozen Lighthouse', description: 'A lighthouse entombed in ice, its beacon dark for decades', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-fc3', title: 'Sea Hag\'s Grotto', description: 'A cave beneath the ice shelf, reeking of brine and dark magic', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-snow-plains', name: 'Snow Plains Landmarks', terrain: 'Snow Plains',
      entries: [
        { id: 'tpl-id-lm-sp1', title: 'Reghed Camp Remains', description: 'Abandoned tent circles and fire pits mark a nomadic campsite', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-sp2', title: 'Buried Obelisk', description: 'Only the tip of an ancient Netherese obelisk protrudes from the snow', rarity: 'Rare', weight: 1 },
        { id: 'tpl-id-lm-sp3', title: 'Mammoth Boneyard', description: 'A field of massive bones half-buried in the permafrost', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-hills', name: 'Hills Landmarks', terrain: 'Hills',
      entries: [
        { id: 'tpl-id-lm-h1', title: 'Sheltered Hollow', description: 'A wind-protected depression offering rare respite from the cold', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-h2', title: 'Mine Entrance', description: 'A collapsed mine shaft, possibly leading to duergar tunnels', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-h3', title: 'Signal Fire Ring', description: 'A stone ring for signal fires, used by Ten-Towns scouts', rarity: 'Common', weight: 1 },
      ]
    },
    {
      id: 'tpl-id-lm-hot-springs', name: 'Hot Springs Landmarks', terrain: 'Hot Springs',
      entries: [
        { id: 'tpl-id-lm-hs1', title: 'Steaming Pool', description: 'A natural hot pool surrounded by lush moss — an oasis of warmth', rarity: 'Common', weight: 2 },
        { id: 'tpl-id-lm-hs2', title: 'Mineral Geyser', description: 'A geyser that erupts periodically, depositing colorful mineral rings', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-id-lm-hs3', title: 'Primordial Shrine', description: 'An ancient altar to a primordial, kept warm by geothermal heat', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.7,
    encounterDensity: 0.35,
    landmarkDensity: 0.2,
    terrainVariety: 0.4,
  },
  factions: [
    { name: 'Ten-Towns Council', description: 'The loose coalition of speakers governing Icewind Dale\'s ten settlements', color: '#4A90D9', goals: 'Protect the towns and maintain trade despite the endless winter', tags: ['political', 'civilized'] },
    { name: 'Reghed Nomads', description: 'Hardy barbarian tribes who follow the reindeer herds across the tundra', color: '#C47A3A', goals: 'Preserve ancestral traditions and survive the Frostmaiden\'s wrath', tags: ['tribal', 'nomadic'] },
    { name: 'Arcane Brotherhood', description: 'Power-hungry wizards from Luskan seeking forbidden knowledge in the ice', color: '#7B3FA0', goals: 'Uncover Netherese artifacts and arcane secrets buried beneath the glacier', tags: ['arcane', 'secretive'] },
    { name: 'Frost Druids', description: 'Fanatical servants of Auril who enforce the eternal winter', color: '#00B8D4', goals: 'Maintain Auril\'s everlasting rime and punish those who defy the cold', tags: ['religious', 'nature'] },
  ],
  regions: [
    { name: 'Ten-Towns', color: '#4A90D9', description: 'The scattered fishing settlements huddled around the three lakes of Icewind Dale', tags: ['civilized', 'settlements'] },
    { name: 'Sea of Moving Ice', color: '#6AA5C4', description: 'A vast expanse of shifting icebergs and frozen sea north of the coast', tags: ['aquatic', 'dangerous'] },
    { name: 'Spine of the World', color: '#8B8FAF', description: 'The impassable mountain range that walls off Icewind Dale from the south', tags: ['mountain', 'barrier'] },
    { name: 'Reghed Glacier', color: '#A8E0F0', description: 'An ancient glacier stretching for miles, hiding secrets beneath its frozen surface', tags: ['glacier', 'mysterious'] },
  ],
  tags: ['arctic', 'forgotten-realms', 'survival', 'horror'],
};
