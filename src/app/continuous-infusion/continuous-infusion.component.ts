//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2023  Interneuron Holdings Ltd

//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

//See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.If not, see<http://www.gnu.org/licenses/>.
//END LICENSE BLOCK 
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SubjectsService } from '../services/subjects.service';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';


@Component({
  selector: 'app-continuous-infusion',
  templateUrl: './continuous-infusion.component.html',
  styleUrls: ['./continuous-infusion.component.css']
})
export class ContinuousInfusionComponent implements OnInit,OnDestroy {

  showCIScreen: boolean = false;
  subscriptions: Subscription = new Subscription();
  fluidbalancesessionroute_id: string;
  route_id: string;
  continuousinfusion_id: string = "";
  timeslot:any;


  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {

    this.subscriptions.add(this.subjects.openContinuosInfusionForm.subscribe
      ((event: any) => {
        this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;
        this.route_id = event.route_id;
        if(event.timeslot){
        this.timeslot=event.timeslot;
        
        }

        this.appService.logToConsole("openContinuosInfusionForm timeslot:" + this.timeslot);

        this.continuousinfusion_id = event.continuousinfusion_id;
        this.showCIScreen = true;
      }));

      this.subscriptions.add(this.subjects.closeCIPopup.subscribe(() => {
        this.closepopup();
      }));
  }

  ngOnInit(): void {

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closepopup() {
    this.timeslot=null;
    this.showCIScreen = false;

  }

  showMenus(newContinuousinfusion_id: string) {
    // this will switch the if condetion in screen
    this.continuousinfusion_id = newContinuousinfusion_id;
  }

}
