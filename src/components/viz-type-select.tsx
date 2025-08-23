import { useLocalStorage } from "@uidotdev/usehooks";
import {
  INITIAL_VIZ_TYPE,
  THREE_D_LOCAL_STORAGE_DEFAULT_VALUE,
  THREE_D_LOCAL_STORAGE_KEY,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VizType } from "@/types";
import { AudioWaveform, Rotate3d, Sparkles } from "lucide-react";

const THREE_D_VIZ_TYPE = "3D-STARS" as const;

export const VizTypeSelect = () => {
  const [vizType, setVizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const [threeD, setThreeD] = useLocalStorage<boolean>(
    THREE_D_LOCAL_STORAGE_KEY,
    THREE_D_LOCAL_STORAGE_DEFAULT_VALUE
  );

  const onValueChange = (value: string): void => {
    const is3D = value === THREE_D_VIZ_TYPE;
    setThreeD(is3D);
    setVizType(is3D ? "STARS" : (value as VizType));
  };

  return (
    <Select
      value={threeD ? THREE_D_VIZ_TYPE : vizType}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="w-full mt-2 p-4 py-5 border-tinted-text/50">
        <SelectValue placeholder={vizType} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TUNNEL">
          <AudioWaveform className="size-4 mr-0" />
          Tunnel
        </SelectItem>
        <SelectItem value="STARS">
          <Sparkles className="size-4 mr-0" />
          Stars
        </SelectItem>
        <SelectItem value={THREE_D_VIZ_TYPE}>
          <Rotate3d className="size-4 mr-0" />
          3D Stars
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
