import { Component } from '@angular/core';
import { Equipment } from 'src/app/model/equipment';
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


  // #region implementsMethods
  constructor() {
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

  getWikiURL(param: string): string {
    return "http://wiki.ffo.jp/search.cgi?imageField.x=0&imageField.y=0&CCC=%E6%84%9B&Command=Search&qf=" + encodeURIComponent(param) + "&order=match&ffotype=title&type=title";
  }

  getFFXIAhURL(param: string): string {
    return "https://jp.ffxiah.com/search/item?q=" + encodeURIComponent(param);
  }
}

