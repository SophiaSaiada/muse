import { MIDIFile } from "@/lib/midi/file";

export const fetchSong = async (url: string) => {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const midiFile = new MIDIFile(arrayBuffer);

  return midiFile.parseSong();
};
