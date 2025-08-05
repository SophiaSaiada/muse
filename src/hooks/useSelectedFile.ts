import { useLocation, useParams } from "react-router";
import useSWR from "swr";
import { fetchFileName } from "@/lib/file-name";
import type { MidiFileWithName } from "@/types";
import { parseFileId } from "@/lib/file-id";

export const useSelectedFile = (): MidiFileWithName | undefined => {
  const { id } = useParams();
  const location = useLocation();

  const midiFile = parseFileId(id);
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

const sanitizeDisplayName = (displayName: string | undefined) =>
  displayName?.replace(/[^a-zA-Z0-9.\-_ ]/g, "");
