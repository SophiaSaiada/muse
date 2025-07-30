import type { MidiFile } from "@/types";
import { useCallback } from "react";
import { useSearchParam } from "react-use";

const ALLOWED_SOURCES: MidiFile["source"][] = ["bitmidi", "example"];

const SEARCH_PARAM_SOURCE = "s";
const SEARCH_PARAM_ID = "i";
const SEARCH_PARAM_NAME = "n";

export const useSelectedFile = (): [
  MidiFile | undefined,
  (file: MidiFile | null) => void
] => {
  const source = useSearchParam(SEARCH_PARAM_SOURCE);
  const id = useSearchParam(SEARCH_PARAM_ID);
  const displayName = useSearchParam(SEARCH_PARAM_NAME);

  const setSelectedFile = useCallback((file: MidiFile | null) => {
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

    history.pushState(null, "", url.pathname + url.search);
  }, []);

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
