import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Component, ViewChild } from '@angular/core';
import {ActivationEnd, NavigationEnd, Router } from '@angular/router';
import { map } from 'rxjs';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishEquipset } from './model/publish_equipset';
import {filter} from 'rxjs/operators';
import { PublishListComponent } from './component/publish-list/publish-list.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  hidden_image = true;

  @ViewChild(EquipsetComponent)
  private equipsetComponent?: EquipsetComponent;
  @ViewChild(PublishListComponent)
  private publishListComponent?: PublishListComponent;

  constructor(private breakpointObserver: BreakpointObserver,
    private router: Router,private titleService: Title, private meta: Meta) {

    // ロゴ表示制御
    breakpointObserver.observe(Breakpoints.XSmall).pipe(
    map((state: BreakpointState) => {
      return state.matches
    })).subscribe(n=> this.hidden_image = n);

    // meta制御
    router.events.pipe(filter(event => event instanceof NavigationEnd ))
    .subscribe(event => {
      switch  (router.url){
        case "/food":
          this.titleService.setTitle("Food - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "FF11の食品を検索します。" });
          break;
        case "/myset":
          this.titleService.setTitle("My Set - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "FF11の装備セットを登録してステータスの確認や比較ができます。" });
          break;
        case "/list":
          this.titleService.setTitle("公開List - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "FF11装備セットの公開一覧。" });
          break;
        default:
          this.titleService.setTitle("FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "FF11の装備品を検索ナビゲート。お探しの装備が見つかります。" });
      }
    });
  }

  published(){
    this.publishListComponent?.inputChange();
  }

  equipsetCopy(publishEquipset: PublishEquipset) {
    this.equipsetComponent?.copy(publishEquipset.job, publishEquipset.equipset, publishEquipset.edit);
    this.router.navigate(["/myset"]);
  }

}

