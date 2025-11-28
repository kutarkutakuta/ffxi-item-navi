import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { EquipmentAug } from 'src/app/model/equipment_aug';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css'],
})
export class ItemDetailComponent {

  equip!: Equipment ;
  equipAug?: EquipmentAug;
  visible: boolean = false;
  loading: boolean = false;
  isFullScreen: boolean = false;
  get height() : string {
    var ret = "";
    if(this.isFullScreen) ret = "100vh";
    else{
      var tmp = this.fixed_eqpuips.length * 175 + 260;
      ret = "min(100vh, " + tmp + "px)"
    }
    return ret;
  }
  get theme(): 'fill'|'outline'|'twotone' {
    return this.fixed_eqpuips.includes(this.equip) ? "fill" : "outline";
  }
  selectedIndex: number = 0;
  fixed_eqpuips: Equipment[] = [];
  fixed_equipAugs: EquipmentAug[] = [];

  // #region implementsMethods
  constructor(private message: NzMessageService,) {
  }


  show(equip: Equipment, equipAug?: EquipmentAug){
    this.equip = equip;
    this.equipAug = equipAug;
    this.visible = true;
    this.loading = false;
    this.selectedIndex = 0;
    this.isFullScreen = false;
  }

  onClose(){
    this.visible = false;
  }

  onFix(){
    var idx = this.fixed_eqpuips.findIndex(n=>n == this.equip);
    if(idx < 0){
      if(this.fixed_eqpuips.length == 2){
        this.message.error("ピン止めは2つまでです。");
        return;
      }
      this.fixed_eqpuips.push(this.equip);
      this.fixed_equipAugs.push(this.equipAug!);
    }
    else{
      this.onFixClear(idx);
      return;
    }
  }

  onFixClear(fixedIndex: number){
    this.fixed_eqpuips.splice(fixedIndex, 1);
    this.fixed_equipAugs.splice(fixedIndex, 1);
  }

}

