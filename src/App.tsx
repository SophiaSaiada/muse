import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { MIDIPlayer } from "@/lib/midi/player";
import { MIDIFile } from "@/lib/midi/file";
import {
  INCLUDE_BEATS,
  MUTE,
  INITIAL_VIZ_TYPE,
  SPEED,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import { Viz } from "@/components/viz";
import { MainScreen } from "@/components/main-screen";
import type { Song, Step, VizType } from "@/types";
import { toast } from "sonner";
import { useLocalStorage } from "react-use";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import { getFileUrl } from "@/lib/file-url";
import { PlayButton } from "@/components/play-button";

function App() {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const [isPlaying, setIsPlaying] = useState(false);

  const player = useRef<MIDIPlayer | null>(null);
  const [selectedFile, setSelectedFile] = useSelectedFile();
  const selectedFileUrl = selectedFile && getFileUrl(selectedFile);
  const { data: path, isLoading } = useSWR(
    selectedFileUrl,
    async (selectedFileUrl) => {
      const res = await fetch(selectedFileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      player.current = new MIDIPlayer();

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.current?.startLoad(song, resolve)
      );

      const path = await calculatePath({
        song,
        speed: SPEED,
        lookaheadForCollision: vizType === "STARS" ? 4 : 14,
      });

      await loadingSongIntoPlayerPromise;

      setIsPlaying(false);

      return path;
    },
    {
      errorRetryCount: 0,
      onError(err, key, config) {
        console.error(err, key, config);
        toast.error("Error loading file, try again");
        setSelectedFile(null);
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (!selectedFileUrl) {
      try {
        player.current?.stop();
      } catch {
        // if we showed the play button, but the user came back to this page instead of playing the song, the player will be initialized, but the audio context will be already closed
      }
    }
  }, [selectedFileUrl]);

  const onClickPlay = () => {
    setIsPlaying(true);
    if (!MUTE) {
      player.current?.startPlay(() => {
        toast("Hope you had fun, pick another song!");
        setSelectedFile(null);
        setIsPlaying(false);
      });
    }
  };

  return path ? (
    isPlaying ? (
      <Viz path={path} />
    ) : (
      <PlayButton onClickPlay={onClickPlay} />
    )
  ) : (
    <MainScreen
      isLoading={isLoading}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
    />
  );
}

export default App;

const calculatePath = async ({
  song,
  speed,
  lookaheadForCollision,
}: {
  song: Song;
  speed: number;
  lookaheadForCollision: number;
}) => {
  const worker = new Worker(new URL("./workers/path.ts", import.meta.url));
  worker.postMessage(JSON.stringify({ song, speed, lookaheadForCollision }));
  return new Promise<Step[]>((resolve) => {
    worker.onmessage = (e) => {
      resolve(JSON.parse(e.data));
    };
  });
};
