import { useEffect, useState } from "react";
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
import type { Song, Step, VizType } from "@/types";
import { toast } from "sonner";
import { useLocalStorage } from "react-use";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import { getFileUrl } from "@/lib/file-url";
import { MainScreen } from "@/screens/main";
import { VizScreen } from "@/screens/viz";
import { PlayScreen } from "@/screens/play";

function App() {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const [player, setPlayer] = useState<MIDIPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedFile, setSelectedFile] = useSelectedFile();
  const selectedFileUrl = selectedFile && getFileUrl(selectedFile);
  const { data, isLoading, isValidating } = useSWR(
    selectedFileUrl,
    async (selectedFileUrl) => {
      const res = await fetch(selectedFileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      const path = await calculatePath({ song, speed: SPEED });

      return { path, song };
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
      setIsPlaying(false);
      player?.stop();
    }
  }, [player, selectedFileUrl]);

  const onClickPlay = async (song: Song) => {
    const player = new MIDIPlayer();
    player.startLoad(song, () => {
      setPlayer(player);
      if (!MUTE) {
        player.startPlay(() => {
          toast("Hope you had fun, pick another song!");
          setSelectedFile(null);
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    });
  };

  if (selectedFile && (isLoading || isValidating || !isPlaying)) {
    return (
      <PlayScreen
        displayName={selectedFile?.displayName}
        onClickPlay={
          isLoading || isValidating || !data?.song
            ? undefined
            : () => onClickPlay(data.song)
        }
      />
    );
  }

  return data?.path ? (
    <VizScreen path={data.path} />
  ) : (
    <MainScreen
      isLoading={false}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
    />
  );
}

export default App;

const calculatePath = async ({
  song,
  speed,
}: {
  song: Song;
  speed: number;
}) => {
  const worker = new Worker(new URL("./workers/path.ts", import.meta.url));
  worker.postMessage(JSON.stringify({ song, speed }));
  return new Promise<Step[]>((resolve) => {
    worker.onmessage = (e) => {
      resolve(JSON.parse(e.data));
    };
  });
};
