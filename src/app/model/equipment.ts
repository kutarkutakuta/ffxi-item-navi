import { EquipmentAug } from "./equipment_aug";

export interface Equipment {
  id: number;
  // aug_id: number;
  show_expand: boolean;
  // aug_type: string;
  // aug_rank: number;
  slot: string;
  name: string;
  yomi: string;
  english: string;
  rare: boolean;
  ex: boolean;
  lv: number;
  item_lv: number;
  pc_text: string;
  pc_status: any;
  pet_status_target: string;
  pet_text: string;
  pet_status: any;
  other_text: string;
  job: string;
  install_date: Date;
  page_title: string;
  // aug_pc_text: string;
  // aug_pet_status_target: string;
  // aug_pet_text: string;
  // aug_other_text: string;
  equipment_augs: EquipmentAug[];
  expanded: boolean;
}
