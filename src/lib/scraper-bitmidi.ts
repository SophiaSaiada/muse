export const searchSongOnBitMidi = async (songName: string) => {
  const params = new URLSearchParams({ q: songName, page: "0" });
  const searchUrl = `https://bitmidi.com/api/midi/search?${params.toString()}`;
  const response = await fetch(searchUrl);
  const data = await response.json();
  const midiFilePath = data.result.results.at(0).downloadUrl;
  return fetch(`https://bitmidi.com${midiFilePath}`);
};
