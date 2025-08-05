import { BEATS_VOLUME_FACTOR } from "@/constants";
import type { Song } from "@/types";

export const adjustBeats = (song: Song) => ({
  ...song,
  beats: song.beats.map((beat) => ({
    ...beat,
    volume: beat.volume * BEATS_VOLUME_FACTOR,
    notes: beat.notes,
  })),
});
