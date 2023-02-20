import { Component, EventEmitter, Output, TemplateRef, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service'
import { DatePipe } from '@angular/common';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { PublishEquipset } from 'src/app/model/publish_equipset';
import { NzTableComponent, NzTableFilterFn, NzTableFilterList, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';
import { EquipsetItem } from 'src/app/model/equipset_item';

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
  publish_key = "";

  all_expanded = false;

  listOfColumns: ColumnItem[] = [
    {
      name: 'ID',
      width: '80px',
      showSort : true,
      sortOrder: null,
      sortFn: (a: PublishEquipset, b: PublishEquipset) => a.id - b.id,
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: '',
      width: '30px',
      showSort : true,
      sortOrder: null,
      sortFn: (a: PublishEquipset, b: PublishEquipset) => a.job.localeCompare(b.job),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Title',
      width: 'auto',
      showSort : false,
      sortOrder: null,
      sortFn: null,
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'User',
      width: '100px',
      showSort : true,
      sortOrder: null,
      sortFn: (a: PublishEquipset, b: PublishEquipset) => a.equipset?.publish_user!.localeCompare(b.equipset?.publish_user!),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Date',
      width: '85px',
      showSort : true,
      sortOrder: null,
      sortFn: (a: PublishEquipset, b: PublishEquipset) => a.equipset?.publish_date! > b.equipset?.publish_date! ? 1 : -1,
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Comment',
      width: 'auto',
      showSort : false,
      sortOrder: null,
      sortFn: null,
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: '',
      width: '50px',
      showSort : true,
      sortOrder: null,
      sortFn: (a: PublishEquipset, b: PublishEquipset) => a.likes_count - b.likes_count,
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: '',
      width: '60px',
      showSort : false,
      sortOrder: null,
      sortFn: null,
      sortDirections: [],
    }
  ];

  constructor(private supabaseService: SupabaseService,
    private modal: NzModalService,
    private message: NzMessageService,) {
  }

  ngOnInit (): void {
    this.inputChange();
  }

  changeAllExpanded(){
    this.all_expanded = !this.all_expanded;
    this.publish_equipsets.forEach(n=>n.expanded = this.all_expanded);
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

  async like(publish_equipset: PublishEquipset){
    this.supabaseService.createLike(publish_equipset.id).then(n=> publish_equipset.likes_count = n);
  }

  copy(publish_equipset: PublishEquipset, edit:boolean, tplContent: TemplateRef<{}>,){

    if(edit){
      this.publish_key = "";
      this.modal.create({
        nzTitle: "編集確認",
        nzContent: tplContent,
        nzOnOk: async () => {
          if(!await this.supabaseService.enableEditEquipset(publish_equipset.id.toString(), this.publish_key)){
            this.message.error("編集キーが不正です。");
          }
          else{
            publish_equipset.edit = edit;
            this.equipsetCopy.emit(publish_equipset);
          }
        }
      });
    }
    else{
      publish_equipset.edit = edit;
      this.equipsetCopy.emit(publish_equipset);
    }
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
          ret += '(R' + equipAug.aug_rank + ')';
        }
      }
    }
    return ret;
  }

  /** 装備詳細表示 */
  showItemDetail(equipset_item: EquipsetItem){

    if(equipset_item.equipment_aug){
      // マスタではなく手入力したオグメを表示したい
      const { decycle, encycle  } = require('json-cyclic');
      const copied = <EquipmentAug>encycle(JSON.parse(JSON.stringify(decycle(equipset_item.equipment_aug))));
      copied.aug_pc_text =equipset_item.custom_pc_aug!;
      copied.aug_pet_text =equipset_item.custom_pet_aug!;

      // ステータスも手入力のほうに
      var pc_status: any = {}
      for (var key in equipset_item.equipment?.pc_status) {
        pc_status[key] = equipset_item.equipment?.pc_status[key];
      }
      for (var key in equipset_item.custom_pc_aug_status) {
        pc_status[key] = (pc_status[key] || 0) + equipset_item.custom_pc_aug_status[key];
      }
      copied.full_pc_status = pc_status;
      var pet_status: any = {}
      for (var key in equipset_item.equipment?.pet_status) {
        pet_status[key] = equipset_item.equipment?.pet_status[key];
      }
      for (var key in equipset_item.custom_pet_aug_status) {
        pet_status[key] = (pet_status[key] || 0) + equipset_item.custom_pet_aug_status[key];
      }
      copied.full_pet_status = pet_status;

      this.itemDetail.show(equipset_item.equipment!, copied);
    }
    else{

    this.itemDetail.show(equipset_item.equipment!, null);
    }

  }

  showItem(equip_items:EquipsetItem[],  slot: string){
    var equip_item = equip_items.find(n=>n.slot == slot)!;
    this.showItemDetail(equip_item);
  }

  getEquip(equip_items:EquipsetItem[],  slot: string) : string {
    var equip_item = equip_items.find(n=>n.slot == slot)!;

    var ret = equip_item.equipment?.name!;
    if(equip_item.equipment_aug){
      ret += "" + this.getAugName(equip_item.equipment_aug!);
    }
    return ret;
  }
}

interface ColumnItem {
  name: string;
  width: string;
  showSort: boolean;
  sortOrder: NzTableSortOrder | null;
  sortFn: NzTableSortFn<PublishEquipset> | null;
  sortDirections: NzTableSortOrder[];
}





