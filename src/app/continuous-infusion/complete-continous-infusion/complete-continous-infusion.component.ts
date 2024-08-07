//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2024  Interneuron Limited

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
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { CoreContinuousinfusion, CoreContinuousinfusionevent, CoreContinuousinfusionfluidloss, CoreContinuousinfusionvalidation } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { Fluidbalanceintakeoutput } from 'src/app/models/fluidbalance.model';
import { start } from 'repl';


@Component({
  selector: 'app-complete-continous-infusion',
  templateUrl: './complete-continous-infusion.component.html',
  styleUrls: ['./complete-continous-infusion.component.css']
})
export class CompleteContinousInfusionComponent implements OnInit, OnDestroy {

  @Output() reFreshMenu = new EventEmitter();

  completInfusionenow: boolean = true;
  isLineremoved: boolean = false;
  checktheline: boolean = false;
  infusionComplete: boolean = false;
  routename: string = "";
  @Input() coreContinuousinfusion: CoreContinuousinfusion;
  @Input() changeFlowRate: boolean = true;
  @Input() selectedTimeslot: Date;

  newFlowRateVolume: number = 0;
  newFlowRateerror: string = "";
  FbIntakeOutput: Fluidbalanceintakeoutput;
  subscriptions: Subscription = new Subscription();
  // allevent: CoreContinuousinfusionevent[] = [];
  filterevent: CoreContinuousinfusionevent[] = [];
  latestEvent: CoreContinuousinfusionevent;
  invalideDateMessage: string = "";
  timeexcitedMessage: string = "";
  totaltimeCalculated: string = "";
  validatingVolume: number = 0;
  validatingflowrate: number = 0;
  timepicker: Date = new Date();
  sameTimechangeFlowRateOnly: boolean = false;
  administeredvolume: number = 0;
  actualvolume: number = 0;
  changedvolume: number = 0;
  totalfluidLoss: number = 0;
  minTime: Date = new Date();
  maxTime: Date = new Date();
  summaryDetails: Array<Date | any> = [];
  slotVolume: number = 0;
  showvalidationtable: boolean = false;
  updatethecalculatedvolume: boolean = false;
  showspinner: boolean = false;
  hasAllVolumeAdministered: boolean = true;
  totalVolumeAdministered: number = 0;
  totalVolumeAdministeredInput: number = 0
  amountDeliveredLastValidation: number = 0;
  completionTime: Date = new Date();
  isValidTimePicker: boolean = true;
  isLastDayOfInfusion = false;
  sessionDateForWarning: Date;
  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {

  }

  ngOnInit(): void {
    this.amountDeliveredLastValidation = this.coreContinuousinfusion.totalremainingvolume;
    // this.getAllEvent();    // duplicate functionality commented : RK:jan1321

    this.getFluidLoss();
    this.getMaxdate();
    ///this.maxTime.setMinutes(this.appService.IsNearestMinutePlus15(moment(new Date()).get("minutes")));
    this.routename = this.appService.MetaRoutes.find(x => x.route_id == this.coreContinuousinfusion.route_id).route.toUpperCase() + "(" + this.coreContinuousinfusion.totalvolume.toString() + ")";
    this.appService.logToConsole("--------coreContinuousinfusion----------");
    this.appService.logToConsole(this.coreContinuousinfusion);
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  // getAllEvent() {
  //   this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
  //     (response) => {
  //       this.allevent = <CoreContinuousinfusionevent[]>JSON.parse(response);
  //       this.filterevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation');
  //       this.getCompletionTime();
  //     }));
  // }
  getLastEvent() {
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
      (response) => {

        // this.allevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation'
        //   && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0
        // );
        this.filterevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation'
          && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0
        );

        if (this.filterevent.length > 0) {
          this.latestEvent = new CoreContinuousinfusionevent();
          this.latestEvent.continuousinfusion_id = this.filterevent[0].continuousinfusion_id;
          this.latestEvent.continuousinfusionevent_id = this.filterevent[0].continuousinfusionevent_id;
          this.latestEvent.datetime = this.filterevent[0].datetime;
          this.latestEvent.eventcorrelationid = this.filterevent[0].eventcorrelationid;
          this.latestEvent.eventtype = this.filterevent[0].eventtype;
          this.latestEvent.addedby = this.filterevent[0].addedby;
          this.latestEvent.modifiedby = this.filterevent[0].modifiedby;
          this.getCompletionTime();
          this.setWarningMessage();
          this.setTimePickerBasedOnCompletion();
          this.getValidationTime();


        }
      }));
  }

  setWarningMessage() {
    if (moment(this.completionTime).isBetween(this.appService.sessionStartDateTime, this.appService.sessionStopDateTime, undefined, '[)')) {
      this.isLastDayOfInfusion = true;
    }
    else {
      this.isLastDayOfInfusion = false;

      //set warning message date
      //if session start time is not 00:00 and completion time is not session start/stop time
      //if completion time is between 00:00 and session start/stop time 
      //this means that the warning message should show completiondate -1 date 

      var sessionStartStopHour = moment(this.appService.FluidBalanceSession.startdate).get("hour");
      var completiontimemoment = moment(this.completionTime);
      this.sessionDateForWarning = completiontimemoment.clone().toDate();
      if (sessionStartStopHour != 0 && completiontimemoment.get("hour") != sessionStartStopHour) // session runs into next day and completion time is not session start/stop hour
      {
        var startHour = completiontimemoment.clone().set("minute", 0).set("hour", 0);
        var endHour = startHour.clone().set("minute", 0).set("hour", sessionStartStopHour);

        if (completiontimemoment.isBetween(startHour, endHour, undefined, "[)")) {
          this.sessionDateForWarning = completiontimemoment.clone().add(-1, "day").toDate();
        }
      }
    }
  }
  getFluidLoss() {
    this.totalfluidLoss = 0;
    let CoreContinuousinfusionfluidloss: CoreContinuousinfusionfluidloss[] = [];
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionfluidloss&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id).subscribe(
      (response) => {

        CoreContinuousinfusionfluidloss = <CoreContinuousinfusionfluidloss[]>JSON.parse(response);
        if (CoreContinuousinfusionfluidloss.length > 0) {
          for (let item of CoreContinuousinfusionfluidloss) {
            if (item.isremoved != true)
              this.totalfluidLoss = this.totalfluidLoss + item.volume;
          }
        }

        this.totalVolumeAdministeredInput = this.totalVolumeAdministered = this.coreContinuousinfusion.totalvolume - this.totalfluidLoss;
        this.amountDeliveredLastValidation = this.totalVolumeAdministered - this.coreContinuousinfusion.totaladministeredvolume;

        this.getLastEvent();


      }));
  }

  loadValidationscreen() {
    this.reFreshMenu.emit("loadvalidation");
  }
  setAmoutDeliveredLastValidation() {
    if (this.hasAllVolumeAdministered) {
      this.totalVolumeAdministeredInput = this.totalVolumeAdministered;
      this.amountDeliveredLastValidation = this.totalVolumeAdministered - this.coreContinuousinfusion.totaladministeredvolume;
      this.validatingVolume = this.amountDeliveredLastValidation;
    } else {
      var comparedate = this.appService.sessionStopDateTime;
      if (this.isLastDayOfInfusion) {
        comparedate = new Date();
      }
      var startDate = moment(comparedate, "DD.MM.YYYY HH:mm");//Date format
      var endDate = moment(this.completionTime, "DD.MM.YYYY HH:mm");
      var isAfter = moment(startDate).isAfter(endDate);
      if (!isAfter) {
        let diffHours = moment(this.timepicker).diff(this.latestEvent.datetime, "hours", true);
        this.totalVolumeAdministeredInput = (diffHours * this.coreContinuousinfusion.flowrate) + this.coreContinuousinfusion.totaladministeredvolume;
        this.amountDeliveredLastValidation = this.totalVolumeAdministeredInput - this.coreContinuousinfusion.totaladministeredvolume;
      }
      this.validatingVolume = this.amountDeliveredLastValidation;
    }
    this.calculateAdministeredvolume();
    this.calculateSummary(this.latestEvent.datetime, this.timepicker, this.administeredvolume);

  }
  setAmoutDeliveredLastValidationOnChangeVolumeAdministered() {
    if (this.coreContinuousinfusion.totaladministeredvolume == 0 && this.totalVolumeAdministeredInput == 0) {
      this.amountDeliveredLastValidation = this.totalVolumeAdministeredInput - this.coreContinuousinfusion.totaladministeredvolume;
    } else {
      this.amountDeliveredLastValidation = this.totalVolumeAdministeredInput - this.coreContinuousinfusion.totaladministeredvolume;
    }
    this.validatingVolume = this.amountDeliveredLastValidation;
    this.amountDeliveredLastValidation = this.totalVolumeAdministeredInput - this.coreContinuousinfusion.totaladministeredvolume;
    this.validatingVolume = this.amountDeliveredLastValidation;
    this.calculateAdministeredvolume();
    this.calculateSummary(this.latestEvent.datetime, this.timepicker, this.administeredvolume);

  }

  saveComplete() {
    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    let completeEventid = uuidv4();
    this.coreContinuousinfusion.eventcorrelationid = completeEventid;
    this.coreContinuousinfusion.finishdatetime = this.appService.getDateTimeinISOFormat(this.timepicker);
    let eventDate = new Date(moment(this.filterevent[0].datetime, moment.ISO_8601).toString());
    let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
    this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
    this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
    this.upsertManager.save((res) => {
      this.subjects.drawChart.next();
      this.reFreshMenu.emit("refresh");
      this.subjects.continuousInfusionMessage.next();
    },
      (error) => {

      }
    );
  }

  getCompletionTime() {
    if (!this.latestEvent) {
      if (this.filterevent.length > 0) {
        let lastValidatedTime = moment(this.filterevent[0].datetime);
        let hours = this.coreContinuousinfusion.totalremainingvolume / this.coreContinuousinfusion.flowrate;
        this.completionTime = lastValidatedTime.add(hours, "hour").toDate();
        this.completionTime.setMinutes(this.appService.IsNearestMinutePlus15(moment(this.completionTime).get("minutes")));
        // this.setTimePickerBasedOnCompletion();
      }
      return;
    }
    let lastValidatedTime = moment(this.latestEvent.datetime);
    let hours = this.coreContinuousinfusion.totalremainingvolume / this.coreContinuousinfusion.flowrate;
    this.completionTime = lastValidatedTime.add(hours, "hour").toDate();
    this.completionTime.setMinutes(this.appService.IsNearestMinutePlus15(moment(this.completionTime).get("minutes")));
    // this.setTimePickerBasedOnCompletion();

  }

  getValidationTime() {
    if (moment(this.appService.sessionStartDateTime).format("MMDDYYYY:HH") > moment(this.timepicker).format("MMDDYYYY:HH")) {
      this.minTime = this.appService.sessionStartDateTime;
    }
    else {
      this.minTime = new Date(moment(this.latestEvent.datetime, moment.ISO_8601).toString());
      if (!this.changeFlowRate) {
        this.minTime.setMinutes(this.minTime.getMinutes() + 15);
      }
    }
    this.getMaxdate();
    if (moment(this.appService.sessionStartDateTime).isBefore(moment())) {
      this.timepicker = new Date(moment(this.appService.sessionStartDateTime, moment.ISO_8601).toString());
      this.timepicker.setHours(this.maxTime.getHours())
      this.timepicker.setMinutes(this.maxTime.getMinutes())
      if (this.selectedTimeslot) {
        var date = moment(this.selectedTimeslot)
        if (date.isValid()) {
          this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
        }
      }
    }
    else {
      this.timepicker = new Date(moment(this.maxTime, moment.ISO_8601).toString());
      if (this.selectedTimeslot) {
        var date = moment(this.selectedTimeslot)
        if (date.isValid()) {
          this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
        }

      }
    }
    this.setTimePickerBasedOnCompletion();
    this.setAmoutDeliveredLastValidation();
    this.calculateAdministeredvolume();
    // this.isValid(null);
  }
  setTimePickerBasedOnCompletion() {
    var comparedate = this.appService.sessionStopDateTime;
    if (this.isLastDayOfInfusion) {
      comparedate = new Date();
    }
    var startDate = moment(comparedate, "DD.MM.YYYY HH:mm");//Date format
    var endDate = moment(this.completionTime, "DD.MM.YYYY HH:mm");
    var isAfter = moment(startDate).isAfter(endDate);
    if (isAfter) {
      this.timepicker = new Date(moment(this.completionTime).toDate().setHours(moment(this.completionTime).get("hours"), moment(this.completionTime).get("minutes"), 0, 0));
    }
    else {
      this.isValid(false);
      this.hasAllVolumeAdministered = false;
      this.setAmoutDeliveredLastValidation();
    }
  }

  isValid(event: boolean): void {
    //this.maxTime.setMinutes(this.appService.IsNearestMinutePlus15(moment(new Date()).get("minutes")));
    this.getMaxdate();
    this.invalideDateMessage = "";
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
    this.actualvolume = 0;
    this.administeredvolume = 0;
    this.summaryDetails = [];
    if (typeof this.latestEvent !== 'undefined') {

      if (moment(this.timepicker).format("MMDDYYYY:HH:mm") == moment(this.latestEvent.datetime).format("MMDDYYYY:HH:mm") && !this.changeFlowRate) {
        if (this.latestEvent.eventtype == "start")
          this.invalideDateMessage = "Completion time cannot be before start time";
        if (this.latestEvent.eventtype == "restart")
          this.invalideDateMessage = "Completion time cannot be before restart time";
        if (this.latestEvent.eventtype == "validation")
          this.invalideDateMessage = "Completion time cannot be before last validation time";
      }

      else if (this.timepicker < this.minTime) {

        if (this.latestEvent.eventtype == "start")
          this.invalideDateMessage = "Completion time cannot be before start time";
        if (this.latestEvent.eventtype == "restart")
          this.invalideDateMessage = "Completion time cannot be before restart time";
        if (this.latestEvent.eventtype == "validation")
          this.invalideDateMessage = "Completion time cannot be before last validation time";
      }

      else if (this.timepicker > this.maxTime) {
        this.invalideDateMessage = "It is not possible to enter a completion time in future"
      }
      else {
        this.setAmoutDeliveredLastValidation();
        this.calculateAdministeredvolume();
        this.calculateSummary(this.latestEvent.datetime, this.timepicker, this.administeredvolume);

      }
      var startDate = moment(new Date(moment(this.latestEvent.datetime, moment.ISO_8601).toString()), "DD.MM.YYYY HH:mm");
      var endDate = moment(this.timepicker, "DD.MM.YYYY HH:mm");
      var isAfter = moment(startDate).isAfter(endDate);
      //var isSame= moment(startDate).isSame(endDate);
      if (isAfter) {
        this.isValidTimePicker = true;
      } else {
        this.isValidTimePicker = false;
      }
    }

  }

  validatesummeryClick() {
    if (this.invalideDateMessage == "") {
      this.calculateSummary(this.latestEvent.datetime, this.timepicker, this.administeredvolume);
    }
  }

  calculateSummary(validatefrom: Date, validateTo: Date, volume: number) {
    this.summaryDetails = [];
    this.validatingVolume = 0;
    if (typeof validatefrom == 'undefined' || typeof validateTo == 'undefined' || volume <= 0) {
      return;
    }
    //validatefrom = new Date(moment(validatefrom).years(), moment(validatefrom).months(), moment(validatefrom).dates(),moment(validatefrom).hours(),moment(validatefrom).minutes());
    //validateTo =  new Date(moment(validateTo).years(), moment(validateTo).months(), moment(validateTo).dates(),moment(validateTo).hours(),moment(validateTo).minutes());
    let temptime = new Date(moment(validatefrom, moment.ISO_8601).toString());
    let totalslots = 0;
    let hourlySlot = 0;
    let alltimeslot: Array<any | any> = [];
    let loopcurrenthour: Date = new Date(moment(temptime, moment.ISO_8601).toString());
    var starttime = new Date(moment(temptime, moment.ISO_8601).toString());

    loopcurrenthour.setMinutes(0);

    while (temptime < validateTo) {

      temptime.setMinutes(temptime.getMinutes() + 15);
      totalslots = totalslots + 1;
      hourlySlot = hourlySlot + 1;
      if (moment(temptime).format("MMDDYYYY:HH") > moment(loopcurrenthour).format("MMDDYYYY:HH")) {
        let adddate = new Date(moment(temptime, moment.ISO_8601).toString());
        this.summaryDetails.push({ starttime, adddate, hourlySlot });
        starttime = adddate;
        hourlySlot = 0;
        loopcurrenthour.setHours(loopcurrenthour.getHours() + 1);

      }
    }
    if (hourlySlot > 0) {
      let adddate = new Date(moment(temptime, moment.ISO_8601).toString());
      this.summaryDetails.push({ starttime, adddate, hourlySlot });
    }


    this.slotVolume = (volume / totalslots);
    let sumOfSlot = 0;
    // summery  header
    this.totaltimeCalculated = this.Dateformating(totalslots);
    this.validatingVolume = volume;
    this.validatingflowrate = Math.floor(this.slotVolume * 4);
    //

    for (var index in this.summaryDetails) {
      sumOfSlot = sumOfSlot + Math.floor(this.summaryDetails[index].hourlySlot * this.slotVolume);
      this.summaryDetails[index].hourlySlot = Math.floor(this.summaryDetails[index].hourlySlot * this.slotVolume);
    }


    let diffrence = this.administeredvolume - sumOfSlot;
    if (this.summaryDetails.length != 0) {

      this.summaryDetails[this.summaryDetails.length - 1].hourlySlot = this.summaryDetails[this.summaryDetails.length - 1].hourlySlot + diffrence
    }
    this.showvalidationtable = (this.showvalidationtable == true) ? false : true; //toggel effect
    this.showvalidationtable = true;
  }

  Dateformating(mins: number) {
    mins = mins * 15;
    // getting the hours. 
    let hrs = Math.floor(mins / 60);
    // getting the minutes. 
    let min = mins % 60;
    // formatting the hours. 
    hrs = hrs < 10 ? 0 + hrs : hrs;
    // formatting the minutes. 
    min = min < 10 ? 0 + min : min;
    // returning them as a string. 
    return hrs + ' Hours and ' + min + " Minutes";
  }
  calculateAdministeredvolume() {
    this.changedvolume = 0;
    this.administeredvolume = this.amountDeliveredLastValidation;
    //this.actualvolume = slots * (this.coreContinuousinfusion.flowrate / 4);


    // this.infusionComplete = false;
    // if (this.latestEvent) {
    //   let validateDate = new Date(moment(this.latestEvent.datetime, moment.ISO_8601).toString());
    //   let diffMs = this.timepicker.valueOf() - validateDate.valueOf(); // milliseconds between now & Christmas

    //   var diffMins = Math.floor((diffMs / 60000));
    //   let slots = diffMins / 15;
    //   if (this.updatethecalculatedvolume == false) {
    //     this.changedvolume = 0;
    //     this.administeredvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
    //     this.actualvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
    //     if (this.administeredvolume > this.coreContinuousinfusion.totalremainingvolume) {
    //       this.administeredvolume = this.coreContinuousinfusion.totalremainingvolume;
    //       this.actualvolume = this.coreContinuousinfusion.totalremainingvolume;

    //     }

    //   }
    //   else {
    //     this.administeredvolume = this.changedvolume;
    //     // this.actualvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
    //     if (this.administeredvolume > this.coreContinuousinfusion.totalremainingvolume) {
    //       this.administeredvolume = this.coreContinuousinfusion.totalremainingvolume;
    //       this.changedvolume = this.coreContinuousinfusion.totalremainingvolume;
    //       this.actualvolume = this.coreContinuousinfusion.totalremainingvolume;

    //     }



    //   }
    //   if (this.actualvolume < 0) {
    //     this.actualvolume = 0;
    //   }
    //   this.infusionComplete = this.administeredvolume == this.coreContinuousinfusion.totalremainingvolume ? true : false;

    //}
  }
  createObjectFbIntakeOutput(validationid, eventid: any, iotype: any, routetype: any, routeId: any, volumn: number, datetime: any) {

    let sessionDate = new Date(moment(datetime, moment.ISO_8601).toString());

    let StartHour = this.appService.sessionStartDateTime.getHours();
    let selectedHour = sessionDate.getHours();
    if (StartHour >= selectedHour) {

      sessionDate.setDate(sessionDate.getDate() - 1);
    }
    if (StartHour == selectedHour && sessionDate.getMinutes() > 0) {
      sessionDate.setDate(sessionDate.getDate() + 1);
    }


    this.FbIntakeOutput = new Fluidbalanceintakeoutput(
      uuidv4(),
      this.coreContinuousinfusion.fluidbalancesessionroute_id,

      routeId,
      routetype,
      0,
      volumn,
      this.coreContinuousinfusion.flowrateunit,
      datetime,
      "",
      this.appService.MetaIOType.filter(x => x.iotype == iotype)[0].fluidbalanceiotype_id,
      false,
      "", "", false,
      0,// "person weight need to add",
      this.appService.personId,
      this.appService.loggedInUserName, this.appService.loggedInUserName,
      eventid,
      validationid, true,
      this.appService.FluidBalanceEncounterSessions.find(x => moment(x.startdate).format("MMDDYYYY") === moment(sessionDate).format("MMDDYYYY")).fluidbalancesession_id,
      this.coreContinuousinfusion.continuousinfusion_id
    )

  }
  saveValidateClick() {
    this.validatesummeryClick();
    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    if (this.coreContinuousinfusion.totalremainingvolume - this.administeredvolume < 0) {

    }
    else {
      // this.newFlowRateerror = "";
      // if (this.changeFlowRate) {

      //   if (this.newFlowRateVolume < 1) {
      //     this.newFlowRateerror = "Invalide Flow Rate"
      //     return;
      //   }

      // }
      if (this.summaryDetails.length >= 0) {

        this.showspinner = true;
        // this.saveValidationEvent();
        /// Get FluidLoss


        let validationEventid = uuidv4();
        let validationtEvent = this.continuousInfusionEvents(validationEventid, "validation", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
        this.coreContinuousinfusion.eventcorrelationid = validationEventid;
        this.coreContinuousinfusion.ispaused = false
        this.coreContinuousinfusion.totaladministeredvolume = this.coreContinuousinfusion.totaladministeredvolume + this.administeredvolume;
        this.coreContinuousinfusion.totalremainingvolume = this.coreContinuousinfusion.totalvolume - (this.coreContinuousinfusion.totaladministeredvolume + this.totalfluidLoss);
        this.coreContinuousinfusion.eventcorrelationid = validationEventid;

        this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
        this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(validationtEvent)));
        ////////////////////validation single record  update /////////////////////////////////////////////////////////////////


        let coreContinuousinfusionvalidation = new CoreContinuousinfusionvalidation();
        coreContinuousinfusionvalidation.continuousinfusionvalidation_id = uuidv4();
        coreContinuousinfusionvalidation.datetime = this.appService.getDateTimeinISOFormat(this.timepicker)
        coreContinuousinfusionvalidation.checkedline = this.checktheline;
        coreContinuousinfusionvalidation.pumpnumber = this.coreContinuousinfusion.pumpnumber;
        coreContinuousinfusionvalidation.flowrate = this.coreContinuousinfusion.flowrate;
        coreContinuousinfusionvalidation.continuousinfusion_id = this.coreContinuousinfusion.continuousinfusion_id
        coreContinuousinfusionvalidation.eventcorrelationid = validationEventid;
        coreContinuousinfusionvalidation.addedby = "addedby";
        coreContinuousinfusionvalidation.modifiedby = "modifiedby";

        coreContinuousinfusionvalidation.calculatedvolume = this.actualvolume;
        coreContinuousinfusionvalidation.administeredvolume = this.administeredvolume;
        this.upsertManager.addEntity('core', 'continuousinfusionvalidation', JSON.parse(JSON.stringify(coreContinuousinfusionvalidation)));

        //////////////////////////// multiple input for all selected hours ///////////////////////////////////////////////////
        let arrayFluidbalanceintakeoutput: Fluidbalanceintakeoutput[] = [];

        for (var index in this.summaryDetails) {

          this.createObjectFbIntakeOutput(coreContinuousinfusionvalidation.continuousinfusionvalidation_id, validationEventid, "CI", this.coreContinuousinfusion.routetype_id, this.coreContinuousinfusion.route_id,
            this.summaryDetails[index].hourlySlot, this.appService.getDateTimeinISOFormat(this.summaryDetails[index].adddate));
          this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(this.FbIntakeOutput)));

        }
      }
      ////////////////////////////////////////////////////////////
      // if (this.changeFlowRate) {
      //   let changeFlowtEventid = uuidv4();
      //   let changeFlowtEvent = this.continuousInfusionEvents(changeFlowtEventid, "flowrate", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
      //   this.coreContinuousinfusion.eventcorrelationid = changeFlowtEventid;
      //   this.coreContinuousinfusion.flowrate = this.newFlowRateVolume;

      //   this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      //   this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(changeFlowtEvent)));

      // }
      ///////////////////////////////////////////////////////////////////////////
      // if (this.completInfusionenow) {

      //   let completeEventid = uuidv4();
      //   let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);

      //   this.coreContinuousinfusion.islineremovedoncompletion = this.isLineremoved;
      //   this.coreContinuousinfusion.finishdatetime = this.appService.getDateTimeinISOFormat(this.timepicker)
      //   this.coreContinuousinfusion.eventcorrelationid = completeEventid;

      //   this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      //   this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
      // }
      ////////////////////save///////////////////////////////////////////////
      this.upsertManager.save((res) => {
        this.saveComplete();
        //this.subjects.drawChart.next();
        //this.reFreshMenu.emit("refresh");
      },
        (error) => {
          // this.validationErrors=error;
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
    coreContinuousinfusionevent.addedby = this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby = this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
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


}
