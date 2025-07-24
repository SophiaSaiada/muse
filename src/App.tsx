import { useEffect, useState } from "react";
// @ts-expect-error TODO: migrate file to TS
import { MIDIPlayer } from "./midi-player/core";
import { type Note } from "./path";
import { Viz } from "./Viz";

const MIDI_FILE_NAME = "We Don't Talk About Bruno (Piano Cover).mid";
const MIDI_FILE_PATH = `/midi/${MIDI_FILE_NAME}`;

function App() {
  const [player] = useState<MIDIPlayer>(MIDIPlayer());
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    player.handleExample(
      MIDI_FILE_PATH,
      (song: { tracks: { notes: { when: number }[] }[] }) => {
        const notes = song.tracks.flatMap((track) => track.notes);
        setNotes(notes);
      }
    );
  }, [player]);

  return (
    <div>
      {player && !isPlaying && (
        <button
          autoFocus
          onClick={() => {
            setIsPlaying(true);
            player.startPlay();
          }}
        >
          ▶️
        </button>
      )}
      {notes && isPlaying && <Viz notes={notes} />}
    </div>
  );
}

export default App;
