import { useRef, useState } from "react";
import useSWR from "swr";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
// @ts-expect-error TODO: migrate file to TS
import { MIDIFile } from "./midi-player/MIDIFile";
import { calculatePath, type Song } from "./path";
import { MIDI_FILES, INCLUDE_BEATS, SPEED } from "./constants";
import { Viz } from "./components/viz";
import { MainScreen } from "./components/main-screen";

function App() {
  const player = useRef<MIDIPlayer>(MIDIPlayer());

  const [selectedFile, setSelectedFile] = useState<
    (typeof MIDI_FILES)[number] | null
  >(null);

  // TODO: add error handling
  const { data: path, isLoading } = useSWR(
    selectedFile?.fileName,
    async (fileName: string) => {
      // TODO: stop previously playing song

      const res = await fetch(`/midi/${fileName}`);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.current.startLoad(song, resolve)
      );

      const path = calculatePath(song, SPEED); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      player.current.startPlay();

      return path;
    }
  );

  return path ? (
    <Viz path={path} />
  ) : (
    <MainScreen
      onSelectFile={setSelectedFile}
      isLoading={isLoading}
      selectedFile={selectedFile}
    />
  );
}

export default App;
