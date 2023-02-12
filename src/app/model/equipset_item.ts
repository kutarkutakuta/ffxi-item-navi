import { Equipment } from "./equipment";
import { EquipmentAug } from "./equipment_aug";

export interface EquipsetItem {
  id: number;
  slot: string;
  type?: string;
  aug?: string;
  equipment?: Equipment | null;
  equipment_aug?: EquipmentAug | null;
  custom_pc_aug?: string;
  custom_pc_aug_error?: string;
  custom_pc_aug_status?: any;
  custom_pet_aug?: string;
  custom_pet_aug_error?: string;
  custom_pet_aug_status?: any;
  memo?: string;
}
