import { useCallback } from "react";
import { useSearchParams } from "react-router";
import useSWR from "swr";
import { getFileName } from "@/lib/file-name";
import type { MidiFile, MidiFileWithName } from "@/types";

const SEARCH_PARAM_SOURCE = "s";
const SEARCH_PARAM_ID = "i";

const MIDI_FILE_ID_TO_NAME: Record<MidiFile["source"], Map<string, string>> = {
  b: new Map(),
  e: new Map(),
};

const ALLOWED_SOURCES = Object.keys(
  MIDI_FILE_ID_TO_NAME
) as MidiFile["source"][];

export const useSelectedFile = (): [
  MidiFileWithName | undefined,
  (file: MidiFile | MidiFileWithName | null) => void
] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const midiFile = getValidMidiFile({
    source: searchParams.get(SEARCH_PARAM_SOURCE),
    id: searchParams.get(SEARCH_PARAM_ID),
  });

  const {
    data: displayName,
    isLoading: isLoadingDisplayName,
    isValidating,
  } = useSWR(midiFile, getFileName, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const setSelectedFile = useCallback(
    (file: MidiFile | MidiFileWithName | null) => {
      const url = new URL(window.location.href);

      if (file) {
        if ("displayName" in file && file.displayName) {
          MIDI_FILE_ID_TO_NAME[file.source].set(file.id, file.displayName);
        }

        url.searchParams.set(SEARCH_PARAM_SOURCE, file.source);
        url.searchParams.set(SEARCH_PARAM_ID, file.id);
      } else {
        url.searchParams.delete(SEARCH_PARAM_SOURCE);
        url.searchParams.delete(SEARCH_PARAM_ID);
      }

      setSearchParams(url.search);
    },
    [setSearchParams]
  );

  const midiFileWithName =
    midiFile && !isLoadingDisplayName
      ? { ...midiFile, displayName, isLoadingDisplayName, isValidating }
      : undefined;

  return [midiFileWithName, setSelectedFile];
};

const getValidMidiFile = ({
  source,
  id,
}: {
  source: string | null;
  id: string | null;
}): MidiFile | undefined => {
  if (
    !source ||
    !ALLOWED_SOURCES.includes(source as MidiFile["source"]) ||
    !id ||
    id.includes("/")
  ) {
    return undefined;
  }

  return {
    source: source as MidiFile["source"],
    id,
  };
};
