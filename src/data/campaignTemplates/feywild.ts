import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const feywildTemplate: CampaignTemplate = {
  id: 'feywild',
  name: 'Feywild',
  description: 'The echo of the Material Plane suffused with wild magic \u2014 a realm of eternal twilight, capricious fey courts, and enchanted wilds.',
  icon: 'flower',
  accentColor: '#DA70D6',
  recommendedWidth: 20,
  recommendedHeight: 20,
  calendarPreset: 'simple',
  startYear: 1,
  terrainTypes: [
    { id: 'tpl-fw-enchanted-forest', name: 'Enchanted Forest', colorHex: '#50C878', icon: 'tree', weight: 4, moveCost: 2, elevation: 2, moisture: 4, temperature: 3, category: 'Temperate' },
    { id: 'tpl-fw-twilight-meadow', name: 'Twilight Meadow', colorHex: '#DDA0DD', icon: 'flower', weight: 3, moveCost: 1, elevation: 1, moisture: 3, temperature: 3, category: 'Temperate' },
    { id: 'tpl-fw-crystal-lake', name: 'Crystal Lake', colorHex: '#ADD8E6', icon: 'water', weight: 2, moveCost: 2, elevation: 0, moisture: 5, temperature: 2, category: 'Aquatic' },
    { id: 'tpl-fw-mushroom-grove', name: 'Mushroom Grove', colorHex: '#BA55D3', icon: 'sparkle', weight: 2, moveCost: 2, elevation: 1, moisture: 4, temperature: 3, hazardLevel: 1, hazardType: 'Hallucinogenic Spores', category: 'Temperate' },
    { id: 'tpl-fw-thornwall', name: 'Thornwall', colorHex: '#8B0000', icon: 'leaf', weight: 1, moveCost: 4, elevation: 2, moisture: 3, temperature: 2, hazardLevel: 2, hazardType: 'Piercing Thorns', category: 'Temperate' },
    { id: 'tpl-fw-fey-court', name: 'Fey Court', colorHex: '#FFD700', icon: 'sparkle', weight: 1, moveCost: 1, elevation: 1, moisture: 3, temperature: 3, category: 'Temperate' },
    { id: 'tpl-fw-misty-bog', name: 'Misty Bog', colorHex: '#698B69', icon: 'drop', weight: 2, moveCost: 3, elevation: 0, moisture: 5, temperature: 2, hazardLevel: 1, hazardType: 'Fey Mist', category: 'Aquatic' },
    { id: 'tpl-fw-shimmer-hills', name: 'Shimmer Hills', colorHex: '#FFB6C1', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, moisture: 2, temperature: 3, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-fw-enc-enchanted-forest', name: 'Enchanted Forest Encounters', terrain: 'Enchanted Forest',
      entries: [
        { id: 'tpl-fw-enc-ef1', title: 'Pixie Ambush', description: 'A swarm of giggling pixies darts from the canopy, eager to confuse and mislead travelers', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-fw-enc-ef2', title: 'Dryad\'s Warning', description: 'A dryad steps from her tree to warn trespassers of an ancient curse spreading through the woods', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-ef3', title: 'Awakened Trees', description: '1d4 awakened trees block the path, demanding tribute before allowing passage', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-fw-enc-ef4', title: 'Displacer Beast Stalker', description: 'A displacer beast shadows the party through the shifting canopy', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-twilight-meadow', name: 'Twilight Meadow Encounters', terrain: 'Twilight Meadow',
      entries: [
        { id: 'tpl-fw-enc-tm1', title: 'Satyr Revel', description: 'A troupe of satyrs plays enchanting music around a bonfire, beckoning travelers to join', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-tm2', title: 'Blink Dog Pack', description: 'A pack of blink dogs flickers in and out of sight, investigating the party', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-fw-enc-tm3', title: 'Quickling Thieves', description: 'Nearly invisible quicklings dart through the meadow, snatching small items', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-crystal-lake', name: 'Crystal Lake Encounters', terrain: 'Crystal Lake',
      entries: [
        { id: 'tpl-fw-enc-cl1', title: 'Naiad\'s Bargain', description: 'A water spirit rises from the crystal depths to offer a deal wrapped in riddles', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-cl2', title: 'Will-o\'-Wisps', description: 'Glowing orbs dance across the water, luring travelers toward hidden depths', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-fw-enc-cl3', title: 'Eladrin Patrol', description: 'An eladrin knight and their retinue emerge from the mist, demanding an oath of passage', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-fw-enc-cl4', title: 'Submerged Ruin', description: 'A glimmering structure beneath the surface beckons explorers into its flooded halls', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-mushroom-grove', name: 'Mushroom Grove Encounters', terrain: 'Mushroom Grove',
      entries: [
        { id: 'tpl-fw-enc-mg1', title: 'Myconid Colony', description: 'Sentient mushroom folk communicate through telepathic spores, seeking allies', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-mg2', title: 'Spore Storm', description: 'A cloud of hallucinogenic spores erupts, causing vivid and prophetic visions', difficulty: 'CR 3', weight: 1 },
        { id: 'tpl-fw-enc-mg3', title: 'Redcap Ambush', description: 'Murderous redcaps burst from beneath the mushroom caps, iron boots clanging', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-fw-enc-mg4', title: 'Fungal Archive', description: 'Ancient memories are stored in vast fungal networks \u2014 touching them triggers visions of the past', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-thornwall', name: 'Thornwall Encounters', terrain: 'Thornwall',
      entries: [
        { id: 'tpl-fw-enc-tw1', title: 'Green Knight Challenge', description: 'An armored figure astride a thorn-covered steed challenges the worthiest fighter to single combat', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-fw-enc-tw2', title: 'Trapped Traveler', description: 'A fey creature hangs ensnared in the thorns, begging for help \u2014 but is it a trick?', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-tw3', title: 'Blighted Treant', description: 'A treant corrupted by dark magic lashes out at anything that moves', difficulty: 'CR 5', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-fey-court', name: 'Fey Court Encounters', terrain: 'Fey Court',
      entries: [
        { id: 'tpl-fw-enc-fc1', title: 'Archfey Audience', description: 'An archfey grants an audience, offering wondrous boons in exchange for seemingly trivial favors', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-fc2', title: 'Court Intrigue', description: 'Two fey nobles each try to recruit the party as pawns in their elaborate schemes', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-fc3', title: 'Eladrin Duelists', description: 'A pair of eladrin demand satisfaction over a perceived slight \u2014 real or invented', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-fw-enc-fc4', title: 'The Tithe', description: 'The court demands a mortal tithe \u2014 a memory, a year of life, or something stranger', difficulty: 'Social', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-misty-bog', name: 'Misty Bog Encounters', terrain: 'Misty Bog',
      entries: [
        { id: 'tpl-fw-enc-mb1', title: 'Hag of the Mire', description: 'A green hag offers prophecy and potions from her stinking hovel, but her prices are steep', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-fw-enc-mb2', title: 'Lost Wanderers', description: 'Fellow travelers, trapped by the fey mist for what seems like days, beg for help finding a way out', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-mb3', title: 'Bog Hound Pack', description: 'Ghostly black dogs with glowing eyes emerge from the fog, herding prey toward the deep mire', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-fw-enc-mb4', title: 'Sunken Shrine', description: 'A half-submerged shrine to a forgotten fey lord still radiates ancient magic', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-enc-shimmer-hills', name: 'Shimmer Hills Encounters', terrain: 'Shimmer Hills',
      entries: [
        { id: 'tpl-fw-enc-sh1', title: 'Eladrin Shepherds', description: 'Eladrin tend flocks of shimmering, semi-corporeal sheep across the hillsides', difficulty: 'Social', weight: 2 },
        { id: 'tpl-fw-enc-sh2', title: 'Wild Hunt Scouts', description: 'Outriders of the Wild Hunt crest the hill, horns echoing in the twilight', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-fw-enc-sh3', title: 'Crystal Cavern', description: 'A cave mouth in the hillside leads to chambers lined with singing crystals', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-fw-enc-sh4', title: 'Dancing Lights', description: 'Mysterious lights bob and weave along the hilltops, leading toward a hidden glade', difficulty: 'CR 2', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-fw-lm-enchanted-forest', name: 'Enchanted Forest Landmarks', terrain: 'Enchanted Forest',
      entries: [
        { id: 'tpl-fw-lm-ef1', title: 'Talking Tree', description: 'An ancient oak with a gnarled face that whispers cryptic advice to those who listen', rarity: 'Common', weight: 2 },
        { id: 'tpl-fw-lm-ef2', title: 'Fairy Ring', description: 'A perfect circle of luminous mushrooms that serves as a portal between clearings', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-fw-lm-ef3', title: 'Silvered Glade', description: 'A clearing where moonlight pools even during the day, bathing everything in silver radiance', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-lm-twilight-meadow', name: 'Twilight Meadow Landmarks', terrain: 'Twilight Meadow',
      entries: [
        { id: 'tpl-fw-lm-tm1', title: 'Moonlit Glade', description: 'A tranquil glade perpetually bathed in soft moonlight, no matter the time of day', rarity: 'Common', weight: 2 },
        { id: 'tpl-fw-lm-tm2', title: 'Whispering Stones', description: 'A ring of standing stones that murmur fragments of conversations from the Material Plane', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-fw-lm-tm3', title: 'Eternal Bonfire', description: 'A bonfire that never burns out, surrounded by toadstools that glow in time with the flames', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-lm-crystal-lake', name: 'Crystal Lake Landmarks', terrain: 'Crystal Lake',
      entries: [
        { id: 'tpl-fw-lm-cl1', title: 'Crystal Spring', description: 'Water wells up from a cluster of glowing crystals, said to grant visions to those who drink', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-fw-lm-cl2', title: 'Enchanted Bridge', description: 'A delicate bridge of woven vines and crystal spans the water, visible only to the fey-touched', rarity: 'Rare', weight: 1 },
        { id: 'tpl-fw-lm-cl3', title: 'Mirror Shore', description: 'The lake surface reflects a different sky \u2014 sometimes showing the Material Plane, sometimes stranger vistas', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-fw-lm-mushroom-grove', name: 'Mushroom Grove Landmarks', terrain: 'Mushroom Grove',
      entries: [
        { id: 'tpl-fw-lm-mg1', title: 'Giant Toadstool Ring', description: 'A circle of towering toadstools large enough to shelter beneath, each a different vivid color', rarity: 'Common', weight: 2 },
        { id: 'tpl-fw-lm-mg2', title: 'Spore Oracle', description: 'A massive puffball mushroom that releases spores carrying visions of possible futures', rarity: 'Rare', weight: 1 },
        { id: 'tpl-fw-lm-mg3', title: 'Myconid Nursery', description: 'A warm hollow where tiny myconid sprouts grow in neat rows, tended by elder myconids', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-lm-thornwall', name: 'Thornwall Landmarks', terrain: 'Thornwall',
      entries: [
        { id: 'tpl-fw-lm-tw1', title: 'Thorn Gate', description: 'A natural archway through the wall of thorns, said to open only for those who speak the right name', rarity: 'Uncommon', weight: 2 },
        { id: 'tpl-fw-lm-tw2', title: 'Imprisoned Tower', description: 'A slender stone tower completely encased in thorns, its upper window still glowing faintly', rarity: 'Rare', weight: 1 },
        { id: 'tpl-fw-lm-tw3', title: 'Blood Roses', description: 'A patch of crimson roses that bloom among the thorns, their petals prized as spell components', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-fw-lm-fey-court', name: 'Fey Court Landmarks', terrain: 'Fey Court',
      entries: [
        { id: 'tpl-fw-lm-fc1', title: 'Throne of Seasons', description: 'An ornate throne carved from living wood, its appearance shifting with the emotional state of the nearest archfey', rarity: 'Rare', weight: 1 },
        { id: 'tpl-fw-lm-fc2', title: 'Reverie Garden', description: 'A sculpted garden where time moves differently \u2014 an hour here might be a day outside', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-fw-lm-fc3', title: 'Oathstone', description: 'A smooth white stone where bargains spoken aloud become magically binding', rarity: 'Common', weight: 2 },
      ]
    },
    {
      id: 'tpl-fw-lm-misty-bog', name: 'Misty Bog Landmarks', terrain: 'Misty Bog',
      entries: [
        { id: 'tpl-fw-lm-mb1', title: 'Weeping Willow', description: 'An enormous willow whose hanging branches drip with luminescent sap', rarity: 'Common', weight: 2 },
        { id: 'tpl-fw-lm-mb2', title: 'Hag\'s Cauldron', description: 'An abandoned iron cauldron, still bubbling with a faintly magical green liquid', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-fw-lm-mb3', title: 'Forgotten Crossing', description: 'Mossy stepping stones lead across the deepest part of the bog to a place no map records', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-fw-lm-shimmer-hills', name: 'Shimmer Hills Landmarks', terrain: 'Shimmer Hills',
      entries: [
        { id: 'tpl-fw-lm-sh1', title: 'Rainbow Falls', description: 'A waterfall that refracts light into permanent rainbows, even under overcast skies', rarity: 'Common', weight: 2 },
        { id: 'tpl-fw-lm-sh2', title: 'Singing Crystals', description: 'A cluster of crystals protruding from the hillside that hum in ethereal harmony', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-fw-lm-sh3', title: 'Hilltop Fey Ring', description: 'A ring of standing stones at the summit, marking the intersection of multiple ley lines', rarity: 'Rare', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.55,
    encounterDensity: 0.45,
    landmarkDensity: 0.35,
    terrainVariety: 0.6,
  },
  factions: [
    { name: 'Seelie Court', description: 'The court of light and growth, ruled by Titania \u2014 beautiful but bound by ancient, inscrutable laws', color: '#FFD700', goals: 'Uphold the old ways of the fey and maintain dominion over the bright realms', tags: ['fey', 'nobility'] },
    { name: 'Unseelie Court', description: 'The court of shadow and winter, ruled by the Queen of Air and Darkness \u2014 cruel but honest in their cruelty', color: '#4B0082', goals: 'Expand the dominion of darkness and remind mortals to fear the night', tags: ['fey', 'shadow'] },
    { name: 'Court of Stars', description: 'A neutral gathering of powerful eladrin who serve neither Seelie nor Unseelie, beholden only to the stars', color: '#C0C0C0', goals: 'Maintain the balance between the courts and protect the crossings to the Material Plane', tags: ['fey', 'neutral'] },
    { name: 'The Wild Hunt', description: 'A relentless cavalcade of fey hunters who ride across the twilight skies, pursuing quarry both mortal and immortal', color: '#228B22', goals: 'Hunt the most dangerous prey across all planes and enforce the ancient rite of the chase', tags: ['fey', 'predatory'] },
  ],
  regions: [
    { name: 'Murkendraw', color: '#698B69', description: 'A vast and treacherous swampland shrouded in perpetual mist, home to hags and lost souls', tags: ['swamp', 'dangerous'] },
    { name: 'Senaliesse', color: '#FFD700', description: 'The glittering heart of the Seelie Court, a city woven from living trees and starlight', tags: ['court', 'civilized'] },
    { name: 'Vale of the Crystal Lake', color: '#ADD8E6', description: 'A serene valley surrounding an impossibly clear lake, sacred to the eladrin', tags: ['lake', 'sacred'] },
    { name: 'Brokenstone Vale', color: '#8B4513', description: 'A wild and untamed region of shattered hills and ancient ruins, contested by rival fey lords', tags: ['wilderness', 'contested'] },
  ],
  tags: ['fey', 'enchanted', 'whimsical'],
};
