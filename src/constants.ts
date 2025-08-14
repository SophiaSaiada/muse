import type { MidiFileWithName, VizType } from "@/types";

// Debugging
export const MUTE = false;
export const DEBUG_SONG_END = false;
export const SHOW_PATH = false;
export const SHOW_BLOCKS = false;
export const RECORD_MODE = true;

// Color & Size
export const CIRCLE_COLOR = "#E5438A";
export const SCALE = 8;
export const CIRCLE_SIZE = SCALE;
export const BLOCK_WIDTH = SCALE * (3 / 2);
export const BLOCK_HEIGHT = SCALE * 0.25;
export const SPARK_SIZE = 1;

// Music
export const SONG_START_DELAY_SECONDS = 0.15;
export const BEATS_VOLUME_FACTOR = 0.1;
export const SONG_DURATION_GRACE_PERIOD_SECONDS = 0.5;

// Speed & Camera
export const SPEED = SCALE * 25;
export const CAMERA_FOLLOW_SMOOTHING = 0.2;

// Viz type
export const VIZ_TYPE_LOCAL_STORAGE_KEY = "vizType" as const;
export const INITIAL_VIZ_TYPE: VizType = "STARS";

// Circle & Block Animations
export const BOUNCE_ANIMATION_HALF_TIME = 0.05;
export const BOUNCE_ANIMATION_SCALE_FACTOR = 0.85;
export const STAR_COLOR_CHANGE_MAX_DURATION = 0.25;
export const BLOCK_START_FADE_OUT_AFTER_INDEX = 50;
export const BLOCK_FADE_MIN_DURATION = 0.75;
export const BLOCK_START_HUE = 334;
export const BLOCK_HUE_CHANGE_INDEX_INTERVAL = 100;
export const BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL = 20;

// Sparks Animation
export const SPARK_DISTANCE = BLOCK_WIDTH * 2;
export const SPARK_DURATION = 0.5;
export const SPARK_OFFSETS = [-1, -0.33, 0.33, 1];
export const SPARK_RANDOM_FACTOR = 0.3;

// Zoom Out Animation
export const ZOOM_OUT_PADDING_FACTOR = 0.025;
export const ZOOM_OUT_DURATION_SECONDS = 5;
export const IMAGE_REVEAL_SMOOTHING = 0.1;

export const MIDI_FILES: MidiFileWithName[] = [
  {
    id: "7Rings",
    displayName: "7 Rings - Ariana Grande",
    source: "e",
  },
  {
    id: "PinkPonyClub",
    displayName: "Chappell Roan - Pink Pony Club",
    source: "e",
  },
  {
    id: "Frozen",
    displayName: "Frozen - Let it Go",
    source: "e",
    artwork: "/artworks/frozen.png",
  },
  { id: "GravityFalls", displayName: "Gravity Falls", source: "e" },
  {
    id: "Moana",
    displayName: "Moana - How Far I'll Go",
    source: "e",
  },
  {
    id: "TakeMeToChurch",
    displayName: "Hozier - Take Me To Church",
    source: "e",
  },
  {
    id: "ComeTogether",
    displayName: "The Beatles - Come Together",
    source: "e",
  },
  {
    id: "WeDontTalkAboutBruno",
    displayName: "Encanto - We Don't Talk About Bruno",
    source: "e",
  },
  {
    id: "Golden",
    displayName: "K-Pop Demon Hunters - Golden",
    artwork: "/artworks/golden.jpg",
    source: "e",
  },
];
