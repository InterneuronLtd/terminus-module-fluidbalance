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
import { Fluidbalanceintakeoutput } from 'src/app/models/fluidbalance.model';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-bolus',
  templateUrl: './add-bolus.component.html',
  styleUrls: ['./add-bolus.component.css'],
  providers: [UpsertTransactionManager]
})
export class AddBolusComponent implements OnInit, OnDestroy {

  @Input() selectedTimeslot: Date;
  completInfusioneNow: boolean = false;

  isLineRemoved: boolean = false;

  subscriptions: Subscription = new Subscription();

  bolusVolume: number = 0;

  showspinner: boolean = false;

  infusionComplete: boolean = false;

  timepicker: Date;
  validationErrors: string = "";

  FbIntakeOutput: Fluidbalanceintakeoutput;

  minTime: Date = new Date();
  

  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Output() reFreshMenu = new EventEmitter();

  remainingfluid: number = 10;


  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { }


  ngOnInit(): void {
    this.remainingfluid = this.coreContinuousinfusion.totalremainingvolume;

    this.timepicker = new Date();
    if(moment(this.selectedTimeslot).isValid()) {
      this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
    } else {
      this.gettimerdate();
    }
    
  
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
      (response) => {

        let allevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start');

        this.minTime = new Date(moment(allevent[allevent.length - 1].datetime,moment.ISO_8601).toString());

        this.isValid(true);

      }));
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
  bolusVolumeChange() {
    this.infusionComplete = false;
    if (this.bolusVolume > this.coreContinuousinfusion.totalremainingvolume) {
      this.bolusVolume = 0;

    }
    if (this.bolusVolume == this.coreContinuousinfusion.totalremainingvolume) {
      this.infusionComplete = true;
    }
  }
  ngOnDestroy(): void {
    this.upsertManager.destroy();
    this.subscriptions.unsubscribe();
  }

  recordBolus() {
    this.showspinner = false;
    if (this.timepicker < this.minTime) {
      this.validationErrors = "Please select time greater than infusion start time"
      return;
    }
    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    if (typeof this.bolusVolume === 'undefined' || this.bolusVolume <= 0) {
      this.validationErrors = "Please enter a volume amount which is greater than zero"
    }
    else if (this.bolusVolume > this.coreContinuousinfusion.totalremainingvolume) {
      this.validationErrors = "The bolus volume entered exceeds the total volume remaining"
    }
    else if (this.bolusVolume > 0) {
      this.showspinner = true;
      let bolusEventid = uuidv4();
      this.createObjectFbIntakeOutput(bolusEventid, "Bolus");
      let bolusEvent = this.continuousInfusionEvents(bolusEventid, "Bolus", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
      this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume - this.bolusVolume);
      this.coreContinuousinfusion.totaladministeredvolume = (this.coreContinuousinfusion.totaladministeredvolume + this.bolusVolume);
      this.coreContinuousinfusion.eventcorrelationid = bolusEventid;

      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(bolusEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(this.FbIntakeOutput)));

      if (this.completInfusioneNow) {

        let completeEventid = uuidv4();
        let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
        this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
        this.coreContinuousinfusion.islineremovedoncompletion = this.isLineRemoved;
        this.coreContinuousinfusion.finishdatetime = this.appService.getDateTimeinISOFormat(this.timepicker)
        this.coreContinuousinfusion.eventcorrelationid = completeEventid;

        this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      }

      this.upsertManager.save((res) => {
        this.appService.logToConsole(res);
        this.subjects.drawChart.next();
        this.reFreshMenu.emit("refresh");
        this.showspinner = false;
      },
        (error) => {
          this.validationErrors = error;
          this.showspinner = false;
        }
      );

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
    this.validationErrors = "";
    if (this.timepicker < this.minTime) {
      this.validationErrors = "Please select time greater than infusion start time"
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
    coreContinuousinfusionevent.addedby = this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby = this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
  }
  createObjectFbIntakeOutput(eventid: any, iotype: any) {
    let sessionDate = new Date(this.timepicker)
    
    let StartHour = this.appService.sessionStartDateTime.getHours();
    let selectedHour = sessionDate.getHours();
    if (StartHour > selectedHour) {
      sessionDate.setDate(sessionDate.getDate() - 1);
    }
    this.FbIntakeOutput = new Fluidbalanceintakeoutput(
      uuidv4(),
      this.coreContinuousinfusion.fluidbalancesessionroute_id,
      this.coreContinuousinfusion.route_id,
      this.coreContinuousinfusion.routetype_id,
      0,
      this.bolusVolume,
      this.coreContinuousinfusion.flowrateunit,
      this.appService.getDateTimeinISOFormat(this.timepicker),
      "",
      this.appService.MetaIOType.filter(x => x.iotype == iotype)[0].fluidbalanceiotype_id,
      false,
      "", "", false,
      0,// "person weight need to add",
      this.appService.personId,
      this.appService.loggedInUserName, this.appService.loggedInUserName,
      eventid,
      ""
      , true,
      this.appService.FluidBalanceEncounterSessions.find(x => moment(x.startdate).format("MMDDYYYY") === moment(sessionDate).format("MMDDYYYY")).fluidbalancesession_id,
      this.coreContinuousinfusion.continuousinfusion_id
    )

  }

}
