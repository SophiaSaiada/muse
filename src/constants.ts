export const MIDI_FILES = [
  {
    fileName: "7 Rings - Ariana Grande (Piano Cover) - MIDI.mid",
    displayName: "7 Rings - Ariana Grande",
  },
  {
    fileName: "Chappell Roan - Pink Pony Club.mid",
    displayName: "Chappell Roan - Pink Pony Club",
  },
  { fileName: "Frozen - Let it Go.mid", displayName: "Frozen - Let it Go" },
  { fileName: "Gravity Falls.mid", displayName: "Gravity Falls" },
  { fileName: "HOW FAR I'LL GO.mid", displayName: "Moana - How Far I'll Go" },
  //   {
  //     // It's a big file (~2000 notes), so it's currently not supported
  //     fileName: "Imagine Dragons - Whatever It Takes.mid",
  //     displayName: "Imagine Dragons - Whatever It Takes",
  //   },
  {
    fileName: "Take Me To Church.mid",
    displayName: "Hozier - Take Me To Church",
  },
  {
    fileName: "The Beatles - Come Together.mid",
    displayName: "The Beatles - Come Together",
  },
  {
    fileName: "We Don't Talk About Bruno (Piano Cover).mid",
    displayName: "Encanto - We Don't Talk About Bruno",
  },
] as const;

export const MUTE = false;
export const SHOW_PATH = false;
export const SHOW_BLOCKS = false;
export const SCALE = 10;
export const BLOCK_SCALE = 20;
export const BOUNCE_ANIMATION_HALF_TIME = 0.05;
export const BOUNCE_ANIMATION_SCALE_FACTOR = 0.85;
export const INCLUDE_BEATS = true;
export const SPEED = 150;
export const LOOKAHEAD_FOR_COLLISION = 14;
export const MIN_INTERVAL_BETWEEN_NOTES = 0.05;
export const BLOCK_FADE_IN_MIN_DURATION = 0.75;
export const BLOCK_FADE_IN_MAX_INDEX_DURATION = 6;
export const BLOCK_START_HUE = 334;
export const BLOCK_HUE_CHANGE_INDEX_INTERVAL = 100;
export const BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL = 10;
