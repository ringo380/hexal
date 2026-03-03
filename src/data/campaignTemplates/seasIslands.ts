import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const seasIslandsTemplate: CampaignTemplate = {
  id: 'seas-islands',
  name: 'Seas & Islands',
  description: 'Open ocean exploration with scattered archipelagos \u2014 pirates, sea monsters, and uncharted tropical islands.',
  icon: 'water',
  accentColor: '#1E90FF',
  recommendedWidth: 35,
  recommendedHeight: 25,
  calendarPreset: 'simple',
  startYear: 1,
  terrainTypes: [
    { id: 'tpl-si-open-sea', name: 'Open Sea', colorHex: '#1565C0', icon: 'water', weight: 4, moveCost: 4, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-si-shallow-water', name: 'Shallow Water', colorHex: '#42A5F5', icon: 'water', weight: 3, moveCost: 3, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-si-reef', name: 'Reef', colorHex: '#00ACC1', icon: 'sparkle', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 3, category: 'Aquatic', hazardLevel: 2, hazardType: 'Hidden Rocks' },
    { id: 'tpl-si-tropical-island', name: 'Tropical Island', colorHex: '#4CAF50', icon: 'flower', weight: 1, moveCost: 1, elevation: 1, moisture: 4, temperature: 4, category: 'Temperate' },
    { id: 'tpl-si-rocky-island', name: 'Rocky Island', colorHex: '#757575', icon: 'mountain', weight: 1, moveCost: 2, elevation: 3, moisture: 2, temperature: 3, category: 'Highland' },
    { id: 'tpl-si-volcanic-island', name: 'Volcanic Island', colorHex: '#BF360C', icon: 'triangle', weight: 1, moveCost: 3, elevation: 4, moisture: 1, temperature: 5, category: 'Highland', hazardLevel: 3, hazardType: 'Volcanic Activity' },
    { id: 'tpl-si-sandbar', name: 'Sandbar', colorHex: '#FFE0B2', icon: 'sun', weight: 1, moveCost: 1, elevation: 0, moisture: 3, temperature: 4, category: 'Aquatic' },
    { id: 'tpl-si-coast', name: 'Coast', colorHex: '#87CEEB', icon: 'drop', weight: 2, moveCost: 1, elevation: 1, moisture: 4, temperature: 3, category: 'Aquatic' },
    { id: 'tpl-si-jungle', name: 'Jungle', colorHex: '#006400', icon: 'tree', weight: 1, moveCost: 3, elevation: 2, moisture: 5, temperature: 5, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-si-enc-open-sea', name: 'Open Sea Encounters', terrain: 'Open Sea',
      entries: [
        { id: 'tpl-si-enc-os1', title: 'Kraken Tentacles', description: 'Enormous tentacles rise from the deep, grasping at the hull', difficulty: 'CR 8', weight: 1 },
        { id: 'tpl-si-enc-os2', title: 'Pirate Galleon', description: 'A black-flagged warship closes in with cannons ready', difficulty: 'CR 5', weight: 2 },
        { id: 'tpl-si-enc-os3', title: 'Ghost Ship', description: 'A spectral vessel drifts through the fog, crewed by the undead', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-si-enc-os4', title: 'Merchant Convoy', description: 'A well-guarded merchant fleet offers trade opportunities', difficulty: 'Social', weight: 2 },
        { id: 'tpl-si-enc-os5', title: 'Sea Storm', description: 'A violent squall threatens to capsize the ship', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-shallow-water', name: 'Shallow Water Encounters', terrain: 'Shallow Water',
      entries: [
        { id: 'tpl-si-enc-shw1', title: 'Sahuagin Patrol', description: 'Sea devil warriors rise from the shallows to attack', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-si-enc-shw2', title: 'Merfolk Traders', description: 'Merfolk surface to barter pearls and coral for surface goods', difficulty: 'Social', weight: 2 },
        { id: 'tpl-si-enc-shw3', title: 'Giant Shark', description: 'A massive predator circles beneath the keel', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-si-enc-shw4', title: 'Floating Wreckage', description: 'Debris from a recent shipwreck bobs in the current \u2014 survivors cling to planks', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-reef', name: 'Reef Encounters', terrain: 'Reef',
      entries: [
        { id: 'tpl-si-enc-rf1', title: 'Sea Hag Lair', description: 'A sea hag lurks in a coral cave, luring sailors with illusions', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-si-enc-rf2', title: 'Coral Golem', description: 'An animated mass of living coral defends the reef', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-si-enc-rf3', title: 'Sunken Treasure Chest', description: 'A barnacle-encrusted chest glimmers among the coral formations', difficulty: 'Exploration', weight: 2 },
      ]
    },
    {
      id: 'tpl-si-enc-tropical-island', name: 'Tropical Island Encounters', terrain: 'Tropical Island',
      entries: [
        { id: 'tpl-si-enc-ti1', title: 'Island Tribe', description: 'Indigenous islanders greet newcomers with suspicion or hospitality', difficulty: 'Social', weight: 2 },
        { id: 'tpl-si-enc-ti2', title: 'Treasure Hunters', description: 'A rival crew searches for buried pirate gold', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-si-enc-ti3', title: 'Giant Crabs', description: 'Enormous crustaceans defend the beach with crushing claws', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-si-enc-ti4', title: 'Marooned Sailor', description: 'A castaway with a wild story and a hand-drawn treasure map', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-rocky-island', name: 'Rocky Island Encounters', terrain: 'Rocky Island',
      entries: [
        { id: 'tpl-si-enc-ri1', title: 'Harpy Nest', description: 'Harpies roost on the crags, singing deadly songs to passing ships', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-si-enc-ri2', title: 'Pirate Hideout', description: 'A hidden cove serves as a pirate base of operations', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-si-enc-ri3', title: 'Hermit Lighthouse Keeper', description: 'An eccentric keeper maintains a lighthouse and knows local secrets', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-volcanic-island', name: 'Volcanic Island Encounters', terrain: 'Volcanic Island',
      entries: [
        { id: 'tpl-si-enc-vi1', title: 'Fire Elemental', description: 'A fire elemental erupts from a lava vent', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-si-enc-vi2', title: 'Lizardfolk Cult', description: 'Lizardfolk worship the volcano as a deity and demand sacrifices', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-si-enc-vi3', title: 'Volcanic Eruption', description: 'The ground shakes and lava begins to flow \u2014 escape the island!', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-si-enc-vi4', title: 'Obsidian Mine', description: 'Duergar miners extract volcanic glass in dangerous conditions', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-sandbar', name: 'Sandbar Encounters', terrain: 'Sandbar',
      entries: [
        { id: 'tpl-si-enc-sb1', title: 'Stranded Ship', description: 'A merchant vessel has run aground and needs help refloating', difficulty: 'Social', weight: 2 },
        { id: 'tpl-si-enc-sb2', title: 'Sea Turtle Nesting', description: 'Giant sea turtles lay eggs on the sandbar under moonlight', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-si-enc-sb3', title: 'Quicksand Trap', description: 'The sandbar conceals patches of treacherous quicksand', difficulty: 'CR 2', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-coast', name: 'Coast Encounters', terrain: 'Coast',
      entries: [
        { id: 'tpl-si-enc-co1', title: 'Smuggler\'s Landing', description: 'Smugglers unload contraband under cover of darkness', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-si-enc-co2', title: 'Fishing Village', description: 'A small coastal settlement offers rest and local gossip', difficulty: 'Social', weight: 2 },
        { id: 'tpl-si-enc-co3', title: 'Beached Sea Monster', description: 'A dying sea creature has washed ashore \u2014 scavengers gather', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-si-enc-co4', title: 'Naval Patrol', description: 'A warship enforces maritime law and inspects passing vessels', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-enc-jungle', name: 'Jungle Encounters', terrain: 'Jungle',
      entries: [
        { id: 'tpl-si-enc-ju1', title: 'Yuan-Ti Ambush', description: 'Snake-people strike from the dense undergrowth', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-si-enc-ju2', title: 'Lost Temple', description: 'A vine-covered temple hides ancient traps and treasure', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-si-enc-ju3', title: 'Cannibal Tribe', description: 'Hostile islanders capture trespassers for their cooking pots', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-si-enc-ju4', title: 'Dinosaur Territory', description: 'Massive reptiles crash through the jungle canopy', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-si-enc-ju5', title: 'Herbalist Hermit', description: 'A reclusive healer knows rare jungle remedies and hidden paths', difficulty: 'Social', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-si-lm-open-sea', name: 'Open Sea Landmarks', terrain: 'Open Sea',
      entries: [
        { id: 'tpl-si-lm-os1', title: 'Floating Debris Field', description: 'Wreckage and cargo from a sunken vessel drift in the current', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-os2', title: 'Whale Migration Route', description: 'Great whales breach and blow as they follow ancient paths', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-si-lm-os3', title: 'Becalmed Zone', description: 'An eerie stretch of windless water where ships become trapped', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-shallow-water', name: 'Shallow Water Landmarks', terrain: 'Shallow Water',
      entries: [
        { id: 'tpl-si-lm-shw1', title: 'Kelp Forest', description: 'Dense underwater kelp creates a maze-like environment below the surface', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-shw2', title: 'Sunken Shipwreck', description: 'The hull of a wrecked vessel visible through clear shallow water', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-shw3', title: 'Merfolk Shrine', description: 'A coral altar decorated with shells and pearls, tended by merfolk', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-reef', name: 'Reef Landmarks', terrain: 'Reef',
      entries: [
        { id: 'tpl-si-lm-rf1', title: 'Coral Cathedral', description: 'Towering coral formations resemble the spires of a great church', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-rf2', title: 'Giant Clam Bed', description: 'Enormous clams litter the reef floor, some containing pearls', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-rf3', title: 'Underwater Cave', description: 'A dark opening in the reef leads to an air-filled grotto', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-tropical-island', name: 'Tropical Island Landmarks', terrain: 'Tropical Island',
      entries: [
        { id: 'tpl-si-lm-ti1', title: 'Freshwater Spring', description: 'Clean drinking water bubbles up from volcanic rock', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-ti2', title: 'Hidden Grotto', description: 'A sea-cave accessible through a waterfall curtain', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-si-lm-ti3', title: 'Ancient Ruins', description: 'Overgrown stone structures from a forgotten island civilization', rarity: 'Rare', weight: 1 },
        { id: 'tpl-si-lm-ti4', title: 'Coconut Grove', description: 'A shaded grove of palms heavy with fruit', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-si-lm-rocky-island', name: 'Rocky Island Landmarks', terrain: 'Rocky Island',
      entries: [
        { id: 'tpl-si-lm-ri1', title: 'Lighthouse', description: 'A working lighthouse warns ships away from the rocks', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-ri2', title: 'Sea Stack', description: 'A dramatic pillar of rock standing offshore, battered by waves', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-ri3', title: 'Smuggler\'s Cave', description: 'A cave with a concealed entrance, stocked with stolen goods', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-volcanic-island', name: 'Volcanic Island Landmarks', terrain: 'Volcanic Island',
      entries: [
        { id: 'tpl-si-lm-vi1', title: 'Lava Tube', description: 'A cooled lava tunnel leads deep into the volcanic interior', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-vi2', title: 'Hot Springs', description: 'Geothermally heated pools steam among the black rock', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-vi3', title: 'Tidal Temple', description: 'A stone temple built at the waterline, accessible only at low tide', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-sandbar', name: 'Sandbar Landmarks', terrain: 'Sandbar',
      entries: [
        { id: 'tpl-si-lm-sb1', title: 'Tidal Pool Garden', description: 'Colorful sea life thrives in pools left by the receding tide', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-sb2', title: 'Buried Treasure', description: 'An X marks the spot on a weathered map \u2014 something lies beneath the sand', rarity: 'Rare', weight: 1 },
        { id: 'tpl-si-lm-sb3', title: 'Warning Beacon', description: 'A rusted iron frame holds a signal fire for navigators', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-coast', name: 'Coast Landmarks', terrain: 'Coast',
      entries: [
        { id: 'tpl-si-lm-co1', title: 'Shipwreck Beach', description: 'The remains of multiple vessels litter the shore', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-co2', title: 'Trading Post', description: 'A weathered dock and warehouse serve as a remote trading hub', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-co3', title: 'Sea Cliff Carvings', description: 'Ancient petroglyphs cover the cliff face, depicting sea creatures and stars', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-si-lm-jungle', name: 'Jungle Landmarks', terrain: 'Jungle',
      entries: [
        { id: 'tpl-si-lm-ju1', title: 'Cenote', description: 'A deep natural sinkhole reveals an underground pool', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-si-lm-ju2', title: 'Giant Tree', description: 'A colossal tree towers above the canopy, visible for miles', rarity: 'Common', weight: 2 },
        { id: 'tpl-si-lm-ju3', title: 'Vine Bridge', description: 'A precarious natural bridge of twisted vines spans a jungle ravine', rarity: 'Common', weight: 1 },
        { id: 'tpl-si-lm-ju4', title: 'Idol Clearing', description: 'A stone idol covered in moss sits in a perfectly circular clearing', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.75,
    encounterDensity: 0.35,
    landmarkDensity: 0.25,
    terrainVariety: 0.45,
  },
  factions: [
    { name: 'Pirate Lords', description: 'A loose confederation of pirate captains who control the lawless waters through force and cunning', color: '#333333', goals: 'Plunder trade routes and maintain dominance over the sea lanes', tags: ['criminal', 'naval'] },
    { name: 'Merchant Marine Guild', description: 'An organized guild of traders and shipwrights who seek safe and profitable sea routes', color: '#DAA520', goals: 'Establish secure trade routes and expand commerce between islands', tags: ['mercantile', 'political'] },
    { name: 'Sea Elf Confederacy', description: 'An ancient alliance of aquatic elves who guard the reefs and deep ocean from surface exploitation', color: '#00ACC1', goals: 'Protect the ocean\'s ecosystems and maintain the balance of the deep', tags: ['nature', 'aquatic'] },
    { name: 'Island Tribes', description: 'A coalition of indigenous island peoples preserving their ancestral ways and sacred sites', color: '#4CAF50', goals: 'Defend their islands from colonizers and preserve their cultural heritage', tags: ['indigenous', 'territorial'] },
  ],
  regions: [
    { name: 'The Shattered Archipelago', color: '#4CAF50', description: 'A dense cluster of tropical islands, each with its own dangers and treasures', tags: ['islands', 'diverse'] },
    { name: 'Serpent Strait', color: '#BF360C', description: 'A treacherous narrow passage between volcanic islands, known for sea monster attacks', tags: ['dangerous', 'volcanic'] },
    { name: 'Trade Wind Route', color: '#DAA520', description: 'The main shipping lane connecting major ports, patrolled by both navies and pirates', tags: ['trade', 'contested'] },
    { name: 'The Maelstrom', color: '#1565C0', description: 'A region of perpetual storms and whirlpools where few ships dare to sail', tags: ['hazardous', 'mysterious'] },
  ],
  tags: ['nautical', 'exploration', 'pirates'],
};
