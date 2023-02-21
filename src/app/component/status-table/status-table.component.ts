import { Component, Input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { Equipset } from 'src/app/model/equipset';

@Component({
  selector: 'app-status-table',
  templateUrl: './status-table.component.html',
  styleUrls: ['./status-table.component.css'],
})
export class StatusTableComponent {

  private _job?: string;

  @Input() equip?: Equipment ;
  @Input() equipAug?: EquipmentAug;
  @Input() equipset?: Equipset;
  @Input() compareEquipset?: Equipset;
  @Input() set job(value: string) {
    this._job = value;
    if(["風","黒","白","学"].includes(value)){
      this.selectedIndex = 1;
    }
    else if(["か","召","獣"].includes(value)){
      this.selectedIndex = 2;
    }
  }

  statuses : Status[] = [];
  selectedIndex = 0;

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;
      });
  }

  getStauses(type: string) : Status[]{
    return this.statuses.filter(data=>data.type == type).sort((a,b)=>a.id-b.id);
  }

  getStausValue(key: string, pet: boolean = false) : string{
    var ret = "";

    if(this.compareEquipset && this.equipset){
      ret = this.getStausSummary2(this.equipset, this.compareEquipset, key, pet)
    }
    else if(this.equipset){
      ret = this.getStausSummary(this.equipset, key, pet);
    }else if(this.equip){
      // 1つの装備から取得
      var ret_number = 0;
      if(pet){
        ret_number = this.equip.pet_status[key];
        if(this.equipAug) ret_number = this.equipAug.full_pet_status[key];
      }
      else{
        ret_number = this.equip.pc_status[key];
        if(this.equipAug) ret_number = this.equipAug.full_pc_status[key];
        if(key == "Ｄ隔" && ret_number){
          ret_number = (Number(ret_number) / 1000);
        }
      }
      ret = ret_number?.toString();
    }

    return ret == "0" ? "" : ret;
  }

  /** ステータス値取得 */
  getStausSummary(equipset:Equipset, key: string, pet: boolean) : string{
    var ret = "";
    if(!pet && key == "Ｄ隔"){
      var equip_item = equipset.equip_items.find(n=>n.slot == "メイン")!;
      var d = <number>equip_item.equipment?.pc_status["Ｄ"];
      if(equip_item.custom_pc_aug_status && equip_item.custom_pc_aug_status["Ｄ"]){
        d += <number>equip_item.custom_pc_aug_status["Ｄ"];
      }
      var kaku = <number>equip_item.equipment?.pc_status["隔"];
      ret = (d / kaku).toFixed(3).toString();
    }
    else if(!pet){
      ret = equipset.equip_items.map(n=>{
        var ret_number = 0;
        if(n.equipment && n.equipment.pc_status[key]){
          ret_number = <number>n.equipment?.pc_status[key]
        }

        // オグメテキストからも取得
        if(n.custom_pc_aug_status && n.custom_pc_aug_status[key]){
          ret_number += n.custom_pc_aug_status[key];
        }

        // 二刀流のサブ武器は、D・隔は無効とする
        // TODO:RMEAはほとんど無効みたいだがとりあえず・・・
        if(n.slot == "サブ" && (n.type == "短剣" || n.type?.startsWith("片手"))){
          if(key.startsWith("Ｄ") || key == "隔"){
            ret_number = 0;
          }
        }
        return ret_number;
      }).reduce((p,c)=>p+c).toString();
    }
    else
    {
      ret = equipset.equip_items.map(n=>{
        var ret_number = 0;
        if(n.equipment && n.equipment.pet_status[key]){
          ret_number = <number>n.equipment?.pet_status[key]
        }

        // オグメテキストからも取得
        if(n.custom_pet_aug_status && n.custom_pet_aug_status[key]){
          ret_number += n.custom_pet_aug_status[key];
        }

        return ret_number;
      }).reduce((p,c)=>p+c).toString();
    }
    return ret == "0" ? "" : ret;
  }

  getStausSummary2(equipset:Equipset, compareEquipset:Equipset, key: string, pet: boolean) : string{

    var a = Number(this.getStausSummary(equipset, key, pet));
    var b = Number(this.getStausSummary(compareEquipset, key, pet));

    if(isNaN(a) && isNaN(b)){
      return "";
    }
    else{
      a = isNaN(a) ? 0 : a;
      b = isNaN(b) ? 0 : b;

      if(a == b){
        return "";
      }
      else{
        var result = key == "Ｄ隔" ? (a - b).toFixed(3).toString() : (a - b).toString();
        if(a > b){
          return "<span class='highlight-plus'>+" + result + "</span>";
        }
        else{
          return "<span class='highlight-minus'>" + result + "</span>";
        }
      }
    }
  }

  getClipboard(status_type: string) {

    var status: Status[] = [];
    switch (status_type) {
      case "物理":
        status = this.statuses.filter(s=>["BASE", "ATACK", "DEFENSE"].includes(s.type));
        break;
      case "魔法":
        status =this.statuses.filter(s=>["BASE", "MAGIC", "MAGIC-SKILL"].includes(s.type));
        break;
      case "ペット":
        status =this.statuses.filter(s=>s.type.startsWith("PET"));
        break;
    }
    status = status.sort((a,b)=>a.id - b.id);

    var clipData = "";
    if(this.equip?.name){
      clipData = "NAME\tｵｸﾞﾒ\t部位\t";
    }
    clipData += status.map(s=>s.short_name).join("\t") + "\n";
    if(this.equip?.name){
      clipData += this.equip?.name + "\t" + this.getAugName() + "\t" + this.equip?.slot + "\t"
    }
    clipData += status.map(s=>{
      var ret = this.getStausValue(s.name, status_type == "ペット")
      if(ret) ret = ret.replace(/(<([^>]+)>)/gi, '');
      return ret;
    }).join("\t");
    this.clipboard.copy(clipData);
    this.message.info("クリップボードにコピーしました。");
  }

  getAugName(): string {
    var ret = "";
    if(this.equipAug){
      if(!this.equipAug.aug_type && !this.equipAug.aug_rank){
        ret = "Aug."
      }else{
        if(this.equipAug.aug_type) ret = this.equipAug.aug_type;
        if(this.equipAug.aug_rank){
          if(ret != "") ret += " ";
          ret += 'Rank:' + this.equipAug.aug_rank;
        }
      }
    }
    return ret;
  }

}

