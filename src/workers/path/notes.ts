import type { NoteOrBeat, Song } from "@/types";

const SPARSE_MIN_INTERVAL_BETWEEN_NOTES = 0.05;
const DENSE_MIN_INTERVAL_BETWEEN_NOTES = 0.075;

export const getNotes = (song: Song, dense: boolean) => {
  const notes = song.tracks.flatMap((track) => track.notes);
  notes.sort((a, b) => a.when - b.when);

  return notes.reduce<NoteOrBeat[]>((acc, note) => {
    const previousNote = acc.at(-1);
    if (
      previousNote &&
      note.when - previousNote.when <
        (dense
          ? DENSE_MIN_INTERVAL_BETWEEN_NOTES
          : SPARSE_MIN_INTERVAL_BETWEEN_NOTES)
    ) {
      return [
        ...acc.slice(0, -1),
        {
          ...previousNote,
          duration: note.when + note.duration - previousNote.when,
        },
      ];
    }

    return [...acc, note];
  }, []);
};
