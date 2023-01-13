export interface Equipment {
  id: number;
  slot: string;
  name: string;
  yomi: string;
  english: string;
  rare: boolean;
  ex: boolean;
  lv: number;
  item_lv: number;
  pc_text: string;
  pc_status: any;
  pet_status_target: string;
  pet_text: string;
  pet_status: any;
  other_text: string;
  job: string;
  install_date: Date;
  page_title: string;
  original_text: string;
}
