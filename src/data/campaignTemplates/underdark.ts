import type { CampaignTemplate } from '../../types/CampaignTemplate';

export const underdarkTemplate: CampaignTemplate = {
  id: 'underdark',
  name: 'Underdark',
  description: 'The vast subterranean realm beneath Faer\u00fbn — lightless caverns, fungal forests, and alien civilizations.',
  icon: 'moon',
  accentColor: '#4B0082',
  recommendedWidth: 20,
  recommendedHeight: 20,
  calendarPreset: 'simple',
  startYear: 1,
  terrainTypes: [
    { id: 'tpl-ud-cavern-floor', name: 'Cavern Floor', colorHex: '#4A4A4A', icon: 'mountain', weight: 3, moveCost: 1, elevation: 1, moisture: 1, temperature: 1, category: 'Temperate' },
    { id: 'tpl-ud-fungal-forest', name: 'Fungal Forest', colorHex: '#8B7DAF', icon: 'tree', weight: 2, moveCost: 2, elevation: 1, moisture: 3, temperature: 1, category: 'Temperate' },
    { id: 'tpl-ud-underground-lake', name: 'Underground Lake', colorHex: '#1A3A5C', icon: 'water', weight: 1, moveCost: 3, elevation: 0, moisture: 5, temperature: 1, category: 'Aquatic' },
    { id: 'tpl-ud-crystal-cave', name: 'Crystal Cave', colorHex: '#40E0D0', icon: 'sparkle', weight: 1, moveCost: 2, elevation: 2, moisture: 1, temperature: 1, category: 'Highland' },
    { id: 'tpl-ud-lava-tube', name: 'Lava Tube', colorHex: '#8B2500', icon: 'sun', weight: 1, moveCost: 3, elevation: 1, moisture: 0, temperature: 5, hazardLevel: 3, hazardType: 'Extreme Heat', category: 'Arid' },
    { id: 'tpl-ud-chasm', name: 'Chasm', colorHex: '#2D2D2D', icon: 'triangle', weight: 1, moveCost: 5, elevation: 0, moisture: 0, temperature: 1, hazardLevel: 3, hazardType: 'Falling', category: 'Highland' },
    { id: 'tpl-ud-deep-tunnels', name: 'Deep Tunnels', colorHex: '#3E2723', icon: 'moon', weight: 2, moveCost: 2, elevation: 1, moisture: 1, temperature: 1, category: 'Temperate' },
    { id: 'tpl-ud-stone-bridge', name: 'Stone Bridge', colorHex: '#696969', icon: 'shield', weight: 1, moveCost: 1, elevation: 2, moisture: 0, temperature: 1, category: 'Temperate' },
  ],
  encounterTables: [
    {
      id: 'tpl-ud-enc-cavern-floor', name: 'Cavern Floor Encounters', terrain: 'Cavern Floor',
      entries: [
        { id: 'tpl-ud-enc-cf1', title: 'Drow Patrol', description: 'A squad of drow warriors moves silently through the darkness, hand crossbows at the ready', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ud-enc-cf2', title: 'Hook Horror Pack', description: 'The clicking echoes of hook horrors reverberate off the cavern walls', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ud-enc-cf3', title: 'Deep Gnome Traders', description: 'Svirfneblin merchants offer rare fungi and gemstones', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ud-enc-cf4', title: 'Carrion Crawler', description: 'A carrion crawler drops from the ceiling, paralyzing tentacles outstretched', difficulty: 'CR 2', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-fungal-forest', name: 'Fungal Forest Encounters', terrain: 'Fungal Forest',
      entries: [
        { id: 'tpl-ud-enc-ff1', title: 'Myconid Circle', description: 'A group of myconids communicates through rapport spores, curious about the newcomers', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ud-enc-ff2', title: 'Violet Fungus Patch', description: 'What appears to be ordinary mushrooms lashes out with rotting tendrils', difficulty: 'CR 2', weight: 1 },
        { id: 'tpl-ud-enc-ff3', title: 'Spore Cloud', description: 'A massive puffball mushroom releases a cloud of hallucinogenic spores', difficulty: 'Exploration', weight: 1 },
        { id: 'tpl-ud-enc-ff4', title: 'Duergar Foragers', description: 'Grey dwarves harvest zurkhwood logs, suspicious of outsiders', difficulty: 'CR 3', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-underground-lake', name: 'Underground Lake Encounters', terrain: 'Underground Lake',
      entries: [
        { id: 'tpl-ud-enc-ul1', title: 'Kuo-toa Fishing Party', description: 'Kuo-toa cast nets from ramshackle rafts, babbling about their mad god', difficulty: 'CR 3', weight: 2 },
        { id: 'tpl-ud-enc-ul2', title: 'Aboleth Whispers', description: 'A psychic presence probes the mind of anyone near the water\'s edge', difficulty: 'CR 10', weight: 1 },
        { id: 'tpl-ud-enc-ul3', title: 'Bioluminescent Jellyfish', description: 'Swarms of glowing jellyfish illuminate the lake, their stings numbing', difficulty: 'CR 1', weight: 1 },
        { id: 'tpl-ud-enc-ul4', title: 'Capsized Raft', description: 'An overturned boat drifts on the black water, cargo still lashed to its hull', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-crystal-cave', name: 'Crystal Cave Encounters', terrain: 'Crystal Cave',
      entries: [
        { id: 'tpl-ud-enc-cc1', title: 'Galeb Duhr Sentinels', description: 'Animate boulders guard a pristine crystal formation, speaking in rumbling Terran', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-ud-enc-cc2', title: 'Xorn Prospector', description: 'A three-armed earth elemental sniffs out precious minerals in the crystals', difficulty: 'Social', weight: 1 },
        { id: 'tpl-ud-enc-cc3', title: 'Piercer Ambush', description: 'Stalactites that are not stalactites plummet toward the unwary', difficulty: 'CR 1', weight: 2 },
      ]
    },
    {
      id: 'tpl-ud-enc-lava-tube', name: 'Lava Tube Encounters', terrain: 'Lava Tube',
      entries: [
        { id: 'tpl-ud-enc-lt1', title: 'Fire Elemental Vortex', description: 'A whirling column of flame dances above a lava fissure', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ud-enc-lt2', title: 'Salamander Smiths', description: 'Salamanders hammer glowing metal at a forge built into the living rock', difficulty: 'Social', weight: 1 },
        { id: 'tpl-ud-enc-lt3', title: 'Magma Mephits', description: 'Cackling mephits hurl gobbets of molten rock at passersby', difficulty: 'CR 2', weight: 2 },
        { id: 'tpl-ud-enc-lt4', title: 'Collapsing Floor', description: 'The thin basalt crust cracks, revealing a river of lava beneath', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-chasm', name: 'Chasm Encounters', terrain: 'Chasm',
      entries: [
        { id: 'tpl-ud-enc-ch1', title: 'Cloaker Glide', description: 'A cloaker detaches from the rock face and swoops silently through the void', difficulty: 'CR 8', weight: 1 },
        { id: 'tpl-ud-enc-ch2', title: 'Rope Bridge Ambush', description: 'Quaggoths cut the ropes as travelers reach the midpoint of a fraying bridge', difficulty: 'CR 4', weight: 1 },
        { id: 'tpl-ud-enc-ch3', title: 'Updraft Spores', description: 'Thermal vents carry glowing spores upward from the depths below', difficulty: 'Exploration', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-deep-tunnels', name: 'Deep Tunnels Encounters', terrain: 'Deep Tunnels',
      entries: [
        { id: 'tpl-ud-enc-dt1', title: 'Mind Flayer Thralls', description: 'Zombified creatures shamble through the corridor, controlled by an unseen intellect', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ud-enc-dt2', title: 'Roper', description: 'What appeared to be a stalagmite extends grasping tendrils across the passage', difficulty: 'CR 5', weight: 1 },
        { id: 'tpl-ud-enc-dt3', title: 'Drider Exile', description: 'A drider driven mad by isolation lurks in the tunnels, hunting anything that moves', difficulty: 'CR 6', weight: 1 },
        { id: 'tpl-ud-enc-dt4', title: 'Lost Explorer', description: 'A half-starved surface dweller begs for help finding the way out', difficulty: 'Social', weight: 2 },
        { id: 'tpl-ud-enc-dt5', title: 'Rust Monster Pair', description: 'Two rust monsters scuttle toward anything metallic, antennae quivering', difficulty: 'CR 1', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-enc-stone-bridge', name: 'Stone Bridge Encounters', terrain: 'Stone Bridge',
      entries: [
        { id: 'tpl-ud-enc-sb1', title: 'Beholder Toll', description: 'A beholder hovers at the far end of the bridge, demanding "interesting things"', difficulty: 'CR 13', weight: 1 },
        { id: 'tpl-ud-enc-sb2', title: 'Drow Checkpoint', description: 'House soldiers demand passage tokens or tribute in coin', difficulty: 'CR 4', weight: 2 },
        { id: 'tpl-ud-enc-sb3', title: 'Crumbling Span', description: 'Sections of the ancient bridge have fallen away, requiring careful navigation', difficulty: 'Exploration', weight: 1 },
      ]
    },
  ],
  landmarkTables: [
    {
      id: 'tpl-ud-lm-cavern-floor', name: 'Cavern Floor Landmarks', terrain: 'Cavern Floor',
      entries: [
        { id: 'tpl-ud-lm-cf1', title: 'Stalagmite Forest', description: 'Thousands of mineral pillars rise from the floor, some reaching the ceiling', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-cf2', title: 'Ancient Drow Waypoint', description: 'A carved obsidian pillar marked with directional glyphs in Undercommon', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-cf3', title: 'Faerzress Zone', description: 'A region of wild magical radiation — spells behave unpredictably here', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-fungal-forest', name: 'Fungal Forest Landmarks', terrain: 'Fungal Forest',
      entries: [
        { id: 'tpl-ud-lm-ff1', title: 'Zurkhwood Grove', description: 'A stand of towering zurkhwood mushrooms, their caps forming a canopy', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-ff2', title: 'Myconid Meld Circle', description: 'A ring of phosphorescent fungi where myconids share their collective dream', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-ff3', title: 'Petrified Giant', description: 'The stone remains of a colossal creature, now overgrown with fungal blooms', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-underground-lake', name: 'Underground Lake Landmarks', terrain: 'Underground Lake',
      entries: [
        { id: 'tpl-ud-lm-ul1', title: 'Sunken City Spires', description: 'Crumbling towers of a flooded settlement jut above the waterline', rarity: 'Rare', weight: 1 },
        { id: 'tpl-ud-lm-ul2', title: 'Bioluminescent Shore', description: 'Colonies of glowing algae paint the lakeshore in shifting blue-green light', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-ul3', title: 'Kuo-toa Shrine', description: 'A ramshackle altar of fish bones and refuse, sacred to Blibdoolpoolp', rarity: 'Uncommon', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-crystal-cave', name: 'Crystal Cave Landmarks', terrain: 'Crystal Cave',
      entries: [
        { id: 'tpl-ud-lm-cc1', title: 'Glowing Crystal Formation', description: 'A cluster of massive crystals pulses with inner light, humming at subsonic frequencies', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-cc2', title: 'Crystal Mirror Pool', description: 'Perfectly still water reflects the crystals above, creating dizzying double images', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-cc3', title: 'Geode Chamber', description: 'An enormous hollow geode, its interior lined with amethyst the size of swords', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-lava-tube', name: 'Lava Tube Landmarks', terrain: 'Lava Tube',
      entries: [
        { id: 'tpl-ud-lm-lt1', title: 'Obsidian Flow', description: 'A river of cooled volcanic glass, its surface razor-sharp and mirror-smooth', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-lt2', title: 'Lava Falls', description: 'Molten rock cascades into a magma pool, the heat unbearable within fifty feet', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-lt3', title: 'Salamander Forge', description: 'An abandoned forge built from fireproof stone, its anvil still warm', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-chasm', name: 'Chasm Landmarks', terrain: 'Chasm',
      entries: [
        { id: 'tpl-ud-lm-ch1', title: 'Web Bridge', description: 'Phase spider silk spans the chasm — strong as steel cable, sticky to the touch', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-ch2', title: 'Echo Chamber', description: 'Sound reverberates endlessly here; a whisper returns as a roar', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-ch3', title: 'Bottomless Pit', description: 'A shaft that drops beyond the reach of darkvision, exhaling cold air from impossible depths', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-deep-tunnels', name: 'Deep Tunnels Landmarks', terrain: 'Deep Tunnels',
      entries: [
        { id: 'tpl-ud-lm-dt1', title: 'Carved Bas-Relief', description: 'An ancient tunnel wall carved with scenes depicting a civilization now long extinct', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-dt2', title: 'Collapsed Intersection', description: 'A crossroads where one passage has caved in, rubble partially blocking the others', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-dt3', title: 'Mind Flayer Tadpole Pool', description: 'An abandoned elder brain pool — the water still squirms with residual psionic energy', rarity: 'Rare', weight: 1 },
      ]
    },
    {
      id: 'tpl-ud-lm-stone-bridge', name: 'Stone Bridge Landmarks', terrain: 'Stone Bridge',
      entries: [
        { id: 'tpl-ud-lm-sb1', title: 'Dwarven Span', description: 'A masterwork bridge carved with dwarven runes of warding, impossibly well preserved', rarity: 'Uncommon', weight: 1 },
        { id: 'tpl-ud-lm-sb2', title: 'Toll Gate Ruins', description: 'The remains of a gatehouse, its portcullis rusted in the open position', rarity: 'Common', weight: 2 },
        { id: 'tpl-ud-lm-sb3', title: 'Hanging Gardens', description: 'Bioluminescent moss and cave vines drape from the bridge supports, creating an eerie beauty', rarity: 'Uncommon', weight: 1 },
      ]
    },
  ],
  generationConfig: {
    biomeClusteringStrength: 0.5,
    encounterDensity: 0.5,
    landmarkDensity: 0.3,
    terrainVariety: 0.5,
  },
  factions: [
    { name: 'Drow Houses', description: 'Rival noble houses of the dark elves, locked in endless schemes of betrayal and assassination', color: '#8A2BE2', goals: 'Gain Lolth\'s favor and dominate rival houses through cunning and treachery', tags: ['political', 'religious'] },
    { name: 'Myconid Collective', description: 'Peaceful fungal beings who share a communal dream through rapport spores', color: '#9370DB', goals: 'Cultivate their fungal gardens in peace and expand the shared dream', tags: ['peaceful', 'alien'] },
    { name: 'Mind Flayer Colony', description: 'An illithid colony ruled by an elder brain, harvesting sentient minds for sustenance', color: '#483D8B', goals: 'Rebuild their shattered empire and enslave all thinking creatures', tags: ['psionic', 'expansionist'] },
    { name: 'Deep Gnome Enclave', description: 'Svirfneblin communities hidden in the stone, surviving through stealth and caution', color: '#A9A9A9', goals: 'Protect their hidden settlements and trade safely with surface dwellers', tags: ['defensive', 'mercantile'] },
  ],
  regions: [
    { name: 'Menzoberranzan Outskirts', color: '#8A2BE2', description: 'The perilous caverns surrounding the great drow city, patrolled by house soldiers and slavers', tags: ['drow', 'dangerous'] },
    { name: 'Darklake', color: '#1A3A5C', description: 'A vast subterranean sea dotted with islands, its depths hiding terrors beyond imagining', tags: ['aquatic', 'mysterious'] },
    { name: 'Crystal Labyrinth', color: '#40E0D0', description: 'A dazzling maze of crystalline passages that refract light and confuse navigation', tags: ['crystal', 'disorienting'] },
    { name: 'Wormwrithings', color: '#3E2723', description: 'A network of tunnels bored by purple worms, where the walls still vibrate with their passage', tags: ['tunnels', 'unstable'] },
  ],
  tags: ['subterranean', 'alien', 'dangerous'],
};
