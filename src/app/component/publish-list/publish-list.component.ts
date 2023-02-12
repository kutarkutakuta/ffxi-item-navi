import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from 'src/app/model/equipment';
import { Status } from 'src/app/model/status';
import { SupabaseService } from 'src/app/service/supabase.service'
import { DatePipe } from '@angular/common';
import { EquipmentAug } from 'src/app/model/equipment_aug';
import { ItemDetailComponent } from '../item-detail/item-detail.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { PublishEquipset } from 'src/app/model/publish_equipset';

@Component({
  selector: 'app-publish-list',
  templateUrl: './publish-list.component.html',
  styleUrls: ['./publish-list.component.css'],
})
export class PublishListComponent {

  @ViewChild(ItemDetailComponent)
  private itemDetail!: ItemDetailComponent;

  @Output()
  equipsetCopy = new EventEmitter<PublishEquipset>();

  jobs: readonly string[] = ["戦","暗","侍","竜","モ","か","シ","踊","忍","コ","狩","青","赤","吟","剣","ナ","風","黒","召","白","学","獣"];

  publish_equipsets: PublishEquipset[] = [];
  statuses : Status[] = [];

  selectedJob: string = "";

  constructor(private supabaseService: SupabaseService,
    private message: NzMessageService,
    private datePipe: DatePipe,
    private modal: NzModalService) {
    supabaseService.getStatus().subscribe(data=>{
      this.statuses = data;
    });
  }

  ngOnInit (): void {
    this.supabaseService.GetPublishEquipsert()
    .then(res=>this.publish_equipsets = res);
  }

  like(eq: PublishEquipset){

  }

  copy(eq: PublishEquipset){
    this.equipsetCopy.emit(eq);
  }

  /** 装備詳細表示 */
  showItemDetail(equip: Equipment, equipAug: EquipmentAug | null){
    this.itemDetail.show(equip, equipAug);
  }

}





