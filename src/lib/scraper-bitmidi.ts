import type { MidiFile } from "@/types";

export const searchSongOnBitMidi = async (
  songName: string
): Promise<MidiFile[]> => {
  const params = new URLSearchParams({ q: songName, page: "0" });
  const searchUrl = `https://bitmidi.com/api/midi/search?${params.toString()}`;
  const response = await fetch(searchUrl);
  const data = await response.json();

  return data.result.results.map(
    ({ id, name }: { name: string; id: number }) => ({
      source: "bitmidi",
      id: id.toString(),
      displayName: name.replaceAll("-", " ").replace(/\.mid$/, ""),
    })
  );
};
