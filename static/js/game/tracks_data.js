/**
 * RACING ZONE - CarX Highway Racing Inspired Track Locations
 * Realistic Highway Duels, Traffic Flow, Mission Briefings & GTA Cities
 */

window.RacingTracks = {
  'los-santos': {
    slug: 'los-santos',
    name: 'Los Santos: Vinewood & Downtown',
    country: 'San Andreas, USA (Los Angeles)',
    district: 'Downtown Los Santos & Vinewood Hills',
    highwayCode: 'CA I-10 WESTBOUND EXPRESSWAY',
    heroImage: '/static/images/tracks/los-santos.jpg',
    biome: 'los_santos',
    vehicleRestriction: 'supercars_only',
    defaultTime: 'day',
    availableTimes: ['day', 'sunset', 'night'],
    trafficDensity: 'Heavy (85%)',
    trafficLevel: 4, // 1 to 5
    policeThreat: '3-Star Interceptor Patrol',
    recommendedHp: 520,
    surfaceGrip: 'Dry Racing Asphalt (100%)',
    worldWidth: 3200,
    worldHeight: 2600,
    roadWidth: 36,
    surfaceColor: 0x1a1d24,
    lineColor: 0xffffff,
    centerLineColor: 0xffd600,
    curbColorA: 0xe63946,
    curbColorB: 0xffffff,
    terrainColor: 0x18201a,
    laps: 3,
    length_km: 4.2,
    difficulty: 'Medium',
    cashReward: 2500,
    xpReward: 650,
    objectives: [
      { text: 'Finish 1st Place vs 3 AI Rivals', reward: '+$1,500 Cash', icon: '🏆' },
      { text: 'Execute 3+ High-Speed Near Misses', reward: '+$500 Cash', icon: '⚡' },
      { text: 'Reach Top Speed of 180+ MPH', reward: '+350 XP', icon: '🔥' }
    ],
    description: 'Iconic California metropolis featuring the hillside VINEWOOD 3D sign, soaring Maze Bank Tower, Del Perro Beach pier, and sunset palm boulevards.',
    waypoints: [
      { x: -300, z: 240 },
      { x: 0, z: 240 },    // Vinewood Blvd straight
      { x: 280, z: 240 },
      { x: 400, z: 150 },  // Del Perro turn
      { x: 400, z: -80 },  // Pacific Coast Highway
      { x: 250, z: -270 }, // Maze Bank plaza chicane
      { x: 90, z: -270 },
      { x: -70, z: -190 }, // Rockford Hills
      { x: -270, z: -250 },// Vinewood Hills hairpin
      { x: -380, z: -60 },
      { x: -380, z: 120 }
    ],
    startGrid: [
      { x: -60, z: 236, angle: Math.PI / 2 },
      { x: -100, z: 244, angle: Math.PI / 2 },
      { x: -140, z: 236, angle: Math.PI / 2 },
      { x: -180, z: 244, angle: Math.PI / 2 }
    ]
  },

  'vice-city': {
    slug: 'vice-city',
    name: 'Vice City: Ocean Beach & Downtown',
    country: 'Florida, USA (Miami)',
    district: 'Ocean Drive & Starfish Island',
    highwayCode: 'A1A OCEAN DRIVE STRIP',
    heroImage: '/static/images/tracks/vice-city.jpg',
    biome: 'vice_city',
    vehicleRestriction: 'supercars_only',
    defaultTime: 'sunset',
    availableTimes: ['sunset', 'night', 'day'],
    trafficDensity: 'Dense Coastal Flow (75%)',
    trafficLevel: 3,
    policeThreat: '2-Star Marina Patrol',
    recommendedHp: 600,
    surfaceGrip: 'Rain-Slicked Neon (92%)',
    worldWidth: 3000,
    worldHeight: 2400,
    roadWidth: 36,
    surfaceColor: 0x1a2130,
    lineColor: 0x00f0ff,
    centerLineColor: 0xff007f,
    curbColorA: 0xff007f,
    curbColorB: 0x00f0ff,
    terrainColor: 0x0f2b46,
    laps: 3,
    length_km: 3.8,
    difficulty: 'Medium',
    cashReward: 2800,
    xpReward: 700,
    objectives: [
      { text: 'Finish 1st Place on Ocean Drive', reward: '+$1,600 Cash', icon: '🏆' },
      { text: 'Power Slide around Starfish Hairpin', reward: '+$600 Cash', icon: '💨' },
      { text: 'Maintain 190+ MPH for 4 Seconds', reward: '+400 XP', icon: '🔥' }
    ],
    description: 'Retro 80s synthwave paradise with Ocean Drive pastel Art Deco neon hotels, Starfish Island mansions, palm-lined oceanfronts, and luxury yachts.',
    waypoints: [
      { x: -260, z: 230 },
      { x: 20, z: 230 },   // Ocean Drive beachfront straight
      { x: 280, z: 230 },
      { x: 380, z: 130 },  // Malibu Club right
      { x: 380, z: -70 },  // Vice Point causeway
      { x: 230, z: -250 }, // Starfish Island bridge
      { x: 70, z: -230 },  // Little Haiti cutoff
      { x: -60, z: -150 }, // Washington Beach hairpin
      { x: -230, z: -230 },// Marina bay
      { x: -330, z: -60 },
      { x: -330, z: 120 }
    ],
    startGrid: [
      { x: -50, z: 226, angle: Math.PI / 2 },
      { x: -90, z: 234, angle: Math.PI / 2 },
      { x: -130, z: 226, angle: Math.PI / 2 },
      { x: -170, z: 234, angle: Math.PI / 2 }
    ]
  },

  'liberty-city': {
    slug: 'liberty-city',
    name: 'Liberty City: Algonquin & Star Junction',
    country: 'Liberty State, USA (New York City)',
    district: 'Algonquin, Star Junction & Broker Bridge',
    highwayCode: 'NY I-95 MIDTOWN EXPRESSWAY',
    heroImage: '/static/images/tracks/liberty-city.jpg',
    biome: 'liberty_city',
    vehicleRestriction: 'supercars_only',
    defaultTime: 'night',
    availableTimes: ['night', 'day', 'sunset'],
    trafficDensity: 'Gridlock Heavy (90%)',
    trafficLevel: 5,
    policeThreat: '4-Star Tactical Interceptors',
    recommendedHp: 700,
    surfaceGrip: 'Wet Manhattan Tarmac (88%)',
    worldWidth: 3000,
    worldHeight: 2500,
    roadWidth: 36,
    surfaceColor: 0x15161c,
    lineColor: 0xffffff,
    centerLineColor: 0xffd600,
    curbColorA: 0xffd600,
    curbColorB: 0x111111,
    terrainColor: 0x0a0c10,
    laps: 3,
    length_km: 4.5,
    difficulty: 'Hard',
    cashReward: 3200,
    xpReward: 850,
    objectives: [
      { text: 'Win Manhattan Midtown Duel', reward: '+$2,000 Cash', icon: '🏆' },
      { text: 'Weave 5+ Near Misses in Traffic', reward: '+$750 Cash', icon: '⚡' },
      { text: 'Evade Police Pursuit to the Bridge', reward: '+500 XP', icon: '🚨' }
    ],
    description: 'Gritty East Coast metropolis packed with the dazzling neon billboards of Star Junction (Times Square), Rotterdam Tower spire, and historic suspension bridges.',
    waypoints: [
      { x: -290, z: 250 },
      { x: 0, z: 250 },    // Star Junction Broadway straight
      { x: 270, z: 250 },
      { x: 390, z: 150 },  // East River turn
      { x: 390, z: -80 },  // Broker Bridge viaduct
      { x: 250, z: -270 }, // Middle Park chicane
      { x: 80, z: -270 },  // North Algonquin
      { x: -80, z: -190 }, // Rotterdam Tower plaza
      { x: -260, z: -250 },// Bohan connector
      { x: -370, z: -70 },
      { x: -370, z: 130 }
    ],
    startGrid: [
      { x: -60, z: 246, angle: Math.PI / 2 },
      { x: -100, z: 254, angle: Math.PI / 2 },
      { x: -140, z: 246, angle: Math.PI / 2 },
      { x: -180, z: 254, angle: Math.PI / 2 }
    ]
  },

  'las-venturas': {
    slug: 'las-venturas',
    name: 'Las Venturas: The Strip & Casino Corridor',
    country: 'San Andreas, USA (Las Vegas)',
    district: 'The Strip & Camelot Casino Corridor',
    highwayCode: 'NV I-15 CASINO FREEWAY',
    heroImage: '/static/images/tracks/las-venturas.jpg',
    biome: 'las_venturas',
    vehicleRestriction: 'supercars_only',
    defaultTime: 'night',
    availableTimes: ['night', 'sunset', 'day'],
    trafficDensity: 'Moderate Strip Traffic (70%)',
    trafficLevel: 3,
    policeThreat: '3-Star Highway Enforcers',
    recommendedHp: 750,
    surfaceGrip: 'Dry Rubbered Asphalt (100%)',
    worldWidth: 3200,
    worldHeight: 2600,
    roadWidth: 36,
    surfaceColor: 0x1d1e26,
    lineColor: 0xffffff,
    centerLineColor: 0xffb703,
    curbColorA: 0xffb703,
    curbColorB: 0x9d4edd,
    terrainColor: 0x140e10,
    laps: 2,
    length_km: 4.6,
    difficulty: 'Hard',
    cashReward: 3400,
    xpReward: 900,
    objectives: [
      { text: 'Conquer The Strip Grand Prix', reward: '+$2,200 Cash', icon: '🏆' },
      { text: 'Hit Speed Camera Trap > 200 MPH', reward: '+$800 Cash', icon: '⚡' },
      { text: 'Zero Collisions on Desert Stretch', reward: '+600 XP', icon: '🛡️' }
    ],
    description: 'Blazing desert casino playground centered around The Camelot obsidian pyramid with sky beam, neon marquee arches, and shimmering golden resort towers.',
    waypoints: [
      { x: -310, z: 250 },
      { x: 0, z: 250 },    // The Strip flat-out straight
      { x: 290, z: 250 },
      { x: 410, z: 140 },  // The Visage sweeper
      { x: 410, z: -90 },  // Caligula's avenue
      { x: 260, z: -280 }, // Four Dragons chicane
      { x: 70, z: -280 },  // Desert overlook
      { x: -90, z: -190 }, // Pyramid plaza
      { x: -280, z: -240 },// Neon arch hairpin
      { x: -390, z: -60 },
      { x: -390, z: 130 }
    ],
    startGrid: [
      { x: -70, z: 246, angle: Math.PI / 2 },
      { x: -110, z: 254, angle: Math.PI / 2 },
      { x: -150, z: 246, angle: Math.PI / 2 },
      { x: -190, z: 254, angle: Math.PI / 2 }
    ]
  },

  'blaine-county': {
    slug: 'blaine-county',
    name: 'Blaine County: Route 68 & Mount Chiliad',
    country: 'San Andreas, USA (California Countryside)',
    district: 'Grand Senora Desert & Mount Chiliad',
    highwayCode: 'US ROUTE 68 DESERT HIGHWAY',
    heroImage: '/static/images/tracks/blaine-county.jpg',
    biome: 'blaine_county',
    vehicleRestriction: 'supercars_only',
    defaultTime: 'day',
    availableTimes: ['day', 'sunset', 'night'],
    trafficDensity: 'Rural Highway Traffic (55%)',
    trafficLevel: 2,
    policeThreat: '5-Star Sheriff Highway Pursuit',
    recommendedHp: 800,
    surfaceGrip: 'Sun-Baked Desert Tarmac (95%)',
    worldWidth: 3400,
    worldHeight: 2800,
    roadWidth: 36,
    surfaceColor: 0x24201c,
    lineColor: 0xffffff,
    centerLineColor: 0xffb703,
    curbColorA: 0xd95d39,
    curbColorB: 0xf4a261,
    terrainColor: 0xb85d28,
    laps: 2,
    length_km: 5.2,
    difficulty: 'Extreme',
    cashReward: 3800,
    xpReward: 1100,
    objectives: [
      { text: 'Outrun Mount Chiliad Rivals', reward: '+$2,500 Cash', icon: '🏆' },
      { text: 'Climb 0-160 MPH in Under 5s', reward: '+$800 Cash', icon: '⚡' },
      { text: 'Escape 5-Star Sheriff Roadblocks', reward: '+700 XP', icon: '🚨' }
    ],
    description: 'Vast rural open-world highway crossing Route 68, Mount Chiliad peak, spinning wind turbine farms, roadside gas stops, and red rock buttes.',
    waypoints: [
      { x: -330, z: 260 },
      { x: -40, z: 260 },  // Route 68 flat-out desert straight
      { x: 260, z: 260 },
      { x: 430, z: 140 },  // Mount Chiliad pass
      { x: 330, z: -50 },  // Canyon gorge
      { x: 430, z: -230 }, // Ridge overlook
      { x: 190, z: -330 }, // Wind farm plateau
      { x: -80, z: -330 },
      { x: -270, z: -210 },// Switchback hairpin
      { x: -190, z: -50 },
      { x: -390, z: 80 }
    ],
    startGrid: [
      { x: -90, z: 256, angle: Math.PI / 2 },
      { x: -130, z: 264, angle: Math.PI / 2 },
      { x: -170, z: 256, angle: Math.PI / 2 },
      { x: -210, z: 264, angle: Math.PI / 2 }
    ]
  },

  'monza-f1': {
    slug: 'monza-f1',
    name: 'Monza: Temple of Speed',
    country: 'Lombardy, Italy (Autodromo Nazionale Monza)',
    district: 'Parco di Monza Grand Prix Circuit',
    highwayCode: 'AUTODROMO NAZIONALE MONZA GP',
    heroImage: '/static/images/tracks/monza.jpg',
    biome: 'monza_f1',
    isF1Track: true,
    vehicleRestriction: 'f1_only',
    defaultTime: 'day',
    availableTimes: ['day', 'sunset', 'night'],
    trafficDensity: 'None (Grand Prix Grid)',
    trafficLevel: 0,
    policeThreat: 'None (FIA Safety Car)',
    recommendedHp: 980,
    surfaceGrip: 'Pirelli P-Zero Ultra-Soft (100%)',
    worldWidth: 3600,
    worldHeight: 3000,
    roadWidth: 32,
    surfaceColor: 0x1e222a,
    lineColor: 0xffffff,
    centerLineColor: 0xffffff,
    curbColorA: 0xd90429,
    curbColorB: 0xffffff,
    terrainColor: 0x1b3b24,
    laps: 3,
    length_km: 5.79,
    difficulty: 'Extreme',
    cashReward: 5000,
    xpReward: 1800,
    drsZones: [
      { startWp: 0, endWp: 2, label: 'DRS ZONE 1: RETTIFILO STRAIGHT' },
      { startWp: 8, endWp: 10, label: 'DRS ZONE 2: SERRAGLIO STRAIGHT' }
    ],
    sectors: [
      { sector: 1, endWp: 4, name: 'SECTOR 1 (Rettifilo & Curva Grande)' },
      { sector: 2, endWp: 8, name: 'SECTOR 2 (Roggia & Lesmo 1 & 2)' },
      { sector: 3, endWp: 12, name: 'SECTOR 3 (Ascari & Parabolica)' }
    ],
    objectives: [
      { text: 'Finish 1st Place at Italian GP', reward: '+$3,000 Cash', icon: '🏆' },
      { text: 'Surpass 220+ MPH down Rettifilo', reward: '+$1,200 Cash', icon: '⚡' },
      { text: 'Clip Apexes through Variante Ascari', reward: '+800 XP', icon: '🏁' }
    ],
    description: 'The legendary Temple of Speed featuring the flat-out Rettifilo straight, Variante del Rettifilo chicane, Curva Grande, Roggia, Lesmo 1 & 2, Serraglio, Variante Ascari, and the high-speed Curva Parabolica.',
    waypoints: [
      { x: -340, z: 260 }, // 0: Start / Finish line on Rettifilo straight
      { x: -60, z: 260 },  // 1: Rettifilo flat-out DRS Zone 1
      { x: 240, z: 260 },  // 2: Speed Trap 1 & 100m brake board
      { x: 410, z: 220 },  // 3: Variante del Rettifilo (Turns 1 & 2 Chicane)
      { x: 420, z: 80 },   // 4: Curva Grande (Turn 3 sweeping flat-out right)
      { x: 340, z: -70 },  // 5: Approach to Roggia
      { x: 380, z: -170 }, // 6: Variante della Roggia (Turns 4 & 5 Chicane)
      { x: 220, z: -290 }, // 7: Curva di Lesmo 1 (Turn 6)
      { x: 40, z: -330 },  // 8: Curva di Lesmo 2 (Turn 7)
      { x: -160, z: -320 },// 9: Serraglio DRS straight (under bridge)
      { x: -330, z: -210 },// 10: Variante Ascari entry (Turns 8, 9, 10)
      { x: -390, z: -40 }, // 11: Ascari exit straight
      { x: -410, z: 120 }  // 12: Curva Parabolica / Alboreto (Turn 11) sweeping onto straight
    ],
    startGrid: [
      { x: -80, z: 256, angle: Math.PI / 2 },
      { x: -120, z: 264, angle: Math.PI / 2 },
      { x: -160, z: 256, angle: Math.PI / 2 },
      { x: -200, z: 264, angle: Math.PI / 2 }
    ]
  }
};

// Aliases for compatibility
window.RacingTracks['neon-metropolis'] = window.RacingTracks['los-santos'];
window.RacingTracks['neon_city'] = window.RacingTracks['los-santos'];
window.RacingTracks['neon-city'] = window.RacingTracks['los-santos'];
window.RacingTracks['coastal-riviera'] = window.RacingTracks['vice-city'];
window.RacingTracks['monaco-city-circuit'] = window.RacingTracks['vice-city'];
window.RacingTracks['tokyo-shuto-c1'] = window.RacingTracks['liberty-city'];
window.RacingTracks['desert-canyon'] = window.RacingTracks['blaine-county'];
window.RacingTracks['snowy-alpine-city'] = window.RacingTracks['blaine-county'];
window.RacingTracks['silverstone-apex'] = window.RacingTracks['los-santos'];
window.RacingTracks['alpine-touge-pass'] = window.RacingTracks['blaine-county'];
