import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { Food } from 'src/app/model/food';

@Component({
  selector: 'app-food-detail',
  templateUrl: './food-detail.component.html',
  styleUrls: ['./food-detail.component.css'],
})
export class FoodDetailComponent {

  food!: Food ;
  visible: boolean = false;
  loading: boolean = false;
  isFullScreen: boolean = false;
  get height() : string {
    var ret = "";
    if(this.isFullScreen) ret = "100vh";
    else{
      var tmp = this.fixed_foods.length * 175 + 230;
      ret = "min(100vh, " + tmp + "px)"
    }
    return ret;
  }
  get theme(): 'fill'|'outline'|'twotone' {
    return this.fixed_foods.includes(this.food) ? "fill" : "outline";
  }
  selectedIndex: number = 0;
  fixed_foods: Food[] = [];

  // #region implementsMethods
  constructor(private message: NzMessageService,) {
  }


  show(food: Food){
    this.food = food;
    this.visible = true;
    this.loading = false;
    this.selectedIndex = 0;
    this.isFullScreen = false;
  }

  onClose(){
    this.visible = false;
  }

  onFix(){
    var idx = this.fixed_foods.findIndex(n=>n == this.food);
    if(idx < 0){
      if(this.fixed_foods.length == 2){
        this.message.error("ピン止めは2つまでです。");
        return;
      }
      this.fixed_foods.push(this.food);
    }
    else{
      this.onFixClear(idx);
      return;
    }
  }

  onFixClear(fixedIndex: number){
    this.fixed_foods.splice(fixedIndex, 1);
  }



  getWikiURL(param: string): string {
    return "http://wiki.ffo.jp/search.cgi?imageField.x=0&imageField.y=0&CCC=%E6%84%9B&Command=Search&qf=" + encodeURIComponent(param) + "&order=match&ffotype=title&type=title";
  }

  getFFXIAhURL(param: string): string {
    return "https://jp.ffxiah.com/search/item?q=" + encodeURIComponent(param);
  }

}

