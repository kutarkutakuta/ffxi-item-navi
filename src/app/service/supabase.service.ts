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

  getStatus(): BehaviorSubject<Status[]> {
    return this._statuses;
  }

  async getEquipment(jobs: string[], wepons:string[], inputText: string): Promise<[Equipment[], number, string[], string[]]> {

    var txtkeywords: string[] = [];
    var opkeywords: string[] = [];

    // 全角→半角変換
    var fnToHankaku = (str: string) :string => {
      return str.replace(/[Ａ-Ｚａ-ｚ０-９！＜＞＝．]/g, (s) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      });
    }

    // 半角→全角変換
    var fnToZenkaku = (str: string) :string => {
      return str.replace(/[A-Za-z\.]/g, (s) => {
          return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
      });
    }

    // +-半角変換
    var fnToHnakakuPlusMinus = (str: string) :string => {
      return str.replace(/[＋]/g, '+')
        .replace(/[－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]/g, '-');
    }

    // 無害化
    var fnSanitize = (str:string): string =>{
      return str.replace(/[!"#$%&'()\*,\/:;<=>?@\[\\\]^_`{|}~]/g, '');
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
        inputText.split(/[,\s]+/).forEach(itemText => {
          var keycolumn = "";
          var keyword = itemText;

          // ターゲットがあれば取得
          var arr_tmp = keyword.replace("：",":").split(":");
          if(arr_tmp.length > 1){
            keycolumn = fnToHankaku(arr_tmp[0]).toUpperCase();
            keyword = keyword.substring(arr_tmp[0].length+1, keyword.length);
          }
          var keyword_han = this.hankana2Zenkana(fnToHankaku(keyword).toUpperCase());  // 式は半角変換
          var keyword_zen = fnToZenkaku(keyword).toUpperCase();  // 式じゃなければ全角に変換

          const regex  = /(?<keyword>[^\=\>\<\!]+)(?<operator>[\=\>\<]|[\>\<!][=])(?<value>[\+\-＋－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]?\d+(?:\.\d+)?)/g;
          var matches = regex.exec(keyword_han);
          if(matches){
            keyword_han = fnSanitize(matches[1]);
            var operator = matches[2];
            var value = Number(fnToHnakakuPlusMinus(matches[3]));

            // Ｄ隔変換
            if(keyword_han=="D") keyword_han = "Ｄ";
            if(keyword_han=="D/隔" || keyword_han=="D／隔" || keyword_han=="D隔") {
              keyword_han = "Ｄ隔"
              value = value * 1000; // Ｄ隔は1000倍
            }

            // 省略名から本名を取得
            var formShortName = this._statuses.getValue().find(s=>
              this.hankana2Zenkana(s.short_name).toUpperCase() == keyword_han)
              keyword_han = formShortName ? formShortName.name : keyword_han;

            // デフォルトはPCステータスで検索するがPET指定時は変更
            var column = "full_pc_status->" + keyword_han;
            if(keycolumn == "PET") column = "full_pet_status->" + keyword_han;
            if(keyword_han == "LV"){
              column = "lv";
              query = query.order(column, {ascending:false, nullsFirst:false});
            }
            if(keyword_han == "IL"){
              column = "item_lv";
              query = query.order(column, {ascending:false, nullsFirst:false});
            }
            switch(operator){
              case "=":
                query = query.eq(column, value);
                break;
              case "!=":
                query = query.neq(column, value);
                break;
              case ">":
                query = query.gt(column, value);
                query = query.order(column, {ascending:false, nullsFirst:false});
                break;
              case ">=":
                query = query.gte(column, value);
                query = query.order(column, {ascending:false, nullsFirst:false});
                break;
              case "<":
                query = query.lt(column, value);
                query = query.order(column, {ascending:true, nullsFirst:false});
                break;
              case "<=":
                query = query.lte(column, value);
                query = query.order(column, {ascending:true, nullsFirst:false});
                break;
            }
            var word = (keycolumn ? keycolumn + ":" : "") + keyword_han;
            if(opkeywords.includes(word) == false) opkeywords.push(word);
          }
          else{
            keyword_han = fnSanitize(keyword_han);
            keyword_zen = fnSanitize(keyword_zen);
            if(keyword_han && txtkeywords.includes(keyword_han) == false || keyword_zen && txtkeywords.includes(keyword_zen) == false ){
              if(txtkeywords.includes(keyword_han) == false ) txtkeywords.push(keyword_han);
              if(txtkeywords.includes(keyword_zen) == false ) txtkeywords.push(keyword_zen);
              switch(keycolumn){
                case "NAME":
                  query = query.ilike("name", "%"+keyword_zen+"%");
                  break;
                case "PC":
                  query = query.ilike("pc_text", "%"+keyword_han+"%");
                  break;
                case "PET":
                  query = query.ilike("pet_text", "%"+keyword_han+"%");
                  break;
                case "OTHER":
                  query = query.ilike("other_text", "%"+keyword_han+"%");
                  break;
                default:
                  if(!keyword_han) keyword_han = keyword_zen;  //無害化した結果空白ならとりあえず全角値をセット
                  query = query.or("name.ilike.%" + keyword_zen + "%,"+
                    "pc_text.ilike.%" + keyword_han+"%, pet_text.ilike.%" + keyword_han + "%, other_text.ilike.%" + keyword_han + "%," +
                    "aug_pc_text.ilike.%" + keyword_han+"%, aug_pet_text.ilike.%" + keyword_han + "%, aug_other_text.ilike.%" + keyword_han + "%" );
                  break;
              }
            }
          }
        });
      }

      query = query.order("install_date", {ascending:false, nullsFirst:false});
      query = query.order("id");

      return query;
    }
    const queryData = await fnFilterBuilder();
    if(queryData.error){
      // this.message.error(queryData.error.message);
      console.error(queryData.error.message);
      return [[],0,[],[]];
    }

    // オーグメントの順番が合わない※ので並び順を揃えて親子関係を構築
    // ※オーグメント付加後でソートしているので仕方ない
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
            lv: d.lv,
            item_lv: d.item_lv,
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

  hankana2Zenkana(str : string) {
    var kanaMap: any = {
        'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
        'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
        'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
        'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
        'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
        'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
        'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
        'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
        '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
    };

    var reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
    return str
            .replace(reg, (match) =>{
                return kanaMap[match]
            })
            .replace(/ﾞ/g, '゛')
            .replace(/ﾟ/g, '゜');
  }

}
