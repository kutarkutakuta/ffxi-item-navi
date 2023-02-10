import { Component, EventEmitter, Output } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'
import { Title } from '@angular/platform-browser';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { EquipmentAug } from 'src/app/model/equipment_aug';

@Component({
  selector: 'app-equipset',
  templateUrl: './equipset.component.html',
  styleUrls: ['./equipset.component.css'],
})
export class EquipsetComponent {

  i = 0;
  editId: string | null = null;

  equipsetgroups: EquipSetGroup[] =[];

  // SELECTボックス用
  equipments: Equipment[] = [];
  equipment_augs: EquipmentAug[] = [];
  nzFilterOption = (): boolean => false;

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣"];

  slot_types: {[key: string]: string[]} = {
    メイン: ["格闘","短剣","片手剣","両手剣","片手斧","両手斧","両手鎌","両手槍","片手刀","両手刀","片手棍","両手棍"],
    サブ: ["短剣","片手剣","片手斧","片手刀","片手棍","グリップ", "盾"],
    レンジ: ["弓術","射撃","楽器","ストリンガー"],
    矢弾: ["矢・弾","投擲"]
  }

  selectedJob: string = "";
  selectedJobTabIndex = 0;
  selectedEquipsetTabIndex = 0;

  statuses : Status[] = [];

  savedAt : string = "";

  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private datePipe: DatePipe) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;
      });
    }

  searchEquipment(value: string, equipsetgroup:EquipSetGroup, equipitem: EquipItem): void {
    var wepon = equipitem.type || (equipitem.slot == "両手" ? "防具:両手" : equipitem.slot);
    if(wepon.startsWith("右") || wepon.startsWith("左")) wepon = wepon.substring(1);
    var inpuText = value;
    this.supabaseService.getEquipment([equipsetgroup.job],[wepon], inpuText)
      .then((res: [Equipment[], number, string[], string[]])=>{
        this.equipments = res[0];
      })
  }

  getStauses(type: string) : Status[]{
    return this.statuses.filter(data=>data.type == type).sort((a,b)=>a.id-b.id);
  }

  getStausValue(equipset:EquipSet, key: string) : string{
    var ret = equipset.equip_items.map(n=>{
      return n.equipment && n.equipment.pc_status[key] ? <number>n.equipment?.pc_status[key] : 0;
    }).reduce((p,c)=>p+c).toString();
    if(key == "Ｄ隔" && ret){
      ret = (Number(ret) / 1000).toString();
    }
    return ret;
  }

  newTab(equipsetgroup?: EquipSetGroup){

    // タブを特定
    if(equipsetgroup == null){
      var idx = this.equipsetgroups.findIndex(n=> n.job == this.selectedJob)
      if(idx < 0){
        equipsetgroup = {
          job: this.selectedJob,
          equipsets: []
        };
        this.equipsetgroups.push(equipsetgroup);
        this.selectedJobTabIndex = this.equipsetgroups.length - 1;
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

  closeTab(index: number, equipsets: EquipSet[]): void {
    equipsets.splice(index, 1);
    if(equipsets.length == 0){
      this.equipsetgroups.splice(this.selectedJobTabIndex, 1);
    }
  }

  startEdit(id: string): void {
    this.editId = id;
  }

  stopEdit(): void {
    this.editId = null;
  }

  ngAfterViewInit (): void {
    this.redo();
  }

  save(): void{
    localStorage.setItem('equipsetgroups', JSON.stringify(this.equipsetgroups));
    var savedAt =this.datePipe.transform(new Date(), "yy/MM/dd HH:mm:ss")!;
    localStorage.setItem('savedAt', savedAt);
    this.savedAt = savedAt;
  }

  redo(): void{
    var saveData = localStorage.getItem('equipsetgroups');
    if(saveData){
      this.equipsetgroups = JSON.parse(saveData);
    }
    var savedAt = localStorage.getItem('savedAt');
    if(savedAt){
      this.savedAt = savedAt;
    }
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

}

interface EquipSetGroup {
  job: string;
  equipsets: EquipSet[];
}

interface EquipSet {
  name: string;
  equip_items: EquipItem[];
  memo?: string;
  updated?: Date;
  created?: Date;
}

interface EquipItem {
    id: number;
    slot: string;
    type?: string;
    aug?: string;
    equipment?: Equipment | null;
    equipment_aug?: EquipmentAug | null;
    custom_aug?: string;
    memo?: string;
}

