import { useRef, useState } from "react";
import useSWRImmutable from "swr/immutable";
import { MIDIPlayer } from "@/midi-player/core";
import { MIDIFile } from "@/midi-player/MIDIFile";
import { calculatePath } from "@/lib/path";
import { INCLUDE_BEATS, MIDI_FILES, MUTE, SPEED } from "@/constants";
import { Viz } from "@/components/viz";
import { MainScreen } from "@/components/main-screen";
import type { Song } from "@/types";

function App() {
  const player = useRef<MIDIPlayer>(new MIDIPlayer());

  const [selectedFile, setSelectedFile] = useState<
    (typeof MIDI_FILES)[number] | null
  >(null);

  // TODO: add error handling
  const { data: path, isLoading } = useSWRImmutable(
    selectedFile,
    async (selectedFile) => {
      // TODO: stop previously playing song

      const res = await fetch(selectedFile.url);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.current.startLoad(song, resolve)
      );

      const path = calculatePath(song, SPEED); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      if (!MUTE) {
        player.current.startPlay();
      }

      return path;
    },
    {
      errorRetryCount: 0,
      onError(err, key, config) {
        console.error(err, key, config);
      },
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
