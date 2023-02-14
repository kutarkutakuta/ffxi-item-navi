import { EquipsetItem } from "./equipset_item";

export interface Equipset {
  name: string;
  equip_items: EquipsetItem[];
  memo?: string;
  publish_id?: string | null;
  publish_user?: string | null;
  publish_comment?: string | null;
  publish_date?: Date | null;
  compareEquipset?: Equipset;
}
