import { Injectable } from "@angular/core";
import Dexie from "dexie";
import { from, Observable } from "rxjs";
import { EquipsetGroup } from "../model/equipset_group";
import { EquipsetDB } from "./equipsetdb";

@Injectable({
  providedIn: 'root',
})
export class EquipsetDBService {

  equipsetDB = new EquipsetDB();

  constructor() {
  }

  public getEquipsetGroup(job: string): Observable<EquipsetGroup | undefined> {
    return from(this.equipsetDB.equipset_group.get(job));
  }

  public putEquipsetGroup(job: string, equipset_group: EquipsetGroup) {
    equipset_group.updated = new Date();
    return from(this.equipsetDB.equipset_group.put(equipset_group, job));
  }

  public deleteEquipsetGroup(job: string) {
    return from(this.equipsetDB.equipset_group.delete(job));
  }

 }
