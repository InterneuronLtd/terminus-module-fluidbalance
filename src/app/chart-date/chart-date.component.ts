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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from '../services/app.service';
import { SubjectsService } from '../services/subjects.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';
import { ApirequestService } from '../services/apirequest.service';

@Component({
  selector: 'app-chart-date',
  templateUrl: './chart-date.component.html',
  styleUrls: ['./chart-date.component.css']
})
export class ChartDateComponent implements OnInit, OnDestroy {

  displayDateText: string;

  selectedDate: Date;

  disableNextButton: boolean = false;

  disablePreviousButton: boolean = false;

  minDate: Date = new Date(0);

  maxDate: Date = new Date();

  isCalledOnce: boolean = false;

  subscriptions: Subscription = new Subscription();
  notcompleted: [];
  constructor(public appService: AppService, private subjects: SubjectsService, private apiRequest: ApirequestService,) {
    this.subscriptions.add(
      this.subjects.continuousInfusionMessage.subscribe(() => {
        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_continuousinfusionnotcompleted", this.createContinuousInfusionFilter())
          .subscribe((response) => {
            this.notcompleted = response;
          })
        );
      }));
    this.init();
    this.subscriptions.add(
      this.subjects.encounterChange.subscribe(() => {
        this.init();
      }));
    this.subscriptions.add(
      this.subjects.monitoringStarted.subscribe(() => {
        this.init();
      }));

  }

  getCurrentChartSessionDate() {
    const currentDate =  moment().toDate();
    currentDate.setHours(0);
    currentDate.setMinutes(0)
    currentDate.setMilliseconds(0);
    currentDate.setSeconds(0);

    var sessionStartDateTime = moment(currentDate).add(this.appService.appConfig.appsettings.sessionStartTime, "hours");
    if (moment().isSameOrAfter(sessionStartDateTime)) {
      return new Date();
    }
    else
      return moment().add(-1, "day").toDate();
  }

  SetMinMaxDates()
  {
    this.minDate = this.appService.encounter.admitdatetime ? new Date(moment(this.appService.encounter.admitdatetime, moment.ISO_8601).toString()) : new Date(0);
    this.maxDate = this.appService.encounter.dischargedatetime ? new Date(moment(this.appService.encounter.dischargedatetime, moment.ISO_8601).toString()) : this.getCurrentChartSessionDate();

  }

  init() {
    this.SetMinMaxDates();
    if (!this.appService.IsCurrentEncounter()) {
      this.selectedDate = null;
      // var admitDate = new Date(this.appService.encounter.admitdatetime);
      var admitDate = new Date(moment(this.appService.encounter.admitdatetime).toISOString());
      this.isCalledOnce = false;
      this.onValueChange(admitDate);
      this.displayDateText = this.selectedDate.toDateString();
      this.disableNextButton = this.checkForDisableNextButton(this.selectedDate);
      this.disablePreviousButton = this.checkForDisablePreviousButton(this.selectedDate);
    }
    else
    {
      //curent encounter
      this.onTodayClick();
    }
    this.subjects.continuousInfusionMessage.next();

  }

  ngOnInit(): void {
  }

  onPreviousClick() {
    if (this.selectedDate != null) {
      this.isCalledOnce = false;
      this.selectedDate = new Date(Date.UTC(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() - 1));
      this.displayDateText = this.selectedDate.toDateString();
      this.disableNextButton = this.checkForDisableNextButton(this.selectedDate);
      this.disablePreviousButton = this.checkForDisablePreviousButton(this.selectedDate);
      this.subjects.continuousInfusionMessage.next();
    }
  }

  onTodayClick() {
    var date = this.getCurrentChartSessionDate();
    this.SetMinMaxDates();
    this.isCalledOnce = false;
    this.selectedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    this.displayDateText = this.selectedDate.toDateString();
    this.disableNextButton = this.checkForDisableNextButton(this.selectedDate);
    this.disablePreviousButton = this.checkForDisablePreviousButton(this.selectedDate);
    this.subjects.continuousInfusionMessage.next();
  }

  onNextClick() {
    if (this.selectedDate != null) {
      this.isCalledOnce = false;
      this.selectedDate = new Date(Date.UTC(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + 1));
      this.displayDateText = this.selectedDate.toDateString();
      this.disableNextButton = this.checkForDisableNextButton(this.selectedDate);
      this.disablePreviousButton = this.checkForDisablePreviousButton(this.selectedDate);
      this.subjects.continuousInfusionMessage.next();
    }
  }

  checkForDisableNextButton(dt: Date) {
    return dt.getDate() == this.maxDate.getDate() && dt.getMonth() == this.maxDate.getMonth() && dt.getFullYear() == this.maxDate.getFullYear();
  }

  checkForDisablePreviousButton(dt: Date) {
    return dt.getDate() == this.minDate.getDate() && dt.getMonth() == this.minDate.getMonth() && dt.getFullYear() == this.minDate.getFullYear();
  }

  onValueChange(value: Date): void {
    if (!this.isCalledOnce && value != null) {
      this.selectedDate = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
      this.displayDateText = this.selectedDate.toDateString();
      this.disableNextButton = this.checkForDisableNextButton(this.selectedDate);
      this.disablePreviousButton = this.checkForDisablePreviousButton(this.selectedDate);
      this.appService.currentChartDate = this.selectedDate;
      this.isCalledOnce = true;
      this.subjects.chartDateChange.next();
    }
  }

  onDatePickerClose(event) {
    this.isCalledOnce = false;
  }

  onDatePickerOpen(event) {
    this.isCalledOnce = false;
  }

  allowedKeys(event) {
    //var key = event.keyCode;

    //if (key == "8" || key == "46") {
    //  //Allow Backspace and Delete keys only
    //  return true;
    //}
    //else {
    return false;
    //}
  }

  createContinuousInfusionFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
