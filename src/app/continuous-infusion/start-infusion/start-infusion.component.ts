//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2025  Interneuron Limited

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
import { Routetype, Fluidbalanceintakeoutput } from 'src/app/models/fluidbalance.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import * as moment from 'moment';
import { Subscription, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CoreContinuousinfusion, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';

@Component({
  selector: 'app-start-infusion',
  templateUrl: './start-infusion.component.html',
  styleUrls: ['./start-infusion.component.css'],
  providers:[UpsertTransactionManager]
})
export class StartInfusionComponent implements OnInit ,OnDestroy {

  subscriptions: Subscription = new Subscription();

  coreContinuousinfusion: CoreContinuousinfusion;

  validationErrors: string = '';

  routeTypes: Routetype[];

  FlushTypes: Routetype[];

  bolus: number;

  totalflushVolume: number;

  flushtype_id: string;

  timepicker: Date;

  showspinner = false;

  minTime: Date = new Date();
  maxTime: Date = new Date();
  @Input() timeslot: any;
  latestEvent: CoreContinuousinfusionevent;


  @Input() route_id: string;

  @Input() fluidbalancesessionroute_id: string;

  @Output() loadSummaryEvent = new EventEmitter();

  constructor(private upsertManager:UpsertTransactionManager,private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {
  
  }
  ngOnDestroy(): void {
   this.upsertManager.destroy();
   this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {


    this.timeslot = this.appService.selectedTimeSlot;
    
    this.appService.logToConsole("CI fluidbalancesessionroute_id:" + this.fluidbalancesessionroute_id);
    this.appService.logToConsole("CI Timeslot:" + this.timeslot);
    


    this.getMaxdate();

    this.coreContinuousinfusion = new CoreContinuousinfusion();

    
    this.timepicker =this.appService.sessionStartDateTime;
    this.appService.getDateTimeinISOFormat(this.timepicker);
    this.coreContinuousinfusion.fluidbalancesession_id = this.appService.FluidBalanceSession.fluidbalancesession_id;//"45cae8a2-4886-4d26-8f45-8b15925ad07e";
    this.coreContinuousinfusion.fluidbalancesessionroute_id = this.fluidbalancesessionroute_id;


    //this.coreContinuousinfusion.timeslot = this.timeslot;
 
    
    this.coreContinuousinfusion.route_id = this.route_id;
    
    this.coreContinuousinfusion.pumpnumber = "";
    this.routeTypes = this.appService.MetaRouteTypes.filter(x => x.route_id == this.route_id);
    this.FlushTypes = this.appService.MetaRouteTypes.filter(x => x.isflush == true);
    // if (this.routeTypes.length > 0) {
    //   this.coreContinuousinfusion.routetype_id = this.routeTypes[0].routetype_id;
    // }
    this.coreContinuousinfusion.routetype_id="";
    if (this.FlushTypes.length > 0) {
      this.flushtype_id = "0";
    }

    this.getdates();

  }
  validDatetime() {
    let currentDateTime = new Date();
    currentDateTime.setMilliseconds(0)
    currentDateTime.setSeconds(0)
    if(currentDateTime < this.timepicker) {
      return true;
    } else {
      return false;
    }
  }
  getdates() {

    // if (moment(this.appService.sessionStartDateTime).format("MMDDYYYY:HH") > moment(this.timepicker).format("MMDDYYYY:HH")) {
    //   this.minTime = this.appService.sessionStartDateTime;
    // }
    // else {
     // this.minTime = new Date(moment(this.latestEvent.datetime, moment.ISO_8601).toString());
    //}

    this.getMaxdate();
    // if (this.appService.sessionStartDateTime.getDay() < new Date().getDay()) {
    //   this.timepicker = new Date(moment(this.appService.sessionStartDateTime, moment.ISO_8601).toString());

    //   this.timepicker.setHours(this.maxTime.getHours())
    //   this.timepicker.setMinutes(this.maxTime.getMinutes())
    //   if (this.selectedTimeslot) {
    //     var date = moment(this.selectedTimeslot)
    //     if (date.isValid()) {
    //       this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
    //     }


    //   }
    // }
    // else {
      this.timepicker = new Date(moment(this.maxTime, moment.ISO_8601).toString());

      if (this.timeslot) {
        var date = moment(this.timeslot)
        if (date.isValid()) {
          this.timepicker = new Date(moment(this.timeslot).toDate().setHours(moment(this.timeslot).get("hours"), 0, 0, 0));
        }

      }
   // }

    this.isValid(null);
  }

  getMaxdate() {

    let TempMinutes = new Date().getMinutes();
    if (TempMinutes >= 45) {

      this.maxTime.setMinutes(45);
    }
    else if (TempMinutes >= 30) {
      this.maxTime.setMinutes(30);
    }
    else if (TempMinutes >= 15) {
      this.maxTime.setMinutes(15);
    }
    else if (TempMinutes >= 0) {
      this.maxTime.setMinutes(0);
    }
    this.maxTime.setMilliseconds(0);
    this.maxTime.setSeconds(0);

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
    this.maxTime = this.timepicker;
  }

  startInfusion() {
    this.validationErrors = "";

    if (this.coreContinuousinfusion.routetype_id == "") {
      this.validationErrors = "<i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>Please select route type"
    }
    if (typeof this.coreContinuousinfusion.totalvolume === 'undefined' || this.coreContinuousinfusion.totalvolume <= 0) {
      this.validationErrors = this.validationErrors + "<br><i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>Please enter a volume amount which is greater than zero"
    }
    
    if (this.bolus >= this.coreContinuousinfusion.totalvolume) {
      this.validationErrors =  this.validationErrors +"<br><i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>The bolus volume entered exceeds the total volume available"
    }
    if (this.totalflushVolume > 0 && this.flushtype_id =="0") {
      this.validationErrors =  this.validationErrors +"<br><i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>Please select flush type"
    }
    if (typeof this.coreContinuousinfusion.flowrate === 'undefined' || this.coreContinuousinfusion.flowrate <= 0) {
      this.validationErrors = this.validationErrors+ "<br><i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>Please enter a flow rate which is greater than zero"
    }
   
    if (this.coreContinuousinfusion.pumpnumber.trim() == "") {
      this.validationErrors = this.validationErrors + " <br><i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i>Please enter pump number"
    }
    if (this.validationErrors == "") {
      this.coreContinuousinfusion.totalremainingvolume = this.coreContinuousinfusion.totalvolume;

      this.coreContinuousinfusion.continuousinfusion_id = uuidv4();
      this.coreContinuousinfusion.startdatetime = this.appService.getDateTimeinISOFormat(this.timepicker);
      this.coreContinuousinfusion.ispaused=false;
      this.coreContinuousinfusion.islineremovedoncompletion = false;
      this.coreContinuousinfusion.islineremovedoncompletion = false;
      this.coreContinuousinfusion.addedby=this.appService.loggedInUserName;
      this.coreContinuousinfusion.modifiedby=this.appService.loggedInUserName;
      this.coreContinuousinfusion.flowrateunit = "ml";
      this. saveTransaction();
      
    }

  }

  saveTransaction() {
    this.showspinner=true;
     this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    //Infusion Start
    let startEventid = uuidv4();
    let startEvent = this.continuousInfusionEvents(startEventid, "start", this.coreContinuousinfusion.startdatetime, this.coreContinuousinfusion.continuousinfusion_id);
    this.coreContinuousinfusion.eventcorrelationid = startEventid;
    this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
    this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(startEvent)));
    ////// Add flush

    if (this.totalflushVolume > 0) {
      let flushEventid = uuidv4();
      let FbIntakeOutputflush = this.createObjectFbIntakeOutput(flushEventid, "Flush", this.flushtype_id, this.appService.MetaRouteTypes.find(x => x.routetype_id == this.flushtype_id).route_id, this.totalflushVolume);
      this.coreContinuousinfusion.eventcorrelationid = flushEventid;
      let flushtEvent = this.continuousInfusionEvents(flushEventid, "Flush", this.coreContinuousinfusion.startdatetime, this.coreContinuousinfusion.continuousinfusion_id);
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(flushtEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(FbIntakeOutputflush)));
    }

    if (this.bolus > 0) {

      let bolusEventid = uuidv4();
      let FbIntakeOutputBolus = this.createObjectFbIntakeOutput(bolusEventid, "Bolus", this.coreContinuousinfusion.routetype_id, this.coreContinuousinfusion.route_id, this.bolus);
      let bolusEvent=  this.continuousInfusionEvents( bolusEventid, "Bolus", this.coreContinuousinfusion.startdatetime,  this.coreContinuousinfusion.continuousinfusion_id);
      this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume - this.bolus);
      this.coreContinuousinfusion.totaladministeredvolume = (this.coreContinuousinfusion.totaladministeredvolume + this.bolus);
      this.coreContinuousinfusion.eventcorrelationid = bolusEventid;
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(bolusEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(FbIntakeOutputBolus)));
    }

    this.upsertManager.save((res) => {
     
      this.subjects.drawChart.next(true);
      this.loadSummaryEvent.emit(this.coreContinuousinfusion.continuousinfusion_id);
      this.showspinner=false;
    },
      (error) => {
        this.validationErrors=error;
        this.showspinner=false;
      }
    
    );



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

  createObjectFbIntakeOutput(eventid: any, iotype: any, routetype: any, routeId: any, volume: any) {

    let FbIntakeOutput = new Fluidbalanceintakeoutput(
      uuidv4(),
      this.coreContinuousinfusion.fluidbalancesessionroute_id,
      routeId,
      routetype,
      0,
      volume,
      this.coreContinuousinfusion.flowrateunit,
      this.coreContinuousinfusion.startdatetime,
      "",
      this.appService.MetaIOType.filter(x => x.iotype == iotype)[0].fluidbalanceiotype_id,
      false,
      "", "", false,
      0,// "person weight need to add",
      this.appService.personId,
      this.appService.loggedInUserName, this.appService.loggedInUserName,
      eventid,
      ""
      , true, this.coreContinuousinfusion.fluidbalancesession_id,
      this.coreContinuousinfusion.continuousinfusion_id
    )
    return FbIntakeOutput;

  }


}
