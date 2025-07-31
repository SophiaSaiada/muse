import type { MidiFileWithName } from "@/types";

export const searchSongOnBitMidi = async (
  songName: string
): Promise<MidiFileWithName[]> => {
  const data = await fetchSearchResults(new URLSearchParams({ q: songName }));
  return data.result.results.map(parseSong);
};

export const getSongById = async (
  idAsString: string,
  pageOffset: number = 1
): Promise<MidiFileWithName | undefined> => {
  const id = parseInt(idAsString);

  const params = new URLSearchParams({
    page: (id - pageOffset).toString(),
    pageSize: "1",
  });
  const data = await fetchSearchResults(params);

  const song = data.result.results.find((result) => result.id === id);
  if (!song) {
    return getSongById(idAsString, pageOffset + 1);
  }

  return song && parseSong(song);
};

const fetchSearchResults = async (params: URLSearchParams) => {
  const searchUrl = `https://bitmidi.com/api/midi/search?${params.toString()}`;
  const response = await fetch(searchUrl);
  const data: { result: { results: { id: number; name: string }[] } } =
    await response.json();
  return data;
};

const parseSong = ({
  id,
  name,
}: {
  name: string;
  id: number;
}): MidiFileWithName => ({
  source: "b",
  id: id.toString(),
  displayName: name.replaceAll("-", " ").replace(/\.mid$/, ""),
});
