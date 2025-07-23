import { type ChangeEventHandler } from "react";
import { MIDIPlayer } from "./midi-player/core";

function App() {
  const onFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    console.log(event);
    const player = MIDIPlayer();
    player.handleFileSelect(event);
  };

  return (
    <>
      <div>
        <input type="file" onChange={onFileChange} />
      </div>
    </>
  );
}

export default App;
