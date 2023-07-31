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
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CoreContinuousinfusion, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { v4 as uuidv4 } from 'uuid';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import * as moment from 'moment';

@Component({
  selector: 'app-change-pump',
  templateUrl: './change-pump.component.html',
  styleUrls: ['./change-pump.component.css'],
  providers:[UpsertTransactionManager]
})
export class ChangePumpComponent implements OnInit ,OnDestroy{
  timepicker: Date;


  @Input() selectedTimeslot: Date;
  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Output() reFreshMenu = new EventEmitter();

  errormessage: string = "";

  constructor(private upsertManager:UpsertTransactionManager,private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { }
  
  ngOnDestroy(): void {
   this.upsertManager.destroy();
  //  this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
 
    this.timepicker =new Date();
    if(moment(this.selectedTimeslot).isValid()) {
      this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
    } else {
      this.gettimerdate();
    }
  }

  isValid(event: boolean): void {
    let StartHour = this.appService.sessionStartDateTime.getHours();
    let selectedHour = this.timepicker.getHours();
    this.timepicker.setFullYear(this.appService.sessionStartDateTime.getFullYear());
    this.timepicker.setMonth(this.appService.sessionStartDateTime.getMonth());
    this.timepicker.setDate(this.appService.sessionStartDateTime.getDate());
    if (StartHour > selectedHour) {
      this.timepicker.setDate(this.appService.sessionStartDateTime.getDate() + 1);
    }
    // else {
    //   this.timepicker.setMonth(this.appService.sessionStartDateTime.getMonth());
    //   this.timepicker.setDate(this.appService.sessionStartDateTime.getDate());

    // }
  }

  gettimerdate() {

    let TempMinutes = new Date().getMinutes();
    if (TempMinutes >= 45) {

      this.timepicker.setMinutes(45);
    }
    else if (TempMinutes >= 30) {
      this.timepicker.setMinutes(30);
    }
    else if (TempMinutes >= 15) {
      this.timepicker.setMinutes(15);
    }
    else if (TempMinutes >= 0) {
      this.timepicker.setMinutes(0);
    }
    this.timepicker.setMilliseconds(0);
    this.timepicker.setSeconds(0);

  }
  pumChange() {
    if (this.coreContinuousinfusion.pumpnumber.trim() == "") {

      this.errormessage = "Please enter Pump Number "
    }
    else {

      this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
      
      let pumpChangeEventid = uuidv4();    
      this.coreContinuousinfusion.eventcorrelationid = pumpChangeEventid;
      let pumpnumberEvent = this.continuousInfusionEvents( pumpChangeEventid, "pumpnumber", this.appService.getDateTimeinISOFormat(this.timepicker),this.coreContinuousinfusion.continuousinfusion_id);
    
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(pumpnumberEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));    

      this.upsertManager.save((res) => {    
    
        this.reFreshMenu.emit("refresh");
      },
        (error) => {
          this.errormessage = error;
        }
      );
      
    }

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
    coreContinuousinfusionevent.addedby=this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby=this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
  }
}
