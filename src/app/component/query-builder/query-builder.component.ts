import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'
import { Title } from '@angular/platform-browser';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-query-builder',
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.css'],
})
export class QueryBuilderComponent {

  @Input() isFood: boolean = false ;
  @Output() created = new EventEmitter<string>();

  visible: boolean = false;
  loading: boolean = false;

  statuses : Status[] = [];
  nodes: NzTreeNodeOptions[] = [];

  lvType: string = "IL";
  lvValue: number = 119;
  lvOperator: string = "=";

  effectTime: string = "1800";
  effectOperator: string = ">=";

  target: string = "PC";
  statusKey: string = "";
  statusValue: number = 0;
  statusOperator: string = ">";
  statusStep: number = 1;

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        
        // 日本語変換
        const typeMap: {[key: string]: string} = {
          "BASE": "基本ステータス",
          "ATACK": "物理",
          "ATACK-SKILL": "戦闘スキル",
          "DEFENSE": "防御",
          "RESIST": "レジスト",
          "MAGIC": "魔法",
          "MAGIC-SKILL": "魔法スキル",
        };
        this.statuses = data.map(s => ({
          ...s,
          type: typeMap[s.type] || s.type
        }));

        this.statuses.forEach(s=>{
          if(this.nodes.findIndex(n=>n.title == s.type) < 0){
            if(!s.type.startsWith("PET")){
              this.nodes.push({
                title: s.type,
                key: s.type,
                children: this.statuses.filter(ss=>ss.type == s.type).map(sss=>{
                  return {
                    title: sss.name,
                    key: sss.short_name,
                    children: [],
                    isLeaf : true
                  }
                }),
                selectable: false
              });
            }
          }
        })

      });
    }

  show(){
    this.visible = true;
    this.loading = false;
  }

  onclose(){
    this.visible = false;
  }

  changeLvType(){
    if(this.lvType == "IL"){
      this.lvValue = 119;
      this.lvOperator = "=";
    }
    else{
      this.lvValue = 99;
      this.lvOperator = "<=";
    }
  }

  changeStatus(){
    if(this.statusKey == "Ｄ隔"){
      this.statusValue = 0;
      this.statusStep = 0.1;
    }
    else{
      this.statusValue =  Math.round(this.statusValue);
      this.statusStep = 1;
    }
  }

  addQuery1(){
    this.created.emit(this.lvType + this.lvOperator + this.lvValue);
  }

  addQuery2(){
    if(this.statusKey){
      this.created.emit((this.target == "PET" ? "PET:" : "") +
        this.statusKey + this.statusOperator + this.statusValue);
    }
    else{
      this.message.warning("ステータスを選択してください。");
    }
  }

  addQuery3(){
    this.created.emit("TIME" + this.effectOperator + this.effectTime);
  }

  // #endregion
}


