import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service'
import { DatePipe } from '@angular/common';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { EquipsetGroup } from 'src/app/model/equipset_group';
import { Equipset } from 'src/app/model/equipset';
import { EquipsetItem } from 'src/app/model/equipset_item';

@Component({
  selector: 'app-equipset',
  templateUrl: './equipset.component.html',
  styleUrls: ['./equipset.component.css'],
})
export class EquipsetComponent {

  @ViewChild(ItemDetailComponent)
  private itemDetail!: ItemDetailComponent;
  private confirmModal?: NzModalRef;

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣"];

  slot_types: {[key: string]: string[]} = {
    メイン: ["格闘","短剣","片手剣","両手剣","片手斧","両手斧","両手鎌","両手槍","片手刀","両手刀","片手棍","両手棍"],
    サブ: ["短剣","片手剣","片手斧","片手刀","片手棍","グリップ", "盾"],
    レンジ: ["弓術","射撃","楽器","ストリンガー"],
    矢弾: ["矢・弾","投擲"]
  }

  equipsetgroups: EquipsetGroup[] =[];
  statuses : Status[] = [];

  // SELECTボックス用
  equipments: Equipment[] = [];
  equipment_augs: EquipmentAug[] = [];
  nzFilterOption = (): boolean => false;

  selectedJob: string = "";
  selectedJobTabIndex = 0;
  selectedEquipsetTabIndex = 0;

  // 保存日時
  savedAt : string = "";

  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private datePipe: DatePipe,
    private modal: NzModalService) {
    supabaseService.getStatus().subscribe(data=>{
      this.statuses = data;
    });
  }

  ngOnInit (): void {
    var savedAt = localStorage.getItem('savedAt');
    if(savedAt){
      this.savedAt = savedAt;
    }
  }

  /** 装備品検索 */
  searchEquipment(value: string, equipsetgroup:EquipsetGroup, equipitem: EquipsetItem): void {
    var wepon = equipitem.type || (equipitem.slot == "両手" ? "防具:両手" : equipitem.slot);
    if(wepon.startsWith("右") || wepon.startsWith("左")) wepon = wepon.substring(1);
    var inpuText = value;
    this.supabaseService.getEquipment([equipsetgroup.job],[wepon], inpuText)
      .then((res: [Equipment[], number, string[], string[]])=>{
        this.equipments = res[0];
      })
  }

  /** タブAdd */
  newTab(equipsetgroup?: EquipsetGroup){

    // タブを特定
    if(equipsetgroup == null){
      var idx = this.equipsetgroups.findIndex(n=> n.job == this.selectedJob)
      if(idx < 0){
        if(!this.selectedJob) {
          this.message.error("ジョブを選択してください。");
          return;
        }
        else{
          equipsetgroup = {
            job: this.selectedJob,
            equipsets: []
          };
          this.equipsetgroups.push(equipsetgroup);
          this.selectedJobTabIndex = this.equipsetgroups.length - 1;
        }
      }
      else{
        equipsetgroup = this.equipsetgroups[idx];
        this.selectedJobTabIndex = idx;
      }
    }

    equipsetgroup.equipsets.push({
      name: (equipsetgroup.equipsets.length + 1).toString(),
      equip_items:[
        {id: 1, slot: "メイン"},
        {id: 2, slot: "サブ"},
        {id: 3, slot: "頭"},
        {id: 4, slot: "胴"},
        {id: 5, slot: "両手"},
        {id: 6, slot: "両脚"},
        {id: 7, slot: "両足"},
        {id: 8, slot: "レンジ"},
        {id: 9, slot: "矢弾"},
        {id: 10, slot: "首"},
        {id: 11, slot: "左耳"},
        {id: 12, slot: "右耳"},
        {id: 13, slot: "左指"},
        {id: 14, slot: "右指"},
        {id: 15, slot: "背"},
        {id: 16, slot: "腰"}
      ]
    });
    this.selectedEquipsetTabIndex = equipsetgroup.equipsets.length -1;
  }

  /** タブClose */
  closeTab(index: number, equipsets: Equipset[]): void {
    equipsets.splice(index, 1);
    if(equipsets.length == 0){
      this.equipsetgroups.splice(this.selectedJobTabIndex, 1);
    }
  }

  /** 保存 */
  save(): void{
    localStorage.setItem('equipsetgroups', JSON.stringify(this.equipsetgroups));
    var savedAt =this.datePipe.transform(new Date(), "yy/MM/dd HH:mm:ss")!;
    localStorage.setItem('savedAt', savedAt);
    this.savedAt = savedAt;
    this.message.info("データを保存しました。");
  }

  /** 読込 */
  redo(): void{
    var saveData = localStorage.getItem('equipsetgroups');
    if(saveData){
      this.equipsetgroups = JSON.parse(saveData);
    }
    var savedAt = localStorage.getItem('savedAt');
    if(savedAt){
      this.savedAt = savedAt;
    }
    this.message.info("データを読み込みました。");
  }

  /** コピー */
  copy(job: string, equipset: Equipset): void{
    const copyed = <Equipset>JSON.parse(JSON.stringify(equipset));

    // 名称変更＆公開情報をクリア
    copyed.name = copyed.name + "_copy";
    copyed.publish_user = null;
    copyed.publish_id = null;
    copyed.publish_date = null;

    // 未Loadの場合Load
    if(this.equipsetgroups.length == 0) this.redo();

    var equipsetgroup = this.equipsetgroups.find(n=>n.job == job);
    if(!equipsetgroup) equipsetgroup = {job: job, equipsets: []};
    equipsetgroup.equipsets.push(copyed);
    this.selectedEquipsetTabIndex = equipsetgroup.equipsets.length -1;
    this.message.info("コピーしました。");
  }

  /** 公開する */
  publish(job: string ,equipset: Equipset){
    if(!equipset.publish_user){
      this.message.error("公開ユーザー名を入力してください。");
      return;
    }
    this.confirmModal = this.modal.confirm({
      nzTitle: '現在の装備セットを公開します。',
      nzContent: 'よろしいですか？',
      nzOnOk: () =>
      this.supabaseService.publishEquipset(job, equipset)
      .then(res=> {
        equipset.publish_id = res.publish_id;
        equipset.publish_date = res.publish_date;
        this.save();
        this.message.info("公開しました。");
      })
    });
  }
  /** ステータスリスト取得 */
  getStauses(type: string) : Status[]{
    return this.statuses.filter(data=>data.type == type).sort((a,b)=>a.id-b.id);
  }

  /** ステータス値取得 */
  getStausValue(equipset:Equipset, key: string) : string{
    var ret = "";
    if(key == "Ｄ隔"){
      var equip_item = equipset.equip_items.find(n=>n.slot == "メイン")!;
      var d = <number>equip_item.equipment?.pc_status["Ｄ"];
      if(equip_item.custom_pc_aug_status && equip_item.custom_pc_aug_status["Ｄ"]){
        d += <number>equip_item.custom_pc_aug_status["Ｄ"];
      }
      var kaku = <number>equip_item.equipment?.pc_status["隔"];
      ret = (d / kaku).toFixed(2).toString();
    }
    else{
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
    return ret == "0" ? "" : ret;
  }

  /** 比較ステータス値取得 */
  getStausValue2(equipset:Equipset, key: string) : string{

    var a = Number(this.getStausValue(equipset, key));
    var b = Number(this.getStausValue(equipset.compareEquipset!, key));

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

  /** オグメ名取得 */
  getAugName(equipAug: EquipmentAug): string {
    var ret = "";
    if(equipAug){
      if(!equipAug.aug_type && !equipAug.aug_rank){
        ret = "Augment"
      }else{
        if(equipAug.aug_type) ret = equipAug.aug_type;
        if(equipAug.aug_rank){
          if(ret != "") ret += " ";
          ret += 'Rank:' + equipAug.aug_rank;
        }
      }
    }
    return ret;
  }

  /** オグメ名変更時 */
  changeAugName(equipsetItem: EquipsetItem){
    equipsetItem.custom_pc_aug = equipsetItem.equipment_aug?.pc_text;
    equipsetItem.custom_pet_aug = equipsetItem.equipment_aug?.pet_text;
    this.changeAugText(equipsetItem);
  }

  /** オグメテキスト変更時 */
  changeAugText(equipsetItem: EquipsetItem){
    var pc_status = this.getAugStatus(equipsetItem.custom_pc_aug!);
    equipsetItem.custom_pc_aug_status = pc_status[0];
    equipsetItem.custom_pc_aug_error = pc_status[1];

    var pet_status = this.getAugStatus(equipsetItem.custom_pet_aug!);
    equipsetItem.custom_pet_aug_status = pet_status[0];
    equipsetItem.custom_pet_aug_error = pet_status[1];
  }

  private getAugStatus(augText: string): [any, string] {
    var result: any = {}
    var err = "";
    if(augText){
      augText.split(/[,\s]+/).forEach(itemText => {

        var idx = itemText.lastIndexOf(":");
        if(idx > 0){
          var key = itemText.substring(0, idx);
          var value = Number(itemText.substring(idx + 1, itemText.length));
          if(!isNaN(value) && key != "Ｄ隔"){
            if(!result[key]) result[key] = 0;
            result[key] += value;
          }else{
            err += "," + itemText;
          }
        }
        else{
          err += "," + itemText;
        }
      });
    }
    return [result, err.substring(1)];
  }

  /** 装備詳細表示 */
  showItemDetail(equip: Equipment, equipAug: EquipmentAug | null){
    this.itemDetail.show(equip, equipAug);
  }

}





