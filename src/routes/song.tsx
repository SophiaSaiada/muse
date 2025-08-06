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
import type { VizType, Song, Step } from "@/types";
import { MIDIPlayer } from "@/lib/midi/player";
import { PlayerContext } from "@/contexts/player/context";
import { getFileUrl } from "@/lib/file-url";
import { useRequiredContext } from "@/lib/utils";
import { MIDIFile } from "@/lib/midi/file";
import { PlayScreen } from "@/screens/play";
import { VizScreen } from "@/screens/viz";
import { trimSong } from "@/lib/trim-song";
import { adjustBeats } from "@/lib/adjust-beats";

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

      const path = await calculatePath({
        song,
        speed: SPEED,
        vizType: vizType ?? "STARS",
      });

      // Fetch image and extract RGB values
      const imageResponse = await fetch("/artworks/flounder.png");
      const imageBlob = await imageResponse.blob();

      const imageData = await new Promise<{
        rgbValues: { r: number; g: number; b: number; a: number }[];
        imageWidth: number;
        imageHeight: number;
        image: HTMLImageElement;
      }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({
              rgbValues: [],
              imageWidth: 0,
              imageHeight: 0,
              image: img,
            });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const pixelData = ctx.getImageData(0, 0, img.width, img.height);
          const rgbValues: { r: number; g: number; b: number; a: number }[] =
            [];

          // Copy RGB values (skip alpha channel)
          for (let i = 0; i < pixelData.data.length; i += 4) {
            rgbValues.push({
              r: pixelData.data[i],
              g: pixelData.data[i + 1],
              b: pixelData.data[i + 2],
              a: pixelData.data[i + 3],
            });
          }

          resolve({
            rgbValues,
            imageWidth: img.width,
            imageHeight: img.height,
            image: img,
          });
        };
        img.src = URL.createObjectURL(imageBlob);
      });

      return { path, song, imageData };
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

  return data?.path && !isLoading && !isValidating && isPlaying && player ? (
    <VizScreen path={data.path} imageData={data.imageData} />
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

  return new Promise<Step[]>((resolve) => {
    worker.onmessage = (e) => {
      resolve(JSON.parse(e.data));
    };
  });
};
