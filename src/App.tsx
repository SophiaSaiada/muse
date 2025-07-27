import { useRef, useState } from "react";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
// @ts-expect-error TODO: migrate file to TS
import { MIDIFile } from "./midi-player/MIDIFile";
import { calculatePath } from "./path";
import { Viz } from "./Viz";
import { MIDI_FILES, INCLUDE_BEATS, SPEED } from "./constants";
import useSWR from "swr";

function App() {
  const player = useRef<MIDIPlayer>(MIDIPlayer());
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedFile, setSelectedFile] = useState<
    (typeof MIDI_FILES)[number] | null
  >(null);

  // TODO: add error handling
  const { data: path, isLoading } = useSWR(
    selectedFile?.fileName,
    async (fileName: string) => {
      const res = await fetch(`/midi/${fileName}`);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: {
        tracks: { notes: { when: number }[] }[];
        beats: { notes: { when: number }[] }[];
      } = midiFile.parseSong();

      const loadingSongPromise = new Promise((resolve) => {
        player.current.startLoad(song, resolve);
      });

      const notes = [
        ...song.tracks.flatMap((track) => track.notes),
        ...(INCLUDE_BEATS ? song.beats.flatMap((track) => track.notes) : []),
      ];
      notes.sort((a, b) => a.when - b.when);

      const path = calculatePath(notes, SPEED); // TODO: calculate on a service worker

      await loadingSongPromise;

      return path;
    }
  );

  return (
    <div>
      {!path && !isLoading && (
        <div>
          {MIDI_FILES.map((file) => (
            <button key={file.fileName} onClick={() => setSelectedFile(file)}>
              {file.displayName}
            </button>
          ))}
        </div>
      )}
      {isLoading && <div>Loading...</div>}
      {!isPlaying && path && (
        <button
          autoFocus
          className="play-button"
          onClick={() => {
            setIsPlaying(true);
            player.current.startPlay();
          }}
        >
          ▶️
        </button>
      )}
      {isPlaying && path && <Viz path={path} />}
    </div>
  );
}

export default App;
