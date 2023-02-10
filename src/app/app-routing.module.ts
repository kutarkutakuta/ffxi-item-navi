import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { ItemNaviComponent } from './component/item-navi/item-navi.component';

const routes: Routes = [
  { path: '',component: ItemNaviComponent},
  { path: 'equipset',component: EquipsetComponent, children: []}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
