import { useEffect, useState } from "react";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
import { calculatePath, type Note, type Step } from "./path";
import { Viz } from "./Viz";
import { MIDI_FILE_NAME, INCLUDE_BEATS, SPEED } from "./constants";

const MIDI_FILE_PATH = `/midi/${MIDI_FILE_NAME}`;

function App() {
  const [player] = useState<MIDIPlayer>(MIDIPlayer());
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [path, setPath] = useState<Step[] | null>(null);

  useEffect(() => {
    player.handleExample(
      MIDI_FILE_PATH,
      (song: {
        tracks: { notes: { when: number }[] }[];
        beats: { notes: { when: number }[] }[];
      }) => {
        const notes = [
          ...song.tracks.flatMap((track) => track.notes),
          ...(INCLUDE_BEATS ? song.beats.flatMap((track) => track.notes) : []),
        ];
        notes.sort((a, b) => a.when - b.when);
        setNotes(notes);
      }
    );
  }, [player]);

  return (
    <div>
      {player && notes && !path && (
        <button
          autoFocus
          onClick={() => {
            setPath(calculatePath(notes!, SPEED));
            player.startPlay();
          }}
        >
          ▶️
        </button>
      )}
      {path && <Viz path={path} />}
    </div>
  );
}

export default App;
