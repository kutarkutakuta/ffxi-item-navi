import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from "../../environments/environment";
import { Observable, EMPTY, of, from, BehaviorSubject, firstValueFrom, map, filter, throwError  } from 'rxjs';
import { HttpClient  } from '@angular/common/http';
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { NzMessageService } from 'ng-zorro-antd/message';
import { Equipment } from '../model/equipment';
import { Status } from '../model/status';
import * as moment from 'moment';
import { Equipset } from '../model/equipset';
import { EquipsetItem } from '../model/equipset_item';
import { PublishEquipset } from '../model/publish_equipset';

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
    const statusQuery = await this.supabase.from('statuses').select('*').order("id");
    this._statuses.next(statusQuery.data as Status[]);
}

  public getStatus(): BehaviorSubject<Status[]> {
    return this._statuses;
  }

  public async getEquipment(jobs: string[], wepons:string[], inputText: string): Promise<[Equipment[], number, string[], string[]]> {

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
        var jobFilter = "";
        jobs.forEach(n=>{
          if(jobFilter.length > 0) jobFilter += ","
          jobFilter += "job.like.%"+n+"%";
        })
        query = query.or('job.eq.All Jobs,and('+ jobFilter +')');
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
      query = query.order("id", {ascending:false});
      query = query.order("aug_id");

      // 履歴
      if(inputText) this.createEquipHitories(jobs, wepons, inputText);

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
        if(a.aug_type != b.aug_type){
          if(a.aug_type > b.aug_type) return 1
          if(a.aug_type < b.aug_type) return -1
        }
        if(a.aug_rank != b.aug_rank){
          return a.aug_rank - b.aug_rank
        }
        return 0;
      });
      if(items.length > 0){
        equipment.show_expand = true;
        items.forEach(d=>{
          equipment.equipment_augs.push({
            id: d.aug_id,
            name: d.name,
            aug_type: d.aug_type,
            aug_rank: d.aug_rank,
            aug_pc_text: d.aug_pc_text,
            full_pc_status: d.full_pc_status,
            aug_pet_status_target: d.aug_pet_status_target,
            aug_pet_text: d.aug_pet_text,
            full_pet_status: d.full_pet_status,
            aug_other_text: d.aug_other_text
          });
        });
      }
    })

    return [equipments, queryData.count!, txtkeywords, opkeywords];
  }

  private createEquipHitories(jobs: string[], wepons:string[], inputText: string){
      return firstValueFrom(this.http.get<any>("https://api.ipify.org/?format=json")).then(async res =>{
        const dt = moment();
        const useragent = navigator?.userAgentData || navigator?.userAgent;
        const { error } = await this.supabase.from("equipment_histories").insert({
          jobs: jobs,
          wepons: wepons,
          input_text: inputText,
          useragent: useragent,
          ipaddress : res.ip,
          created_at: dt.format(),
        });
        if (error) {
          console.error(error);
          this.message.error(error.message);
        }
    });
  }

  private hankana2Zenkana(str : string) {
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

  /** 公開リスト登録 */
  public async publishEquipset(job: string, equipset: Equipset, publish_key: string): Promise<Equipset> {

    // ステータスのサマリー
    var full_pc_status: any = {};
    var full_pet_status: any = {};
    equipset.equip_items.forEach(item=>{
      var pc_status = item.equipment?.pc_status;
      if(pc_status){
        for (const key in pc_status) {
          if(!full_pc_status[key]) full_pc_status[key] = 0;
          full_pc_status[key] += pc_status[key];
        }
      }
      var pet_status = item.equipment?.pet_status;
      if(pet_status){
        for (const key in pet_status) {
          if(!full_pet_status[key]) full_pet_status[key] = 0;
          full_pet_status[key] += pet_status[key];
        }
      }

      // オグメテキストも反映
      var pc_aug_status = item.custom_pc_aug_status;
      if(pc_aug_status){
        for (const key in pc_aug_status) {
          if(!full_pc_status[key]) full_pc_status[key] = 0;
          full_pc_status[key] += pc_aug_status[key];
        }
      }
      var pet_aug_status = item.custom_pet_aug_status;
      if(pet_aug_status){
        for (const key in pet_aug_status) {
          if(!full_pet_status[key]) full_pet_status[key] = 0;
          full_pet_status[key] += pet_aug_status[key];
        }
      }
    })

    return firstValueFrom(this.http.get<any>("https://api.ipify.org/?format=json")).then(async res =>{

      const dt = moment();
      const useragent = navigator?.userAgentData || navigator?.userAgent;

      if(equipset.publish_id){
        if(!await this.enableEditEquipset(equipset.publish_id, publish_key)){
          throw new Error("IDが存在しないか、編集キーが無効です。");
        }
      }

      var { data, error } = await this.supabase.from("published_sets").upsert({
        id: equipset.publish_id || undefined,
        job: job,
        name: equipset.name,
        memo: equipset.memo,
        full_pc_status: full_pc_status,
        full_pet_status: full_pet_status,
        publish_user: equipset.publish_user,
        publish_key: publish_key,
        publish_comment: equipset.publish_comment,
        created_useragent: useragent,
        created_ipaddress : res.ip,
        created_at: dt.format(),
        updated_useragent: useragent,
        updated_ipaddress : res.ip,
        updated_at: dt.format(),
      }, { 'onConflict': 'id' }).select();

      if (error) {
        console.error(error);
        throw new Error(error.message);
      }

      var publish_id = data![0].id;

      // 子を削除
      await this.supabase.from("published_items").delete()
        .eq("published_set_id", publish_id);

      // 子を登録
      var { error } = await this.supabase.from("published_items").insert(
        equipset.equip_items.map(n=>{
        return {
          published_set_id: publish_id,
          slot_no: n.id,
          slot_name: n.slot,
          type: n.type,
          equipment_name: n.equipment?.name,
          equipment_aug_type: n.equipment_aug?.aug_type,
          equipment_aug_rank: n.equipment_aug?.aug_rank,
          pc_aug_text: n.custom_pc_aug,
          pc_aug_error: n.custom_pc_aug_error,
          pc_aug_status: n.custom_pc_aug_status,
          pet_aug_text: n.custom_pet_aug,
          pet_aug_error: n.custom_pet_aug_error,
          pet_aug_status: n.custom_pet_aug_status,
          memo: n.memo,
        }
      }));

      if (error) {
        console.error(error);
        throw new Error(error.message);
      }

      equipset.publish_id = data![0].id;
      equipset.publish_date = data![0].updated_at;
      return equipset;
  });
  }

  /** 公開リスト削除 */
  public async unppublishEquipset(publish_id: string, publish_key: string): Promise<void> {

    var { error, count } = await this.supabase.from("published_sets").select('*', {count: 'exact'})
      .eq("id", publish_id)
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    if(!count || count == 0){
      // IDがないので削除済み
      return;
    }

    if(!await this.enableEditEquipset(publish_id, publish_key)){
      throw new Error("編集キーが無効です。");
    }

    var { error } =await this.supabase.from("published_items").delete()
      .eq("published_set_id", publish_id);
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    var { error } =await this.supabase.from("published_sets").delete()
      .eq("id", publish_id);
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
  }

  public async enableEditEquipset(publish_id: string, publish_key: string): Promise<boolean>{
    var { error, count } = await this.supabase.from("published_sets").select('*', {count: 'exact'})
      .eq("id", publish_id).eq("publish_key", publish_key)
    if (error) {
      console.error(error);
      return false;
    }
    if(!count || count == 0){
      return false;
    }
    return true;
  }

  /** 公開リスト取得 */
  public async getPublishEquipsert(jobs: string[], inpuText: string) : Promise<PublishEquipset[]>{
    var query = this.supabase.from('published_list')
    .select("*")
    .order("updated_at", {ascending: false});

    if(jobs.length > 0){
      query = query.in("job", jobs);
    }

    if(inpuText){
      query = query.or("publish_user.ilike.%" + inpuText + "%" +
                  ",name.ilike.%" + inpuText + "%" +
                  ",memo.ilike.%" + inpuText +"%");
    }
    var { data, error } = await query;
    if (error) {
      console.error(error);
      this.message.error(error.message);
    }

    var publish_equipsets: PublishEquipset[] = [];

    data!.forEach(d=>{

      if(publish_equipsets.findIndex(p=>p.id == d.id) < 0){

        var equipset_items : EquipsetItem[] = data!.filter(d2=> d2.id == d.id).sort((a: any,b: any) =>{
          return a.slot_no - b.slot_no;
        }).map(d2=> {
          return {
            id: d2.slot_no,
            slot: d2.slot_name,
            type: d2.type,
            equipment: d2.equipment,
            equipment_aug: d2.equipment_aug,
            custom_pc_aug: d2.pc_aug_text,
            custom_pc_aug_error: d2.pc_aug_error,
            custom_pc_aug_status: d2.pc_aug_status,
            custom_pet_aug: d2.pet_aug_text,
            custom_pet_aug_error: d2.pet_aug_error,
            custom_pet_aug_status: d2.pet_aug_status,
            memo: d2.item_memo,
          }
        })

        var euipset: Equipset = {
          name: d.name,
          equip_items: equipset_items,
          memo: d.memo,
          publish_id: d.id,
          publish_user: d.publish_user,
          publish_comment: d.publish_comment,
          publish_date: d.updated_at,
        };

        publish_equipsets.push({
          id: d.id,
          job: d.job,
          equipset: euipset,
          full_pc_status: d.full_pc_status,
          full_pet_status: d.full_pet_status,
          created_ipaddress: d.created_ipaddress,
          created_at: d.created_at,
          updated_ipaddress: d.updated_ipaddress,
          updated_at: d.updated_at,
          likes_count: d.likes_count,
          expanded: false,
          edit: false,
        });
      }
    })

    return publish_equipsets;
  }

  public async createLike(comment_id: number): Promise<number> {
    await this.createLikeOrDislike(comment_id, 'likes');
    const { error, count } = await this.supabase.from('likes').select('*', {count: 'exact'})
      .eq("comment_id", comment_id);
    if (error) {
      console.error(error);
      this.message.error(error.message);
    }
    return count || 0;
  }

  private createLikeOrDislike(comment_id: number, table_name: string) : Promise<void>{
    return firstValueFrom(this.http.get<any>("https://api.ipify.org/?format=json")).then(async res =>{

      const {data} = await this.supabase.from(table_name).select().match({
        comment_id: comment_id,
        ipaddress : res.ip,
       });

      var dt = moment();
      if(data && data.length > 0){
        const { error } = await this.supabase.from(table_name).delete().match({
          comment_id: comment_id,
          ipaddress : res.ip,
         });
        if (error) {
          console.error(error);
          this.message.error(error.message);
        }
       }
       else{
        const { error } = await this.supabase.from(table_name).insert({
          comment_id: comment_id,
          ipaddress : res.ip,
          created_at: dt.format(),
          updated_at: dt.format(),
        });
        if (error) {
          console.error(error);
          this.message.error(error.message);
        }
       }
    });
  }

}
