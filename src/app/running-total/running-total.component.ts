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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { SubjectsService } from '../services/subjects.service';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';
import { RecordWeightComponent } from '../record-weight/record-weight.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-running-total',
  templateUrl: './running-total.component.html',
  styleUrls: ['./running-total.component.css']
})
export class RunningTotalComponent implements OnInit, OnDestroy {

  bsModalRef: BsModalRef;
  subscriptions: Subscription = new Subscription();
  sessionSubscriptions: Subscription = new Subscription();

  weight: number;

  age: number;

  expectedHourlyUrineOutput: number;
  expectedHourlyUrineOutputWithContinuousInfusion: number = 0;
  urineCatheterFlowrate: number = 0;
  intakeRunningTotal: number = 0;
  isCurrentDaySession: boolean = false;
  outputRunningTotal: number = 0;

  constructor(private appService: AppService, private apiRequest: ApirequestService, private subjects: SubjectsService, private modalService: BsModalService) {

    this.init();

    this.subscriptions.add(
      this.subjects.sessionChanged
        .subscribe(() => {
          this.sessionSubscriptions.unsubscribe();
          this.sessionSubscriptions = new Subscription();
          this.init();
        })
    )

    this.subscriptions.add(
      this.subjects.weightChanged
        .subscribe(() => {
          this.getWeight();
        })
    )

    this.subscriptions.add(
      this.subjects.drawChart
        .subscribe(() => {
          this.init();
        })
    )
  }
  ngOnDestroy(): void {
    this.appService.logToConsole("destroying running total");
    this.subscriptions.unsubscribe();
  }

  init() {
    this.isCurrentDaySession = this.appService.IsCurrentDaySession();
    this.getWeight();
    this.calculateRunningTotal();
  }

  getWeight() {
    this.sessionSubscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getweightobservations", this.createWeightFilter())
      .subscribe((response) => {
        if (response.length > 0) {
          if (response[0].value != "" || response[0].value != null) {
            this.weight = response[0].value;
            this.appService.isWeightCaptured = true;
          }
          else {
            this.weight = 0;
            this.appService.isWeightCaptured = false;
          }
        }
        else {
          this.weight = 0;
          this.appService.isWeightCaptured = false;
        }
        this.age = this.appService.getPatientCurrentAge();
        //this.expectedHourlyUrineOutput = this.appService.expectedHourlyUrineOutput(this.age, this.weight);
        //this.expectedHourlyUrineOutputWithContinuousInfusion = this.expectedHourlyUrineOutput + this.appService.urineCatheterFlowrate;
        //this.urineCatheterFlowrate = this.appService.urineCatheterFlowrate;
        if (this.appService.IsCurrentDaySession()) {
          this.subscriptions.add(
            this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/CalculateExpectedUrineOutput/` + this.appService.personId + "/" + this.appService.encounter.encounter_id)
              .subscribe((response) => {
                this.expectedHourlyUrineOutput = response;
                this.expectedHourlyUrineOutputWithContinuousInfusion = this.expectedHourlyUrineOutput + this.appService.urineCatheterFlowrate;
                this.urineCatheterFlowrate = this.appService.urineCatheterFlowrate;
              })
          )
        } else {
          if (this.appService.FluidBalanceIntakeOutput) {
            this.expectedHourlyUrineOutput = this.appService.expectedHourlyUrineOutputRetro();
            this.expectedHourlyUrineOutputWithContinuousInfusion = this.expectedHourlyUrineOutput + this.appService.urineCatheterFlowrate;
            this.urineCatheterFlowrate = this.appService.urineCatheterFlowrate;
          }
        }
      })
    );
  }
  openUrineHistory() {
    this.subjects.openUrineOutputHistory.next();
  }
  calculateRunningTotal() {
    this.sessionSubscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_calculaterunningtotal", this.createRunningTotalFilter())
      .subscribe((response) => {
        if (response.length > 0) {
          this.intakeRunningTotal = 0;
          this.outputRunningTotal = 0;
          for (var i = 0; i < response.length; i++) {
            if (response[i].iotype == "Intake") {
              this.intakeRunningTotal = response[i].value;
            }
            if (response[i].iotype == "Output") {
              this.outputRunningTotal = response[i].value;
            }
          }
        }
        else {
          this.intakeRunningTotal = 0;
          this.outputRunningTotal = 0;
        }
      })
    );
  }

  ngOnInit(): void {

  }
  createWeightFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY observationeventdatetime desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  createRunningTotalFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id and fluidbalancesession_id = @fluidbalancesession_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
    pm.filterparams.push(new filterparam("fluidbalancesession_id", this.appService.FluidBalanceSession.fluidbalancesession_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1 desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  openRecordWeightModal() {
    const config = {
      backdrop: true,
      ignoreBackdropClick: true,
      class: 'modal-dialog-centered modal-lg',
      initialState: {
        errorMessage: ""
      }
    }
    this.bsModalRef = this.modalService.show(RecordWeightComponent, config);
  }

}
