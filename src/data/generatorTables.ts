// Default encounter and landmark tables for procedural generation
// Covers all 10 terrain types with 3-5 entries each

import type { EncounterTable, LandmarkTable } from '../types/Campaign';

export const DEFAULT_EXPANDED_ENCOUNTER_TABLES: EncounterTable[] = [
  {
    id: 'enc-plains',
    name: 'Plains Encounters',
    terrain: 'Plains',
    entries: [
      { id: 'enc-plains-1', title: 'Traveling Merchant', description: 'A merchant with a cart of goods', difficulty: 'Social', weight: 2 },
      { id: 'enc-plains-2', title: 'Gnoll Raiders', description: '1d6+2 gnolls on a raiding party', difficulty: 'CR 4', weight: 1 },
      { id: 'enc-plains-3', title: 'Ancient Battlefield', description: 'Bones and rusted weapons litter the ground', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-plains-4', title: 'Wild Horse Herd', description: 'A herd of wild horses grazes peacefully', difficulty: 'Social', weight: 1 },
    ]
  },
  {
    id: 'enc-forest',
    name: 'Forest Encounters',
    terrain: 'Forest',
    entries: [
      { id: 'enc-forest-1', title: 'Wolf Pack', description: '2d4 wolves hunting in the forest', difficulty: 'CR 2', weight: 2 },
      { id: 'enc-forest-2', title: 'Bandit Camp', description: 'A group of bandits has made camp here', difficulty: 'CR 3', weight: 1 },
      { id: 'enc-forest-3', title: 'Ancient Shrine', description: 'An overgrown shrine to a forgotten deity', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-forest-4', title: 'Treant Guardian', description: 'An ancient treant watches over this grove', difficulty: 'CR 9', weight: 1 },
      { id: 'enc-forest-5', title: 'Pixie Tricksters', description: 'Mischievous pixies play pranks on travelers', difficulty: 'Social', weight: 1 },
    ]
  },
  {
    id: 'enc-hills',
    name: 'Hills Encounters',
    terrain: 'Hills',
    entries: [
      { id: 'enc-hills-1', title: 'Ogre Den', description: 'An ogre has claimed a hillside cave', difficulty: 'CR 2', weight: 1 },
      { id: 'enc-hills-2', title: 'Shepherd Camp', description: 'A shepherd tends their flock on the hillside', difficulty: 'Social', weight: 2 },
      { id: 'enc-hills-3', title: 'Collapsed Mine', description: 'An old mine shaft has partially collapsed', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-hills-4', title: 'Hill Giant', description: 'A hill giant roams the area throwing boulders', difficulty: 'CR 5', weight: 1 },
    ]
  },
  {
    id: 'enc-mountains',
    name: 'Mountains Encounters',
    terrain: 'Mountains',
    entries: [
      { id: 'enc-mountains-1', title: 'Giant Eagle Nest', description: 'A pair of giant eagles have nested here', difficulty: 'CR 2', weight: 1 },
      { id: 'enc-mountains-2', title: 'Orc Warband', description: '2d6 orcs traveling through the pass', difficulty: 'CR 5', weight: 1 },
      { id: 'enc-mountains-3', title: "Dragon's Lair Entrance", description: 'A cave that leads deeper into the mountain', difficulty: 'CR 15+', weight: 1 },
      { id: 'enc-mountains-4', title: 'Mountain Hermit', description: 'A wise hermit lives in a secluded cave', difficulty: 'Social', weight: 1 },
      { id: 'enc-mountains-5', title: 'Rockslide', description: 'Unstable terrain triggers a dangerous rockslide', difficulty: 'Exploration', weight: 1 },
    ]
  },
  {
    id: 'enc-swamp',
    name: 'Swamp Encounters',
    terrain: 'Swamp',
    entries: [
      { id: 'enc-swamp-1', title: 'Lizardfolk Patrol', description: 'A patrol of lizardfolk guards their territory', difficulty: 'CR 3', weight: 1 },
      { id: 'enc-swamp-2', title: 'Will-o-Wisp', description: 'Ghostly lights lure travelers into quicksand', difficulty: 'CR 2', weight: 1 },
      { id: 'enc-swamp-3', title: 'Hag Cottage', description: 'A green hag lurks in a decrepit hut', difficulty: 'CR 5', weight: 1 },
      { id: 'enc-swamp-4', title: 'Sunken Treasure', description: 'Something glints beneath the murky water', difficulty: 'Exploration', weight: 1 },
    ]
  },
  {
    id: 'enc-desert',
    name: 'Desert Encounters',
    terrain: 'Desert',
    entries: [
      { id: 'enc-desert-1', title: 'Sand Worm', description: 'A massive worm burrows beneath the dunes', difficulty: 'CR 8', weight: 1 },
      { id: 'enc-desert-2', title: 'Oasis Mirage', description: 'Is that water ahead, or something else?', difficulty: 'Puzzle', weight: 1 },
      { id: 'enc-desert-3', title: 'Nomad Caravan', description: 'Desert nomads offer trade and shelter', difficulty: 'Social', weight: 2 },
      { id: 'enc-desert-4', title: 'Buried Ruins', description: 'Wind has uncovered ancient stone structures', difficulty: 'Exploration', weight: 1 },
    ]
  },
  {
    id: 'enc-coast',
    name: 'Coast Encounters',
    terrain: 'Coast',
    entries: [
      { id: 'enc-coast-1', title: 'Pirate Landing', description: 'Pirates have beached their ship for repairs', difficulty: 'CR 4', weight: 1 },
      { id: 'enc-coast-2', title: 'Merfolk Emissary', description: 'A merfolk surfaces to deliver a message', difficulty: 'Social', weight: 1 },
      { id: 'enc-coast-3', title: 'Shipwreck', description: 'The remains of a ship lie scattered on the shore', difficulty: 'Exploration', weight: 2 },
      { id: 'enc-coast-4', title: 'Sea Hag', description: 'A sea hag terrorizes coastal fishers', difficulty: 'CR 4', weight: 1 },
    ]
  },
  {
    id: 'enc-jungle',
    name: 'Jungle Encounters',
    terrain: 'Jungle',
    entries: [
      { id: 'enc-jungle-1', title: 'Yuan-ti Ambush', description: 'Snake people attack from the canopy', difficulty: 'CR 5', weight: 1 },
      { id: 'enc-jungle-2', title: 'Ancient Temple', description: 'A crumbling temple hidden by vines', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-jungle-3', title: 'Poisonous Flora', description: 'Beautiful flowers release toxic spores', difficulty: 'Puzzle', weight: 1 },
      { id: 'enc-jungle-4', title: 'Tribal Village', description: 'A hidden village of indigenous people', difficulty: 'Social', weight: 1 },
      { id: 'enc-jungle-5', title: 'Giant Spider Web', description: 'Massive webs block the path ahead', difficulty: 'CR 3', weight: 1 },
    ]
  },
  {
    id: 'enc-tundra',
    name: 'Tundra Encounters',
    terrain: 'Tundra',
    entries: [
      { id: 'enc-tundra-1', title: 'Frost Giant', description: 'A frost giant patrols the frozen waste', difficulty: 'CR 8', weight: 1 },
      { id: 'enc-tundra-2', title: 'Ice Storm', description: 'A sudden blizzard reduces visibility to nothing', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-tundra-3', title: 'Frozen Mammoth', description: 'A perfectly preserved mammoth lies in the ice', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-tundra-4', title: 'Yeti Pack', description: '1d4 yeti stalk travelers through the snow', difficulty: 'CR 3', weight: 1 },
    ]
  },
  {
    id: 'enc-grassland',
    name: 'Grassland Encounters',
    terrain: 'Grassland',
    entries: [
      { id: 'enc-grassland-1', title: 'Centaur Scouts', description: 'Centaurs patrol their territory', difficulty: 'Social', weight: 1 },
      { id: 'enc-grassland-2', title: 'Prairie Fire', description: 'A wildfire sweeps across the grassland', difficulty: 'Exploration', weight: 1 },
      { id: 'enc-grassland-3', title: 'Bison Stampede', description: 'A massive herd thunders across the plain', difficulty: 'CR 3', weight: 1 },
      { id: 'enc-grassland-4', title: 'Halfling Farmstead', description: 'A friendly halfling family offers hospitality', difficulty: 'Social', weight: 2 },
    ]
  },
];

export const DEFAULT_LANDMARK_TABLES: LandmarkTable[] = [
  {
    id: 'lm-plains',
    name: 'Plains Landmarks',
    terrain: 'Plains',
    entries: [
      { id: 'lm-plains-1', title: 'Standing Stones', description: 'A circle of ancient megaliths marks a ley line convergence', rarity: 'uncommon', weight: 2 },
      { id: 'lm-plains-2', title: 'Crossroads Inn', description: 'A well-known inn at a major crossroads', rarity: 'common', weight: 3 },
      { id: 'lm-plains-3', title: 'Windmill Tower', description: 'A tall windmill that serves as a local landmark', rarity: 'common', weight: 2 },
    ]
  },
  {
    id: 'lm-forest',
    name: 'Forest Landmarks',
    terrain: 'Forest',
    entries: [
      { id: 'lm-forest-1', title: 'Ancient Tree', description: 'A colossal tree said to be thousands of years old', rarity: 'rare', weight: 1 },
      { id: 'lm-forest-2', title: 'Druid Grove', description: 'A sacred clearing tended by druids', rarity: 'uncommon', weight: 2 },
      { id: 'lm-forest-3', title: 'Fairy Ring', description: 'A ring of mushrooms that marks a fey crossing', rarity: 'uncommon', weight: 2 },
      { id: 'lm-forest-4', title: 'Ranger Outpost', description: 'A hidden watchtower used by forest rangers', rarity: 'common', weight: 3 },
    ]
  },
  {
    id: 'lm-hills',
    name: 'Hills Landmarks',
    terrain: 'Hills',
    entries: [
      { id: 'lm-hills-1', title: 'Hilltop Fortress', description: 'The crumbling remains of a hilltop keep', rarity: 'uncommon', weight: 2 },
      { id: 'lm-hills-2', title: 'Quarry', description: 'An active stone quarry with workers', rarity: 'common', weight: 3 },
      { id: 'lm-hills-3', title: 'Burial Mound', description: 'An ancient barrow containing forgotten dead', rarity: 'uncommon', weight: 2 },
    ]
  },
  {
    id: 'lm-mountains',
    name: 'Mountains Landmarks',
    terrain: 'Mountains',
    entries: [
      { id: 'lm-mountains-1', title: 'Dwarven Hall', description: 'An entrance to an abandoned dwarven stronghold', rarity: 'rare', weight: 1 },
      { id: 'lm-mountains-2', title: 'Mountain Pass', description: 'A narrow pass through treacherous peaks', rarity: 'common', weight: 3 },
      { id: 'lm-mountains-3', title: 'Volcanic Vent', description: 'Steam and sulfur rise from a crack in the rock', rarity: 'uncommon', weight: 2 },
      { id: 'lm-mountains-4', title: 'Eagle Eyrie', description: 'A high nest with a commanding view of the region', rarity: 'uncommon', weight: 2 },
    ]
  },
  {
    id: 'lm-swamp',
    name: 'Swamp Landmarks',
    terrain: 'Swamp',
    entries: [
      { id: 'lm-swamp-1', title: 'Sunken Tower', description: 'A tower slowly sinking into the bog', rarity: 'rare', weight: 1 },
      { id: 'lm-swamp-2', title: 'Bog Island', description: 'A raised area of dry ground amid the swamp', rarity: 'common', weight: 3 },
      { id: 'lm-swamp-3', title: 'Sacred Spring', description: 'A natural spring with purportedly healing waters', rarity: 'uncommon', weight: 2 },
    ]
  },
  {
    id: 'lm-desert',
    name: 'Desert Landmarks',
    terrain: 'Desert',
    entries: [
      { id: 'lm-desert-1', title: 'Oasis', description: 'A life-giving source of water amid the sands', rarity: 'common', weight: 3 },
      { id: 'lm-desert-2', title: 'Pyramid', description: 'A massive stone pyramid half-buried in sand', rarity: 'rare', weight: 1 },
      { id: 'lm-desert-3', title: 'Petrified Forest', description: 'Ancient trees turned to stone by desert winds', rarity: 'uncommon', weight: 2 },
    ]
  },
  {
    id: 'lm-coast',
    name: 'Coast Landmarks',
    terrain: 'Coast',
    entries: [
      { id: 'lm-coast-1', title: 'Lighthouse', description: 'A tall lighthouse warns ships of rocky shoals', rarity: 'common', weight: 3 },
      { id: 'lm-coast-2', title: 'Sea Cave', description: 'A tidal cave accessible only at low tide', rarity: 'uncommon', weight: 2 },
      { id: 'lm-coast-3', title: 'Fishing Village', description: 'A small coastal settlement of fisherfolk', rarity: 'common', weight: 3 },
      { id: 'lm-coast-4', title: 'Coral Reef', description: 'A shallow reef teeming with marine life', rarity: 'uncommon', weight: 2 },
    ]
  },
  {
    id: 'lm-jungle',
    name: 'Jungle Landmarks',
    terrain: 'Jungle',
    entries: [
      { id: 'lm-jungle-1', title: 'Lost City', description: 'Ruins of an ancient civilization reclaimed by jungle', rarity: 'rare', weight: 1 },
      { id: 'lm-jungle-2', title: 'Waterfall', description: 'A spectacular waterfall cascading into a pool', rarity: 'uncommon', weight: 2 },
      { id: 'lm-jungle-3', title: 'Canopy Bridge', description: 'A rope bridge connecting massive trees', rarity: 'common', weight: 3 },
    ]
  },
  {
    id: 'lm-tundra',
    name: 'Tundra Landmarks',
    terrain: 'Tundra',
    entries: [
      { id: 'lm-tundra-1', title: 'Ice Cavern', description: 'A cavern carved from ancient glacial ice', rarity: 'uncommon', weight: 2 },
      { id: 'lm-tundra-2', title: 'Hot Spring', description: 'A geothermal spring melting the surrounding snow', rarity: 'uncommon', weight: 2 },
      { id: 'lm-tundra-3', title: 'Frost Monolith', description: 'A pillar of ice that never melts, covered in runes', rarity: 'rare', weight: 1 },
    ]
  },
  {
    id: 'lm-grassland',
    name: 'Grassland Landmarks',
    terrain: 'Grassland',
    entries: [
      { id: 'lm-grassland-1', title: 'Stone Circle', description: 'An ancient stone circle used for ceremonies', rarity: 'uncommon', weight: 2 },
      { id: 'lm-grassland-2', title: 'Trading Post', description: 'A frontier trading post at a trail junction', rarity: 'common', weight: 3 },
      { id: 'lm-grassland-3', title: 'Giant Anthill', description: 'An enormous mound built by giant ants', rarity: 'uncommon', weight: 2 },
      { id: 'lm-grassland-4', title: 'Watering Hole', description: 'A natural pond where animals gather to drink', rarity: 'common', weight: 3 },
    ]
  },
];
