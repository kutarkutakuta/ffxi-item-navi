import { Component, Input, SimpleChanges } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { Equipset } from 'src/app/model/equipset';
import { retry } from 'rxjs';

@Component({
  selector: 'app-status-table',
  templateUrl: './status-table.component.html',
  styleUrls: ['./status-table.component.css'],
})
export class StatusTableComponent {

  private _job?: string;

  @Input() equip?: Equipment ;
  @Input() equipAug?: EquipmentAug;
  @Input() equipset?: Equipset;
  @Input() compareEquipset?: Equipset;
  @Input() set job(value: string) {
    this._job = value;
    this.status_datas = [
      {
        id:1,
        name:"近接",
        status_keys: this.status_key1
      },{
        id:2,
        name:"遠隔",
        status_keys: this.status_key2
      },{
        id:3,
        name:"精霊",
        status_keys: this.status_key3
      },{
        id:4,
        name:"回復支援",
        status_keys: this.status_key4
      },{
        id:5,
        name:"盾",
        status_keys: this.status_key5
      },{
        id:6,
        name:"ペット",
        status_keys: this.status_key6
      },
    ];
    if(["狩","コ"].includes(value)){
      this.selectedIndex = 1;
    }
    else if(["黒","学"].includes(value)){
      this.selectedIndex = 2;
    }
    else if(["白","吟","風","召"].includes(value)){
      this.selectedIndex = 3;

    }
    else if(["ナ","剣"].includes(value)){
      this.selectedIndex = 4;
    }
    else if(["か","獣"].includes(value)){
      this.selectedIndex = 5;
    }
  }

  get job(): string{
    return this._job!;
  }

  statuses : Status[] = [];
  selectedIndex = 0;

  // 近接
  status_key1: string[][] = [
    ["Ｄ","隔", "Ｄ隔","STR","DEX","AGI","VIT","INT","MND","CHR"],
    ["命","攻","魔命","魔攻","魔ﾀﾞﾒ", "ﾍｲｽﾄ","二刀流","DA","TA","QA", "STP", "ｸﾘ","ｸﾘﾀﾞﾒ","WSﾀﾞﾒ","上限","連携","TPﾎﾞ"],
    ["HP","MP","防","回避", "魔回避","魔防","敵対心","被物理","被魔法", "被ﾀﾞﾒ", "被ｸﾘ","ﾓｸｼｬ","ﾓｸII","ｶｳﾝﾀ","ﾜﾙﾂ"]
  ];

  // 遠隔
  status_key2: string[][] = [
    ["Ｄﾚ","隔ﾚ", "Ｄ隔ﾚ","STR","DEX","AGI","VIT","INT","MND","CHR"],
    ["飛命","飛攻", "魔命","魔攻","魔ﾀﾞﾒ", "ｽﾅｯﾌﾟ","ﾗﾋﾟｯﾄﾞ","ﾄｩﾙｰ", "STP", "ｸﾘ","ｸﾘﾀﾞﾒ","WSﾀﾞﾒ","上限","連携","TPﾎﾞ"],
    ["HP","MP","防","回避", "魔回避","魔防","敵対心","被物理","被魔法", "被ﾀﾞﾒ", "被ｸﾘ","ﾓｸｼｬ","ﾓｸII"]
  ];

  // 精霊
  status_key3: string[][] = [
    ["INT","MND","神聖","精霊","暗黒","青魔","忍術","魔命ｽｷﾙ"],
    ["魔命","魔攻","魔ﾀﾞﾒ","MB","MBII","FC","ﾍｲｽﾄ","魔ｸﾘ","ﾄﾞﾚｱｽ","ｱｷｭﾒﾝ","ｺﾝｻﾌﾞ","ﾘﾌﾚｼｭ","詠中断"],
    ["HP","MP","防","回避", "魔回避","魔防","敵対心","被物理","被魔法", "被ﾀﾞﾒ", "被ｸﾘ","ﾓｸｼｬ","ﾓｸII"]
  ];

  // 回復支援
  status_key4: string[][] = [
    ["INT","MND","CHR","回復","強化","弱体","魔命ｽｷﾙ"],
    ["魔命","FC","ﾍｲｽﾄ","強化時間","ｹｱ量","ｹｱ量II","ｹｱ詠","弱体効果","弱体時間","ｶｰｽﾞﾅ","ｺﾝｻﾌﾞ","詠中断"],
    ["HP","MP","防","回避", "魔回避","魔防","敵対心","被物理","被魔法", "被ﾀﾞﾒ", "被ｸﾘ","ﾘﾌﾚｼｭ","ﾘｼﾞｪﾈ"]
  ];

  // 盾
  status_key5: string[][] = [
    ["VIT","MND","CHR","回復","強化","受流","ｶﾞｰﾄﾞ","回避ｽｷﾙ","盾ｽｷﾙ","盾発動","被ﾌｧﾗ","被ﾘｼﾞｪ","被ｹｱ"],
    ["FC","ﾍｲｽﾄ","ﾘﾌﾚｼｭ","ﾘｼﾞｪﾈ","強化時間","詠中断","耐火","耐氷","耐風","耐土","耐雷","耐水","耐光","耐闇","全耐性","全状態"],
    ["HP","MP","防","回避", "魔回避","魔防","敵対心","被物理","被魔法", "被ﾀﾞﾒ", "被ｸﾘ","ﾓｸｼｬ","ﾓｸII","ｶｳﾝﾀ"]
  ];

  // ペット
  status_key6: string[][] = [
    ["Lv","ｽｷﾙ","STR","DEX","AGI","VIT","INT","MND","CHR"],
    ["命","攻","飛命","飛攻","魔命","魔攻","ﾍｲｽﾄ","DA","STP","ｸﾘ","ｸﾘﾀﾞﾒ","WSﾀﾞﾒ","TPﾎﾞ"],
    ["HP","MP","回避","敵対心","被物理","被魔法", "被ﾀﾞﾒ","ﾓｸｼｬ","ﾘﾌﾚｼｭ","ﾘｼﾞｪﾈ"]
  ];

  status_datas?: StatusData[];

  get_option_keys(category: string, index: number ): string[] {
    if(category == "近接" && index == 0){
      var main = this.equipset?.equip_items.find(n=>n.slot == "メイン");
      var atack_skills = this.statuses.filter(data=>data.type == 'ATACK-SKILL' &&
        (main?.equipment?.pc_status[data.name] || (main?.custom_pc_aug_status && main?.custom_pc_aug_status[data.name])))
        .sort((a,b)=>a.id-b.id).map(n=>n.short_name);
      return atack_skills;
    }
    else if(category == "遠隔" && index == 0){
      var range = this.equipset?.equip_items.find(n=>n.slot == "レンジ");
      return range?.type == "射撃" || range?.type == "弓術" ? [range?.type] : [];
    }
    else if(category == "回復支援" && index == 0){
      if(this.job == "吟"){
        return ["歌唱","管楽","弦楽"];
      }
      else if(this.job == "風"){
        return ["風水","風水鈴"];
      }
      else if(this.job == "召"){
        return ["召喚","召喚維持","履行ﾀﾞﾒ","履行隔","履行隔II"];
      }
    }

    return [];
  }

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;

        this.status_datas =[
          {
            id:1,
            name:"物理",
            status_keys: [
              this.statuses.filter(data=>data.type == 'BASE').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'ATACK').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'DEFENSE').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
            ]
          },
          {
            id:2,
            name:"魔法",
            status_keys: [
              this.statuses.filter(data=>data.type == 'BASE').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'MAGIC').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'MAGIC-SKILL').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
            ]
          },
          {
            id:3,
            name:"ペット",
            status_keys: [
              this.statuses.filter(data=>data.type == 'PET-BASE').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'PET-ATACK').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
              this.statuses.filter(data=>data.type == 'PET-DEFENSE').sort((a,b)=>a.id-b.id).map(n=>n.short_name),
            ]
          }
        ];
      });
  }

  getStausValue(key: string, category: string) : string{
    var ret = "";

    var st = this.statuses.find(n=>n.short_name == key);
    if(st) key = st.name;

    if(this.compareEquipset && this.equipset){
      ret = this.getStausSummary2(this.equipset, this.compareEquipset, key, category)
    }
    else if(this.equipset){
      ret = this.getStausSummary(this.equipset, key, category);
    }else if(this.equip){
      // 1つの装備から取得
      var ret_number = 0;
      if(category == "ペット"){
        ret_number = this.equip.pet_status[key];
        if(this.equipAug) ret_number = this.equipAug.full_pet_status[key];
      }
      else{
        ret_number = this.equip.pc_status[key];
        if(this.equipAug) ret_number = this.equipAug.full_pc_status[key];
        if(key == "Ｄ隔" && ret_number){
          ret_number = (Number(ret_number) / 1000);
        }
      }
      ret = ret_number?.toString();
    }

    return ret == "0" ? "" : ret;
  }

  /** ステータス値取得 */
  getStausSummary(equipset:Equipset, key: string, category: string) : string{
    var ret = "";

    if(category == "ペット"){
      ret = equipset.equip_items.map(n=>{
        var ret_number = 0;
        if(n.equipment && n.equipment.pet_status[key]){
          ret_number = <number>n.equipment?.pet_status[key]
        }
        // オグメテキストからも取得
        if(n.custom_pet_aug_status && n.custom_pet_aug_status[key]){
          ret_number += n.custom_pet_aug_status[key];
        }
        return ret_number;
      }).reduce((p,c)=>p+c).toString();
    }
    else{
      if(["Ｄ","隔","Ｄ隔"].includes(key)){
        var d = 0;
        var kaku = 0;
        if(category == "物理" || category == "近接"){
          var equip_item = equipset.equip_items.find(n=>n.slot == "メイン")!;
          if(equip_item){
            d += <number>equip_item.equipment?.pc_status["Ｄ"] || 0;
            kaku += <number>equip_item.equipment?.pc_status["隔"] || 0;
            if(equip_item.custom_pc_aug_status){
              d += <number>equip_item.custom_pc_aug_status["Ｄ"] || 0;
              kaku += <number>equip_item.custom_pc_aug_status["隔"] || 0;
            }
          }
        }
        else if(category == "遠隔"){
          var equip_item = equipset.equip_items.find(n=>n.slot == "レンジ")!;
          if(equip_item){
            d += <number>equip_item.equipment?.pc_status["Ｄ"] || 0;
            kaku += <number>equip_item.equipment?.pc_status["隔"] || 0;
            if(equip_item.custom_pc_aug_status){
              d += <number>equip_item.custom_pc_aug_status["Ｄ"] || 0;
              kaku += <number>equip_item.custom_pc_aug_status["隔"] || 0;
            }
          }
          var equip_item2 = equipset.equip_items.find(n=>n.slot == "矢弾")!;
          if(equip_item2){
            d += <number>equip_item2.equipment?.pc_status["Ｄ"] || 0;
            kaku += <number>equip_item2.equipment?.pc_status["隔"] || 0;
            if(equip_item2.custom_pc_aug_status){
              d += <number>equip_item2.custom_pc_aug_status["Ｄ"] || 0;
              kaku += <number>equip_item2.custom_pc_aug_status["隔"] || 0;
            }
          }
        }
        if(key == "Ｄ") {
          ret = d.toString();
        }
        else if(key == "隔") {
          ret = kaku.toString();
        }
        else{
          ret = (d / kaku).toFixed(3).toString();
        }
      }
      else{
        ret = equipset.equip_items.map(n=>{
          var ret_number = 0;

          if(key == "TPボーナス" && (
            (category == "近接" && n.slot != "メイン") || (category == "遠隔" && n.slot != "レンジ"))){
            // TPボーナスはメイン武器とオグメテキストのみ有効→メイジャンのみ有効
            if(n.custom_pc_aug_status && n.custom_pc_aug_status[key]){
              ret_number = n.custom_pc_aug_status[key];
            }
          }
          else if(n.slot == "サブ"){
            // 二刀流のサブ武器スキル・命中・攻は無効
            if(key.endsWith("スキル") || ["命中","攻"].includes(key)){
              ret_number = 0;
            }
            else{
              // RMEAは「魔法ダメージ」「基本ステータス」「ストアTP」のみ有効
              if(["マンダウ","エクスカリバー","ガトラー","鬼哭","ミョルニル","与一の弓","アナイアレイター",
                "ヴァジュラ","カルンウェナン","テルプシコラー","ミュルグレス","ブルトガング","ティソーナ","アイムール","凪","ヤグルシュ", "イドリス",
                "トゥワシュトラ","アルマス","ファルシャ","神無","ガンバンテイン"].includes(n.equipment?.name!)){
                if(["魔法ダメージ","STR","DEX","AGI","VIT","INT","MND","CHR","HP","MP","ストアTP"].includes(key)){
                  if(n.equipment && n.equipment.pc_status[key]){
                    ret_number = <number>n.equipment?.pc_status[key]
                  }
                }
              }
              else{
                if(n.equipment && n.equipment.pc_status[key]){
                  ret_number = <number>n.equipment?.pc_status[key]
                }
                // オグメテキストからも取得
                if(n.custom_pc_aug_status && n.custom_pc_aug_status[key]){
                  ret_number += n.custom_pc_aug_status[key];
                }
              }
            }
          }
          else{
            if(n.equipment && n.equipment.pc_status[key]){
              ret_number = <number>n.equipment?.pc_status[key]
            }
            // オグメテキストからも取得
            if(n.custom_pc_aug_status && n.custom_pc_aug_status[key]){
              ret_number += n.custom_pc_aug_status[key];
            }
          }
          return ret_number;
        }).reduce((p,c)=>p+c).toString();
      }
    }
    return ret == "0" ? "" : ret;
  }

  getStausSummary2(equipset:Equipset, compareEquipset:Equipset, key: string, category: string) : string{

    var a = Number(this.getStausSummary(equipset, key, category));
    var b = Number(this.getStausSummary(compareEquipset, key, category));

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
        var result = key == "Ｄ隔" ? (a - b).toFixed(3).toString() : (a - b).toString();
        if(a > b){
          return "<span class='highlight-plus'>+" + result + "</span>";
        }
        else{
          return "<span class='highlight-minus'>" + result + "</span>";
        }
      }
    }
  }

  getClipboard(category: string) {

    var clipData = "";
    if(this.equip?.name){
      clipData = "NAME\tｵｸﾞﾒ\t部位\t";
    }

    var status_keys = this.status_datas?.find(n=>n.name == category)?.status_keys.map((n,i)=>{
      return n.concat(this.get_option_keys(category,i));
    }).join().replaceAll(",","\t")
    clipData += status_keys + "\n";
    if(this.equip?.name){
      clipData += this.equip?.name + "\t" + this.getAugName() + "\t" + this.equip?.slot + "\t"
    }
    clipData += status_keys?.split("\t").map(s=>{
      var ret = this.getStausValue(s, category)
      if(ret) ret = ret.replace(/(<([^>]+)>)/gi, '');
      return ret;
    }).join("\t");
    this.clipboard.copy(clipData);
    this.message.info("クリップボードにコピーしました。");
  }

  getAugName(): string {
    var ret = "";
    if(this.equipAug){
      if(!this.equipAug.aug_type && !this.equipAug.aug_rank){
        ret = "Aug."
      }else{
        if(this.equipAug.aug_type) ret = this.equipAug.aug_type;
        if(this.equipAug.aug_rank){
          if(ret != "") ret += " ";
          ret += 'Rank:' + this.equipAug.aug_rank;
        }
      }
    }
    return ret;
  }

  isLongText(str: string): boolean {
    if(str.length > 3){
      const ctx = document.createElement('canvas').getContext('2d')!;
      return ctx.measureText(str).width > 30 ;
    }
    return false;
  }

}

interface StatusData {
  id: number;
  name: string;
  status_keys: string[][];
}
