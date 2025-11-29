import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ItemNaviComponent } from './component/item-navi/item-navi.component';
import { ItemDetailComponent } from './component/item-detail/item-detail.component';
import { StatusTableComponent } from './component/status-table/status-table.component';
import { QueryBuilderComponent } from './component/query-builder/query-builder.component';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishListComponent } from './component/publish-list/publish-list.component';
import { FoodNaviComponent } from './component/food-navi/food-navi.component';
import { FoodDetailComponent } from './component/food-detail/food-detail.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { ja_JP } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import ja from '@angular/common/locales/ja';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClipboardModule } from '@angular/cdk/clipboard'
import {ScrollingModule} from '@angular/cdk/scrolling';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ServiceWorkerModule } from '@angular/service-worker';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import { A11yModule } from "@angular/cdk/a11y";


registerLocaleData(ja);

@NgModule({
  declarations: [
    AppComponent,
    ItemNaviComponent,
    ItemDetailComponent,
    StatusTableComponent,
    QueryBuilderComponent,
    EquipsetComponent,
    PublishListComponent,
    FoodNaviComponent,
    FoodDetailComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ClipboardModule,
    ScrollingModule,
    NzTableModule,
    NzDividerModule,
    NzMessageModule,
    NzButtonModule,
    NzSelectModule,
    NzInputModule,
    NzIconModule,
    NzImageModule,
    NzDrawerModule,
    NzGridModule,
    NzToolTipModule,
    NzTreeSelectModule,
    NzInputNumberModule,
    NzSpaceModule,
    NzTabsModule,
    NzCollapseModule,
    NzAffixModule,
    NzDropDownModule,
    NzMenuModule,
    NzModalModule,
    NzSpinModule,
    NzCheckboxModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
    }),
    RouterModule,
    LayoutModule,
    A11yModule
],
  providers: [
    { provide: NZ_I18N, useValue: ja_JP },
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
