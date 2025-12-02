import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { SupabaseService } from 'src/app/service/supabase.service';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { QueryBuilderComponent } from '../query-builder/query-builder.component';
import { Food } from 'src/app/model/food';
import { FoodDetailComponent } from '../food-detail/food-detail.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

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
  @ViewChild('basicTable2', { static: true  })
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
  offset: number = 0;
  total: number = 0;
  currentIndex = 0;
  private isLoadingMore = false;

  constructor(private supabaseService: SupabaseService,
    private changeDetectorRef: ChangeDetectorRef,
    private message: NzMessageService,
    private router: Router) {
      router.events.pipe(filter(event => event instanceof NavigationEnd ))
      .subscribe(() => {
        this.isHeader = true;
        setTimeout(() => {
          if(this.currentIndex == 0) {
            this.nzTableComponent.cdkVirtualScrollViewport?.checkViewportSize();
          }else{
            this.nzTableComponent.cdkVirtualScrollViewport?.scrollToIndex(this.currentIndex);
          }
        }, 100);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
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
        
        // スクロール位置に基づいてデータをロード
        const viewport = this.nzTableComponent.cdkVirtualScrollViewport!;
        const end = viewport.measureScrollOffset('bottom');
        const viewportSize = viewport.measureScrollOffset('end');
        
        if (end < Math.max(viewportSize * 0.5, 500) && 
            this.foods.length > 0 &&
            this.foods.length < this.total && 
            !this.isLoadingMore && 
            !this.loading) {
          this.isLoadingMore = true;
          this.inputChange(this.offset + 1);
        }
      });

      this.nzTableComponent.cdkVirtualScrollViewport?.scrolledIndexChange.subscribe(index => {
        this.currentIndex = index;
      });

      this.inputChange();
    }, 0);
  }

  /** 入力変更時 */
  inputChange(offset: number = 0){

    this.offset = offset;

    // 無害化
    this.inputValue = this.fnSanitize(this.inputValue);

    this.loading = true;
    this.supabaseService.getFood(this.selectedCategories, this.inputValue.trim(), offset)
    .then((res: [Food[], string[], string[], number])=>{
      if(res == null || res[0].length == 0) return;
      if(offset == 0) this.foods = res[0];
      else this.foods = this.foods.concat(res[0]);
      this.txtKeywords = res[1];
      this.opKeywords = res[2];
      this.total = res[3];
    }).catch(error => {
      console.error('Failed to load food data:', error);
      this.isLoadingMore = false;
    }).finally(()=>{
      this.loading = false;
      this.isLoadingMore = false;
      if(offset == 0) this.nzTableComponent.cdkVirtualScrollViewport?.scrollToOffset(0);
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
    this.message.info(`${query} をクエリに追加しました。`);
  }

}

