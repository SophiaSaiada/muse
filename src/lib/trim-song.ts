import {
  SONG_START_DELAY_SECONDS,
  ZOOM_OUT_DURATION_SECONDS,
} from "@/constants";
import type { Song } from "@/types";

export const trimSong = (song: Song) => {
  const firstNoteOrBeatTimestamp = Math.min(
    song.duration,
    ...song.tracks.flatMap((track) => track.notes.map((note) => note.when)),
    ...song.beats.flatMap((beat) => beat.notes.map((note) => note.when))
  );

  const getAdjustedTime = (time: number) =>
    time - firstNoteOrBeatTimestamp + SONG_START_DELAY_SECONDS;

  const trimmedSong = {
    ...song,
    duration: getAdjustedTime(song.duration) + ZOOM_OUT_DURATION_SECONDS,
    tracks: song.tracks.map((track) => ({
      ...track,
      notes: track.notes.map((note) => ({
        ...note,
        when: getAdjustedTime(note.when),
      })),
    })),
    beats: song.beats.map((beat) => ({
      ...beat,
      notes: beat.notes.map((note) => ({
        ...note,
        when: getAdjustedTime(note.when),
      })),
    })),
  };

  return trimmedSong;
};
