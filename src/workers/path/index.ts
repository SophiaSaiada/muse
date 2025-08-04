import type { Song } from "@/types";
import { getNotes } from "@/workers/path/notes";
import { generateDensePath } from "@/workers/path/dense";
import { generateSparsePath } from "@/workers/path/sparse";

self.onmessage = (e: MessageEvent<string>) => {
  const { song, speed, dense } = JSON.parse(e.data) as {
    song: Song;
    speed: number;
    dense: boolean;
  };

  const notes = getNotes(song, dense);
  const path = dense
    ? generateDensePath(notes, speed)
    : generateSparsePath(notes, speed);

  self.postMessage(JSON.stringify(path));
};
