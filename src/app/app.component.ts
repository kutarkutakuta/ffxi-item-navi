import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Component, ViewChild } from '@angular/core';
import { map } from 'rxjs';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishEquipset } from './model/publish_equipset';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  selectedIndex = 0;
  hidden_image = false;

  @ViewChild(EquipsetComponent)
  private equipsetComponent?: EquipsetComponent;

  constructor(private breakpointObserver: BreakpointObserver) {
    breakpointObserver.observe(Breakpoints.XSmall).pipe(
      map((state: BreakpointState) => {
        return state.matches
      })).subscribe(n=>
        this.hidden_image = n
      )
  }

  equipsetCopy(publishEquipset: PublishEquipset) {
    this.equipsetComponent?.copy(publishEquipset.job, publishEquipset.equipset, publishEquipset.edit);
    this.selectedIndex = 1;
  }
}

