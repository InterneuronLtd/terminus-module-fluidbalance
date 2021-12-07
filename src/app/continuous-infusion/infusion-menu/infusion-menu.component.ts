//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2021  Interneuron CIC

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
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { CoreContinuousinfusion, CoreContinuousinfusionfluidloss, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';

import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import * as moment from 'moment';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from 'src/app/models/Filter.model';
import { HOUR } from 'ngx-bootstrap/chronos/units/constants';
import { Fluidbalancesession } from 'src/app/models/fluidbalance.model';

@Component({
  selector: 'app-infusion-menu',
  templateUrl: './infusion-menu.component.html',
  styleUrls: ['./infusion-menu.component.css'],
  providers: [UpsertTransactionManager]
})

export class InfusionMenuComponent implements OnInit, OnDestroy {

  @Input() continuousinfusion_id: string;
  @Input() timeslot: Date;

  coreContinuousinfusion: CoreContinuousinfusion;

  subscriptions: Subscription = new Subscription();

  routename: string = "";

  continuousinfusionHistory: any;

  ShowMenu: boolean = false;

  resionForPause: string = "";

  totalfluidLoss: number = 0;
  completionTime: Date = new Date();
  timeRemaining: string = "";

  pauseInfusionError: string = "";

  showfluidloss: boolean = false;
  showHistory: boolean = false;
  showPumpChange: boolean = false;
  showAddBolus: boolean = false;
  showAddFlush: boolean = false;
  showCompleteInfusion: boolean = false;
  showValidate: boolean = false;
  showChangeFlowRate: boolean = false;
  showpause: boolean = false;

  remainningVolumeIsZero: boolean = false;


  allevent: any;
  filterevent: any;

  isInfusionComplete: boolean = false;
  ciStatus = ""
  pauseDuration: any;

  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {


  }

  GetCIStatus() {

    if (this.coreContinuousinfusion.totalremainingvolume == 0) {
      this.remainningVolumeIsZero = true;
    }
    if (this.coreContinuousinfusion) {
      //check if paused
      if (this.coreContinuousinfusion.ispaused)
        this.ciStatus = "Paused";
      else
        if (this.coreContinuousinfusion.finishdatetime) // check if complete
        {
          this.ciStatus = "Completed";
          this.completionTime = this.coreContinuousinfusion.finishdatetime;
          this.timeRemaining = "NA";

        }
        else
          this.ciStatus = "In Progress";
    }
  }


  ngOnInit(): void {
    //get session for encounter id
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalancesession&synapseattributename=person_id&attributevalue=" + this.appService.personId).subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.FluidBalanceEncounterSessions = [];
        for (let r of responseArray) {
          this.appService.FluidBalanceEncounterSessions.push(<Fluidbalancesession>r);
        }
      }));
    this.defaultMenuoptions();
    this.loadcoreContinuousinfusion();

  }

  Getlastevent() {

    let varb = this.createEncounterFilter();
    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_cieventshistory", varb).subscribe(
      (response) => {
        this.continuousinfusionHistory = response;
        this.continuousinfusionHistory.sort((a, b) => b._sequenceid - a._sequenceid);

        this.allevent = response;
        this.filterevent = this.continuousinfusionHistory.filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation');

        if (this.continuousinfusionHistory.find(x => x.eventtype == "complete")) {
          this.isInfusionComplete = true;

          this.completionTime = this.coreContinuousinfusion.finishdatetime;
          this.timeRemaining = "NA";

        }
        else {
          this.GetCompletionTime();
        }

        this.GetTotalPausetime();


      }));
  }
  createEncounterFilter() {
    let condition = "continuousinfusion_id = @continuousinfusion_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("continuousinfusion_id", this.coreContinuousinfusion.continuousinfusion_id));


    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 2");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  GetCompletionTime() {


    let lastValidatedTime = moment(this.filterevent[0].datetime);
    let hours = this.coreContinuousinfusion.totalremainingvolume / this.coreContinuousinfusion.flowrate;
    this.completionTime = lastValidatedTime.add(hours, "hour").toDate();
    this.completionTime.setMinutes(this.appService.IsNearestMinutePlus15(moment(this.completionTime).get("minutes")));

    const duration = moment.duration(moment(this.completionTime).diff(moment()));

    //const remainingHours = duration.get("hour");
    //;
    //const remainingMins = (duration.asMinutes() % 60).toFixed();

    //this.timeRemaining = remainingHours + "Hrs " + remainingMins + "Mins";
    if (duration.get("minute") < 0 || duration.get("hour") < 0 || duration.get("day") < 0) {
      this.timeRemaining = "NA";

    } else {

      this.timeRemaining = this.FormatDuration(duration);
    }


  }

  FormatDuration(duration: moment.Duration) {

    const day = duration.get("day");
    const dayString = day ? day + (day > 1 ? " Days " : " Day ") : "";

    const hour = duration.get("hour");
    const hourString = hour + (hour > 1 ? " Hrs " : " Hr ");

    const min = duration.get("minute");
    const minString = min + (min > 1 ? " Mins " : " Min ");


    return dayString + hourString + minString
  }
  GetTotalPausetime() {



    const events = this.allevent.filter(x => x.eventtype === 'pause' || x.eventtype === 'restart');

    events.sort((a, b) => { return ((a.datetime as Date) > (b.datetime as Date)) ? 0 : -1; });

    const datetimes = events.map((e) => { return e.datetime });

    // const reduced = datetimes.reduce((a, b) => { return a + moment.duration(moment(b.datetime).diff(a.datetime)).asHours() }, 0);

    let test = events.reduce(
      ([result, lastobj], a) =>
        (lastobj) ? (a.eventtype === "restart") ? [result + moment.duration(moment(a.datetime).diff(lastobj.datetime)).asHours(), a] : [result, a] : [result, a], [0],
    )


    let td = moment.duration();
    td.add(30, "hour");
    this.appService.logToConsole(td);

    const duration = moment.duration();
    duration.add(test[0], "hours");
    //const remainingHours = duration.get("hour");

    //const remainingMins = (duration.asMinutes() % 60).toFixed();

    //this.pauseDuration = remainingHours + "Hrs " + remainingMins + "Mins";

    this.pauseDuration = this.FormatDuration(duration);

  }
  calculateFluidLoss() {
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
        this.coreContinuousinfusion.totalremainingvolume = this.coreContinuousinfusion.totalvolume - (this.coreContinuousinfusion.totaladministeredvolume + this.totalfluidLoss);
      }));
  }



  loadcoreContinuousinfusion() {

    this.coreContinuousinfusion = new CoreContinuousinfusion();
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetObject?synapsenamespace=core&synapseentityname=continuousinfusion&id=" + this.continuousinfusion_id).subscribe(
      (response) => {
        this.coreContinuousinfusion = <CoreContinuousinfusion>JSON.parse(response);
        this.routename = this.appService.MetaRouteTypes.find(x => x.routetype_id == this.coreContinuousinfusion.routetype_id).routetype.toUpperCase() + "-" +
          this.appService.MetaRoutes.find(x => x.route_id == this.coreContinuousinfusion.route_id).route.toUpperCase();
        this.ShowMenu = true;
        this.showHistory = true;
        this.Getlastevent();
        this.calculateFluidLoss();

        this.GetCIStatus();
      }));
  }

  defaultMenuoptions() {
    this.showChangeFlowRate = false;
    this.showfluidloss = false;
    this.showHistory = false;
    this.showPumpChange = false;
    this.showAddBolus = false;
    this.showAddFlush = false;
    this.showCompleteInfusion = false;
    this.showValidate = false;
    this.showpause = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  reFreshMenu(reLoadType: string) {
    if (reLoadType == "loadvalidation") {
      this.onMenuChange("Validate");
    }
    else {
      this.showHistory = false;
      this.defaultMenuoptions();
      this.loadcoreContinuousinfusion();
      this.subjects.drawChart.next();
    }
  }


  onMenuChange(option: any) {
    this.defaultMenuoptions();
    switch (option) {
      case "Complete":
        {

          this.showCompleteInfusion = true;
        }
        break;
      case "Validate":
        {

          this.showValidate = true;
        }
        break;
      case "History":
        {

          this.showHistory = true;
        }
        break;

      case "Bolus":
        {

          this.showAddBolus = true;
        }
        break;
      case "Flush":
        {

          this.showAddFlush = true;
        }
        break;
      case "Flow":
        {
          this.showChangeFlowRate = true;

        }
        break;
      case "Pump":
        {

          this.showPumpChange = true;
        }
        break;
      case "Fluidloss":
        {

          this.showfluidloss = true;
        }
        break;
      case "Pause":
        {
          this.showpause = true;
        }
        break;
      default: {


      }

        break;
    }
  }


}
