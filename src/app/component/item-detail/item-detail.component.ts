import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service';
import { Clipboard } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css'],
})
export class ItemDetailComponent {

  equip!: Equipment;
  visible: boolean = false;
  loading: boolean = false;

  statuses : Status[] = [];

  // #region implementsMethods
  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private clipboard: Clipboard) {
      supabaseService.getStatus().subscribe(data=>{
        this.statuses = data;
      });
    }


  show(equip: Equipment){
    this.equip = equip
    this.visible = true;
    this.loading = false;
  }

  onclose(){
    this.visible = false;
  }

  getStauses(type: string) : Status[]{
    return this.statuses.filter(data=>data.type == type).sort((a,b)=>a.id-b.id);
  }

  getWikiURL(param: string | undefined): string {
    return "http://wiki.ffo.jp/search.cgi?imageField.x=0&imageField.y=0&CCC=%E6%84%9B&Command=Search&qf=" + param + "&order=match&ffotype=title&type=title";
  }

  getClipboard(data: Equipment) {
    this.clipboard.copy(JSON.stringify(data));
    this.message.info("クリップボードにコピーしました。");
  }

  // #endregion
}

