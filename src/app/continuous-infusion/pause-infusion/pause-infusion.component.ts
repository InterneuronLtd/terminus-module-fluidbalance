//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2022  Interneuron CIC

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
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { CoreContinuousinfusion, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';

@Component({
  selector: 'app-pause-infusion',
  templateUrl: './pause-infusion.component.html',
  styleUrls: ['./pause-infusion.component.css']
})
export class PauseInfusionComponent implements OnInit {

  resionForPause:string="";
  pauseInfusionError:string="";

  timepicker:Date;
  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Input() filterevent: any;

  @Output() reFreshMenu = new EventEmitter();
  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService,private apiRequest: ApirequestService, public appService: AppService ) { }

  ngOnInit(): void {
    this.timepicker = new Date(moment(this.filterevent[0].datetime,moment.ISO_8601).toString());
  }
  loadValidationscreen() {
    this.reFreshMenu.emit("loadvalidation");
  }
  continuousInfusionEvents(
    Eventid: string,
    EventType: string,
    DateTime: any,
    ContinuousInfusion_ID: string
  ) {
    let coreContinuousinfusionevent: CoreContinuousinfusionevent;
    coreContinuousinfusionevent = new CoreContinuousinfusionevent();
    coreContinuousinfusionevent.continuousinfusionevent_id = Eventid;
    coreContinuousinfusionevent.continuousinfusion_id = ContinuousInfusion_ID;
    coreContinuousinfusionevent.eventcorrelationid = "";
    coreContinuousinfusionevent.datetime = DateTime;
    coreContinuousinfusionevent.eventtype = EventType;
    coreContinuousinfusionevent.addedby = this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby = this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
  }
  pauseInfusion() {
   
    if (this.resionForPause.trim() == "") {
      this.pauseInfusionError = "Please Enter Reason ";
    }
    else {

      this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
      let pauseEventid = uuidv4();

      let pauseTime = new Date(moment(this.filterevent[0].datetime,moment.ISO_8601).toString());

      this.coreContinuousinfusion.ispaused = true;
      this.coreContinuousinfusion.eventcorrelationid = pauseEventid;
      this.coreContinuousinfusion.reasonforpause = this.resionForPause;

      let pumpnumberEvent = this.continuousInfusionEvents(pauseEventid, "pause", this.appService.getDateTimeinISOFormat(pauseTime), this.coreContinuousinfusion.continuousinfusion_id);

      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(pumpnumberEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));

      this.upsertManager.save((res) => {
  
        this.resionForPause = "";
        this.subjects.drawChart.next();
        this.reFreshMenu.emit("pause");
      },
        (error) => {
          this.pauseInfusionError = error;
        }
      );

    }

  }

}
