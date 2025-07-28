import { useRef, useState } from "react";
import useSWR from "swr";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
// @ts-expect-error TODO: migrate file to TS
import { MIDIFile } from "./midi-player/MIDIFile";
import { calculatePath } from "./lib/path";
import { MIDI_FILES, MUTE, SPEED } from "./constants";
import { Viz } from "./components/viz";
import { MainScreen } from "./components/main-screen";
import type { Song } from "./types";
import { searchSongOnMidiDB } from "./lib/scraper";

function App() {
  const player = useRef<MIDIPlayer>(MIDIPlayer());

  const [search, setSearch] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<
    (typeof MIDI_FILES)[number] | null
  >(null);

  // TODO: add error handling
  const { data: path, isLoading } = useSWR(
    search || selectedFile ? { search, selectedFile } : null,
    async ({ search, selectedFile }) => {
      // TODO: stop previously playing song

      const res = await (search
        ? searchSongOnMidiDB(search)
        : fetch(`/midi/${selectedFile!.fileName}`));
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.current.startLoad(song, resolve)
      );

      const path = calculatePath(song, SPEED); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      if (!MUTE) {
        player.current.startPlay();
      }

      return path;
    }
  );

  return path ? (
    <Viz path={path} />
  ) : (
    <MainScreen
      onSearch={setSearch}
      onSelectFile={setSelectedFile}
      isLoading={isLoading}
      selectedFile={selectedFile}
    />
  );
}

export default App;
