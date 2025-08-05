import { useLocation, useParams } from "react-router";
import useSWR from "swr";
import { fetchFileName } from "@/lib/file-name";
import type { MidiFile, MidiFileWithName } from "@/types";

const ALLOWED_SOURCES: MidiFile["source"][] = ["b", "e"];

export const useSelectedFile = (): MidiFileWithName | undefined => {
  const { source, id } = useParams();
  const location = useLocation();

  const midiFile = getValidMidiFile({ source, id });
  const displayNameFromState = location.state?.displayName;

  const { data: displayName } = useSWR(
    midiFile ? { midiFile, displayNameFromState } : null,
    ({ midiFile, displayNameFromState }) =>
      sanitizeDisplayName(displayNameFromState) || fetchFileName(midiFile),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return midiFile && { ...midiFile, displayName };
};

const getValidMidiFile = ({
  source,
  id,
}: {
  source: string | undefined;
  id: string | undefined;
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

const sanitizeDisplayName = (displayName: string | undefined) =>
  displayName?.replace(/[^a-zA-Z0-9.\-_ ]/g, "");
