import Dexie from "dexie";
import { EquipsetGroup } from "../model/equipset_group";

export class EquipsetDB extends Dexie {

  // ストア定義
  equipset_group! : Dexie.Table<EquipsetGroup, string>;

  /** DBバージョン */
  dbversion: number = 1;

  constructor() {
    // DB名
    super('EquipsetDB');
    // ストア定義
    this.version(this.dbversion).stores({
      equipset_group: 'job',
    });
    // ストア名
    this.equipset_group = this.table('equipset_group');
  }

 }
