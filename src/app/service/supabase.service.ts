import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from "../../environments/environment";
import { Observable, EMPTY, of, from, BehaviorSubject, firstValueFrom, map, filter  } from 'rxjs';
import { HttpClient  } from '@angular/common/http';
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from '../model/equipment';
import { Status } from '../model/status';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private supabase: SupabaseClient;
  private _statuses: BehaviorSubject<Status[]> = new BehaviorSubject<Status[]>([]);

  constructor(private http:HttpClient,
    private message: NzMessageService,) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.loadData();
  }

  private async loadData() {
    const statusQuery = await this.supabase.from('statuses').select('*');
    this._statuses.next(statusQuery.data as Status[]);
}

  getStatus(): Observable<Status[]> {
    return this._statuses.asObservable();
  }

  async getEquipment(jobs: string[], wepons:string[], inputText: string): Promise<[Equipment[], number, string[], string[]]> {

    var txtkeywords: string[] = [];
    var opkeywords: string[] = [];

    // 全角→半角変換
    var fnToHnakaku = (str: string) :string => {
      return str.replace(/[Ａ-Ｚａ-ｚ０-９！＜＞＝：]/g, (s) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      });
    }

    // +-半角変換
    var fnToHnakakuPlusMinus = (str: string) :string => {
      return str.replace(/[＋]/g, '+')
        .replace(/[－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]/g, '-');
    }

    // フィルタビルダ
    var fnFilterBuilder = (): PostgrestFilterBuilder<any, any, any> =>{
      var query = this.supabase.from('equipment_summary').select().limit(100);

      if(jobs.length > 0){
        var jobFilter = "job.eq.All Jobs";
        jobs.forEach(n=>{
          if(jobFilter.length > 0) jobFilter += ","
          jobFilter += "job.like.%"+n+"%";
        })
        query = query.or(jobFilter);
      }

      if(wepons.length > 0){
        var weponFilter = "";
        wepons.forEach(n=>{
          if(weponFilter.length > 0) weponFilter += ","
          weponFilter += "slot.like.%"+n+"%";
        })
        query = query.or(weponFilter);
      }

      if(inputText.length > 0){
        fnToHnakaku(inputText).split(/[,\s]+/).forEach(itemText => {
          var keycolumn = "";
          var keyword = itemText;
          var arr_tmp = itemText.split(":");
          if(arr_tmp.length > 1){
            keycolumn = arr_tmp[0].toUpperCase();
            keyword = itemText.substring(arr_tmp[0].length+1, keyword.length);
          }
          const regex  = /(?<keyword>[^\=\>\<\!]+)(?<operator>[\=\>\<]|[\>\<!][=])(?<value>[\+\-＋－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]?[0-9]+)/g;
          var matches = regex.exec(keyword);
          if(matches){
            keyword = matches[1];
            var operator = matches[2];
            var value = fnToHnakakuPlusMinus(matches[3]);

            // デフォルトはPCステータスで検索するがPET指定時は変更
            var column = "full_pc_status->" + keyword;
            if(keycolumn == "PET") column = "full_pet_status->" + keyword;
            switch(operator){
              case "!=":
                query = query.neq(column, value);
                break;
              case ">=":
                query = query.gte(column, value);
                break;
              case "<=":
                query = query.lte(column, value);
                break;
              case ">":
                query = query.gt(column, value);
                // query = query.gt("equipment_augs.full_pc_status->" + keyword, value);
                // これができない・・・
                // query.or(column + ".gt." + value + ",equipment_augs.full_" + column + ".gt." + value);
                query.not(column, "lte", value)
                break;
              case "<":
                query = query.lt(column, value);
                break;
              case "=":
                query = query.eq(column, value);
                break;
            }
            query = query.order(column, {ascending:false, nullsFirst:false});
            opkeywords.push((keycolumn ? keycolumn + ":" : "") + keyword);
          }
          else{
            txtkeywords.push(itemText);
          }

          switch(keycolumn){
            case "NAME":
              query = query.ilike("name", "%"+keyword+"%");
              break;
            case "PC":
              query = query.ilike("pc_text", "%"+keyword+"%");
              break;
            case "PET":
              query = query.ilike("pet_text", "%"+keyword+"%");
              break;
            case "OTHER":
              query = query.ilike("other_text", "%"+keyword+"%");
              break;
            default:
              query = query.or("name.ilike.%"+keyword+"%, pc_text.ilike.%"+keyword+"%, pet_text.ilike.%"+keyword+"%, other_text.ilike.%"+keyword+"%" );
              break;
          }

        });
      }

      query = query.order("install_date", {ascending:false, nullsFirst:false});
      query = query.order("id");

      return query;
    }
    const queryData = await fnFilterBuilder();

    var equipments: Equipment[] = [];
    queryData.data!.forEach(d=>{
      if(equipments.findIndex(r=>r.id == d.id) < 0){
        equipments.push({
          id: d.id,
          show_expand: false,
          slot: d.slot,
          name: d.name,
          yomi: d.yomi,
          english: d.english,
          rare: d.rare,
          ex: d.ex,
          lv: d.lv,
          item_lv: d.item_lv,
          pc_text: d.pc_text,
          pc_status: d.pc_status,
          pet_status_target: d.pet_status_target,
          pet_text: d.pet_text,
          pet_status: d.pet_status,
          other_text: d.other_text,
          job: d.job,
          install_date: d.install_date,
          page_title: d.page_title,
          equipment_augs: [],
          expanded: false,
        });
      }
    })

    equipments.forEach(equipment=>{
      var items = queryData.data!.filter(d=>d.id == equipment.id && d.aug_id > 0).sort((a: any,b: any)=>{
        return a.aug_id - b.aug_id;
      });
      if(items.length > 0){
        equipment.show_expand = true;
        items.forEach(d=>{
          equipment.equipment_augs.push({
            id: d.aug_id,
            name: d.name,
            aug_type: d.aug_type,
            aug_rank: d.aug_rank,
            pc_text: d.aug_pc_text,
            pc_status: d.full_pc_status,
            pet_status_target: d.aug_pet_status_target,
            pet_text: d.aug_pet_text,
            pet_status: d.full_pet_status,
            other_text: d.aug_other_text,
          });
        });
      }
    })

    return [equipments, queryData.count!, txtkeywords, opkeywords];
  }

}
