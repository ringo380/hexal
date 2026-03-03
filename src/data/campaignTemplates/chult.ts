import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const chultTemplate: CampaignTemplate = {
  id: 'chult',
  name: 'Chult',
  description: 'A Tomb of Annihilation-style dense jungle peninsula — deadly, unexplored, and teeming with dinosaurs, undead, and ancient ruins.',
  icon: 'leaf',
  accentColor: '#006400',
  recommendedWidth: 30,
  recommendedHeight: 25,
  calendarPreset: 'forgotten-realms',
  startYear: 1492,
  terrainTypes: [
    { id: 'tpl-ch-dense-jungle', name: 'Dense Jungle', colorHex: '#1B5E20', icon: 'tree', weight: 3, moveCost: 3, elevation: 2, moisture: 5, temperature: 5, hazardLevel: 2, hazardType: 'Dense Undergrowth', category: 'Tropical' },
    { id: 'tpl-ch-light-jungle', name: 'Light Jungle', colorHex: '#388E3C', icon: 'leaf', weight: 2, moveCost: 2, elevation: 1, moisture: 4, temperature: 5, category: 'Tropical' },
    { id: 'tpl-ch-swamp', name: 'Swamp', colorHex: '#4E6B3A', icon: 'drop', weight: 2, moveCost: 3, elevation: 0, moisture: 5, temperature: 4, hazardLevel: 1, hazardType: 'Difficult Terrain', category: 'Aquatic' },
    { id: 'tpl-ch-mountains', name: 'Mountains', colorHex: '#78909C', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 2, temperature: 1, hazardLevel: 2, hazardType: 'Altitude', category: 'Highland' },
    { id: 'tpl-ch-river-delta', name: 'River Delta', colorHex: '#26A69A', icon: 'water', weight: 1, moveCost: 2, elevation: 0, moisture: 5, temperature: 4, category: 'Aquatic' },
    { id: 'tpl-ch-coast', name: 'Coast', colorHex: '#4FC3F7', icon: 'water', weight: 2, moveCost: 1, elevation: 0, moisture: 5, temperature: 4, category: 'Aquatic' },
    { id: 'tpl-ch-volcanic-waste', name: 'Volcanic Waste', colorHex: '#BF360C', icon: 'triangle', weight: 1, moveCost: 3, elevation: 3, moisture: 0, temperature: 5, hazardLevel: 3, hazardType: 'Volcanic Activity', category: 'Arid' },
    { id: 'tpl-ch-ruins', name: 'Ruins', colorHex: '#7E57C2', icon: 'sparkle', weight: 1, moveCost: 2, elevation: 2, moisture: 3, temperature: 4, category: 'Tropical' },
    { id: 'tpl-ch-plateau', name: 'Plateau', colorHex: '#A1887F', icon: 'wind', weight: 1, moveCost: 2, elevation: 4, moisture: 2, temperature: 3, category: 'Highland' },
  ],
  encounterTables: [
    {
      id: 'tpl-ch-enc-dense-jungle', name: 'Dense Jungle Encounters', terrain: 'Dense Jungle',
      entries: [
        { id: 'tpl-ch-enc-dj1', title: 'Tyrannosaurus Rex', description: 'The ground shakes as a massive predator crashes through the canopy', difficulty: 'CR 8', weight: 1 },
        { id: 'tpl-ch-enc-dj2', title: 'Vegepygmy Colony', description: 'Small plant creatures swarm from the undergrowth, defending their patch of russet mold', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-ch-enc-dj3', title: 'Zombie Horde', description: 'Shambling undead wander aimlessly, remnants of the death curse', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ch-enc-dj4', title: 'Giant Spider Ambush', description: 'Webs span the canopy above — enormous spiders descend silently', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-dj5', title: 'Goblin War Band', description: 'Batiri goblins wearing dinosaur masks stalk the party from the trees', difficulty: 'CR 2', weight: 2 },
      ]
    },
    {
      id: 'tpl-ch-enc-light-jungle', name: 'Light Jungle Encounters', terrain: 'Light Jungle',
      entries: [
        { id: 'tpl-ch-enc-lj1', title: 'Grung Patrol', description: 'Brightly colored frog-folk guard their territory with poisoned darts', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-ch-enc-lj2', title: 'Explorer Campsite', description: 'Abandoned gear and a cold campfire — signs of a hasty departure', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ch-enc-lj3', title: 'Pteranodon Flock', description: 'A flock of pteranodons roosts in the treetops, agitated by intruders', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-ch-enc-lj4', title: 'Triceratops Herd', description: 'A herd of triceratops grazes peacefully but may charge if startled', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-swamp', name: 'Swamp Encounters', terrain: 'Swamp',
      entries: [
        { id: 'tpl-ch-enc-sw1', title: 'Crocodile Nest', description: 'Giant crocodiles lurk beneath the murky water', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ch-enc-sw2', title: 'Will-o\'-Wisp', description: 'Ghostly lights lead travelers deeper into the mire', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-ch-enc-sw3', title: 'Yuan-ti Scout', description: 'A yuan-ti pureblood disguised as a lost traveler seeks information', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-sw4', title: 'Shambling Mound', description: 'A mass of rotting vegetation rises from the swamp', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-ch-enc-mt1', title: 'Firenewt Raiding Party', description: 'Firenewts mounted on giant striders patrol the volcanic slopes', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ch-enc-mt2', title: 'Pteranodon Aerie', description: 'Nesting pteranodons fiercely defend their clifftop roost', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-mt3', title: 'Rockslide', description: 'Loose stone gives way, sending boulders cascading downhill', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-river-delta', name: 'River Delta Encounters', terrain: 'River Delta',
      entries: [
        { id: 'tpl-ch-enc-rd1', title: 'Aldani Lobsterfolk', description: 'Reclusive crustacean humanoids emerge to trade or warn of danger', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ch-enc-rd2', title: 'Pirate Skiff', description: 'River pirates demand tribute from anyone passing through', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-rd3', title: 'Hippopotamus Pod', description: 'Aggressive hippos block the waterway and charge boats on sight', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-coast', name: 'Coast Encounters', terrain: 'Coast',
      entries: [
        { id: 'tpl-ch-enc-co1', title: 'Pirate Landing Party', description: 'Buccaneers row ashore to bury treasure or resupply', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-co2', title: 'Merchant Ship Wreck', description: 'A ship has run aground — survivors wave from the beach', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ch-enc-co3', title: 'Plesiosaurus', description: 'A long-necked predator surfaces near the shore', difficulty: 'CR 4', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-volcanic-waste', name: 'Volcanic Waste Encounters', terrain: 'Volcanic Waste',
      entries: [
        { id: 'tpl-ch-enc-vw1', title: 'Magma Mephit Swarm', description: 'Tiny elemental creatures erupt from fissures in the scorched earth', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ch-enc-vw2', title: 'Firenewt Warband', description: 'Firenewts worship the volcano and attack trespassers on sight', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ch-enc-vw3', title: 'Lava Fissure', description: 'The ground cracks open, revealing rivers of molten rock below', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ch-enc-vw4', title: 'Fire Snake Nest', description: 'Elemental serpents coil in the heated rocks', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-ruins', name: 'Ruins Encounters', terrain: 'Ruins',
      entries: [
        { id: 'tpl-ch-enc-ru1', title: 'Yuan-ti Ritual Site', description: 'Yuan-ti cultists perform a dark ritual among crumbling pillars', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-ch-enc-ru2', title: 'Undead Explorers', description: 'The risen dead of a previous expedition guard their final camp', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ch-enc-ru3', title: 'Trapped Corridor', description: 'Ancient Omuan traps still function after centuries of neglect', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ch-enc-ru4', title: 'Lich\'s Phylactery Guardian', description: 'A construct or bound spirit guards a hidden chamber', difficulty: 'CR 7', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-enc-plateau', name: 'Plateau Encounters', terrain: 'Plateau',
      entries: [
        { id: 'tpl-ch-enc-pl1', title: 'Aarakocra Scouts', description: 'Bird-folk circle overhead, watching for threats to their territory', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ch-enc-pl2', title: 'Dinosaur Stampede', description: 'A herd of herbivores thunders across the open ground', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ch-enc-pl3', title: 'Chultan Guide', description: 'A lone guide offers to lead the party through the wilderness — for a price', difficulty: 'Social', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-ch-lm-dense-jungle', name: 'Dense Jungle Landmarks', terrain: 'Dense Jungle',
      entries: [
        { id: 'tpl-ch-lm-dj1', title: 'Overgrown Shrine', description: 'A moss-covered shrine to a Chultan trickster god, barely visible beneath the canopy', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-dj2', title: 'Carnivorous Plant Grove', description: 'Giant flytraps and strangling vines dominate a sun-dappled clearing', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-dj3', title: 'Crashed Skyship', description: 'The wreckage of a Halruaan skyship, half-swallowed by jungle growth', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-light-jungle', name: 'Light Jungle Landmarks', terrain: 'Light Jungle',
      entries: [
        { id: 'tpl-ch-lm-lj1', title: 'Watering Hole', description: 'A large natural pool where dinosaurs come to drink', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-lj2', title: 'Grung Village', description: 'A treetop settlement of brightly painted grung', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-lj3', title: 'Giant Beehive', description: 'An enormous hive drips with honey — and danger', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-swamp', name: 'Swamp Landmarks', terrain: 'Swamp',
      entries: [
        { id: 'tpl-ch-lm-sw1', title: 'Sunken Canoe', description: 'A half-submerged canoe tangled in reeds, still loaded with supplies', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-sw2', title: 'Bubbling Tar Pit', description: 'A pool of natural tar traps unwary creatures and preserves ancient bones', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-sw3', title: 'Naga\'s Lair', description: 'A spirit naga dwells within a half-flooded stone chamber', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-ch-lm-mt1', title: 'Cliff Nesting Ground', description: 'Pteranodons nest on inaccessible cliff ledges high above', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-mt2', title: 'Volcanic Vent', description: 'Sulfurous steam hisses from cracks in the rock', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-mt3', title: 'Hidden Mine', description: 'An abandoned mine shaft leads deep into the mountain', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-river-delta', name: 'River Delta Landmarks', terrain: 'River Delta',
      entries: [
        { id: 'tpl-ch-lm-rd1', title: 'Fisherman\'s Stilt Hut', description: 'A rickety hut on stilts above the muddy water', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-rd2', title: 'Aldani Basin Stones', description: 'Carved standing stones mark the border of aldani territory', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-rd3', title: 'Submerged Statue', description: 'A colossal stone head peers above the waterline, its features worn smooth', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-coast', name: 'Coast Landmarks', terrain: 'Coast',
      entries: [
        { id: 'tpl-ch-lm-co1', title: 'Beached Shipwreck', description: 'A rotting hull lies half-buried in the sand, picked clean by scavengers', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-co2', title: 'Coral Formation', description: 'Vibrant coral visible in shallow turquoise water', rarity: 'Common', weight: 1 },
        { id: 'tpl-ch-lm-co3', title: 'Pirate Signal Tower', description: 'A crude watchtower used by pirates to signal passing ships', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-volcanic-waste', name: 'Volcanic Waste Landmarks', terrain: 'Volcanic Waste',
      entries: [
        { id: 'tpl-ch-lm-vw1', title: 'Obsidian Field', description: 'A glittering expanse of razor-sharp volcanic glass', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-vw2', title: 'Lava Tube', description: 'A natural tunnel carved by ancient lava flows, still warm to the touch', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-vw3', title: 'Petrified Forest', description: 'Stone trees stand as silent witnesses to a long-ago eruption', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-ruins', name: 'Ruins Landmarks', terrain: 'Ruins',
      entries: [
        { id: 'tpl-ch-lm-ru1', title: 'Omuan Ziggurat', description: 'A stepped pyramid rises above the jungle, its entrance choked with vines', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-ru2', title: 'Puzzle Cube Pedestal', description: 'A stone pedestal with Omuan glyphs — one of the legendary puzzle cubes may fit', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ch-lm-ru3', title: 'Collapsed Colonnade', description: 'Rows of fallen pillars hint at a once-grand processional way', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-ru4', title: 'Trickster God Mural', description: 'A faded wall painting depicts one of Omu\'s nine trickster gods', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ch-lm-plateau', name: 'Plateau Landmarks', terrain: 'Plateau',
      entries: [
        { id: 'tpl-ch-lm-pl1', title: 'Dinosaur Bone Yard', description: 'Bleached bones of enormous creatures litter the sun-baked ground', rarity: 'Common', weight: 2 },
        { id: 'tpl-ch-lm-pl2', title: 'Wind-Carved Mesa', description: 'A flat-topped mesa rises dramatically from the plateau', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ch-lm-pl3', title: 'Aarakocra Spire', description: 'A natural stone spire serves as a lookout for the bird-folk', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.7,
    encounterDensity: 0.5,
    landmarkDensity: 0.3,
    terrainVariety: 0.5,
  },
  factions: [
    { name: 'Merchant Princes', description: 'The wealthy rulers of Port Nyanzaru who control trade in and out of Chult', color: '#DAA520', goals: 'Maintain their monopoly on Chultan trade and keep the port prosperous', tags: ['political', 'mercantile'] },
    { name: 'Yuan-ti', description: 'Serpentine shapeshifters scheming to restore their ancient empire from the ruins of Omu', color: '#6A0DAD', goals: 'Reclaim Omu and bring about the return of Dendar the Night Serpent', tags: ['evil', 'secretive'] },
    { name: 'Order of the Gauntlet', description: 'Holy warriors who have established a forward base to combat undead plaguing the peninsula', color: '#DAA520', goals: 'Destroy the undead menace and find the source of the death curse', tags: ['religious', 'military'] },
    { name: 'Flaming Fist', description: 'Mercenary soldiers from Baldur\'s Gate seeking to establish colonial footholds in Chult', color: '#CC4400', goals: 'Secure territory, exploit resources, and project Baldurian power', tags: ['military', 'colonial'] },
  ],
  regions: [
    { name: 'Port Nyanzaru', color: '#DAA520', description: 'The only major settlement on Chult — a vibrant trade city ruled by merchant princes', tags: ['urban', 'trade'] },
    { name: 'Valley of Dread', color: '#1B5E20', description: 'A dense, perilous jungle valley overrun with undead and territorial dinosaurs', tags: ['jungle', 'dangerous'] },
    { name: 'Peaks of Flame', color: '#BF360C', description: 'Volcanic mountains wreathed in smoke and home to firenewts and fire elementals', tags: ['volcanic', 'highland'] },
    { name: 'Aldani Basin', color: '#26A69A', description: 'A vast river delta inhabited by reclusive lobster-folk and teeming with wildlife', tags: ['wetland', 'frontier'] },
  ],
  tags: ['jungle', 'forgotten-realms', 'deadly', 'exploration'],
};
