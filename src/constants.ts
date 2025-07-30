import type { MidiFile, VizType } from "@/types";

export const MIDI_FILES: MidiFile[] = [
  {
    id: "7Rings",
    displayName: "7 Rings - Ariana Grande",
    source: "example",
  },
  {
    id: "PinkPonyClub",
    displayName: "Chappell Roan - Pink Pony Club",
    source: "example",
  },
  {
    id: "Frozen",
    displayName: "Frozen - Let it Go",
    source: "example",
  },
  { id: "GravityFalls", displayName: "Gravity Falls", source: "example" },
  {
    id: "Moana",
    displayName: "Moana - How Far I'll Go",
    source: "example",
  },
  //   {
  //     // It's a big file (~2000 notes), so it's currently not supported
  //     id: "WhateverIt Takes",
  //     displayName: "Imagine Dragons - Whatever It Takes",
  //     source: "example",
  //   },
  {
    id: "TakeMeToChurch",
    displayName: "Hozier - Take Me To Church",
    source: "example",
  },
  {
    id: "ComeTogether",
    displayName: "The Beatles - Come Together",
    source: "example",
  },
  {
    id: "WeDontTalkAboutBruno",
    displayName: "Encanto - We Don't Talk About Bruno",
    source: "example",
  },
];

export const MUTE = false;
export const SHOW_PATH = false;
export const SHOW_BLOCKS = false;
export const SCALE = 8;
export const BLOCK_WIDTH = 12;
export const BLOCK_HEIGHT = 2;
export const BOUNCE_ANIMATION_HALF_TIME = 0.05;
export const BOUNCE_ANIMATION_SCALE_FACTOR = 0.85;
export const INCLUDE_BEATS = false;
export const SPEED = 150;
export const VIZ_TYPE_LOCAL_STORAGE_KEY = "vizType" as const;
export const INITIAL_VIZ_TYPE: VizType = "STARS";
export const MIN_INTERVAL_BETWEEN_NOTES = 0.025;
export const BLOCK_FADE_MIN_DURATION = 0.75;
export const STAR_COLOR_CHANGE_MAX_DURATION = 0.25;
export const MAX_BLOCKS = 75;
export const BLOCK_START_FADE_OUT_AFTER_INDEX = 50;
export const BLOCK_START_HUE = 334;
export const BLOCK_HUE_CHANGE_INDEX_INTERVAL = 100;
export const BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL = 20;
export const CAMERA_FOLLOW_SMOOTHING = 0.2;
