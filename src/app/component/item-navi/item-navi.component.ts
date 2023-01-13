import { Component } from '@angular/core';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Equipment } from 'src/app/model/equipment';

@Component({
  selector: 'item-navi',
  templateUrl: './item-navi.component.html',
  styleUrls: ['./item-navi.component.css']
})
export class ItemNaviComponent {

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣","All Jobs"];
  wepons: readonly string[] = ["格闘","短剣","片手剣","両手剣","片手斧","両手斧","両手鎌","両手槍","片手刀","両手刀","片手棍","両手棍","弓術","射撃","楽器","投擲","矢・弾","グリップ"];
  armors: readonly string[] = ["盾","頭","胴","両手","両脚","両足","首","耳","指","腰","背"];

  selectedJobs: string[] = [];
  selectedWepons: string[] = [];
  selectedArmors: string[] = [];
  inputValue: string = "";

  equipments: Equipment[] = [];

  txtKeywords: string[] = [];
  opKeywords: string[] = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {}

  /** 入力変更時 */
  inputChange(){
    this.supabaseService.getEquipment(this.selectedJobs, this.selectedWepons.concat(this.selectedArmors), this.inputValue.trimEnd())
    .then((res: [Equipment[], number, string[], string[]])=>{
      this.equipments = res[0];
      this.txtKeywords = res[2];
      this.opKeywords = res[3];
    });
  }

  /** HTML変換（ハイライト付加） */
  replacer(source: string ,keycolumn: string) {

    var returnHtml = source;

    // ハイライト変換
    var fnHighlight = (str: string, reg: string) :string => {
      var regularExp = new RegExp(reg, "g" );
      var replaceString = '<span class="highlight">$1</span>';
      return str.replace( regularExp , replaceString );
    }

    for (let keyword of this.opKeywords) {
      var arr_tmp = keyword.split(":");
      if(arr_tmp.length > 1){
        // キー列が一致しない場合は変換しない
        if(arr_tmp[0].toUpperCase() != keycolumn) break;
        keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
      }
      returnHtml = fnHighlight(returnHtml, '(' + keyword + '[:：][0-9]+)');
   }

   for (let keyword of this.txtKeywords) {
    var arr_tmp = keyword.split(":");
    if(arr_tmp.length > 1){
      // キー列が一致しない場合は変換しない
      if(arr_tmp[0].toUpperCase() != keycolumn) break;
      keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
    }
    returnHtml = fnHighlight(returnHtml, '(' + keyword +')');
  }

    return returnHtml;
  }

  /** 値付き項目の値取得 */
  getOpKeywordValue(eq: Equipment, keyword: string) : string{

    var keycolumn = "";
    var arr_tmp = keyword.split(":");
    if(arr_tmp.length > 0){
      keycolumn = arr_tmp[0].toUpperCase();
      keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
    }

    var regularExp = new RegExp(keyword + '[:：]([0-9]+)', "g" );
    var regularText = eq.pc_text;
    if(keycolumn == "PET") regularText = eq.pet_text;
    var matches = regularExp.exec(regularText);
    return matches![1];
  }

}

