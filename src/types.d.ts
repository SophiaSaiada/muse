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

export type Direction = { x: number; y: number };

export type Step = {
  note: NoteOrBeat;
  x: number;
  duration: number;
  y: number;
  directionOnHit: Direction;
  newDirection: Direction;
};

export type MidiFile = {
  source:
    | "b" // =bitmidi
    | "e"; // =example
  id: string;
};

export type MidiFileWithName = MidiFile & {
  displayName?: string;
};

export type VizType = "TUNNEL" | "STARS";

export type Region = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type PathWorkerResult = {
  path: Step[];
  denseRegion?: Region;
};

export type ImageData = {
  rgbaValues: { r: number; g: number; b: number; a: number }[];
  imageWidth: number;
  imageHeight: number;
  image: HTMLImageElement;
};
