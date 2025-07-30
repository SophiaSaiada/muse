import type { MidiFile } from "@/types";
import { useCallback } from "react";
import { useSearchParams } from "react-router";

const ALLOWED_SOURCES: MidiFile["source"][] = ["b", "e"];

const SEARCH_PARAM_SOURCE = "s";
const SEARCH_PARAM_ID = "i";
const SEARCH_PARAM_NAME = "n";

export const useSelectedFile = (): [
  MidiFile | undefined,
  (file: MidiFile | null) => void
] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const source = searchParams.get(SEARCH_PARAM_SOURCE);
  const id = searchParams.get(SEARCH_PARAM_ID);
  const displayName = searchParams.get(SEARCH_PARAM_NAME);

  const setSelectedFile = useCallback(
    (file: MidiFile | null) => {
      const url = new URL(window.location.href);

      if (file) {
        url.searchParams.set(SEARCH_PARAM_SOURCE, file.source);
        url.searchParams.set(SEARCH_PARAM_ID, file.id);
        url.searchParams.set(SEARCH_PARAM_NAME, file.displayName);
      } else {
        url.searchParams.delete(SEARCH_PARAM_SOURCE);
        url.searchParams.delete(SEARCH_PARAM_ID);
        url.searchParams.delete(SEARCH_PARAM_NAME);
      }

      setSearchParams(url.search);
    },
    [setSearchParams]
  );

  if (
    !source ||
    !ALLOWED_SOURCES.includes(source as MidiFile["source"]) ||
    !id ||
    id.includes("/") ||
    !displayName
  ) {
    return [undefined, setSelectedFile];
  }

  return [
    {
      source: source as MidiFile["source"],
      id,
      displayName,
    },
    setSelectedFile,
  ];
};
