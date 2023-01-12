import { Component } from '@angular/core';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Equipment } from './model/equipment';
import { Job } from './model/job';
import { Wepon } from './model/wepon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
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

  constructor(private supabaseService: SupabaseService) { }
  ngOnInit(): void {
  }

  inputChange(){
    this.supabaseService.getEquipment(this.selectedJobs, this.selectedWepons.concat(this.selectedArmors), this.inputValue)
    .then((res: [Equipment[], number, string[], string[]])=>{
      this.equipments = res[0];
      this.txtKeywords = res[2];
      this.opKeywords = res[3];

    });
  }

  replacer(str: string) {
    var ret = str;
    this.opKeywords.forEach(n=>{
      var regularExp = new RegExp('(' + n + '[:：][0-9]+)', "g" );
      var replaceString = '<span class="highlight">$1</span>';
      ret = ret.replace( regularExp , replaceString );
    });
    this.txtKeywords.forEach(n=>{
      var regularExp = new RegExp('(' + n + ')', "g" );
      var replaceString = '<span class="highlight">$1</span>';
      ret = ret.replace( regularExp , replaceString );
    });
    return ret;
  }

  getOpKeywordValue(eq: Equipment, key: string) : string{
    var regularExp = new RegExp('(' + key + ')[:：]([0-9]+)', "g" );
    var matches = regularExp.exec(eq.pc_text);
    return matches![2];
  }

}

