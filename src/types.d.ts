export type Note = { when: number };

export type Song = {
  tracks: { notes: Note[] }[];
  beats: { notes: Note[] }[];
};
