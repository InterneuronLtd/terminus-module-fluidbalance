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
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CoreContinuousinfusion, CoreContinuousinfusionevent, CoreContinuousinfusionfluidloss, CoreContinuousinfusionvalidation } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Fluidbalanceintakeoutput } from 'src/app/models/fluidbalance.model';
import { UpsertTransactionManager } from '@interneuroncic/interneuron-ngx-core-lib';
import { datepickerAnimation } from 'ngx-bootstrap/datepicker/datepicker-animations';


@Component({
  selector: 'app-validate-infusion',
  templateUrl: './validate-infusion.component.html',
  styleUrls: ['./validate-infusion.component.css'],
  providers: [UpsertTransactionManager]
})
export class ValidateInfusionComponent implements OnInit, OnDestroy {
  completInfusionenow: boolean = false;

  isLineremoved: boolean = false;
  checktheline: boolean = false;
  infusionComplete: boolean = false;
  routename: string = "";
  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Input() changeFlowRate: boolean = true;
  @Input() selectedTimeslot: Date;

  newFlowRateVolume: number = 0;
  newFlowRateerror: string = "";

  FbIntakeOutput: Fluidbalanceintakeoutput

  @Output() reFreshMenu = new EventEmitter();

  subscriptions: Subscription = new Subscription();

  allevent: CoreContinuousinfusionevent[] = [];
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

  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {



  }
  ngOnDestroy(): void {
    this.upsertManager.destroy();
    this.subscriptions.unsubscribe();
  }


  ngOnInit(): void {
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
      }));
    this.getMaxdate();
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
      (response) => {

        this.allevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation'
          && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0
        );
        if (this.allevent.length > 0) {
          this.latestEvent = new CoreContinuousinfusionevent();
          this.latestEvent.continuousinfusion_id = this.allevent[0].continuousinfusion_id;
          this.latestEvent.continuousinfusionevent_id = this.allevent[0].continuousinfusionevent_id;
          this.latestEvent.datetime = this.allevent[0].datetime;
          this.latestEvent.eventcorrelationid = this.allevent[0].eventcorrelationid;
          this.latestEvent.eventtype = this.allevent[0].eventtype;
          this.latestEvent.addedby = this.allevent[0].addedby;
          this.latestEvent.modifiedby = this.allevent[0].modifiedby;
          this.getdates();
        }

      }));
    this.routename = this.appService.MetaRoutes.find(x => x.route_id == this.coreContinuousinfusion.route_id).route.toUpperCase() + "(" + this.coreContinuousinfusion.totalvolume.toString() + ")";

  }
  GetCompletionTime() {

    if (!this.latestEvent) {
      return;
    }
    let lastValidatedTime = moment(this.latestEvent.datetime);
    let hours = this.coreContinuousinfusion.totalremainingvolume / this.coreContinuousinfusion.flowrate;
    let completionTime = lastValidatedTime.add(hours, "hour").toDate();
    if (moment(completionTime) < moment(this.timepicker)) {
      this.timeexcitedMessage = "The selected time is after the expected completion time for this infusion. Please check";
    }
    else {
      this.timeexcitedMessage = ""
    }

  }
  changevolumeChecked() {
    this.changedvolume = 0;
    this.calculateAdministeredvolume();
    this.showvalidationtable = false;
  }

  volumeChange() {

    //  this.showvalidationtable = false;
    this.infusionComplete = false;
    this.calculateAdministeredvolume();
    this.validatesummeryClick();
  }
  getdates() {

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

    this.calculateAdministeredvolume();
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
          this.invalideDateMessage = "Validation entry cannot be  recorded at Start time";
        if (this.latestEvent.eventtype == "restart")
          this.invalideDateMessage = "Validation entry cannot be recorded at Restart time";
        if (this.latestEvent.eventtype == "validation")
          this.invalideDateMessage = "A validation entry has already been recorded for this time";
      }

      else if (this.timepicker < this.minTime) {

        if (this.latestEvent.eventtype == "start")
          this.invalideDateMessage = "Validation entry cannot be  recorded before Start time";
        if (this.latestEvent.eventtype == "restart")
          this.invalideDateMessage = "Validation entry cannot be recorded before Restart time";
        if (this.latestEvent.eventtype == "validation")
          this.invalideDateMessage = "A validation entry has already been recorded for this time";
      }

      else if (this.timepicker > this.maxTime) {
        this.invalideDateMessage = "It is not possible to enter observations for future dates and times  "
      }
      else {
        this.calculateAdministeredvolume();
        this.calculateSummary(this.latestEvent.datetime, this.timepicker, this.administeredvolume);

      }

    }
    this.GetCompletionTime();
    if (moment(this.timepicker).format("MMDDYYYY:HH:mm") == moment(this.minTime).format("MMDDYYYY:HH:mm") && this.changeFlowRate) {
      this.sameTimechangeFlowRateOnly = true;
    }
    else {
      this.sameTimechangeFlowRateOnly = false;
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

    this.infusionComplete = false;
    if (this.latestEvent) {
      let validateDate = new Date(moment(this.latestEvent.datetime, moment.ISO_8601).toString());
      let diffMs = this.timepicker.valueOf() - validateDate.valueOf(); // milliseconds between now & Christmas

      var diffMins = Math.floor((diffMs / 60000));
      let slots = diffMins / 15;
      if (this.updatethecalculatedvolume == false) {
        this.changedvolume = 0;
        this.administeredvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
        this.actualvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
        if (this.administeredvolume > this.coreContinuousinfusion.totalremainingvolume) {
          this.administeredvolume = this.coreContinuousinfusion.totalremainingvolume;
          this.actualvolume = this.coreContinuousinfusion.totalremainingvolume;

        }

      }
      else {
        this.administeredvolume = this.changedvolume;
        // this.actualvolume = slots * (this.coreContinuousinfusion.flowrate / 4);
        if (this.administeredvolume > this.coreContinuousinfusion.totalremainingvolume) {
          this.administeredvolume = this.coreContinuousinfusion.totalremainingvolume;
          this.changedvolume = this.coreContinuousinfusion.totalremainingvolume;
          this.actualvolume = this.coreContinuousinfusion.totalremainingvolume;

        }



      }
      if (this.actualvolume < 0) {
        this.actualvolume = 0;
      }
      this.infusionComplete = this.administeredvolume == this.coreContinuousinfusion.totalremainingvolume ? true : false;

    }
  }



  saveValidateClick() {
    this.validatesummeryClick();
    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    if (this.coreContinuousinfusion.totalremainingvolume - this.administeredvolume < 0) {

    }
    else {
      this.newFlowRateerror = "";
      if (this.changeFlowRate) {

        if (this.newFlowRateVolume < 1) {
          this.newFlowRateerror = "Invalide Flow Rate"
          return;
        }

      }
      if (this.summaryDetails.length > 0) {

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
      if (this.changeFlowRate) {
        let changeFlowtEventid = uuidv4();
        let changeFlowtEvent = this.continuousInfusionEvents(changeFlowtEventid, "flowrate", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
        this.coreContinuousinfusion.eventcorrelationid = changeFlowtEventid;
        this.coreContinuousinfusion.flowrate = this.newFlowRateVolume;

        this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
        this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(changeFlowtEvent)));

      }
      ///////////////////////////////////////////////////////////////////////////
      if (this.completInfusionenow) {

        let completeEventid = uuidv4();
        let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);

        this.coreContinuousinfusion.islineremovedoncompletion = this.isLineremoved;
        this.coreContinuousinfusion.finishdatetime = this.appService.getDateTimeinISOFormat(this.timepicker)
        this.coreContinuousinfusion.eventcorrelationid = completeEventid;

        this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
        this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
      }
      ////////////////////save///////////////////////////////////////////////
      this.upsertManager.save((res) => {

        this.subjects.drawChart.next();
        this.reFreshMenu.emit("refresh");
        this.subjects.continuousInfusionMessage.next();
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


}



