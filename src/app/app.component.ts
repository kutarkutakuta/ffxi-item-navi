import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Component, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {ActivationEnd, NavigationEnd, Router } from '@angular/router';
import { map } from 'rxjs';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishEquipset } from './model/publish_equipset';
import {filter} from 'rxjs/operators';
import { PublishListComponent } from './component/publish-list/publish-list.component';
import { Meta, Title } from '@angular/platform-browser';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AppComponent {

  hidden_image = true;
  showFooter = true;
  private scrollTimeout: any;
  private isBrowser: boolean;

  @ViewChild(EquipsetComponent)
  private equipsetComponent?: EquipsetComponent;
  @ViewChild(PublishListComponent)
  private publishListComponent?: PublishListComponent;

  constructor(private breakpointObserver: BreakpointObserver,
    private router: Router,private titleService: Title, private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: any) {

    this.isBrowser = isPlatformBrowser(this.platformId);

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
          this.titleService.setTitle("食事 - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "FF11の食事効果をサクッとチェック！気になる料理がすぐ見つかります。" });
          break;
        case "/myset":
          this.titleService.setTitle("My Set - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "装備セットを気軽に登録＆比較！ステータス確認に便利です。" });
          break;
        case "/list":
          this.titleService.setTitle("みんなの装備 - FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "みんなが公開してる装備セットをのぞけます。強い構成のヒントに！" });
          break;
        default:
          this.titleService.setTitle("FF11装備Navi");
          this.meta.updateTag({ name: 'description', content: "オンラインRPG『FF11』の装備品や食事効果を簡単にチェック！自分だけの装備セットを作って公開もできる非公式アプリです。" });
      }
    });
  }

  ngOnInit() {
    if (this.isBrowser) {
      window.addEventListener('scroll', this.onScroll.bind(this), true);
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onScroll.bind(this), true);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  onScroll() {
    this.showFooter = false;
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.scrollTimeout = setTimeout(() => {
      this.showFooter = true;
    }, 5000);
  }

  published(){
    this.publishListComponent?.inputChange();
  }

  equipsetCopy(publishEquipset: PublishEquipset) {
    this.equipsetComponent?.copy(publishEquipset.job, publishEquipset.equipset, publishEquipset.edit);
    this.router.navigate(["/myset"]);
  }

}

