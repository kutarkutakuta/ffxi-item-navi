import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Equipment } from 'src/app/model/equipment';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { QueryBuilderComponent } from '../query-builder/query-builder.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-item-navi',
  templateUrl: './item-navi.component.html',
  styleUrls: ['./item-navi.component.css']
})
export class ItemNaviComponent {

  @ViewChild(ItemDetailComponent)
  private itemDetail!: ItemDetailComponent;
  @ViewChild(QueryBuilderComponent)
  private queryBuilder!: QueryBuilderComponent;
  @ViewChild('basicTable', { static: true })
  private nzTableComponent!: NzTableComponent<Equipment>;

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣","All Jobs"];
  wepons: readonly string[] = ["格闘","短剣","片手剣","両手剣","片手斧","両手斧","両手鎌","両手槍","片手刀","両手刀","片手棍","両手棍",
                              "弓術","射撃","楽器","グリップ","投擲","矢・弾","ストリンガー"];
  armors: readonly string[] = ["盾","頭","胴","両手","両脚","両足","首","耳","指","腰","背"];

  selectedJobs: string[] = [];
  selectedWepons: string[] = [];
  selectedArmors: string[] = [];
  inputValue: string = "";

  loading = false;
  equipments: Equipment[] = [];

  txtKeywords: string[] = [];
  opKeywords: string[] = [];

  private startPos: number = 0;
  isHeader : boolean = true;
  offset: number = 0;
  total: number = 0;
  currentIndex = 0;

  constructor(private supabaseService: SupabaseService,
    private changeDetectorRef: ChangeDetectorRef,
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
        }
      }
      this.startPos = currentPos;
    });

    this.nzTableComponent.cdkVirtualScrollViewport?.scrolledIndexChange.subscribe(index => {
      if (index > 0 && index > this.equipments.length - 10 && this.total > (this.offset + 1) * 100) {
        this.inputChange(this.offset + 1);
      }
      this.currentIndex = index;
    });

    this.inputChange();
  }

  shouldLoadMore(): boolean {
    // スクロールが特定の位置に達したかどうかを確認するロジックをここに実装する
    const bufferPx = 500; // この値は適切に調整してください
    const totalHeight = this.nzTableComponent.cdkVirtualScrollViewport!.measureScrollOffset('bottom') + this.nzTableComponent.cdkVirtualScrollViewport!.getViewportSize();
    return totalHeight < this.nzTableComponent.cdkVirtualScrollViewport!.measureScrollOffset('top') + bufferPx;
  }

  /** 入力変更時 */
  inputChange(offset: number = 0){

    this.offset = offset;

    // 無害化
    this.inputValue = this.fnSanitize(this.inputValue);

    this.loading = true;
    this.supabaseService.getEquipment(this.selectedJobs,
        this.selectedWepons.concat(this.selectedArmors.map(n=> "防具:" + n)),
        this.inputValue.trim(), offset)
    .then((res: [Equipment[], string[], string[], number])=>{
      if(offset == 0) this.equipments = res[0];
      else this.equipments = this.equipments.concat(res[0]);
      this.txtKeywords = res[1];
      this.opKeywords = res[2];
      this.total = res[3];
    }).finally(()=>{
      this.loading = false;
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
      .replace(/\|/g, '\\/');
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

  expandChange(id: number, expanded: boolean){
    this.equipments.forEach(d=>{
      if(d.id == id){
        d.expanded = expanded;
      }
    })
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

  getStatusValue(equip: Equipment, equip_aug: EquipmentAug | null = null, keyword: string): string{
    var ret = "";
    var status_key = keyword;

    if(keyword.toUpperCase() == "LV"){
      return equip.lv.toString();
    }
    else if(keyword.toUpperCase() == "IL"){
      return equip.item_lv.toString();
    }

    var arr_tmp  =keyword.split(":");
    var status_target = "PC"
    if(arr_tmp.length > 1){
      status_target = arr_tmp[0];
      status_key = arr_tmp[1];
    }
    if(status_target != "PC"){
      var value = (equip_aug ? equip_aug.full_pet_status[status_key] : equip.pet_status[status_key]) || 0;
      var max = value;
      var min =  value;
      if("show_expand" in equip && equip.show_expand){
        equip.equipment_augs.forEach(n=> {
          if(n.full_pet_status[status_key] > max){
            max = n.full_pet_status[status_key]
          }
          if(n.full_pet_status[status_key] < min){
            min = n.full_pet_status[status_key]
          }
        });
      }
      if(status_key == "Ｄ隔"){
        value = value / 1000;
        max = max / 1000;
        min = min / 1000;
      }
      ret = (value > min ? "(" + min + ") ": "") + value + (value < max ? " (" + max + ")": "");
    }
    else{
      var value = (equip_aug ? equip_aug.full_pc_status[status_key] : equip.pc_status[status_key]) || 0;
      var max = value;
      var min =  value;
      if("show_expand" in equip && equip.show_expand){
        equip.equipment_augs.forEach(n=> {
          if(n.full_pc_status[status_key] > max){
            max = n.full_pc_status[status_key]
          }
          if(n.full_pc_status[status_key] < min){
            min = n.full_pc_status[status_key]
          }
        });
      }
      if(status_key == "Ｄ隔"){
        value = value / 1000;
        max = max / 1000;
        min = min / 1000;
      }
      ret = (value > min ? "(" + min + ") ": "") + value + (value < max ? " (" + max + ")": "");
    }
    return ret;
  }

  getAugName(equipAug: EquipmentAug): string {
    var ret = "";
    if(!equipAug.aug_type && !equipAug.aug_rank){
      ret = "Augment"
    }else{
      if(equipAug.aug_type) ret = equipAug.aug_type;
      if(equipAug.aug_rank){
        if(ret != "") ret += " ";
        ret += 'Rank:' + equipAug.aug_rank;
      }
    }
    return ret;
  }

  showItemDetail(equip: Equipment, equipAug?: EquipmentAug){
    this.itemDetail.show(equip, equipAug);
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

