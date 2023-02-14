import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'
import { EquipmentAug } from 'src/app/model/equipment_aug';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css'],
})
export class ItemDetailComponent {

  equip!: Equipment ;
  equipAug: EquipmentAug | null = null;
  visible: boolean = false;
  loading: boolean = false;

  statuses : Status[] = [];

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;
      });
    }


  show(equip: Equipment, equipAug: EquipmentAug | null){
    this.equip = equip;
    this.equipAug = equipAug;
    this.visible = true;
    this.loading = false;
  }

  onclose(){
    this.visible = false;
  }

  getStauses(type: string) : Status[]{
    return this.statuses.filter(data=>data.type == type).sort((a,b)=>a.id-b.id);
  }

  getStausValue(key: string, pet: boolean = false) : string{
    var ret = "";
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

    return ret;
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

  getWikiURL(param: string): string {
    return "http://wiki.ffo.jp/search.cgi?imageField.x=0&imageField.y=0&CCC=%E6%84%9B&Command=Search&qf=" + param + "&order=match&ffotype=title&type=title";
  }

  getFFXIAhURL(param: string): string {
    return "https://jp.ffxiah.com/search/item?q=" + encodeURIComponent(param);
  }

  getClipboard() {
    var clipData = "NAME\tｵｸﾞﾒ\t部位\t" + this.statuses.map(s=>s.short_name).join("\t") + "\n";
    clipData += this.equip.name + "\t" + this.getAugName() + "\t" + this.equip.slot + "\t"
     + this.statuses.map(s=>this.getStausValue(s.name)).join("\t");
    this.clipboard.copy(clipData);
    this.message.info("クリップボードにコピーしました。");
  }

  // #endregion
}

