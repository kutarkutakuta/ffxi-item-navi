import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { SupabaseService } from 'src/app/service/supabase.service'
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { EquipsetGroup } from 'src/app/model/equipset_group';
import { Equipset } from 'src/app/model/equipset';
import { EquipsetItem } from 'src/app/model/equipset_item';
import { EquipsetDBService } from 'src/app/service/equipsetdb.service';
import { map, Observable, of, Subject, tap } from 'rxjs';
import { JobTrait } from 'src/app/model/job_traits';

@Component({
  selector: 'app-equipset',
  templateUrl: './equipset.component.html',
  styleUrls: ['./equipset.component.css'],
})
export class EquipsetComponent {

  @ViewChild(ItemDetailComponent)
  private itemDetail!: ItemDetailComponent;

  @Output()
  published = new EventEmitter<void>();

  private confirmModal?: NzModalRef;

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣"];

  slot_types: {[key: string]: string[]} = {
    メイン: ["格闘","短剣","片手剣","両手剣","片手斧","両手斧","両手鎌","両手槍","片手刀","両手刀","片手棍","両手棍"],
    サブ: ["短剣","片手剣","片手斧","片手刀","片手棍","グリップ", "盾"],
    レンジ: ["弓術","射撃","楽器","ストリンガー"],
    矢弾: ["矢・弾","投擲"]
  }

  equipsetgroup?: Observable<EquipsetGroup | undefined>;

  // SELECTボックス用
  equipments: Equipment[] = [];
  equipment_augs: EquipmentAug[] = [];
  nzFilterOption = (): boolean => false;

  selectedJob: string = "";
  selectedJobTabIndex = 0;
  selectedEquipsetTabIndex = 0;

  visible_publish = false;
  publish_key = "";
  visible_jobTrait = false;
  job_trait_groups: { status_name: string; job_traits: JobTrait[]; }[] = [];
  selected_job_trait: {status_name: string, status_value: number}[] = [];

  public isLoading: Subject<boolean> = new Subject<boolean>();

  constructor(private supabaseService: SupabaseService,
    private equipsetDBService: EquipsetDBService,
    private message: NzMessageService,
    private modal: NzModalService) {
    this.equipsetgroup = equipsetDBService.getEquipsetGroup(this.selectedJob);
    supabaseService.getJobTrait().subscribe(data=>{
      this.job_trait_groups = data;
    });
  }

  /** 装備品検索 */
  searchEquipment(value: string, equipitem: EquipsetItem): void {
    var wepon = equipitem.type || (equipitem.slot == "両手" ? "防具:両手" : equipitem.slot);
    if(wepon.startsWith("右") || wepon.startsWith("左")) wepon = wepon.substring(1);
    var inpuText = value;
    this.supabaseService.getEquipment([this.selectedJob],[wepon], inpuText)
      .then((res: [Equipment[], string[], string[], number])=>{
        this.equipments = res[0];
      })
  }

  /** タブAdd */
  newTab(job: string, copied: Equipset | null = null){

    this.equipsetgroup?.pipe(map(n=>{
      if(!n) n = {job: job, equipsets: []};
      if(copied){
        n?.equipsets.push(copied);
      }
      else{
        n?.equipsets.push({
          name: "装備セット" + (n?.equipsets.length + 1).toString(),
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
            {id: 16, slot: "腰"},
            {id: 17, slot: "他"}
          ]
        });
      }
      return n;
    })).subscribe(n=>{
      this.equipsetgroup = of(n);
      this.selectedEquipsetTabIndex = n?.equipsets.length! -1;
    });
  }

  /** タブClose */
  closeTab(index: number): void {
    this.equipsetgroup?.pipe(
      tap(n=>n?.equipsets.splice(index, 1))
    ).subscribe();
  }

  /** 保存 */
  save(): void{
    this.equipsetgroup?.pipe(
      tap(n=> this.equipsetDBService.putEquipsetGroup(this.selectedJob, n!))
    ).subscribe();

    this.message.info("データを保存しました。");
  }

  /** 読込 */
  redo(): void{
    this.isLoading.next(true);

    this.equipsetDBService.getEquipsetGroup(this.selectedJob).pipe(
      map(data=>this.equipsetgroup = of(data))
    ).subscribe(()=>this.isLoading.next(false));

  }

  /** コピー */
  copy(job: string, equipset: Equipset, edit: boolean): void{

    const { decycle, encycle  } = require('json-cyclic');
    const copied = <Equipset>encycle(JSON.parse(JSON.stringify(decycle(equipset))));

    // 名称変更＆公開情報をクリア
    if(!edit){
      copied.name = copied.name + "_copy";
      copied.publish_user = null;
      copied.publish_id = null;
      copied.publish_comment = null;
      copied.publish_date = null;
    }

    if(this.selectedJob != job){
      // 未Loadの場合Load
      this.confirmModal = this.modal.confirm({
        nzTitle: 'My Set のジョブと異なります',
        nzContent: '編集中のデータはクリアされますがよろしいですか？',
        nzOnOk: () => {
          this.selectedJob = job;
          this.equipsetDBService.getEquipsetGroup(this.selectedJob).pipe(
            map(data=>this.equipsetgroup = of(data))
          ).subscribe(()=>{
            this.newTab(job, copied);
          })
        }
      });
    }
    else{
      this.newTab(job, copied);
    }

  }

  /** 公開する */
  publish(equipset: Equipset){
    if(!equipset.publish_user?.trim()){
      this.message.error("公開ユーザー名を入力してください。");
      return;
    }
    if(!this.publish_key.trim()){
      this.message.error("編集キーを入力してください。");
      return;
    }
    this.confirmModal = this.modal.confirm({
      nzTitle: '現在の装備セットを公開します。',
      nzContent: 'よろしいですか？',
      nzOnOk: () =>
      this.supabaseService.publishEquipset(this.selectedJob, equipset, this.publish_key)
      .then(res=> {
        // 公開情報を保存
        equipset.publish_id = res.publish_id;
        equipset.publish_date = res.publish_date;
        this.save();
        this.published.emit();
        this.message.info("公開しました。");
      }).catch(reason =>{
        this.message.error(reason);
      })
    });
  }

 /** 公開取り消し */
  unpublish(equipset: Equipset){
    if(!this.publish_key.trim()){
      this.message.error("編集キーを入力してください。");
      return;
    }
    this.confirmModal = this.modal.confirm({
      nzTitle: '現在の装備セットの公開を取消します。',
      nzContent: 'よろしいですか？',
      nzOnOk: () =>
      this.supabaseService.unppublishEquipset(equipset?.publish_id!, this.publish_key)
      .then(()=> {
        // 公開情報を保存
        equipset.publish_id = undefined;
        equipset.publish_date = undefined;
        this.save();
        this.published.emit();
        this.message.info("公開を取り消しました");
      }).catch(reason =>{
        this.message.error(reason);
      })
    });
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

  /** 装備変更時 */
  changeEquipment(equipsetItem: EquipsetItem){

    // other_textをmemoにセット
    if(equipsetItem.equipment?.other_text != equipsetItem.memo){
      if(!equipsetItem.memo){
        equipsetItem.memo = equipsetItem.equipment?.other_text;
      }
      else{
        this.confirmModal = this.modal.confirm({
          nzTitle: '確認',
          nzContent: 'Memo欄に装備品のテキストをセットしますか？※現在のMemoがクリアされます。',
          nzOnOk: () => {
            equipsetItem.memo = equipsetItem.equipment?.other_text;
          }
        });
      }
    }

    //　オグメ名をリセット
    equipsetItem.equipment_aug = null;
    this.changeAugName(equipsetItem);
  }

  /** オグメ名変更時 */
  changeAugName(equipsetItem: EquipsetItem){
    equipsetItem.custom_pc_aug = equipsetItem.equipment_aug?.aug_pc_text;
    equipsetItem.custom_pet_aug = equipsetItem.equipment_aug?.aug_pet_text;
    this.changeAugText(equipsetItem);
  }

  /** オグメテキスト変更時 */
  changeAugText(equipsetItem: EquipsetItem){
    var pc_status = this.getAugStatus(equipsetItem, false);
    equipsetItem.custom_pc_aug_status = pc_status[0];
    equipsetItem.custom_pc_aug_error = pc_status[1];

    var pet_status = this.getAugStatus(equipsetItem, true);
    equipsetItem.custom_pet_aug_status = pet_status[0];
    equipsetItem.custom_pet_aug_error = pet_status[1];
  }

  private getAugStatus(equipsetItem: EquipsetItem, isPet:boolean): [any, string] {

    var augText = isPet ? equipsetItem.custom_pet_aug! : equipsetItem.custom_pc_aug!;
    var result: any = {}
    var err = "";
    if(augText){

      // サブRMEAはすべてのオグメを無効
      var isSub = equipsetItem.slot == "サブ";
      var isRmeaSub = isSub && ["マンダウ","エクスカリバー","ガトラー","鬼哭","ミョルニル","与一の弓","アナイアレイター",
        "ヴァジュラ","カルンウェナン","テルプシコラー","ミュルグレス","ブルトガング","ティソーナ","アイムール","凪","ヤグルシュ", "イドリス",
        "トゥワシュトラ","アルマス","ファルシャ","神無","ガンバンテイン",
        "エーネアス", "セクエンス","トライエッジ","丙子椒林剣","ティシュトライヤ"].includes(equipsetItem.equipment?.name!);
      if(isRmeaSub){
        return [result, "サブウェポンがRMEAのオグメは全て無効です。"];
      }

      augText.split(/[,\s]+/).forEach(itemText => {

        var idx = itemText.lastIndexOf(":");
        if(idx > 0){
          var key = itemText.substring(0, idx);
          var value = Number(itemText.substring(idx + 1, itemText.length));
          if(!isNaN(value) && key != "Ｄ隔" && !(isSub && ["Ｄ","隔","命中","攻"].includes(key))){
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
    return [result, err.substring(1) ? "[無効] " + err.substring(1) : ""];
  }

  /** 装備詳細表示 */
  showItemDetail(equip: Equipment, equipAug?: EquipmentAug){
    this.itemDetail.show(equip, equipAug);
  }

  /** ジョブ特性チェック */
  changeTraits(value: string[]){
    var result: {status_name: string, status_value: number}[] = [];
    value.forEach(n=>{
      var tmp = n.split(":");
      var itm = result.find(m=>m.status_name == tmp[0]);
      if(itm){
        itm.status_value += Number(tmp[1]);
      }else{
        result.push({status_name: tmp[0], status_value: Number(tmp[1])});
      }
    });
    this.selected_job_trait = result;
  }

  /** ジョブ特性セット */
  addJobTraits(equipset: Equipset){
    var result = "";

    var equipsetItem = equipset.equip_items.find(n=>n.slot == "他")!;
    if(equipsetItem.custom_pc_aug?.length! > 0){
      equipsetItem.custom_pc_aug?.split(" ").forEach(n=>{
        var tmp = n.split(":");
        var itm = this.selected_job_trait.find(m=>m.status_name == tmp[0]);
        if(itm){
          n = itm.status_name + ":" + itm.status_value;
          this.selected_job_trait = this.selected_job_trait.filter(m=>m.status_name != itm?.status_name)
        }
        result += (result ? " " : "") + n;
      })
    }
    result +=  " " + this.selected_job_trait.map(m=>m.status_name + ":" + m.status_value).join(" ");
    equipsetItem.custom_pc_aug = result.trim();
    this.changeAugText(equipsetItem);
    this.visible_jobTrait = false;
  }

}





