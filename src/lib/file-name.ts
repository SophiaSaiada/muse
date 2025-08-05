import { MIDI_FILES } from "@/constants";
import { getSongById } from "@/lib/scraper-bitmidi";
import type { MidiFile } from "@/types";

export const fetchFileName = async ({
  id,
  source,
}: Pick<MidiFile, "source" | "id">) => {
  if (source === "b") {
    const song = await getSongById(id);
    return song?.displayName;
  }

  return MIDI_FILES.find((file) => file.id === id)?.displayName;
};
