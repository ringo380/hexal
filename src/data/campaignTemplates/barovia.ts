import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const baroviaTemplate: CampaignTemplate = {
  id: 'barovia',
  name: 'Barovia',
  description: 'A Curse of Strahd gothic horror setting — a dark domain of dread trapped in mist, ruled by an immortal vampire lord.',
  icon: 'skull',
  accentColor: '#8B0000',
  recommendedWidth: 12,
  recommendedHeight: 10,
  calendarPreset: 'simple',
  startYear: 735,
  terrainTypes: [
    { id: 'tpl-ba-dark-forest', name: 'Dark Forest', colorHex: '#1A3A1A', icon: 'tree', weight: 3, moveCost: 3, elevation: 2, moisture: 3, temperature: 1, hazardLevel: 2, hazardType: 'Supernatural Darkness', category: 'Temperate' },
    { id: 'tpl-ba-moors', name: 'Moors', colorHex: '#5C6B4E', icon: 'wind', weight: 2, moveCost: 2, elevation: 1, moisture: 4, temperature: 1, hazardLevel: 1, hazardType: 'Mist Hazard', category: 'Temperate' },
    { id: 'tpl-ba-mountains', name: 'Mountains', colorHex: '#6B6B6B', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, moisture: 1, temperature: 0, hazardLevel: 2, hazardType: 'Altitude', category: 'Highland' },
    { id: 'tpl-ba-swamp', name: 'Swamp', colorHex: '#3B4A2A', icon: 'drop', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 1, hazardLevel: 1, hazardType: 'Difficult Terrain', category: 'Aquatic' },
    { id: 'tpl-ba-farmland', name: 'Farmland', colorHex: '#8B7D5B', icon: 'leaf', weight: 2, moveCost: 1, elevation: 1, moisture: 3, temperature: 2, category: 'Temperate' },
    { id: 'tpl-ba-hills', name: 'Hills', colorHex: '#7A6F5D', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, moisture: 2, temperature: 1, category: 'Temperate' },
    { id: 'tpl-ba-lake', name: 'Lake', colorHex: '#1A3A5C', icon: 'water', weight: 1, moveCost: 2, elevation: 0, moisture: 5, temperature: 1, category: 'Aquatic' },
  ],
  encounterTables: [
    {
      id: 'tpl-ba-enc-dark-forest', name: 'Dark Forest Encounters', terrain: 'Dark Forest',
      entries: [
        { id: 'tpl-ba-enc-df1', title: 'Wolf Pack', description: 'A pack of unnaturally large wolves stalks the party through the trees', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-ba-enc-df2', title: 'Werewolf Ambush', description: 'A figure steps onto the path — then begins to change', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ba-enc-df3', title: 'Needle Blights', description: 'The forest itself attacks as blighted plants animate with malice', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-ba-enc-df4', title: 'Barovian Witch', description: 'A haggard woman crouches over a small fire, muttering to herself', difficulty: 'CR 2', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-moors', name: 'Moors Encounters', terrain: 'Moors',
      entries: [
        { id: 'tpl-ba-enc-mo1', title: 'Scarecrow Sentinels', description: 'Straw figures lining the road twitch and turn their burlap heads', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ba-enc-mo2', title: 'Vistani Caravan', description: 'Colorful wagons are circled for the night — the Vistani offer fortune-telling and wine', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ba-enc-mo3', title: 'Revenant', description: 'An undead knight of the Order of the Silver Dragon seeks vengeance against Strahd', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-mountains', name: 'Mountains Encounters', terrain: 'Mountains',
      entries: [
        { id: 'tpl-ba-enc-mt1', title: 'Roc of Mount Ghakis', description: 'A massive shadow passes overhead — the legendary roc circles its mountain', difficulty: 'CR 11', weight: 1 },
        { id: 'tpl-ba-enc-mt2', title: 'Mountain Berserkers', description: 'Barbarian outcasts lair in caves, driven mad by Barovia\'s darkness', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ba-enc-mt3', title: 'Frozen Corpse', description: 'A dead adventurer clutches a journal with a map drawn inside', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-swamp', name: 'Swamp Encounters', terrain: 'Swamp',
      entries: [
        { id: 'tpl-ba-enc-sw1', title: 'Night Hag', description: 'A night hag haunts the swamp, tormenting travelers with nightmares', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ba-enc-sw2', title: 'Drowned Undead', description: 'Corpses rise from the murky water, grasping at the living', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-ba-enc-sw3', title: 'Will-o\'-Wisp', description: 'Eerie lights drift through the fog, luring the unwary into deep water', difficulty: 'CR 2', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-farmland', name: 'Farmland Encounters', terrain: 'Farmland',
      entries: [
        { id: 'tpl-ba-enc-fl1', title: 'Strahd\'s Tax Collectors', description: 'Armored riders demand tribute from the peasantry in the name of the count', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-ba-enc-fl2', title: 'Desperate Villagers', description: 'Frightened farmers beg for protection from nightly terrors', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ba-enc-fl3', title: 'Zombie Scarecrows', description: 'The scarecrows in the fields are stuffed with something that still moves', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-ba-enc-fl4', title: 'Funeral Procession', description: 'A somber group carries a coffin toward the church — the dead do not rest easy here', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-hills', name: 'Hills Encounters', terrain: 'Hills',
      entries: [
        { id: 'tpl-ba-enc-hi1', title: 'Wereraven Scouts', description: 'Ravens watch from every branch — some are more than they appear', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ba-enc-hi2', title: 'Ghoul Pack', description: 'Starving ghouls scrabble out of shallow graves on the hillside', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ba-enc-hi3', title: 'Abandoned Wagon', description: 'A merchant wagon sits overturned, its contents scattered — claw marks score the wood', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-enc-lake', name: 'Lake Encounters', terrain: 'Lake',
      entries: [
        { id: 'tpl-ba-enc-la1', title: 'Drowned Spirits', description: 'Ghostly figures drift beneath the surface, reaching upward', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ba-enc-la2', title: 'Fisherman\'s Ghost', description: 'The translucent shade of a fisherman repeats his final moments endlessly', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-ba-enc-la3', title: 'Sunken Rowboat', description: 'A rowboat rests in the shallows — something glints beneath the waterline', difficulty: 'Exploration', weight: 2 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-ba-lm-dark-forest', name: 'Dark Forest Landmarks', terrain: 'Dark Forest',
      entries: [
        { id: 'tpl-ba-lm-df1', title: 'Hanging Tree', description: 'A gnarled oak with frayed nooses dangling from its branches', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-df2', title: 'Huntsman\'s Shrine', description: 'A small stone shrine to a forgotten forest deity, offerings still fresh', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-df3', title: 'Den of Wolves', description: 'A cave entrance littered with bones — the stench of wet fur is overpowering', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-moors', name: 'Moors Landmarks', terrain: 'Moors',
      entries: [
        { id: 'tpl-ba-lm-mo1', title: 'Mist-Shrouded Crossroads', description: 'A junction where the mist seems to pool — direction signs have been torn down', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-mo2', title: 'Gallows Hill', description: 'A weathered gallows stands atop a barren hillock, creaking in the wind', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-mo3', title: 'Stone Circle', description: 'Ancient standing stones hum with faint energy when the mist thickens', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-mountains', name: 'Mountains Landmarks', terrain: 'Mountains',
      entries: [
        { id: 'tpl-ba-lm-mt1', title: 'Tsolenka Pass', description: 'A narrow mountain pass guarded by ancient statues with outstretched hands', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-mt2', title: 'Frozen Waterfall', description: 'A cascade of ice clings to the cliff face, concealing a cave behind it', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-mt3', title: 'Mountain Shrine', description: 'A crumbling shrine to the Morninglord, hope in an unlikely place', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-swamp', name: 'Swamp Landmarks', terrain: 'Swamp',
      entries: [
        { id: 'tpl-ba-lm-sw1', title: 'Ruined Hut', description: 'A rotting wooden hut sinks slowly into the mire, shelves of jars still inside', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-sw2', title: 'Sunken Graveyard', description: 'Crooked headstones protrude from the swamp water at odd angles', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-sw3', title: 'Witch\'s Cauldron', description: 'An enormous iron cauldron sits in a clearing, still warm', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-farmland', name: 'Farmland Landmarks', terrain: 'Farmland',
      entries: [
        { id: 'tpl-ba-lm-fl1', title: 'Haunted Windmill', description: 'An old windmill on a hill — its sails turn despite the still air', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-fl2', title: 'Village Well', description: 'A communal well with a rusty bucket — villagers say the water tastes of iron', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-fl3', title: 'Roadside Shrine', description: 'A small shrine with wilted flowers and a carved raven — a Keepers symbol', rarity: 'Common', weight: 1 },
        { id: 'tpl-ba-lm-fl4', title: 'Burned Farmstead', description: 'Charred timbers and scorched earth — whatever happened here was not natural', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-hills', name: 'Hills Landmarks', terrain: 'Hills',
      entries: [
        { id: 'tpl-ba-lm-hi1', title: 'Winery Ruins', description: 'The crumbling walls of what was once a prosperous vineyard', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-hi2', title: 'Raven Roost', description: 'A rocky outcrop where hundreds of ravens gather at dusk', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-hi3', title: 'Collapsed Tomb', description: 'A hillside burial chamber has caved in, exposing old bones and rusted armor', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ba-lm-lake', name: 'Lake Landmarks', terrain: 'Lake',
      entries: [
        { id: 'tpl-ba-lm-la1', title: 'Crumbling Dock', description: 'A rotting wooden pier extends into the dark water — a rowboat is tied to the post', rarity: 'Common', weight: 2 },
        { id: 'tpl-ba-lm-la2', title: 'Lakeside Shrine', description: 'A small stone altar at the water\'s edge, offerings of coins glint beneath the surface', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ba-lm-la3', title: 'Sunken Tower', description: 'The top floor of a tower protrudes from the lake — stairs descend into black water', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.5,
    encounterDensity: 0.6,
    landmarkDensity: 0.35,
    terrainVariety: 0.4,
  },
  factions: [
    { name: 'Strahd\'s Court', description: 'The vampire lord and his servants who rule Barovia with an iron fist of terror', color: '#8B0000', goals: 'Maintain absolute dominion over Barovia and capture Ireena Kolyana', tags: ['evil', 'undead'] },
    { name: 'The Keepers of the Feather', description: 'A secret order of wereravens who resist Strahd from the shadows', color: '#4A6FA5', goals: 'Undermine Strahd\'s power and protect the people of Barovia', tags: ['secret', 'resistance'] },
    { name: 'Vistani', description: 'Nomadic travelers who move freely through the mists, serving as Strahd\'s eyes — or perhaps playing both sides', color: '#9C27B0', goals: 'Maintain their freedom to travel and honor their ancient pact with Strahd', tags: ['nomadic', 'neutral'] },
  ],
  regions: [
    { name: 'Village of Barovia', color: '#6B4C3B', description: 'A wretched village cowering in the shadow of Castle Ravenloft, its people broken by despair', tags: ['village', 'cursed'] },
    { name: 'Vallaki', color: '#4A6FA5', description: 'A walled town where the burgomaster enforces mandatory festivals to keep spirits high — and suspicion higher', tags: ['town', 'political'] },
    { name: 'Castle Ravenloft Environs', color: '#8B0000', description: 'The cursed lands immediately surrounding Strahd\'s castle — perpetually dark, haunted, and watched', tags: ['castle', 'dangerous'] },
  ],
  tags: ['horror', 'gothic', 'ravenloft'],
};
