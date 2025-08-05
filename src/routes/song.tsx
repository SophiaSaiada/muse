import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import {
  INCLUDE_BEATS,
  INITIAL_VIZ_TYPE,
  MUTE,
  SPEED,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import type { VizType, Song, Step } from "@/types";
import { MIDIPlayer } from "@/lib/midi/player";
import { PlayerContext } from "@/contexts/player/context";
import { getFileUrl } from "@/lib/file-url";
import { useRequiredContext } from "@/lib/utils";
import { MIDIFile } from "@/lib/midi/file";
import { PlayScreen } from "@/screens/play";
import { VizScreen } from "@/screens/viz";
import { trimSong } from "@/lib/trim-song";

export const SongRoute = () => {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const navigate = useNavigate();

  const { player, setPlayer } = useRequiredContext(PlayerContext);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedFile = useSelectedFile();
  const selectedFileUrl = selectedFile && getFileUrl(selectedFile);
  const { data, isLoading, isValidating } = useSWR(
    selectedFileUrl && vizType ? { selectedFileUrl, vizType } : null,
    async ({ selectedFileUrl, vizType }) => {
      const res = await fetch(selectedFileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = trimSong(midiFile.parseSong());

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      const path = await calculatePath({
        song,
        speed: SPEED,
        vizType: vizType ?? "STARS",
      });

      return { path, song };
    },
    {
      errorRetryCount: 0,
      onError(err, key, config) {
        console.error(err, key, config);
        toast.error("Error loading file, try again");
        navigate("/");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    const song = data?.song;
    if (!song) {
      setPlayer(null);
      return;
    }

    const player = new MIDIPlayer();
    player.startLoad(song, () => {
      setPlayer(player);
    });
  }, [data?.song, setPlayer]);

  const onClickPlay = async (player: MIDIPlayer) => {
    if (!MUTE) {
      player.startPlay(() => {
        toast("Hope you had fun, pick another song!");
        navigate("/");
        setIsPlaying(false);
      });
    }
    setIsPlaying(true);
  };

  return data?.path && !isLoading && !isValidating && isPlaying && player ? (
    <VizScreen path={data.path} />
  ) : (
    <PlayScreen
      displayName={selectedFile?.displayName}
      onClickPlay={
        isLoading || isValidating || !player || !selectedFile?.displayName
          ? undefined
          : () => onClickPlay(player)
      }
    />
  );
};

const calculatePath = async ({
  song,
  speed,
  vizType,
}: {
  song: Song;
  speed: number;
  vizType: VizType;
}) => {
  const worker = new Worker(new URL("@/workers/path", import.meta.url), {
    type: "module",
  });

  worker.postMessage(
    JSON.stringify({ song, speed, dense: vizType === "STARS" })
  );

  return new Promise<Step[]>((resolve) => {
    worker.onmessage = (e) => {
      resolve(JSON.parse(e.data));
    };
  });
};
