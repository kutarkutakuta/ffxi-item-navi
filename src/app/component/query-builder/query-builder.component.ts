import { Component, EventEmitter, Output } from '@angular/core';
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

  @Output() created = new EventEmitter<string>();

  visible: boolean = false;
  loading: boolean = false;

  statuses : Status[] = [];
  nodes: NzTreeNodeOptions[] = [];

  target: string = "PC";
  statusKey: string = "";
  statusValue: number = 0;
  operator: string = ">";
  statusStep: number = 1;

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;

        this.statuses.forEach(s=>{
          if(this.nodes.findIndex(n=>n.title == s.type) < 0){
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

  addQuery(){
    if(this.statusKey){
      this.created.emit((this.target == "PET" ? "PET:" : "") +
        this.statusKey + this.operator + this.statusValue);
    }

  }

  // #endregion
}


