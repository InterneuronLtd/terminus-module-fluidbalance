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
import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppService } from './services/app.service';
import { ApirequestService } from './services/apirequest.service';
import { SubjectsService } from './services/subjects.service';
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement, action, DataContract } from './models/Filter.model';
import { Route, Routetype, Fluidcapturedevice, Routetypefluidcapturedevice, Fluidbalanceiotype, Expectedurineoutput, RouteConfig, Fluidbalancesession } from './models/fluidbalance.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SingleVoulmeFluidIntakeOutput } from './models/fluidbalance.model';
import { SingleVolumeFluidIntakeComponent } from './single-volume-fluid-intake/single-volume-fluid-intake.component';
import { Observationscaletype, PersonObservationScale } from './models/observations.model';
import { environment } from '../environments/environment';
import { AddRouteComponent } from './add-route/add-route.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'terminus-module-fluidbalance';
  subscriptions: Subscription = new Subscription();

  bsModalRef: BsModalRef;

  @Input() set datacontract(value: DataContract) {
    this.appService.personId = value.personId;
    this.appService.apiService = value.apiService;
    this.subjects.unload = value.unload;
    this.initConfigAndGetMeta(this.appService.apiService)
  }

  @Output() frameworkAction = new EventEmitter<string>();
  alerts: any[] = [];
  isIntakeModalShown = false;
  constructor(private subjects: SubjectsService, public appService: AppService, private apiRequest: ApirequestService, private modalService: BsModalService) {

    this.subscriptions.add(this.subjects.frameworkEvent.subscribe((e: string) => { this.emitFrameworkEvent(e) }
    ));

    console.log(environment.production);
    if (!environment.production)
      this.initDevMode();
  }

  openAddRouteModal() {
    const initialState = {
      selectedRouteTypeText: "Please select",
      selectedRouteText: "Please select",
      selectedRouteId: "",
      ioRoutes: [],
      showErrorMessage: false,
      errorMessage: ""
    };
    this.bsModalRef = this.modalService.show(AddRouteComponent, { initialState });
  }

  initDevMode() {
    //commment out to push to framework - 3lines
    if (!environment.production) {

      this.appService.personId = "17775da9-8e71-4a3f-9042-4cdcbf97efec";// "0422d1d0-a9d2-426a-b0b2-d21441e2f045";//"429904ca-19c1-4a3a-b453-617c7db513a3";//"027c3400-24cd-45c1-9e3d-0f4475336394";//"429904ca-19c1-4a3a-b453-617c7db513a3";

      let value: any = {};
      value.authService = {};
      value.authService.user = {};
      let auth = this.apiRequest.authService;
      auth.getToken().then((token) => {
        value.authService.user.access_token = token;
        this.initConfigAndGetMeta(value);
      });
    }
  }


  emitFrameworkEvent(e: string) {    
    this.frameworkAction.emit(e);
  }




  async initConfigAndGetMeta(value: any) {

    this.appService.apiService = value;
    let decodedToken: any;
    if (this.appService.apiService) {
      decodedToken = this.appService.decodeAccessToken(this.appService.apiService.authService.user.access_token);
      if (decodedToken != null)
        this.appService.loggedInUserName = decodedToken.name ? (Array.isArray(decodedToken.name) ? decodedToken.name[0] : decodedToken.name) : decodedToken.IPUId;

    }
    await this.subscriptions.add(this.apiRequest.getRequest("./assets/config/FluidBalanceConfig.json?V" + Math.random()).subscribe(
      async (response) => {
        this.appService.appConfig = response;
        this.appService.baseURI = this.appService.appConfig.uris.baseuri;
        this.appService.enableLogging = this.appService.appConfig.enablelogging;

        //getPersonDateOfBirth
        await this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.baseURI}/GetObject?synapsenamespace=core&synapseentityname=person&id=${this.appService.personId}`).subscribe(
          (person) => {
            person = JSON.parse(person);
            if (person && person.dateofbirth) {
              this.appService.personDOB = person.dateofbirth as Date;
            }

          }));

        //get actions for rbac
        await this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/rbac_actions`, this.createRoleFilter(decodedToken))
          .subscribe((response: action[]) => {
            this.appService.roleActions = response;
            this.appService.logToConsole(response);
          }));

        await this.getMetaData();

        //get all meta before emitting events
        //all components depending on meta should perform any action only after receiveing these events
        //use await on requets that are mandatory before the below events can be fired.

        //emit events after getting initial config. //this happens on first load only. 
        this.appService.logToConsole("Service reference is being published from init config");
        this.subjects.apiServiceReferenceChange.next(true);
        this.appService.logToConsole("personid is being published from init config");
        this.subjects.personIdChange.next(true);

      }));

  }

  async getMetaData() {
    this.appService.logToConsole("Get meta data")

    //get routes
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=route").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaRoutes = new Array<Route>();
        for (let r of responseArray) {
          this.appService.MetaRoutes.push(<Route>r);
        }
      }));

    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=routeconfig").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaRouteConfig = new Array<RouteConfig>();
        for (let r of responseArray) {
          this.appService.MetaRouteConfig.push(<RouteConfig>r);
        }
      }));


    //get route types
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=routetype").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaRouteTypes = [];
        for (let r of responseArray) {
          this.appService.MetaRouteTypes.push(<Routetype>r);
        }
      }));

    //get session for encounter id
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalancesession&synapseattributename=person_id&attributevalue=" + this.appService.personId).subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.FluidBalanceEncounterSessions = [];
        for (let r of responseArray) {
          this.appService.FluidBalanceEncounterSessions.push(<Fluidbalancesession>r);
        }
      }));


    //get fluid capture devices
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=fluidcapturedevice").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaFluidCaptureDevices = [];
        for (let r of responseArray) {
          this.appService.MetaFluidCaptureDevices.push(<Fluidcapturedevice>r);
        }
      }));

    //get RouteTypes Fluid Capture Device
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=routetypefluidcapturedevice").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaRouteTypeFluidCaptureDevices = [];
        for (let r of responseArray) {
          this.appService.MetaRouteTypeFluidCaptureDevices.push(<Routetypefluidcapturedevice>r);
        }
      }));

    //get obs Scale 
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=fluidbalanceiotype").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaIOType = [];
        for (let r of responseArray) {
          this.appService.MetaIOType.push(<Fluidbalanceiotype>r);
        }
      }));

    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=observationscaletype").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        for (let r of responseArray) {
          this.appService.obsScales.push(<Observationscaletype>r);
        }

        //get person scale type
        this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=personobservationscale&synapseattributename=person_id&attributevalue=" + this.appService.personId)
          .subscribe(
            (personobservationscale) => {
              let personobservationscalelist = <PersonObservationScale[]>JSON.parse(personobservationscale);
              if (personobservationscalelist.length > 0) {
                this.appService.personscale = personobservationscalelist[0];
                this.appService.logToConsole("updating app service person scale type");
                this.appService.logToConsole(this.appService.personscale);
              }
              this.appService.setCurrentScale();
            }
          ));
      }));
    //expeted urine output metda
    await this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=expectedurineoutput").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        this.appService.MetaExpectedurineoutput = [];
        for (let r of responseArray) {
          this.appService.MetaExpectedurineoutput.push(<Expectedurineoutput>r);
        }
      }));

    this.appService.isInitComplete = true;
  }


  createRoleFilter(decodedToken: any) {

    let condition = "";
    let pm = new filterParams();
    let synapseroles;
    if (environment.production)
      synapseroles = decodedToken.SynapseRoles
    else
      synapseroles = decodedToken.client_SynapseRoles
    if (!Array.isArray(synapseroles)) {
      condition = "rolename = @rolename";
      pm.filterparams.push(new filterparam("rolename", synapseroles));
    }
    else
      for (var i = 0; i < synapseroles.length; i++) {
        condition += "or rolename = @rolename" + i + " ";
        pm.filterparams.push(new filterparam("rolename" + i, synapseroles[i]));
      }
    condition = condition.replace(/^\or+|\or+$/g, '');
    let f = new filters();
    f.filters.push(new filter(condition));


    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    this.appService.logToConsole(JSON.stringify(body));
    return JSON.stringify(body);
  }

  ngOnDestroy() {
    this.appService.logToConsole("app component being unloaded");
    this.appService.encounter = null;
    this.appService.personId = null;
    this.appService.isCurrentEncouner = null;
    this.appService.reset();
    this.subscriptions.unsubscribe();
    this.subjects.unload.next("app-fluidbalance");
  }

  showMessage(status: any) {
    if (status.result == "complete") {

      this.alerts = [];
      this.alerts.push({
        type: 'success',
        msg: `${status.message}`,
        timeout: status.timeout ? status.timeout : 0
      });
    }
    else if (status.result == "failed") {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: `${status.message}`,
        timeout: status.timeout ? status.timeout : 0
      });
    }
    else if (status.result == "inprogress") {
      this.alerts = [];
      this.alerts.push({
        type: 'info',
        msg: `${status.message}`,
        timeout: status.timeout ? status.timeout : 0
      });
    }
  } 
}
