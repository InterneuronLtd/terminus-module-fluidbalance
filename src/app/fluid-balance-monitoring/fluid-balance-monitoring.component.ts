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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';
import { FluidBalancePersonStatus } from '../models/fluidbalance.model';
import { v4 as uuidv4 } from 'uuid';
import { SubjectsService } from '../services/subjects.service';
import { AppService } from '../services/app.service';
import { RecordWeightComponent } from '../record-weight/record-weight.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-fluid-balance-monitoring',
  templateUrl: './fluid-balance-monitoring.component.html',
  styleUrls: ['./fluid-balance-monitoring.component.css']
})
export class FluidBalanceMonitoringComponent implements OnInit, OnDestroy {

  //personId: string = 'db4467b0-7200-471b-940f-56d0e8e0e5da';

  //encounterId: string = '5fd44d09-2882-4d13-a10a-98866b923170';
  bsModalRef: BsModalRef;

  showHideFluidBalanceMonitoring: boolean = false;

  isActiveFluidBalanceMonitoring: boolean = false;

  fluidBalancePersonStatusId: string;

  showRecordWeight: boolean = false;

  showHideFBMAtInitLoad: boolean = false;

  subscriptions: Subscription = new Subscription();

  constructor(private apiRequest: ApirequestService, private subjects: SubjectsService, public appService: AppService, private modalService: BsModalService) {
    this.subscriptions.add(
      this.subjects.encounterChange.subscribe(() => {
        this.init();

      }));
    this.subscriptions.add(
      this.subjects.monitoringStopped.subscribe(() => {
        this.init();
      }));
  }

  init() {
    this.checkForFluidBalanceMontoring();
    this.getWeightObservations();
  }

  ngOnInit(): void {

  }

  checkForFluidBalanceMontoring() {
    this.subscriptions.add(
      this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost/core/fluidbalancepersonstatus", this.createFilter())
        .subscribe((response) => {
          if (response.length > 0) {
            this.appService.FluidBalanceStatus = response[0] as FluidBalancePersonStatus;
            const fluidBalancePersonStatus = response[0] as FluidBalancePersonStatus;

            this.fluidBalancePersonStatusId = fluidBalancePersonStatus.fluidbalancepersonstatus_id;

            if (fluidBalancePersonStatus.isactive) {
              this.isActiveFluidBalanceMonitoring = true;
            }
            else {
              this.isActiveFluidBalanceMonitoring = false;
            }

            this.showHideFluidBalanceMonitoring = false;
          }
          else {
            this.showHideFluidBalanceMonitoring = true;
          }

          this.showHideFBMAtInitLoad = true;
        })
    );
  }

  createFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1 DESC");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  startFluidBalanceMonitoring() {
    let fluidBalancePersonStatus = new FluidBalancePersonStatus();
    fluidBalancePersonStatus.person_id = this.appService.personId;
    fluidBalancePersonStatus.encounter_id = this.appService.encounter.encounter_id;
    fluidBalancePersonStatus.fluidbalancepersonstatus_id = uuidv4();
    fluidBalancePersonStatus.isactive = true;
    fluidBalancePersonStatus.addedby = this.appService.loggedInUserName;
    fluidBalancePersonStatus.modifiedby = this.appService.loggedInUserName;

    // this.subscriptions.add(
    //   this.apiRequest.postRequest(AppConfig.uris.baseuri + AppConfig.dynamicApiEndpoints.find((x: { endpointName: string }) => x.endpointName == "PostFluidBalancePersonStatus").url, JSON.stringify(fluidBalancePersonStatus))
    //     .subscribe((response) => {
    //       this.checkForFluidBalanceMontoring();
    //       this.getWeightObservations();
    //       this.subjects.monitoringStarted.next(true);
    //     })
    // );

    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/SetMonitoringStatus`, JSON.stringify(fluidBalancePersonStatus))
    .subscribe((response) => {
          this.checkForFluidBalanceMontoring();
          this.getWeightObservations();
          this.subjects.monitoringStarted.next(true);
    }));
  }

  restartFluidBalanceMonitoring() {
    let fluidBalancePersonStatus = new FluidBalancePersonStatus();
    fluidBalancePersonStatus.person_id = this.appService.personId;
    fluidBalancePersonStatus.encounter_id = this.appService.encounter.encounter_id;
    fluidBalancePersonStatus.fluidbalancepersonstatus_id = this.fluidBalancePersonStatusId;
    fluidBalancePersonStatus.isactive = true;
    fluidBalancePersonStatus.addedby = this.appService.loggedInUserName;
    fluidBalancePersonStatus.modifiedby = this.appService.loggedInUserName;

    // this.subscriptions.add(
    //   this.apiRequest.postRequest(AppConfig.uris.baseuri + AppConfig.dynamicApiEndpoints.find((x: { endpointName: string }) => x.endpointName == "PostFluidBalancePersonStatus").url, JSON.stringify(fluidBalancePersonStatus))
    //     .subscribe((response) => {
    //       this.checkForFluidBalanceMontoring();
    //       this.getWeightObservations();
    //     })
    // )
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/SetMonitoringStatus`, JSON.stringify(fluidBalancePersonStatus))
    .subscribe((response) => {
          this.checkForFluidBalanceMontoring();
          this.getWeightObservations();
          this.subjects.monitoringStarted.next(true);
    }));
  }

  getWeightObservations() {
    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getweightobservations", this.createWeightFilter())
      .subscribe((response) => {
        if (response.length > 0) {
          if (response[0].value != "" || response[0].value != null){
            this.showRecordWeight = false;
            this.appService.isWeightCaptured = true;
          }
          else {
            this.showRecordWeight = true;
            this.appService.isWeightCaptured = false;
          } 
        }
        else {
          this.showRecordWeight = true;
          this.appService.isWeightCaptured = false;
        }
      })
    );
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  openRecordWeightModal() {
    this.showRecordWeight = false;
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
