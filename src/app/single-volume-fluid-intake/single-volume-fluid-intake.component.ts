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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from '../services/app.service';
import { SingleVoulmeFluidIntakeOutput, Routetype } from '../models/fluidbalance.model';
import { SubjectsService } from '../services/subjects.service';
import { FormType } from '../models/fluidbalance.enum';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';

@Component({
  selector: 'app-single-volume-fluid-intake',
  templateUrl: './single-volume-fluid-intake.component.html',
  styleUrls: ['./single-volume-fluid-intake.component.css']
})
export class SingleVolumeFluidIntakeComponent implements OnInit, OnDestroy {
  subscriptions: Subscription = new Subscription();   
  fluidbalancesessionroute_id: string;
  intakeOutput: SingleVoulmeFluidIntakeOutput;
  route_id: string;
  routeTypes: Routetype[];
  fluidbalanceintakeoutput_id: string;
  showSpinner: boolean = false;
  unit: string;
  personWeight: number;
  expectedVolume: number;
  ioType: string;
  age: number;
  formType : number;
  FormType = FormType;
  isamended : boolean = false;
  isremoved:boolean = false;
  datetime : Date;
  hour: number;
  minute : number;
  timeslot: Date;
  maxTime: Date = new Date();
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {       
      this.init();   
      // subscribe for new intake
      this.subscriptions.add(this.subjects.singleIntakeNew.subscribe
        ((event: any) => {    
          this.appService.logToConsole(event);         
          this.formType = this.FormType.New        
          this.appService.showSingleIntakeForm = true;
          this.fluidbalanceintakeoutput_id = uuidv4();          
          this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;
          this.route_id = event.route_id;
          this.isamended = false;
          this.isremoved = false;
          this.timeslot = event.timeslot;
          if(event.timeslot && event.timeslot.isValid()) {
            this.hour = moment(event.timeslot).get("hours");
            this.datetime = new Date(moment(this.appService.sessionStartDateTime).toDate().setHours(this.hour,0,0,0));
            
          }   
          else {
            this.hour = moment(new Date()).get("hours");
            this.minute = this.appService.IsNearestMinute(moment(new Date()).get("minutes"));
            //this.datetime = new Date(moment(new Date()).toDate().setHours(this.hour,this.minute,0,0));
            this.datetime = new Date(moment(this.appService.sessionStartDateTime).toDate().setHours(this.hour, this.minute,0,0));
          }   
          this.maxTime = this.datetime;    
          this.initComplete();           
        }));
        // subscribe for amend intake
        this.subscriptions.add(this.subjects.singleIntakeAmend.subscribe
          ((event: any) => {                        
            this.formType = this.FormType.Amend     
            this.appService.showSingleIntakeForm = true;
            this.isamended = true;
            this.isremoved =false;         
            this.fluidbalanceintakeoutput_id = event.fluidbalanceintakeoutput_id;
            this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;    
            this.route_id = event.route_id;                    
            this.initComplete();
            this.getFluidIntake(this.fluidbalanceintakeoutput_id);            
          }));
        // subscribe for remove intake  
        this.subscriptions.add(this.subjects.singleIntakeRemove.subscribe
            ((event: any) => {              
              this.formType = this.FormType.Remove     
              this.appService.showSingleIntakeForm = true;
              this.isremoved = true; 
              this.isamended = false;             
              this.fluidbalanceintakeoutput_id = event.fluidbalanceintakeoutput_id;
              this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id; 
              this.route_id = event.route_id;             
              this.initComplete();
              this.getFluidIntake(this.fluidbalanceintakeoutput_id);              
        }));
  }
  init() : void {        
    // initialize object and set mintue to zero   
    this.intakeOutput = new SingleVoulmeFluidIntakeOutput("",
      "",
      this.fluidbalancesessionroute_id,
      this.appService.personId,
      "", this.ioType, this.route_id, "",
      this.unit, this.datetime, 
      this.personWeight,
      this.expectedVolume, "", "",
      this.appService.loggedInUserName,
      this.appService.loggedInUserName, false, false, true, "", "","", 0);
  }  
  initComplete() :void {        
    this.ioType = this.appService.MetaIOType.find(x => x.iotype = "SI").fluidbalanceiotype_id;     
    this.routeTypes = this.appService.MetaRouteTypes.filter(x => x.route_id == this.route_id).sort( (a,b) => { return a.displayorder - b.displayorder });
    this.age = this.appService.getPatientCurrentAge();
    this.unit = "ml";    
    this.getExpectedVolume(); 
    this.intakeOutput.datetime= this.datetime;   
    this.intakeOutput.volume= 0;
    this.intakeOutput.routetype_id="";
  }


   ngOnInit(): void {     
    
  }

  isValid(event: boolean): boolean {
   return
  }
  validDatetime() {
    let currentDateTime = new Date();
    currentDateTime.setMilliseconds(0)
    currentDateTime.setSeconds(0)
    if(currentDateTime < this.intakeOutput.datetime) {
      return true;
    } else {
      return false;
    }
  }
  // submit the form 
  onSubmit() {
    this.intakeOutput.fluidbalanceintakeoutput_id = this.fluidbalanceintakeoutput_id;
    this.intakeOutput.fluidbalancesessionroute_id = this.fluidbalancesessionroute_id;
    this.intakeOutput.fluidbalancesession_id = this.appService.FluidBalanceSession.fluidbalancesession_id;
    this.intakeOutput.route_id = this.route_id;
    this.intakeOutput.expectedvolume = this.expectedVolume;
    this.intakeOutput.personweight = this.personWeight;
    this.intakeOutput.isamended = this.isamended;
    this.intakeOutput.isremoved = this.isremoved;
    this.intakeOutput.fluidbalanceiotype_id = this.ioType;
    this.intakeOutput.units = this.unit;
    this.intakeOutput.addedby = this.appService.loggedInUserName;
    this.intakeOutput.modifiedby = this.appService.loggedInUserName;
   
    // var date = new Date(this.intakeOutput.datetime);
    // if (this.formType == this.FormType.New) {
    //   if (date.getHours() < AppConfig.appsettings.sessionStartTime) {
    //     this.intakeOutput.datetime = moment(date).add(1, 'days');
    //   }
    // }
    this.appService.logToConsole(this.appService.getDateTimeinISOFormat(new Date(this.intakeOutput.datetime)));

    this.intakeOutput.datetime = this.appService.getDateTimeinISOFormat(new Date(this.intakeOutput.datetime));
    this.showSpinner = true;
    this.appService.logToConsole(this.intakeOutput);
    this.subscriptions.add(
      this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/AddUpdateRemoveSingleVolumeObservation/` + this.appService.personId +"/" + this.appService.encounter.encounter_id, JSON.stringify(this.intakeOutput))
        .subscribe((response) => {
          this.showSpinner = false;
          this.appService.showSingleIntakeForm = false;              
          this.subjects.drawChart.next();          
        })
    )

  }
  adjustFluidIntakeDate(event: boolean): void {
    this.appService.logToConsole(event);
    let StartHour = this.appService.sessionStartDateTime.getHours();
    if(this.intakeOutput.datetime) {
    let selectedHour = this.intakeOutput.datetime.getHours();
    this.intakeOutput.datetime.setFullYear(this.appService.sessionStartDateTime.getFullYear());
    this.intakeOutput.datetime.setMonth(this.appService.sessionStartDateTime.getMonth());
    this.intakeOutput.datetime.setDate(this.appService.sessionStartDateTime.getDate());
    if (StartHour > selectedHour) {
      this.intakeOutput.datetime.setDate(this.appService.sessionStartDateTime.getDate() + 1);
      
    }
     
   }
  }
   
  // get single voulme fluid intake
  getFluidIntake(id: string) {
    this.appService.logToConsole(id);    
    this.showSpinner = true;
    this.subscriptions.add(
      this.apiRequest.getRequest(this.appService.baseURI + '/GetObject?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&id=' + id)
        .subscribe((response) => {
          this.appService.logToConsole(response);
          this.intakeOutput = JSON.parse(response);  
          this.intakeOutput.datetime =  moment(this.intakeOutput.datetime).toDate(); 
          this.maxTime = this.intakeOutput.datetime;           
          this.showSpinner = false;          
        })
    )

  }
  getExpectedVolume() {
    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getweightobservations", this.createWeightFilter())
      .subscribe((response) => {
        if (response.length > 0) {
          if (response[0].value != "" || response[0].value != null)
            this.personWeight = parseFloat(response[0].value)
          else
            this.personWeight = 0;
        }
        else {
          this.personWeight = 0;
        }
        this.age = this.appService.personCurrentAge;
        this.expectedVolume = this.appService.expectedHourlyUrineOutput(this.age, this.personWeight);
      })
    );
  }
  close() {     
    this.appService.showSingleIntakeForm = false;
  }

  onHidden() {
    this.appService.showSingleIntakeForm = false;
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
  }

  clearTextboxValue(){
    if(this.intakeOutput.volume === 0){
      this.intakeOutput.volume = null;
    }
  }
}
