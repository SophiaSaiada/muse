import { useRef, useState } from "react";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
// @ts-expect-error TODO: migrate file to TS
import { MIDIFile } from "./midi-player/MIDIFile";
import { calculatePath, type Song } from "./path";
import { Viz } from "./Viz";
import { MIDI_FILES, INCLUDE_BEATS, SPEED } from "./constants";
import useSWR from "swr";

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

      const notes = [
        ...song.tracks.flatMap((track) => track.notes),
        ...(INCLUDE_BEATS ? song.beats.flatMap((track) => track.notes) : []),
      ];
      notes.sort((a, b) => a.when - b.when);

      const path = calculatePath(song, SPEED); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      player.current.startPlay();

      return path;
    }
  );

  return (
    <div>
      {!path && !isLoading && (
        <div className="flex flex-col gap-2.5">
          {MIDI_FILES.map((file) => (
            <button
              key={file.fileName}
              onClick={() => setSelectedFile(file)}
              className="rounded-md flex items-center gap-2 group hover:translate-x-1 transition font-body cursor-pointer hover:text-tinted-text"
            >
              <span>♪</span>
              <span>{file.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="text-center text-2xl font-body">Just a second...</div>
      )}

      {path && <Viz path={path} />}
    </div>
  );
}

export default App;
