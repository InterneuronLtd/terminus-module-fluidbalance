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


import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Encounter } from '../models/encounter.model';
import { Subscription } from 'rxjs';
import jwt_decode from "jwt-decode";
import { action } from '../models/Filter.model';
import { ConfigModel } from '../models/config.model';
import * as moment from 'moment';
import { Route, Routetype, Routetypefluidcapturedevice, Fluidcapturedevice, Expectedurineoutput, Fluidbalanceiotype, Fluidbalancesession, Fluidbalancesessionroute, Fluidbalanceintakeoutput, Continuousinfusion, FluidBalancePersonStatus, RouteConfig, Continuousinfusionevent } from '../models/fluidbalance.model';
import { Observationscaletype, PersonObservationScale } from '../models/observations.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  reset(): void {
    this.selectedTimeSlot = null;
    this.personId = null;
    this.encounter = null;
    this.isCurrentEncouner = null;
    this.apiService = null;
    this.baseURI = null;
    this.appConfig = new ConfigModel();
    this.loggedInUserName = null;
    this.enableLogging = true;
    this.roleActions = [];

    this.isInitComplete = null;
    this.personDOB = null;
    this.personAgeAtAdmission = null;
    this.personCurrentAge = null;
    this.urineCatheterFlowrate = 0;
    this.personscale = null;
    this.currentEWSScale = null;
    this.obsScales = [];


    this.MetaRoutes = [];
    this.MetaRouteTypes = [];
    this.MetaRouteConfig = [];
    this.MetaFluidCaptureDevices = [];
    this.MetaRouteTypeFluidCaptureDevices = [];
    this.MetaExpectedurineoutput = [];
    this.MetaIOType = [];



    this.FluidBalanceStatus = undefined;
    this.FluidBalanceEncounterSessions = undefined;

    this.resetFluidBalanceDaySession();

    //chart

    this.sessionStartDateTime = null;
    this.sessionStopDateTime = null;

    this.currentChartDate = null;

    this.expectedUrineOutputVolumePerKg = null;

    //display Toggles
    this.showSingleIntakeForm = false;
    this.showSingleOutputForm = false;
    this.showTimeSlotWindow = false;
    this.showSingleVolumeIntakeHistory = false;
    this.showSingleVolumeOutputHistory = false;
    this.showSBAREscalationForm = false;
    this.showUrineOutputHistory = false;

    this.isWeightCaptured = false;
  }

  resetFluidBalanceDaySession(){
    this.FluidBalanceSession = undefined;
    this.FluidBalanceSessionRoutes = undefined;
    this.FluidBalanceIntakeOutput = undefined;
    this.FluidBalanceSessionContinuousInfusions = undefined;
    this.FluidBalanceSessionContinuousInfusionsEvents = undefined;
  }



  public selectedTimeSlot: any;
  public personId: string;
  public encounter: Encounter;
  public isCurrentEncouner = false;
  public apiService: any;
  public baseURI: string;
  public appConfig = new ConfigModel();
  public loggedInUserName: string = null;
  public enableLogging = true;
  public roleActions: action[] = [];

  public isInitComplete: boolean = false;
  public personDOB: Date;
  public personAgeAtAdmission: number;
  public personCurrentAge: number;
  public urineCatheterFlowrate: number = 0;
  public personscale: PersonObservationScale = null;
  public currentEWSScale: string;
  public obsScales: Array<Observationscaletype> = [];

  public MetaRoutes: Array<Route>;
  public MetaRouteTypes: Array<Routetype>;
  public MetaRouteConfig: Array<RouteConfig>
  public MetaFluidCaptureDevices: Array<Fluidcapturedevice>;
  public MetaRouteTypeFluidCaptureDevices: Array<Routetypefluidcapturedevice>;
  public MetaExpectedurineoutput: Array<Expectedurineoutput>;
  public MetaIOType: Array<Fluidbalanceiotype>;



  public FluidBalanceStatus: FluidBalancePersonStatus;
  public FluidBalanceSession: Fluidbalancesession;
  public FluidBalanceSessionRoutes: Array<Fluidbalancesessionroute>;
  public FluidBalanceIntakeOutput: Array<Fluidbalanceintakeoutput>;
  public FluidBalanceSessionContinuousInfusions: Array<Continuousinfusion>;
  public FluidBalanceSessionContinuousInfusionsEvents: Array<Continuousinfusionevent>;
  public FluidBalanceEncounterSessions: Array<Fluidbalancesession>;


  //chart

  public sessionStartDateTime: Date;
  public sessionStopDateTime: Date;

  public currentChartDate: Date;

  public expectedUrineOutputVolumePerKg: number;

  //display Toggles
  public showSingleIntakeForm = false;
  public showSingleOutputForm = false;
  public showTimeSlotWindow = false;
  public showSingleVolumeIntakeHistory = false;
  public showSingleVolumeOutputHistory = false;
  public showSBAREscalationForm = false;
  public showUrineOutputHistory = false;

  public isWeightCaptured: boolean = false;

  constructor() {
  }



  decodeAccessToken(token: string): any {
    try {
      return jwt_decode(token);
    }
    catch (Error) {
      return null;
    }
  }

  logToConsole(msg: any) {
    if (this.enableLogging) {
      console.log(msg);
    }
  }

  setPatientAgeAtAdmission() {
    this.personAgeAtAdmission = moment(this.encounter.admitdatetime, moment.ISO_8601).diff(moment(this.personDOB, moment.ISO_8601), "years");
  }
  getPatientCurrentAge() {
    this.personCurrentAge = moment(new Date(), moment.ISO_8601).diff(moment(this.personDOB, moment.ISO_8601), "years");
    return this.personCurrentAge;
  }

  public AuthoriseAction(action: string): boolean {
    return this.roleActions.filter(x => x.actionname.toLowerCase().trim() == action.toLowerCase()).length > 0;
  }

  setCurrentScale() {
    let scale = "";
    if (this.personAgeAtAdmission < 19) {
      if (this.personAgeAtAdmission <= 0)
        scale = "PEWS-0To11Mo";
      else if (this.personAgeAtAdmission >= 1 && this.personAgeAtAdmission <= 4)
        scale = "PEWS-1To4Yrs";
      else if (this.personAgeAtAdmission >= 5 && this.personAgeAtAdmission <= 12)
        scale = "PEWS-5To12Yrs";
      else if (this.personAgeAtAdmission >= 13 && this.personAgeAtAdmission <= 18)
        scale = "PEWS-13To18Yrs";

    } else
      if (this.personscale) {

        scale = this.obsScales.filter(x => x.observationscaletype_id == this.personscale.observationscaletype_id)[0].scaletypename;
      }
      else {
        scale = "NEWS2-Scale1";
      }
    this.currentEWSScale = scale;
    return scale;

  }

  formatUTCDate(d: string): string {

    var date = new Date(moment(d, moment.ISO_8601).toString());
    var hours = date.getHours();
    var minutes = date.getMinutes();

    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dt = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();


    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (dt < 10 ? "0" + dt : dt) + "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + ".000Z");
    return returndate;
  }

  public getDateTimeinISOFormat(date: Date): string {

    var time = date;
    var hours = time.getHours();
    var s = time.getSeconds();
    var m = time.getMilliseconds()
    var minutes = time.getMinutes();
    date.setHours(hours);
    date.setMinutes(minutes);
    //date.setSeconds(s);
    //date.setMilliseconds(m);
    //this.appService.logToConsole(date);
    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dt = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();
    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (dt < 10 ? "0" + dt : dt) + "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));
    //this.appService.logToConsole(returndate);
    return returndate;
  }

  expectedHourlyUrineOutput(age: number, weight: number): number {
    if (age > 100 || age < 0)
      return 0;
    var expectedUrine = this.MetaExpectedurineoutput.find(x => x.agefrom <= age && x.ageto >= age);
    if (expectedUrine == null)
      return 0;
    return expectedUrine.volume * weight;
  }
  expectedHourlyUrineOutputRetro() {
    var ioType = this.MetaIOType.find(x => x.iotype = "SO").fluidbalanceiotype_id;
    var weight = 0;
    var age = this.FluidBalanceSession.initialage;
    var urine_route_id = this.MetaRoutes.find(x => x.route == "Urine").route_id;
    var data = this.FluidBalanceIntakeOutput.
      filter(x => x.fluidbalanceiotype_id == ioType && x.route_id == urine_route_id).sort((a, b) => { return ((a.datetime as Date) > (b.datetime as Date)) ? 0 : -1; }).reverse()
    if (data.length > 0) {
      weight = data[0].personweight;
    } else {
      weight = this.FluidBalanceSession.initialweight;
    }
    return this.expectedHourlyUrineOutput(age, weight);
  }
  getExpectedUrineOutputVolumePerKg(age: number): number {
    if (age > 100 || age < 0) {
      this.expectedUrineOutputVolumePerKg = 0;
    }
    else {
      var expectedUrineVolume = this.MetaExpectedurineoutput.find(x => age >= x.agefrom && age <= x.ageto);
      if (expectedUrineVolume) {
        this.expectedUrineOutputVolumePerKg = expectedUrineVolume.volume;
      }
    }
    return this.expectedUrineOutputVolumePerKg;
  }
  getUrineCatheterFlowrate(): number {
    var route_id = this.MetaRoutes.find(x => x.route == "Bladder Irrigation").route_id;
    var data = this.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesession_id === this.FluidBalanceSession.fluidbalancesession_id && x.route_id === route_id && x.totalremainingvolume !== 0);
    //this.appService.logToConsole("flow rate");
   // this.appService.logToConsole(data);
    let flowrate = 0;
    if (data) {
      flowrate = data.reduce((a, b) => { return a + b.flowrate }, 0);
    }
    return flowrate

  }

  getUrineCatheterFlowrateTotal(prevTime: Date, currentTime: Date) {
    var route_id = this.MetaRoutes.find(x => x.route == "Bladder Irrigation").route_id;
    var data = this.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesession_id === this.FluidBalanceSession.fluidbalancesession_id && x.route_id === route_id && (moment(x.startdatetime).format("MMDDYYYY:HH") < moment(currentTime).format("MMDDYYYY:HH") && (!x.finishdatetime || x.finishdatetime > prevTime)));
    var startTime;
    var finishTime;
    //this.appService.logToConsole("getUrineCatheterFlowrateTotal");
    //this.appService.logToConsole(data);
    let flowrate_total = 0;
    let arr = data.map((e) => {
      let stopdatetime = null;
      if (e.ispaused) {
        stopdatetime = this.FluidBalanceSessionContinuousInfusionsEvents.filter(x => x.continuousinfusion_id === e.continuousinfusion_id && x.eventtype.toLowerCase() === "paused").sort((a, b) => { return ((a.datetime as Date) > (b.datetime as Date)) ? 0 : -1; }).reverse()[0].datetime;
      }
      else {
        stopdatetime = e.finishdatetime ? e.finishdatetime : currentTime;
      }

      const start = moment.max([moment(e.startdatetime), moment(prevTime)]);
      const stop = moment.max([moment(stopdatetime), moment(currentTime)]);

      const steps = stop.diff(start, "hour", true);
      const totalfr = steps * e.flowrate;
      return { "start": start, "stop": stop, "fr": e.flowrate, "tft": totalfr }
    });

    flowrate_total = arr.reduce((a, b) => { return a + b.tft }, 0)
    let flowrate = arr.reduce((a, b) => { return a + b.fr }, 0)


    return { "frt": flowrate_total, "fr": flowrate }

  }

  IsCurrentEncounter() {
    return this.isCurrentEncouner;
  }

  IsCurrentDaySession() {
    return moment().isBetween(moment(this.sessionStartDateTime), moment(this.sessionStopDateTime), undefined, "[)");
  }

  IsMonitoringActive() {

    return this.FluidBalanceStatus && this.FluidBalanceStatus.isactive;

  }

  IsNearestMinute(mintues: number) {
    var vDevide = mintues / 15;
    if (vDevide % 1 == 0) {
      return mintues;
    } else {
      return (Math.floor(vDevide) * 15);
    }
  }
  IsNearestMinutePlus15(mintues: number) {
    var vDevide = mintues / 15;
    if (vDevide % 1 == 0) {
      return mintues;
    } else {
      return (Math.floor(vDevide) * 15) +15;
    }
  }

}


