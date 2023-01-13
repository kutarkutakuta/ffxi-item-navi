import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from "../../environments/environment";
import { Observable, EMPTY, of, from, BehaviorSubject, firstValueFrom, map, filter  } from 'rxjs';
import { HttpClient  } from '@angular/common/http';
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { NzMessageService } from 'ng-zorro-antd/message';
import { Job } from '../model/job';
import { Wepon } from '../model/wepon';
import { Equipment } from '../model/equipment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private supabase: SupabaseClient;
  private _jobs: BehaviorSubject<Job[]> = new BehaviorSubject<Job[]>([]);
  private _wepons: BehaviorSubject<Wepon[]> = new BehaviorSubject<Wepon[]>([]);

  constructor(private http:HttpClient,
    private message: NzMessageService,) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.loadData();
  }

  getJob(): Observable<Job[]> {
    return this._jobs.asObservable();
  }

  getWepon(): Observable<Wepon[]> {
    return this._wepons.asObservable();
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
      var query = this.supabase.from('equipments').select();

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
            var column = "pc_status->" + keyword;
            if(keycolumn == "PET") column = "pet_status->" + keyword;
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
      return [queryData.data as Equipment[], queryData.count!, txtkeywords, opkeywords];
  }

  private async loadData() {
      const jobQuery = await this.supabase.from('jobs').select('*');
      this._jobs.next(jobQuery.data as Job[]);

      const weponQuery = await this.supabase.from('wepons').select('*');
      this._wepons.next(weponQuery.data as Wepon[]);
  }

}
