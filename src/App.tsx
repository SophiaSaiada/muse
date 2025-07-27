import { useRef, useState } from "react";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
// @ts-expect-error TODO: migrate file to TS
import { MIDIFile } from "./midi-player/MIDIFile";
import { calculatePath, type Song } from "./path";
import { Viz } from "./Viz";
import { MIDI_FILES, INCLUDE_BEATS, SPEED } from "./constants";
import useSWR from "swr";
import { cn } from "./utils/cn";

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
      {!path && (
        <div className="flex flex-col gap-2.5">
          <h1 className="text-5xl mb-1 font-headline text-shadow-dino">
            Muse by Sophie
          </h1>
          {MIDI_FILES.map((file) => (
            <button
              key={file.fileName}
              onClick={selectedFile ? undefined : () => setSelectedFile(file)}
              disabled={isLoading}
              className={cn(
                "rounded-md flex items-center gap-2 group transition font-body",
                isLoading ||
                  "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
                file.fileName === selectedFile?.fileName &&
                  "text-tinted-text text-shadow-dino translate-x-1",
                isLoading &&
                  file.fileName !== selectedFile?.fileName &&
                  "opacity-50"
              )}
            >
              <span className={"w-4"}>
                {file.fileName === selectedFile?.fileName ? "⏳" : "♪"}
              </span>
              <span>{file.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {path && <Viz path={path} />}
    </div>
  );
}

export default App;
