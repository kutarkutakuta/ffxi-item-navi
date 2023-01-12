import { KeyValue } from "@angular/common";

export interface EquipTexts {
  key: string;
  value: Texts[];
}

export interface Texts {
  Stats: KeyValue<string, number>[];
  notes: string[];
}
