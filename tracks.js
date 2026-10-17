// v20 track + cup data. Only tracks with a `cfg` are playable; the rest show as "coming soon".
export const CUPS = [
  { id: 'brass', name: 'Brass Cup', color: '#ffc83a', icon: '🎺', tracks: [['brass', 'Brass City'], ['ghost', 'Ghost Town Gulch'], ['stadium', 'Marching Band Stadium']] },
  { id: 'wood', name: 'Woodwind Cup', color: '#40e8ff', icon: '🎷', tracks: [['water', 'Splash Tempo Water Park'], ['bayou', 'Bayou Jazz Swamp'], ['reed', 'Reed Forest']] },
  { id: 'perc', name: 'Percussion Cup', color: '#ff5a6a', icon: '🥁', tracks: [['school', 'School Halls'], ['canyon', 'Drumline Desert Canyon'], ['volcano', 'Thunder Volcano']] },
  { id: 'grand', name: 'Grand Finale', color: '#c080ff', icon: '🎆', tracks: [['snow', 'Snowy Holiday Parade'], ['neon', 'Neon Night Concert'], ['rainbow', 'Rainbow Parade Route']] },
];
export const TRACKS = {
  brass: { name: 'Brass City', cup: 'Brass Cup', blurb: 'Sunset streets, Backbeat Alley shortcut, the giant metronome.',
    ctrl: [[0,0],[0,-160],[30,-230],[110,-250],[190,-220],[230,-150],[200,-80],[140,-50],[130,10],[190,60],[220,140],[170,210],[80,220],[10,180],[-40,120],[-20,60]],
    hill: [415, 52, 7], alley: { A: 245, B: 360, HW: 6.5, style: 'alley', sign: 'SHORTCUT ➜ BACKBEAT ALLEY', exit: 'BACKBEAT ALLEY', ahead: 'SHORTCUT AHEAD' },
    crosswalks: [110, 230, 490, 560], rails: [], ramp: 150, warps: [15, 190, 482], pads: [[52, 4], [520, -4]], stands: [[100, -7], [140, 6], [300, -5], [440, -6], [575, -5]],
    metro: 70, rollers: 'timpani', surface: 'city', banner: 'TURBO TEMPO ♪ BRASS CITY', music: 'march', scenery: 'city',
    env: { bg: 0xffa060, fog: 0xf2a066, fogNear: 140, fogFar: 560, ground: 0x5a5560, hemi: [0xffe2c0, 0x40304a, 1.3], sun: [0xfff0d0, 1.8] } },
  ghost: { name: 'Ghost Town Gulch', cup: 'Brass Cup', blurb: 'Dusty old-west ghost town at dusk. Cut through the mine tunnel!',
    ctrl: [[0,0],[0,-140],[30,-210],[100,-235],[170,-215],[200,-165],[212,-120],[250,-100],[300,-70],[305,-15],[260,15],[215,45],[200,95],[170,160],[110,200],[40,205],[-30,170],[-45,100],[-20,40]],
    hill: [150, 40, 6], alley: { A: 210, B: 360, HW: 6.5, style: 'mine', sign: 'MINE SHORTCUT ➜', exit: 'OLD GOLD MINE', ahead: 'MINE SHORTCUT AHEAD' },
    crosswalks: [], rails: [95, 430], ramp: 545, warps: [20, 380, 455], pads: [[70, -4], [300, 4]], stands: [[60, -6], [250, 6], [300, -6], [335, 6], [510, -5]],
    metro: null, rollers: 'barrel', surface: 'dirt', banner: 'GHOST TOWN GULCH ★ FINISH', music: 'saloon', scenery: 'ghost',
    env: { bg: 0x7a4a6a, fog: 0x8a5a68, fogNear: 150, fogFar: 600, ground: 0xb08860, hemi: [0xffd0a8, 0x4a3040, 1.25], sun: [0xffc090, 1.5] } },
};
// card art colours for the select screen (all 12, built or not)
export const THEME = { brass: ['#ff9a50', '#5a2a7a', 'Sunset streets, Backbeat Alley, the giant metronome'], ghost: ['#ff7a40', '#2a1438', 'Dusty saloon town, tumbleweeds, a mine-tunnel shortcut'],
  stadium: ['#3aa04a', '#1a2a5a', 'Laps around the 50-yard line'], water: ['#40d8ff', '#1a4a8a', 'Slides, splashes and wave pools'], bayou: ['#6aa040', '#1a2a1a', 'Swampy jazz under the moss'],
  reed: ['#8ad060', '#2a4a1a', 'Tall reeds and woodwind trees'], school: ['#ffd34d', '#5a3a2a', 'Lockers, band room and the gym'], canyon: ['#e8804a', '#5a2a1a', 'Red-rock drumline echoes'],
  volcano: ['#ff4a2a', '#2a0a0a', 'Lava drums and rumbling thunder'], snow: ['#e8f4ff', '#3a5a8a', 'Holiday floats on fresh snow'], neon: ['#ff4fd8', '#140a30', 'Laser-lit concert at midnight'], rainbow: ['#ff6ad0', '#4a3aa0', 'The grand parade of every colour'] };
export function trackOf(id) { return TRACKS[id] ? id : 'brass'; }
