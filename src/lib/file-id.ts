import { MIDI_FILES } from "@/constants";
import type { MidiFile } from "@/types";

const BITMIDI_ID_REGEX = /^\d+$/;

export const parseFileId = (
  rawId: string | undefined
): MidiFile | undefined => {
  if (!rawId) {
    return undefined;
  }

  const exampleFile = MIDI_FILES.find((file) => file.id === rawId);
  if (exampleFile) {
    return exampleFile;
  }

  const source = rawId[0];
  const id = rawId.slice(1);

  if (source !== "b") {
    console.error("Unknown source in song ID", rawId);
    return undefined;
  }

  if (!BITMIDI_ID_REGEX.test(id)) {
    console.error("Invalid BitMidi song ID", id);
    return undefined;
  }

  return { source, id };
};

export const getFileId = (midiFile: MidiFile) => {
  if (midiFile.source === "e") {
    return midiFile.id;
  }

  return `${midiFile.source}${midiFile.id}`;
};
