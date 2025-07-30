import { useLocalStorage } from "react-use";
import { INITIAL_VIZ_TYPE, VIZ_TYPE_LOCAL_STORAGE_KEY } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VizType } from "@/types";

export const VizTypeSelect = () => {
  const [vizType, setVizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  return (
    <Select
      value={vizType}
      onValueChange={(value) => setVizType(value as VizType)}
    >
      <SelectTrigger className="w-full mt-2 p-4 py-5 border-tinted-text/50">
        <SelectValue placeholder={vizType} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TUNNEL">
          <span className="mr-0">🪨</span> Tunnel
        </SelectItem>
        <SelectItem value="STARS">
          <span className="mr-0">✨</span> Stars
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
