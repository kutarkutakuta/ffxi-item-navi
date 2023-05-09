import { EquipmentAug } from "./equipment_aug";

export interface Food {
  id: number;
  category: string;
  name: string;
  effect_time: number;
  effect_range: string;
  rare: boolean;
  ex: boolean;
  pc_text: string;
  pc_status: any;
  pet_text: string;
  pet_status: any;
  other_text: string;
  install_date: Date;
  page_title: string;
  original_text: string;
}
