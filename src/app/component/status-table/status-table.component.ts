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

  @Input() equip?: Equipment ;
  @Input() equipAug?: EquipmentAug;
  @Input() equipset?: Equipset;
  @Input() compareEquipset?: Equipset;

  statuses : Status[] = [];

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService) {
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
      if(pet){
        ret = this.equip.pet_status[key];
        if(this.equipAug) ret = this.equipAug.full_pet_status[key];
      }
      else{
        ret = this.equip.pc_status[key];
        if(this.equipAug) ret = this.equipAug.full_pc_status[key];
        if(key == "Ｄ隔" && ret){
          ret = (Number(ret) / 1000).toString();
        }
      }
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
      ret = (d / kaku).toFixed(2).toString();
    }
    else if(!pet){
      ret = equipset.equip_items.map(n=>{
        var ret = 0;
        if(n.equipment && n.equipment.pc_status[key]){
          ret = <number>n.equipment?.pc_status[key]
        }

        // オグメテキストからも取得
        if(n.custom_pc_aug_status && n.custom_pc_aug_status[key]){
          ret += n.custom_pc_aug_status[key];
        }

        // 二刀流のサブ武器は、D・隔は無効とする
        // TODO:RMEAはほとんど無効みたいだがとりあえず・・・
        if(n.slot == "サブ" && (n.type == "短剣" || n.type?.startsWith("片手"))){
          if(key.startsWith("Ｄ") || key == "隔"){
            ret = 0;
          }
        }
        return ret;
      }).reduce((p,c)=>p+c).toString();
    }
    else
    {
      ret = equipset.equip_items.map(n=>{
        var ret = 0;
        if(n.equipment && n.equipment.pet_status[key]){
          ret = <number>n.equipment?.pet_status[key]
        }

        // オグメテキストからも取得
        if(n.custom_pet_aug_status && n.custom_pet_aug_status[key]){
          ret += n.custom_pet_aug_status[key];
        }

        return ret;
      }).reduce((p,c)=>p+c).toString();
    }
    return ret == "0" ? "" : ret;
  }

  getStausSummary2(equipset:Equipset, compareEquipset:Equipset, key: string, pet: boolean ) : string{

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
        var result = key == "Ｄ隔" ? (a - b).toFixed(2).toString() : (a - b).toString();
        if(a > b){
          return "<span class='highlight-plus'>+" + result + "</span>";
        }
        else{
          return "<span class='highlight-minus'>" + result + "</span>";
        }
      }

    }
  }

}

