import { Equipset } from "./equipset";

export interface PublishEquipset {
  id: number;
  job: string;
  equipset: Equipset;
  full_pc_status: any;
  full_pet_status: any;
  created_ipaddress: string;
  created_at: string;
  updated_ipaddress: Date;
  updated_at: Date;
  expanded: boolean;
}
