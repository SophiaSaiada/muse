import { MIDI_FILES } from "@/constants";
import { getSongById } from "@/lib/scraper-bitmidi";
import type { MidiFile } from "@/types";

const MIDI_FILE_ID_TO_NAME: Record<MidiFile["source"], Map<string, string>> = {
  b: new Map(),
  e: new Map(),
};

export const cacheFileName = (
  source: MidiFile["source"],
  id: string,
  fileName: string
) => {
  MIDI_FILE_ID_TO_NAME[source].set(id, fileName);
};

export const getFileName = async ({
  id,
  source,
}: Pick<MidiFile, "source" | "id">) => {
  const cached = MIDI_FILE_ID_TO_NAME[source].get(id);
  if (cached) {
    return cached;
  }

  const fileName = await fetchFileName({ id, source });
  if (fileName) {
    cacheFileName(source, id, fileName);
  }
  return fileName;
};

const fetchFileName = async ({
  id,
  source,
}: Pick<MidiFile, "source" | "id">) => {
  if (source === "b") {
    const song = await getSongById(id);
    return song?.displayName;
  }

  return MIDI_FILES.find((file) => file.id === id)?.displayName;
};
