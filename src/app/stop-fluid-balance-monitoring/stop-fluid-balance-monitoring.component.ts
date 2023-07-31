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
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { ApirequestService } from "../services/apirequest.service";
import { SubjectsService } from "../services/subjects.service";
import { AppService } from "../services/app.service";
import { FluidBalancePersonStatus } from "../models/fluidbalance.model";
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement } from "../models/Filter.model";

@Component({
  selector: "app-stop-fluid-balance-monitoring",
  templateUrl: "./stop-fluid-balance-monitoring.component.html",
  styleUrls: ["./stop-fluid-balance-monitoring.component.css"],
})
export class StopFluidBalanceMonitoringComponent implements OnInit,OnDestroy {
  showHideFluidBalanceMonitoring: boolean = false;

  isActiveFluidBalanceMonitoring: boolean = false;

  fluidBalancePersonStatusId: string;

  showHideFBMAtInitLoad: boolean = false;

  subscriptions: Subscription = new Subscription();

  constructor(private apiRequest: ApirequestService, private subjects: SubjectsService, public appService: AppService) {
    this.init();

    this.subscriptions.add(
      this.subjects.encounterChange.subscribe(() => {
        this.init();
      })
    );
  }

  init() {
    this.checkForFluidBalanceMontoring();
  }
  ngOnInit(): void {}

  checkForFluidBalanceMontoring() {
    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost/core/fluidbalancepersonstatus", this.createFilter())
        .subscribe((response) => {
          if (response.length > 0) {
            let fluidBalancePersonStatus = response[0] as FluidBalancePersonStatus;
            this.appService.FluidBalanceStatus = response[0] as FluidBalancePersonStatus;

            this.fluidBalancePersonStatusId =
              fluidBalancePersonStatus.fluidbalancepersonstatus_id;

            if (fluidBalancePersonStatus.isactive) {
              this.isActiveFluidBalanceMonitoring = true;
            } else {
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

  stopFluidBalanceMonitoring() {
    let fluidBalancePersonStatus = new FluidBalancePersonStatus();
    fluidBalancePersonStatus.person_id = this.appService.personId;
    fluidBalancePersonStatus.encounter_id = this.appService.encounter.encounter_id;
    fluidBalancePersonStatus.fluidbalancepersonstatus_id = this.fluidBalancePersonStatusId;
    fluidBalancePersonStatus.isactive = false;
    fluidBalancePersonStatus.addedby = this.appService.loggedInUserName;
    fluidBalancePersonStatus.modifiedby = this.appService.loggedInUserName;

    // this.subscriptions.add(
    //   this.apiRequest.postRequest(AppConfig.uris.baseuri + AppConfig.dynamicApiEndpoints.find((x: { endpointName: string }) => x.endpointName == "PostFluidBalancePersonStatus").url, JSON.stringify(fluidBalancePersonStatus))
    //     .subscribe((response) => {
    //       this.checkForFluidBalanceMontoring();
    //       this.subjects.monitoringStopped.next();

    //     }));

    this.subscriptions.add(
      this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/SetMonitoringStatus`, JSON.stringify(fluidBalancePersonStatus))
        .subscribe((response) => {
          this.checkForFluidBalanceMontoring();
          this.subjects.monitoringStopped.next();
        })
    );
  }

  createFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";

    let f = new filters();
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(
      new filterparam("person_id", this.appService.personId)
    );
    pm.filterparams.push(
      new filterparam("encounter_id", this.appService.encounter.encounter_id)
    );

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1 DESC");

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
