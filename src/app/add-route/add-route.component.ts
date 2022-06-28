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
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from "@angular/core";
import { ApirequestService } from "../services/apirequest.service";
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from "../models/Filter.model";
import { SubjectsService } from "../services/subjects.service";
import { AppService } from "../services/app.service";
import { Subscription } from "rxjs";
import { Route, Fluidbalancesessionroute, Fluidbalancesessionroutesessions } from "../models/fluidbalance.model";
import { v4 as uuidv4 } from "uuid";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: "app-add-route",
  templateUrl: "./add-route.component.html",
  styleUrls: ["./add-route.component.css"],
})
export class AddRouteComponent implements OnInit, OnDestroy {

  selectedRouteTypeText: string = "Please select";

  selectedRouteText: string = "Please select";

  selectedRouteId: string;

  subscriptions: Subscription = new Subscription();

  routes: Route[];

  ioRoutes: Route[] = [];

  isIntake: boolean = false;

  displayOrder: number;

  showErrorMessage: boolean = false;

  errorMessage: string;
  showSpinner : boolean = false;
  constructor(private apiRequest: ApirequestService, private subjects: SubjectsService, private appService: AppService, public bsModalRef: BsModalRef, private modalService: BsModalService) {

    this.subscriptions.add(
      this.subjects.addRoute.subscribe((routedirection: any) => {
        if (routedirection) {
          this.onRouteTypeSelection(routedirection.value)
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ngOnInit() { }



  public selectedRoute(ioRoute: Route) {
    this.selectedRouteText = ioRoute.route;
    this.selectedRouteId = ioRoute.route_id;
  }

  saveRoute() {
    this.showSpinner =true;
    let sessionroute = new Fluidbalancesessionroute()
    sessionroute.fluidbalancesessionroute_id = uuidv4();
    sessionroute.fluidbalancesession_id = this.appService.FluidBalanceSession.fluidbalancesession_id;
    sessionroute.route_id = this.selectedRouteId;
    sessionroute.hasbeenamended = false;
    sessionroute.dateadded = this.appService.getDateTimeinISOFormat(this.appService.sessionStartDateTime);
    sessionroute.displayorder = this.displayOrder + 1;
    sessionroute.addedby = this.appService.loggedInUserName;
    sessionroute.modifiedby = this.appService.loggedInUserName;
    sessionroute.routename = this.selectedRouteText;
    sessionroute.isintake = this.isIntake;


    // this.subscriptions.add(
    //   this.apiRequest.postRequest(AppConfig.uris.baseuri + AppConfig.dynamicApiEndpoints.find((x) => x.endpointName == "PostRoute").url, JSON.stringify(sessionroute))
    //     .subscribe((response) => {
    //       const sessionroutemapping = new Fluidbalancesessionroutesessions(uuidv4(), sessionroute.fluidbalancesession_id, sessionroute.fluidbalancesessionroute_id);
    //       this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions",
    //         JSON.stringify(sessionroutemapping)).
    //         subscribe(() => {
    //           this.subjects.drawChart.next();
    //           this.bsModalRef.hide();
    //         }));
    //     }));

    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/AddSessionRoute`, JSON.stringify(sessionroute))
    .subscribe((response) => {
      this.subjects.drawChart.next();
      this.bsModalRef.hide();
    }));
  }

  async onRouteTypeSelection(value: boolean) {
    if (value === true) {
      this.isIntake = true;
      this.selectedRouteTypeText = "Intake";
    } else {
      this.isIntake = false;
      this.selectedRouteTypeText = "Output";
    }

    const response = await this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getdisplayorderforfluidbalanceroute", this.createRouteFilter())
      .toPromise()

    if (response.length > 0) {
      //this.displayOrder = response[0].displayorder;

      for(var i=0; i < response.length; i++){
        if(this.isIntake && (response[response.length - 1].displayorder < this.appService.appConfig.appsettings.maxIntakeRoutes || response.length == this.appService.appConfig.appsettings.maxIntakeRoutes)){
          this.displayOrder = response[i].displayorder;
        }
        else if(this.isIntake && response[i].displayorder != i + 1){
          this.displayOrder = i;
          break;
        }

        if(!this.isIntake && (response[response.length - 1].displayorder < (this.appService.appConfig.appsettings.maxIntakeRoutes + this.appService.appConfig.appsettings.maxOutputRoutes) || response.length == this.appService.appConfig.appsettings.maxOutputRoutes)){
          this.displayOrder = response[i].displayorder;
        }
        else if(!this.isIntake && response[i].displayorder != this.appService.appConfig.appsettings.maxOutputRoutes + i + 1){
          this.displayOrder = this.appService.appConfig.appsettings.maxOutputRoutes + i;
          break;
        }
      }

      if (this.isIntake && !this.checkIfBetweenIntakeDisplayOrder(this.displayOrder) && this.displayOrder >= this.appService.appConfig.appsettings.maxIntakeRoutes) {
        this.errorMessage = "";
        this.errorMessage = "Can't add more intake routes";
        this.showErrorMessage = true;
      }

      if (!this.isIntake && !this.checkIfBetweenOutputDisplayOrder(this.displayOrder) && this.displayOrder >= (this.appService.appConfig.appsettings.maxIntakeRoutes + this.appService.appConfig.appsettings.maxOutputRoutes)) {
        this.errorMessage = "";
        this.errorMessage = "Can't add more output routes";
        this.showErrorMessage = true;
      }

      if (!this.showErrorMessage) {
        this.ioRoutes = this.appService.MetaRoutes.filter((x) => x.isintake == this.isIntake && x.route != "Urine" && x.route != "Arterial Line" && x.route != "Oral" && x.route != "IO-Fluid" && x.route != "IO-Meds" && x.route != "IO-Blood").sort( (a,b) => { return a.displayorder - b.displayorder });
        this.selectedRouteText = this.ioRoutes[0].route;
        this.selectedRouteId = this.ioRoutes[0].route_id;
      }
    }
  }

  checkIfBetweenIntakeDisplayOrder(value: number) {
    return value > 1 && value < this.appService.appConfig.appsettings.maxIntakeRoutes;
  }

  checkIfBetweenOutputDisplayOrder(value: number) {
    return value > (this.appService.appConfig.appsettings.maxIntakeRoutes + 1) && value < (this.appService.appConfig.appsettings.maxIntakeRoutes + this.appService.appConfig.appsettings.maxOutputRoutes);
  }

  createRouteFilter() {
    let condition = "fluidbalancesession_id = @fluidbalancesession_id and isintake = @isintake::boolean";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("fluidbalancesession_id", this.appService.FluidBalanceSession.fluidbalancesession_id));
    pm.filterparams.push(new filterparam("isintake", this.isIntake.toString()));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 3 asc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }
}
