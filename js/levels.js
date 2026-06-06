// Drift Level Design Data (Paper & Ink Redesign)
// Logical dimensions are 1200 x 800

export const levels = [
  {
    id: 1,
    title: "Chapter 1: Gentle Waters",
    description: "Paint a continuous watercolor wind current with your brush. Guide the boat to the dock lantern.",
    spawn: { x: 200, y: 400, angle: 0 },
    shore: { x: 1000, y: 400, radius: 50, dockAngle: Math.PI },
    maxWind: 3,
    threeStarLimit: 1,
    twoStarLimit: 2,
    rocks: [],
    tutorial: "Sweep a single watercolor brush stroke from left to right along the screen.",
    tutorialPath: [
      { x: 230, y: 400 },
      { x: 500, y: 400 },
      { x: 800, y: 400 }
    ],
    palette: {
      paperColor: '#f4efe2',
      vignetteColor: 'rgba(230, 220, 196, 0.48)',
      causticColor: 'rgba(255, 255, 255, 0.12)',
      windColor: 'rgba(59, 163, 159',
      windColorHex: '#3ba39f'
    },
    weather: 'none',
    lotuses: []
  },
  {
    id: 2,
    title: "Chapter 2: Sanctuary Stone",
    description: "Earthy stones block the way. Paint a winding current around them.",
    spawn: { x: 200, y: 600, angle: -Math.PI / 6 },
    shore: { x: 1000, y: 200, radius: 50, dockAngle: Math.PI / 2 },
    maxWind: 3,
    threeStarLimit: 2,
    twoStarLimit: 2,
    rocks: [
      { x: 600, y: 400, radius: 95, seed: 1.25, variance: 0.24, mossAngle: -Math.PI / 3 }
    ],
    tutorial: "Paint a curving current: bend up, then guide it right towards the dock.",
    palette: {
      paperColor: '#f0f2eb',
      vignetteColor: 'rgba(182, 196, 172, 0.45)',
      causticColor: 'rgba(255, 255, 255, 0.14)',
      windColor: 'rgba(79, 140, 186',
      windColorHex: '#4f8cba'
    },
    weather: 'fog',
    lotuses: [
      { x: 420, y: 220, bloomed: false, seed: 0.1 },
      { x: 740, y: 550, bloomed: false, seed: 0.2 }
    ]
  },
  {
    id: 3,
    title: "Chapter 3: The S-Bend Passage",
    description: "The waters wind between two ancient mossy rocks. Weave through them.",
    spawn: { x: 150, y: 150, angle: 0 },
    shore: { x: 1050, y: 650, radius: 50, dockAngle: Math.PI },
    maxWind: 4,
    threeStarLimit: 2,
    twoStarLimit: 3,
    rocks: [
      { x: 450, y: 250, radius: 105, seed: 5.43, variance: 0.25, mossAngle: -Math.PI / 4 },
      { x: 750, y: 550, radius: 105, seed: 9.87, variance: 0.20, mossAngle: -Math.PI / 6 }
    ],
    tutorial: "The paper boat has momentum. Paint a curving breeze to guide its turn early.",
    palette: {
      paperColor: '#f7ecd8',
      vignetteColor: 'rgba(195, 120, 110, 0.35)',
      causticColor: 'rgba(255, 240, 200, 0.16)',
      windColor: 'rgba(170, 90, 190',
      windColorHex: '#aa5abe'
    },
    weather: 'none',
    lotuses: [
      { x: 260, y: 440, bloomed: false, seed: 0.3 },
      { x: 910, y: 320, bloomed: false, seed: 0.4 }
    ]
  },
  {
    id: 4,
    title: "Chapter 4: The Whispering Eddy",
    description: "Create a swirling current of brush strokes to orbit the central island.",
    spawn: { x: 150, y: 400, angle: -Math.PI / 2 },
    shore: { x: 1050, y: 400, radius: 50, dockAngle: Math.PI },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 600, y: 400, radius: 145, seed: 3.14, variance: 0.24, mossAngle: -Math.PI / 4 },
      { x: 600, y: 110, radius: 45, seed: 2.71, variance: 0.18, mossAngle: -Math.PI / 4 },
      { x: 600, y: 690, radius: 45, seed: 4.22, variance: 0.18, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "Draw multiple brush strokes to form a circular flow around the large rock.",
    palette: {
      paperColor: '#cbd4ec',
      vignetteColor: 'rgba(40, 52, 98, 0.4)',
      causticColor: 'rgba(255, 255, 255, 0.09)',
      windColor: 'rgba(235, 150, 60',
      windColorHex: '#eb963c'
    },
    weather: 'fog',
    lotuses: [
      { x: 420, y: 400, bloomed: false, seed: 0.5 },
      { x: 780, y: 400, bloomed: false, seed: 0.6 }
    ]
  },
  {
    id: 5,
    title: "Chapter 5: Eye of the Needle",
    description: "Navigate a narrow channel. Precision and patience will lead to peace.",
    spawn: { x: 150, y: 400, angle: 0 },
    shore: { x: 1050, y: 400, radius: 50, dockAngle: Math.PI },
    maxWind: 4,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 500, y: 190, radius: 95, seed: 6.78, variance: 0.22, mossAngle: -Math.PI / 3 },
      { x: 500, y: 610, radius: 95, seed: 8.90, variance: 0.22, mossAngle: -Math.PI / 4 },
      { x: 790, y: 220, radius: 85, seed: 1.11, variance: 0.25, mossAngle: -Math.PI / 6 },
      { x: 790, y: 580, radius: 85, seed: 2.22, variance: 0.25, mossAngle: -Math.PI / 4 },
      { x: 645, y: 400, radius: 35, seed: 3.33, variance: 0.15, mossAngle: -Math.PI / 2 }
    ],
    tutorial: "Align short, precise wind currents. Guide the boat through the eye of the needle.",
    palette: {
      paperColor: '#d9e0e4',
      vignetteColor: 'rgba(70, 85, 110, 0.5)',
      causticColor: 'rgba(255, 255, 255, 0.06)',
      windColor: 'rgba(60, 180, 130',
      windColorHex: '#3cb482'
    },
    weather: 'rain',
    lotuses: [
      { x: 350, y: 400, bloomed: false, seed: 0.7 },
      { x: 925, y: 400, bloomed: false, seed: 0.8 }
    ]
  },
  {
    id: 6,
    title: "Chapter 6: Twin Pillars",
    description: "Navigate the narrow gap between two ancient stone pillars.",
    spawn: { x: 600, y: 700, angle: -Math.PI / 2 },
    shore: { x: 600, y: 120, radius: 45, dockAngle: Math.PI / 2 },
    maxWind: 4,
    threeStarLimit: 2,
    twoStarLimit: 3,
    rocks: [
      { x: 420, y: 410, radius: 75, seed: 1.6, variance: 0.18, mossAngle: -Math.PI / 3 },
      { x: 780, y: 410, radius: 75, seed: 2.1, variance: 0.18, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "Thread the needle between the two rocks. Speed and angle must be precise.",
    palette: {
      paperColor: '#f4efe2',
      vignetteColor: 'rgba(230, 220, 196, 0.48)',
      causticColor: 'rgba(255, 255, 255, 0.12)',
      windColor: 'rgba(59, 163, 159',
      windColorHex: '#3ba39f'
    },
    weather: 'none',
    lotuses: [
      { x: 600, y: 410, bloomed: false, seed: 0.11 }
    ]
  },
  {
    id: 7,
    title: "Chapter 7: The Trident",
    description: "Choose your path wisely: three barriers divide the waters ahead.",
    spawn: { x: 200, y: 400, angle: 0 },
    shore: { x: 1000, y: 400, radius: 45, dockAngle: Math.PI },
    maxWind: 4,
    threeStarLimit: 2,
    twoStarLimit: 3,
    rocks: [
      { x: 600, y: 180, radius: 75, seed: 3.3, variance: 0.2, mossAngle: -Math.PI / 4 },
      { x: 600, y: 400, radius: 60, seed: 4.4, variance: 0.15, mossAngle: -Math.PI / 3 },
      { x: 600, y: 620, radius: 75, seed: 5.5, variance: 0.2, mossAngle: -Math.PI / 2 }
    ],
    tutorial: "There are two channels. Guide the boat through the upper or lower gap.",
    palette: {
      paperColor: '#f0f2eb',
      vignetteColor: 'rgba(182, 196, 172, 0.45)',
      causticColor: 'rgba(255, 255, 255, 0.14)',
      windColor: 'rgba(79, 140, 186',
      windColorHex: '#4f8cba'
    },
    weather: 'fog',
    lotuses: [
      { x: 600, y: 290, bloomed: false, seed: 0.12 },
      { x: 600, y: 510, bloomed: false, seed: 0.13 }
    ]
  },
  {
    id: 8,
    title: "Chapter 8: Hidden Haven",
    description: "The sanctuary dock is nestled behind a curved wall of solid stone.",
    spawn: { x: 150, y: 650, angle: -Math.PI / 4 },
    shore: { x: 1000, y: 180, radius: 45, dockAngle: Math.PI / 2 },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 920, y: 320, radius: 70, seed: 6.6, variance: 0.22, mossAngle: -Math.PI / 4 },
      { x: 1080, y: 320, radius: 70, seed: 7.7, variance: 0.22, mossAngle: -Math.PI / 3 },
      { x: 740, y: 220, radius: 55, seed: 8.8, variance: 0.18, mossAngle: -Math.PI / 6 }
    ],
    tutorial: "Sling the boat in a wide, circular arc around the outer stones to slip in from below.",
    palette: {
      paperColor: '#f7ecd8',
      vignetteColor: 'rgba(195, 120, 110, 0.35)',
      causticColor: 'rgba(255, 240, 200, 0.16)',
      windColor: 'rgba(170, 90, 190',
      windColorHex: '#aa5abe'
    },
    weather: 'none',
    lotuses: [
      { x: 800, y: 450, bloomed: false, seed: 0.14 },
      { x: 1000, y: 380, bloomed: false, seed: 0.15 }
    ]
  },
  {
    id: 9,
    title: "Chapter 9: Crosswind Channel",
    description: "Drift down a long channel while dodging diagonal current drops.",
    spawn: { x: 150, y: 400, angle: 0 },
    shore: { x: 1050, y: 400, radius: 45, dockAngle: Math.PI },
    maxWind: 4,
    threeStarLimit: 2,
    twoStarLimit: 3,
    rocks: [
      { x: 500, y: 290, radius: 70, seed: 1.1, variance: 0.2, mossAngle: -Math.PI / 3 },
      { x: 750, y: 510, radius: 70, seed: 2.2, variance: 0.2, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "A zigzag path is required. Steer down-right, then glide back up-right.",
    palette: {
      paperColor: '#cbd4ec',
      vignetteColor: 'rgba(40, 52, 98, 0.4)',
      causticColor: 'rgba(255, 255, 255, 0.09)',
      windColor: 'rgba(235, 150, 60',
      windColorHex: '#eb963c'
    },
    weather: 'fog',
    lotuses: [
      { x: 500, y: 500, bloomed: false, seed: 0.16 },
      { x: 750, y: 290, bloomed: false, seed: 0.17 }
    ]
  },
  {
    id: 10,
    title: "Chapter 10: Ring of Stones",
    description: "A ring of ancient stones surrounds the path to the lantern dock.",
    spawn: { x: 200, y: 400, angle: 0 },
    shore: { x: 1000, y: 400, radius: 45, dockAngle: Math.PI },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 600, y: 240, radius: 60, seed: 3.1, variance: 0.18, mossAngle: -Math.PI / 3 },
      { x: 600, y: 560, radius: 60, seed: 3.2, variance: 0.18, mossAngle: -Math.PI / 4 },
      { x: 450, y: 400, radius: 50, seed: 3.3, variance: 0.15, mossAngle: -Math.PI / 2 },
      { x: 750, y: 400, radius: 50, seed: 3.4, variance: 0.15, mossAngle: -Math.PI / 6 }
    ],
    tutorial: "Ride the center eye of the storm, or weave around the outer ring.",
    palette: {
      paperColor: '#d9e0e4',
      vignetteColor: 'rgba(70, 85, 110, 0.5)',
      causticColor: 'rgba(255, 255, 255, 0.06)',
      windColor: 'rgba(60, 180, 130',
      windColorHex: '#3cb482'
    },
    weather: 'rain',
    lotuses: [
      { x: 600, y: 400, bloomed: false, seed: 0.18 }
    ]
  },
  {
    id: 11,
    title: "Chapter 11: The Crevice",
    description: "Glide above a long horizontal stone shelf.",
    spawn: { x: 150, y: 200, angle: 0 },
    shore: { x: 1050, y: 200, radius: 45, dockAngle: Math.PI },
    maxWind: 4,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 300, y: 380, radius: 95, seed: 4.1, variance: 0.22, mossAngle: -Math.PI / 4 },
      { x: 600, y: 380, radius: 95, seed: 4.2, variance: 0.22, mossAngle: -Math.PI / 3 },
      { x: 900, y: 380, radius: 95, seed: 4.3, variance: 0.22, mossAngle: -Math.PI / 6 }
    ],
    tutorial: "Keep your breeze strictly horizontal. The boat has minimal clearance.",
    palette: {
      paperColor: '#f4efe2',
      vignetteColor: 'rgba(230, 220, 196, 0.48)',
      causticColor: 'rgba(255, 255, 255, 0.12)',
      windColor: 'rgba(59, 163, 159',
      windColorHex: '#3ba39f'
    },
    weather: 'none',
    lotuses: [
      { x: 450, y: 160, bloomed: false, seed: 0.19 },
      { x: 750, y: 160, bloomed: false, seed: 0.20 }
    ]
  },
  {
    id: 12,
    title: "Chapter 12: Maze of Sages",
    description: "Five scattered rocks challenge your spatial intuition.",
    spawn: { x: 150, y: 150, angle: 0 },
    shore: { x: 1050, y: 650, radius: 45, dockAngle: Math.PI },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 380, y: 220, radius: 65, seed: 5.1, variance: 0.2, mossAngle: -Math.PI / 4 },
      { x: 600, y: 400, radius: 75, seed: 5.2, variance: 0.2, mossAngle: -Math.PI / 3 },
      { x: 820, y: 580, radius: 65, seed: 5.3, variance: 0.2, mossAngle: -Math.PI / 6 },
      { x: 400, y: 550, radius: 55, seed: 5.4, variance: 0.18, mossAngle: -Math.PI / 2 },
      { x: 800, y: 220, radius: 55, seed: 5.5, variance: 0.18, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "Paint short, winding curves to thread through the maze.",
    palette: {
      paperColor: '#f0f2eb',
      vignetteColor: 'rgba(182, 196, 172, 0.45)',
      causticColor: 'rgba(255, 255, 255, 0.14)',
      windColor: 'rgba(79, 140, 186',
      windColorHex: '#4f8cba'
    },
    weather: 'fog',
    lotuses: [
      { x: 600, y: 200, bloomed: false, seed: 0.21 },
      { x: 600, y: 600, bloomed: false, seed: 0.22 }
    ]
  },
  {
    id: 13,
    title: "Chapter 13: The Whirlwind",
    description: "Launch from the center of an orbital ring of stones.",
    spawn: { x: 600, y: 400, angle: 0 },
    shore: { x: 1050, y: 650, radius: 45, dockAngle: Math.PI },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 600, y: 180, radius: 55, seed: 6.1, variance: 0.18, mossAngle: -Math.PI / 3 },
      { x: 400, y: 400, radius: 55, seed: 6.2, variance: 0.18, mossAngle: -Math.PI / 4 },
      { x: 600, y: 620, radius: 55, seed: 6.3, variance: 0.18, mossAngle: -Math.PI / 2 },
      { x: 800, y: 400, radius: 55, seed: 6.4, variance: 0.18, mossAngle: -Math.PI / 6 }
    ],
    tutorial: "Loop around the center and slip out of the right-hand gap.",
    palette: {
      paperColor: '#f7ecd8',
      vignetteColor: 'rgba(195, 120, 110, 0.35)',
      causticColor: 'rgba(255, 240, 200, 0.16)',
      windColor: 'rgba(170, 90, 190',
      windColorHex: '#aa5abe'
    },
    weather: 'none',
    lotuses: [
      { x: 480, y: 280, bloomed: false, seed: 0.23 },
      { x: 720, y: 520, bloomed: false, seed: 0.24 }
    ]
  },
  {
    id: 14,
    title: "Chapter 14: Gates of Sanctuary",
    description: "Navigate a zigzag of defensive columns.",
    spawn: { x: 150, y: 400, angle: 0 },
    shore: { x: 1050, y: 400, radius: 45, dockAngle: Math.PI },
    maxWind: 5,
    threeStarLimit: 3,
    twoStarLimit: 4,
    rocks: [
      { x: 420, y: 240, radius: 75, seed: 7.1, variance: 0.22, mossAngle: -Math.PI / 4 },
      { x: 420, y: 560, radius: 75, seed: 7.2, variance: 0.22, mossAngle: -Math.PI / 3 },
      { x: 720, y: 150, radius: 65, seed: 7.3, variance: 0.2, mossAngle: -Math.PI / 6 },
      { x: 720, y: 650, radius: 65, seed: 7.4, variance: 0.2, mossAngle: -Math.PI / 2 },
      { x: 720, y: 400, radius: 50, seed: 7.5, variance: 0.15, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "S-bend down, up, and down again. Precision is essential.",
    palette: {
      paperColor: '#cbd4ec',
      vignetteColor: 'rgba(40, 52, 98, 0.4)',
      causticColor: 'rgba(255, 255, 255, 0.09)',
      windColor: 'rgba(235, 150, 60',
      windColorHex: '#eb963c'
    },
    weather: 'fog',
    lotuses: [
      { x: 570, y: 250, bloomed: false, seed: 0.25 },
      { x: 570, y: 550, bloomed: false, seed: 0.26 }
    ]
  },
  {
    id: 15,
    title: "Chapter 15: The Ocean Trial",
    description: "The ultimate test of fluid dynamics and watercolor currents.",
    spawn: { x: 150, y: 400, angle: 0 },
    shore: { x: 1050, y: 400, radius: 45, dockAngle: Math.PI },
    maxWind: 6,
    threeStarLimit: 4,
    twoStarLimit: 5,
    rocks: [
      { x: 380, y: 250, radius: 65, seed: 8.1, variance: 0.2, mossAngle: -Math.PI / 3 },
      { x: 380, y: 550, radius: 65, seed: 8.2, variance: 0.2, mossAngle: -Math.PI / 4 },
      { x: 600, y: 150, radius: 50, seed: 8.3, variance: 0.18, mossAngle: -Math.PI / 6 },
      { x: 600, y: 650, radius: 50, seed: 8.4, variance: 0.18, mossAngle: -Math.PI / 2 },
      { x: 600, y: 400, radius: 75, seed: 8.5, variance: 0.22, mossAngle: -Math.PI / 4 },
      { x: 820, y: 250, radius: 60, seed: 8.6, variance: 0.2, mossAngle: -Math.PI / 3 },
      { x: 820, y: 550, radius: 60, seed: 8.7, variance: 0.2, mossAngle: -Math.PI / 4 }
    ],
    tutorial: "Combine all lessons. Manage speed thresholds and curve shapes to guide the boat home.",
    palette: {
      paperColor: '#d9e0e4',
      vignetteColor: 'rgba(70, 85, 110, 0.5)',
      causticColor: 'rgba(255, 255, 255, 0.06)',
      windColor: 'rgba(60, 180, 130',
      windColorHex: '#3cb482'
    },
    weather: 'rain',
    lotuses: [
      { x: 490, y: 400, bloomed: false, seed: 0.27 },
      { x: 710, y: 400, bloomed: false, seed: 0.28 }
    ]
  }
];

export default levels;
