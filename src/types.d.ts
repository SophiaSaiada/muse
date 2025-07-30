export type NoteOrBeat = Note | Beat;

export type Note = {
  when: number;
  pitch: number;
  duration: number;
  slides?: unknown;
};

export type Beat = {
  when: number;
  n: number;
  duration: number;
};

export type Song = {
  duration: number;
  tracks: {
    notes: Note[];
    volume: number;
    program: number;
    info: { url: string; variable: string };
    id: number;
  }[];
  beats: {
    notes: Beat[];
    volume: number;
    n: number;
    info: { url: string; variable: string };
    id: number;
  }[];
};

export type MidiFile = {
  source: "bitmidi" | "example";
  id: string;
  displayName: string;
};

export type VizType = "TUNNEL" | "STARS";
