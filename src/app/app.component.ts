import { Component, ViewChild } from '@angular/core';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishEquipset } from './model/publish_equipset';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  logoSrc = "/assets/images/logo.png";
  isCollapsed = false;

  @ViewChild(EquipsetComponent)
  private equipsetComponent?: EquipsetComponent;

  equipsetCopy(publishEquipset: PublishEquipset) {
    this.equipsetComponent?.copy(publishEquipset.job, publishEquipset.equipset);
  }
}

