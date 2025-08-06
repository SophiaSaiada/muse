import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import {
  INITIAL_VIZ_TYPE,
  MUTE,
  SPEED,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import type { VizType, Song, PathWorkerResult } from "@/types";
import { MIDIPlayer } from "@/lib/midi/player";
import { PlayerContext } from "@/contexts/player/context";
import { getFileUrl } from "@/lib/file-url";
import { useRequiredContext } from "@/lib/utils";
import { MIDIFile } from "@/lib/midi/file";
import { PlayScreen } from "@/screens/play";
import { VizScreen } from "@/screens/viz";
import { trimSong } from "@/lib/trim-song";
import { adjustBeats } from "@/lib/adjust-beats";
import { getPNGImageData } from "@/lib/image";

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

      const song: Song = adjustBeats(trimSong(midiFile.parseSong()));

      const [imageData, { path, denseRegion }] = await Promise.all([
        getPNGImageData("/artworks/flounder.png"), // TODO: dynamic image
        calculatePath({
          song,
          speed: SPEED,
          vizType: vizType ?? "STARS",
        }),
      ]);

      return { path, denseRegion, song, imageData };
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

  const onClickPlay = async (song: Song) => {
    const player = new MIDIPlayer();
    player.startLoad(song, () => {
      setPlayer(player);
      if (!MUTE) {
        player.startPlay(() => {
          toast("Hope you had fun, pick another song!");
          navigate("/");
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    });
  };

  return data && !isLoading && !isValidating && isPlaying && player ? (
    <VizScreen
      path={data.path}
      imageData={data.imageData}
      denseRegion={data.denseRegion}
    />
  ) : (
    <PlayScreen
      displayName={selectedFile?.displayName}
      onClickPlay={
        isLoading || isValidating || !data?.song || !selectedFile?.displayName
          ? undefined
          : () => onClickPlay(data.song)
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

  return new Promise<PathWorkerResult>((resolve) => {
    worker.onmessage = (e) => {
      resolve(JSON.parse(e.data));
    };
  });
};
