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
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Observationevent, Observation } from '../models/observations.model';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { SubjectsService } from '../services/subjects.service';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';
import { Fluidbalancesession } from '../models/fluidbalance.model';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-record-weight',
  templateUrl: './record-weight.component.html',
  styleUrls: ['./record-weight.component.css']
})
export class RecordWeightComponent implements OnInit, OnDestroy {
  @Output() updateFrameworkEvents: EventEmitter<string> = new EventEmitter();
  weight: number;

  observationevent_id: string; 

  eventcorrelationid: string;

  age: number;

  expectedHourlyUrineOutput: number;

  expectedUrineOutputPerKg: number;

  subscriptions: Subscription = new Subscription();

  fbs: Fluidbalancesession;

  errorMessage: string = "";

  constructor(private appService: AppService, private apiRequest: ApirequestService, private subjects: SubjectsService, public bsModalRef: BsModalRef) {
    this.init();

    this.subscriptions.add(
      this.subjects.weightChanged
        .subscribe(() => {
          this.init();
        })
    )
  }

  init() {
    this.subscriptions.add(
      this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getweightobservations", this.createWeightFilter())
        .subscribe((response) => {
          if (response.length > 0) {
            if (response[0].value != "" || response[0].value != null){
              this.weight = response[0].value;
              this.appService.isWeightCaptured = true;
            } 
            else{
              this.weight = 0;
              this.appService.isWeightCaptured = false;
            }    
          }
          else {
            this.weight = 0;
            this.appService.isWeightCaptured = false;
          }
          this.age = this.appService.getPatientCurrentAge();

          this.expectedHourlyUrineOutput = this.appService.expectedHourlyUrineOutput(this.age, this.weight);

          this.expectedUrineOutputPerKg = this.appService.getExpectedUrineOutputVolumePerKg(this.age);
        })
    );
  }
  hourlyUrineOutputOnWeightChange() : void {
    this.age = this.appService.getPatientCurrentAge();
    this.expectedHourlyUrineOutput = this.appService.expectedHourlyUrineOutput(this.age, this.weight);
  }
  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  saveWeightObs() {
    this.errorMessage = "";

    if (typeof this.weight === 'undefined' || this.weight <= 0) {
      this.errorMessage = "Please enter a valid weight";
    }

    let isAmend: boolean = false;
    let observation_id: string = uuidv4();
    let personId: string = this.appService.personId;
    let encounterId: string = this.appService.encounter.encounter_id;
    let scale: string = this.appService.obsScales.filter(x => x.scaletypename == this.appService.currentEWSScale)[0].observationscaletype_id;
    let loggedInUser: string = this.appService.loggedInUserName;

    if(this.errorMessage == "")
    {
            this.observationevent_id = uuidv4();
            this.eventcorrelationid = uuidv4();
            let newObsEvent = new Observationevent(
              this.observationevent_id,
              personId,
              this.getDateTime(),
              this.getDateTime(),
              loggedInUser,
              encounterId,
              isAmend,
              168,
              scale,
              null,
              null,
              loggedInUser,
              null,
              null,
              this.eventcorrelationid,
              true);

            let weightObs = new Observation(
              observation_id,
              "",
              "",
              newObsEvent.datefinished,
              newObsEvent.observationevent_id,
              "71d6a339-7d9e-4054-99d6-683da95331dc",
              "",
              this.weight.toString(),
              false,
              loggedInUser,
              this.eventcorrelationid
            );

            this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=observationevent", JSON.stringify(newObsEvent))
              .subscribe((response) => {

                this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=observation", JSON.stringify(weightObs))
                  .subscribe((response) => {
                    this.appService.isWeightCaptured = true;
                    this.subjects.weightChanged.next(true);
                    this.bsModalRef.hide();                     
                    this.subjects.frameworkEvent.next("UPDATE_HEIGHT_WEIGHT");
                  })
                );

              })
            );
    }
  }

  getDateTime(): string {
    var date = new Date();

    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let day = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();

    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day) +
      "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));

    return returndate;
  }

  createObservationEventFilter() {
    let condition = 'person_id = @person_id and encounter_id = @encounter_id';

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam('person_id', this.appService.personId));
    pm.filterparams.push(new filterparam('encounter_id', this.appService.encounter.encounter_id));

    let select = new selectstatement('SELECT *');

    let orderby = new orderbystatement('ORDER BY 1 DESC');

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  createObservationFilter() {
    let condition = 'observationevent_id = @observationevent_id and eventcorrelationid = @eventcorrelationid and observationtype_id = @observationtype_id';

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam('observationevent_id', this.observationevent_id));
    pm.filterparams.push(new filterparam('eventcorrelationid', this.eventcorrelationid));
    pm.filterparams.push(new filterparam('observationtype_id', '71d6a339-7d9e-4054-99d6-683da95331dc'));

    let select = new selectstatement('SELECT *');

    let orderby = new orderbystatement('ORDER BY 1 DESC');

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
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
}
