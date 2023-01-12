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

    var fnToHnakaku = (str: string) :string => {
      return str.replace(/[Ａ-Ｚａ-ｚ０-９！＜＞＝]/g, (s) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      });
    }

    var fn = (): PostgrestFilterBuilder<any, any, any> =>{
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
        inputText.split(/[,\s]+/).forEach(n=>{
          if(!["and","or"].includes(n.toLowerCase())){
            var keyword = n;
            var colonIndex = keyword.lastIndexOf(":");
            if(colonIndex > -1){
              keyword = keyword.substring(colonIndex, keyword.length)
            }
            const regex  = /(?<keyword>[^\=\>\<\!＝＞＜！]+)(?<operator>[\=\>\<＝＞＜]|[\>\<＞＜!！][=＝])(?<value>[\+\-＋－ー]?[0-9０-９]+)/g;
            var matches = regex.exec(keyword);
            if(matches){
              keyword = fnToHnakaku(matches[1]);
              var operator = fnToHnakaku(matches[2]);
              var value = fnToHnakaku(matches[3]);

              switch(operator){
                case "!=":
                  query = query.neq("pc_status->" + keyword, value);
                  break;
                case ">=":
                  query = query.gte("pc_status->" + keyword, value);
                  break;
                case "<=":
                  query = query.lte("pc_status->" + keyword, value);
                  break;
                case ">":
                  query = query.gt("pc_status->" + keyword, value);
                  break;
                case "<":
                  query = query.lt("pc_status->" + keyword, value);
                  break;
                case "=":
                  query = query.eq("pc_status->" + keyword, value);
                  break;
              }
              query = query.order("pc_status->" + keyword, {ascending:false, nullsFirst:false});
              opkeywords.push(keyword);
            }
            else{
              txtkeywords.push(keyword);

            }
            query = query.or("name.ilike.%"+keyword+"%, pc_text.ilike.%"+keyword+"%, pet_text.ilike.%"+keyword+"%, other_text.ilike.%"+keyword+"%" );
          }
        });
      }

      query = query.order("install_date", {ascending:false, nullsFirst:false});
      query = query.order("id");

      return query;
    }
    const queryData = await fn();
      return [queryData.data as Equipment[], queryData.count!, txtkeywords, opkeywords];
  }

  private async loadData() {
      const jobQuery = await this.supabase.from('jobs').select('*');
      this._jobs.next(jobQuery.data as Job[]);

      const weponQuery = await this.supabase.from('wepons').select('*');
      this._wepons.next(weponQuery.data as Wepon[]);
  }

}
