import type { Song } from "@/types";

export declare class MIDIFile {
  constructor(buffer?: ArrayBuffer, strictMode?: boolean);
  parseSong(): Song;
}
