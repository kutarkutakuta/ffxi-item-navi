import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { SupabaseService } from 'src/app/service/supabase.service';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { QueryBuilderComponent } from '../query-builder/query-builder.component';
import { Food } from 'src/app/model/food';
import { FoodDetailComponent } from '../food-detail/food-detail.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-food-navi',
  templateUrl: './food-navi.component.html',
  styleUrls: ['./food-navi.component.css']
})
export class FoodNaviComponent {

  @ViewChild(FoodDetailComponent)
  private foodDetail!: FoodDetailComponent;
  @ViewChild(QueryBuilderComponent)
  private queryBuilder!: QueryBuilderComponent;
  @ViewChild('basicTable', { static: false })
  private nzTableComponent!: NzTableComponent<Food>;

  categories: readonly string[] = ["肉・卵","魚介","野菜","スープ","穀物","スィーツ","ドリンク"];

  selectedCategories: string[] = [];
  inputValue: string = "";

  loading = false;
  foods: Food[] = [];

  txtKeywords: string[] = [];
  opKeywords: string[] = [];

  private startPos: number = 0;
  isHeader : boolean = true;

  constructor(private supabaseService: SupabaseService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router) {
      router.events.pipe(filter(event => event instanceof NavigationEnd ))
      .subscribe(() => this.isHeader = true);
  }

  ngAfterViewInit() {
    this.nzTableComponent.cdkVirtualScrollViewport?.elementScrolled()
    .subscribe(ev=>{
      var src = ev.target as any;
      let currentPos = src.scrollTop;
      if(currentPos > this.startPos) {
        if(this.isHeader) {
          this.isHeader = false;
          this.changeDetectorRef.detectChanges();
        }
      } else if(currentPos < this.startPos) {
        if(!this.isHeader){
          this.isHeader = true;
          this.changeDetectorRef.detectChanges();
        }
      }
      this.startPos = currentPos;
    })
  }

  /** 入力変更時 */
  inputChange(){

    // 無害化
    this.inputValue = this.fnSanitize(this.inputValue);

    this.loading = true;
    this.supabaseService.getFood(this.selectedCategories, this.inputValue.trim())
    .then((res: [Food[], string[], string[]])=>{
      this.foods = res[0];
      this.txtKeywords = res[1];
      this.opKeywords = res[2];
    }).finally(()=>{
      this.loading = false;
      this.nzTableComponent.cdkVirtualScrollViewport?.scrollToIndex(0);
      this.nzTableComponent.nzWidthConfig;

    });
  }

  // 無害化
  fnSanitize (str:string): string {
    return str.replace(/["#$%&'()\*,\/;?@\[\\\]^_`{|}~]/g, '');
  }

  htmlSanitize (str: string): string {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  regxSanitize (str: string): string {
    return str.replace('\\', '\\\\')
      .replace(/\*/g, '\\*').replace(/\+/g, '\\+')
      .replace(/\./g, '\\.').replace(/\?/g, '\\?')
      .replace(/\{/g, '\\{').replace(/\}/g, '\\}')
      .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[').replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^').replace(/\$/g, '\\$')
      .replace(/\|/g, '\\|').replace(/\-/g, '\\-')
      .replace(/\|/g, '\\/')
      .replace(/\HHP/g, '\\hHP').replace(/\HMP/g, '\\hMP');  // hHP、hMPは先頭小文字に変換
  }

  /** HTML変換（ハイライト付加） */
  replacer(source: string ,keycolumn: string) {

    var returnHtml = " " + source;  //\bが使えないのでスペースで代用

    for (let keyword of this.opKeywords) {
      var arr_tmp = keyword.split(":");
      if(arr_tmp.length > 1){
        // キー列が一致しない場合は変換しない
        if(arr_tmp[0].toUpperCase() != keycolumn) break;
        keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
      }
      var reg = new RegExp(' (' + this.regxSanitize(keyword) + '[:：][-]?[0-9]+(?:\\.\\d+)?)', 'g');
      returnHtml = returnHtml.replace(reg, ' <span class="highlight">$1</span>');
   }

    for (let keyword of this.txtKeywords) {
      var arr_tmp = keyword.split(":");
      if(arr_tmp.length > 1){
        // キー列が一致しない場合は変換しない
        if(arr_tmp[0].toUpperCase() != keycolumn) break;
        keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
      }
      var reg = new RegExp('(' + this.regxSanitize(keyword) +')', 'g');
      returnHtml = returnHtml.replace(reg, '<span class="highlight">$1</span>');
    }

    return returnHtml.trim();
  }

  getShrotStatusName(str: string): string{
    var arr_tmp  =str.split(":");
    var status_target = ""
    var status_key = str;
    if(arr_tmp.length > 1){
      status_target = arr_tmp[0] + ":";
      status_key = arr_tmp[1];
    }
    var status = this.supabaseService.getStatus().value.find(s=>s.name == status_key);
    return status ? status_target + status.short_name : str;
  }

  getStatusValue(food: Food, keyword: string): string{
    var ret = "";
    var status_key = keyword;

    if(keyword.toUpperCase() == "TIME"){
      return this.getTimeText(food.effect_time);
    }

    var arr_tmp  =keyword.split(":");
    var status_target = "PC"
    if(arr_tmp.length > 1){
      status_target = arr_tmp[0];
      status_key = arr_tmp[1];
    }
    if(status_target != "PC"){
      ret = food.pet_status[status_key]|| 0;
    }
    else{
      ret = food.pc_status[status_key] || 0;
    }
    return ret;
  }

  getTimeText(num: number){
    var ret = "";
    var tmp = num;
    if(tmp > 60 * 60){
      ret += Math.floor(tmp / 60 / 60).toString() + "時間";
      tmp = tmp - Math.floor(tmp / 60 / 60) * 60 * 60;
    }
    if(tmp > 60){
      ret += Math.floor(tmp / 60).toString() + "分";
      tmp = tmp - Math.floor(tmp / 60) * 60;
    }
    if(tmp > 0){
      ret += tmp + "秒";
    }
    return ret;
  }

  showFoodDetail(food: Food){
    this.foodDetail.show(food);
  }

  showIQueryBuilder(){
    this.queryBuilder.show();
    // this.changeDetectorRef.detectChanges();
  }

  clearText(){
    this.inputValue = '';
    this.inputChange();
    // this.changeDetectorRef.detectChanges();
  }

  addQuery(query: string){
    this.inputValue = this.inputValue + " " + query;
    this.inputChange();
  }

}

