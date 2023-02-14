import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service'
import { DatePipe } from '@angular/common';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { PublishEquipset } from 'src/app/model/publish_equipset';
import { NzTableComponent } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-publish-list',
  templateUrl: './publish-list.component.html',
  styleUrls: ['./publish-list.component.css'],
})
export class PublishListComponent {

  @ViewChild(ItemDetailComponent)
  private itemDetail!: ItemDetailComponent;

  @ViewChild('equipsetTable', { static: false })
  private nzTableComponent!: NzTableComponent<Equipment>;

  @Output()
  equipsetCopy = new EventEmitter<PublishEquipset>();

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣"];

  publish_equipsets: PublishEquipset[] = [];
  selectedJobs: string[] = [];
  inputValue: string = "";


  loading = false;

  constructor(private supabaseService: SupabaseService) {
  }

  ngOnInit (): void {
    this.inputChange();
  }

  /** 入力変更時 */
  inputChange(){

    // 無害化
    this.inputValue = this.fnSanitize(this.inputValue);

    this.loading = true;
    this.supabaseService.getPublishEquipsert(this.selectedJobs, this.inputValue.trim())
    .then((res)=>{
      this.publish_equipsets = res;
    }).finally(()=>{
      this.loading = false;
      this.nzTableComponent.cdkVirtualScrollViewport?.scrollToIndex(0);
      this.nzTableComponent.nzWidthConfig
    });
  }

      // 無害化
  fnSanitize (str:string): string {
    return str.replace(/["#$%&'()\*,\/;?@\[\\\]^_`{|}~]/g, '');
  }

  like(eq: PublishEquipset){

  }

  copy(eq: PublishEquipset){
    this.equipsetCopy.emit(eq);
  }

  /** オグメ名取得 */
  getAugName(equipAug: EquipmentAug): string {
    var ret = "";
    if(equipAug){
      if(!equipAug.aug_type && !equipAug.aug_rank){
        ret = "Aug."
      }else{
        if(equipAug.aug_type) ret = equipAug.aug_type;
        if(equipAug.aug_rank){
          ret += '-R' + equipAug.aug_rank;
        }
      }
    }
    return ret;
  }

  /** 装備詳細表示 */
  showItemDetail(equip: Equipment, equipAug: EquipmentAug | null){
    this.itemDetail.show(equip, equipAug);
  }

}





