import { EquipsetItem } from "./equipset_item";

export interface Equipset {
  name: string;
  equip_items: EquipsetItem[];
  memo?: string;
  compareEquipset?: Equipset | null;
  publish_id?: string | null;
  publish_user?: string | null;
  publish_date?: Date | null;
}
