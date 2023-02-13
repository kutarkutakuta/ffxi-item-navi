import { Equipset } from "./equipset";

export interface EquipsetGroup {
  job: string;
  equipsets: Equipset[];
  updated?: Date;
}
