import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import { map } from 'rxjs';
import { EquipsetComponent } from './component/equipset/equipset.component';
import { PublishEquipset } from './model/publish_equipset';
import {filter} from 'rxjs/operators';
import { PublishListComponent } from './component/publish-list/publish-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  selectedIndex = 2;
  hidden_image = false;

  @ViewChild(EquipsetComponent)
  private equipsetComponent?: EquipsetComponent;
  @ViewChild(PublishListComponent)
  private publishListComponent?: PublishListComponent;

  constructor(private breakpointObserver: BreakpointObserver,
    private router: Router) {
    breakpointObserver.observe(Breakpoints.XSmall).pipe(
      map((state: BreakpointState) => {
        return state.matches
      })).subscribe(n=>
        this.hidden_image = n
      );
    router.events.pipe(filter(event => event instanceof ActivationEnd))
    .subscribe(event => {
      switch  (router.url){
        case "/myset":
          this.selectedIndex = 1;
          break;
        case "/list":
          this.selectedIndex = 2;
          break;
        default:
          this.selectedIndex = 0;
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

  onSelectedIndexChange(idx: number){
    switch  (idx){
      case 1:
        // history.replaceState('', '', "myset");
        this.router.navigate(["/myset"]);
        break;
      case 2:
        // history.replaceState('', '', "list");
        this.router.navigate(["/list"]);
        break;
      default:
        this.router.navigate(["/"]);
    }

  }
}

