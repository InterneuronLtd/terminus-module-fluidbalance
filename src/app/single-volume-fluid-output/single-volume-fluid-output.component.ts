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
import { SingleVoulmeFluidIntakeOutput, Routetype, Fluidcapturedevice, Expectedurineoutput } from '../models/fluidbalance.model';
import { SubjectsService } from '../services/subjects.service';
import { FormType } from '../models/fluidbalance.enum';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';


@Component({
  selector: 'app-single-volume-fluid-output',
  templateUrl: './single-volume-fluid-output.component.html',
  styleUrls: ['./single-volume-fluid-output.component.css']
})
export class SingleVolumeFluidOutputComponent implements OnInit, OnDestroy {

  subscriptions: Subscription = new Subscription();   
  fluidbalancesessionroute_id: string;
  intakeOutput: SingleVoulmeFluidIntakeOutput;
  route_id: string;
  routeTypes: Routetype[];
  deviceTypes: Fluidcapturedevice[];
  fluidbalanceintakeoutput_id: string;
  showSpinner: boolean = false;
  unit: string;
  personWeight: number;
  expectedVolume: number;
  ioType: string;
  age: number;
  formType : number;
  FormType = FormType;
  isamended : boolean;
  isremoved:boolean;
  datetime : Date;
  hour: number;
  minute : number;
  routename : string;
  showExpectedUrineOutputMonitoring: boolean =false;
  maxTime: Date = new Date();
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { 
      this.init();   
      // subscribe for new intake
      this.subscriptions.add(this.subjects.singleOutputNew.subscribe
        ((event: any) => {    
          this.appService.logToConsole(event);         
          this.formType = this.FormType.New
          this.hour = moment(event.timeslot).get("hours");          
          this.appService.showSingleOutputForm = true;
          this.fluidbalanceintakeoutput_id = "";          
          this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;
          this.route_id = event.route_id;
          this.isamended =false;
          this.isremoved =false;
          if(event.timeslot) {
            this.datetime = new Date(moment(this.appService.sessionStartDateTime).toDate().setHours(this.hour,0,0,0));
          }   
          else {
            this.hour = moment(new Date()).get("hours");
            this.minute = this.appService.IsNearestMinute(moment(new Date()).get("minutes"));
            this.datetime = new Date(moment(this.appService.sessionStartDateTime).toDate().setHours(this.hour,this.minute,0,0));
            //this.datetime = new Date(moment(this.appService.sessionStartDateTime).toDate().setHours(0,0,0,0));
          }       
          this.maxTime = this.datetime;  
          this.initComplete();
          this.appService.logToConsole("New Click");
        }));
        // subscribe for amend intake
        this.subscriptions.add(this.subjects.singleOutputAmend.subscribe
          ((event: any) => {                        
            this.formType = this.FormType.Amend     
            this.appService.showSingleOutputForm = true;
            this.isamended = true;
            this.isremoved =false;
            this.fluidbalanceintakeoutput_id = event.fluidbalanceintakeoutput_id;
            this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;  
            this.route_id = event.route_id;
            this.initComplete();          
            this.getFluidIntake(this.fluidbalanceintakeoutput_id);
          
            
          }));
        // subscribe for remove intake  
        this.subscriptions.add(this.subjects.singleOutputRemove.subscribe
            ((event: any) => {              
              this.formType = this.FormType.Remove     
              this.appService.showSingleOutputForm = true;
              this.isremoved = true;
              this.isamended = false;
              this.fluidbalanceintakeoutput_id = event.fluidbalanceintakeoutput_id;
              this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;
              this.route_id = event.route_id;    
              this.initComplete();          
              this.getFluidIntake(this.fluidbalanceintakeoutput_id);
            
              
        }));
        // save single volume output with SBR FORM
        this.subscriptions.add(this.subjects.saveUrineOuputAndSBARForm.subscribe
          ((event: any) => {   
            this.showSpinner = true;           
            this.subscriptions.add(
              this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/AddUpdateRemoveSingleVolumeObservation/` + this.appService.personId +"/" + this.appService.encounter.encounter_id, JSON.stringify(this.intakeOutput))
                .subscribe((response) => {
                  this.fluidbalanceintakeoutput_id = JSON.parse(response)[0].fluidbalanceintakeoutput_id;    
                  this.showSpinner = false;                    
                  this.subjects.drawChart.next();  
                  event.sbar.fluidbalanceintakeoutput_id = this.fluidbalanceintakeoutput_id;
                  /// save SBR Form              
                  this.subscriptions.add(
                    this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalanceescalation", JSON.stringify(event.sbar))
                      .subscribe((response) => {         
                        this.appService.showSBAREscalationForm =false;                        
                      })
                  )
                })
            )
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
      this.appService.loggedInUserName, false, false, false, "", "","", 0);
  }  
  initComplete() :void {        
    this.routename = this.appService.MetaRoutes.find(x=>x.route_id===this.route_id).route;
    this.ioType = this.appService.MetaIOType.find(x => x.iotype = "SO").fluidbalanceiotype_id;     
    this.routeTypes = this.appService.MetaRouteTypes.filter(x => x.route_id == this.route_id && x.routetype != 'Dilute').sort( (a,b) => { return a.displayorder - b.displayorder });
    this.deviceTypes =[];
    this.age = this.appService.getPatientCurrentAge();
    this.unit = "ml";    
    this.getExpectedVolume();
    this.intakeOutput.fluidbalancesession_id =  this.appService.FluidBalanceSession.fluidbalancesession_id
    this.intakeOutput.fluidbalancesessionroute_id  =this.fluidbalancesessionroute_id;
    this.intakeOutput.person_id = this.appService.personId;
    this.intakeOutput.fluidbalanceiotype_id =this.ioType;
    this.intakeOutput.route_id =this.route_id;
    this.intakeOutput.units =this.unit; 
    this.intakeOutput.datetime= this.datetime;   
    this.intakeOutput.volume= 0;
    this.intakeOutput.routetype_id=""; 
    this.intakeOutput.fluidcapturedevice_id ="";  
  }
   ngOnInit(): void {     
    
  }

  // submit the form 
  onSubmit() {
    const outputdata = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === this.fluidbalancesessionroute_id && x.isintake === false && x.route_id===this.route_id && !x.isremoved).slice().sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());    
    var startTime;
    var endTime = this.intakeOutput.datetime;      
    if(outputdata.length>0 ) {
      startTime = outputdata[0].datetime;
    } else {
      startTime = this.appService.sessionStartDateTime;
    }
    var flowRate = this.appService.getUrineCatheterFlowrateTotal(startTime, endTime);   
    this.intakeOutput.fluidbalanceintakeoutput_id = this.fluidbalanceintakeoutput_id;
    this.intakeOutput.expectedvolume = this.expectedVolume + flowRate.fr;
    this.intakeOutput.personweight = this.appService.FluidBalanceSession.initialweight;
    this.intakeOutput.isamended = this.isamended;
    this.intakeOutput.isremoved = this.isremoved;
    this.intakeOutput.addedby = this.appService.loggedInUserName;
    this.intakeOutput.modifiedby = this.appService.loggedInUserName;  
    this.intakeOutput.datetime = this.appService.getDateTimeinISOFormat(new Date(this.intakeOutput.datetime));       
    if(this.isremoved===false && this.isamended===false && this.routename==="Urine"){
      this.isExpectedHourlyUrineOutputMonitoring(startTime, endTime, flowRate.frt, outputdata)
    } else {
        this.saveSingleVolumeOutput();
    }

  }
  saveSingleVolumeOutput() {
    this.showSpinner = true;
    this.intakeOutput.isintake = false;  
    this.subscriptions.add(
      this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/AddUpdateRemoveSingleVolumeObservation/` + this.appService.personId +"/" + this.appService.encounter.encounter_id, JSON.stringify(this.intakeOutput))
        .subscribe((response) => {
          this.fluidbalanceintakeoutput_id = JSON.parse(response)[0].fluidbalanceintakeoutput_id;    
          this.showSpinner = false;
          this.appService.showSingleOutputForm = false;            
          this.subjects.drawChart.next();               
        })
    )
  }
   
  isExpectedHourlyUrineOutputMonitoring(startTime: any, endTime: any, flowrate: number , outputdata: any) {            
    var averageUrineOutput=0;  
    var lastVolume = 0 ;
    if(outputdata.length>0) {
      lastVolume = outputdata[0].volume;
    } 
    startTime =moment(startTime);
    endTime= moment(this.appService.getDateTimeinISOFormat(new Date(endTime)));
    const step = endTime.diff(startTime, "hour", true)  
    this.appService.logToConsole(startTime);  
    this.appService.logToConsole(endTime);  
    averageUrineOutput = ((step * this.expectedVolume) + flowrate);        
    this.appService.logToConsole("averageUrineOutput" + averageUrineOutput);   
    this.appService.logToConsole("flowrate" + flowrate);  
    this.appService.logToConsole("step" + step);    
    if(this.intakeOutput.volume < averageUrineOutput){
        this.showExpectedUrineOutputMonitoring =true;        
        this.appService.showSingleOutputForm = false;    
    } else {
        this.showExpectedUrineOutputMonitoring =false;
        this.saveSingleVolumeOutput();
    }
  }
  getDeviceType(routetype_id: string) {
    this.deviceTypes = [];
    var allroutedevice = this.appService.MetaRouteTypeFluidCaptureDevices.filter(x=>x.routetype_id== routetype_id);
    for(const device of allroutedevice) {
      this.deviceTypes.push(this.appService.MetaFluidCaptureDevices.find(x=>x.fluidcapturedevice_id==device.fluidcapturedevice_id));
    }   
  }
  getSelectedRouteDeviceType(routetype_id: string) {
    this.deviceTypes = [];
    var allroutedevice = this.appService.MetaRouteTypeFluidCaptureDevices.filter(x=>x.routetype_id== routetype_id);
    for(const device of allroutedevice) {
      this.deviceTypes.push(this.appService.MetaFluidCaptureDevices.find(x=>x.fluidcapturedevice_id==device.fluidcapturedevice_id));
    } 
    this.intakeOutput.fluidcapturedevice_id = "";
  }
  adjustFluidOuputDate(event: boolean): void {
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
    //this.maxTime  = this.intakeOutput.datetime;
   }
  }
  // get single voulme fluid intake
  getFluidIntake(id: string) {
    this.appService.logToConsole(id);
    this.showSpinner = true;
    this.subscriptions.add(
      this.apiRequest.getRequest(this.appService.baseURI + '/GetObject?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&id=' + id)
        .subscribe((response) => {
          this.intakeOutput = JSON.parse(response); 
          this.intakeOutput.datetime =  moment(this.intakeOutput.datetime).toDate(); 
          this.getDeviceType(this.intakeOutput.routetype_id);          
          this.showSpinner = false;  
          this.maxTime = this.intakeOutput.datetime;                    
          //this.appService.logToConsole(this.isExpectedHourlyUrineOutputMonitoring()); 
        })
    )

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
  getExpectedVolume() {
    // this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getweightobservations", this.createWeightFilter())
    //   .subscribe((response) => {
    //     if (response.length > 0) {
    //       if (response[0].value != "" || response[0].value != null)
    //         this.personWeight = parseFloat(response[0].value)
    //       else
    //         this.personWeight = 0;
    //     }
    //     else {
    //       this.personWeight = 0;
    //     }
    //     this.age = this.appService.personCurrentAge;
    //     this.expectedVolume = this.appService.expectedHourlyUrineOutput(this.age, this.personWeight);
    //   })
    // );

    if (this.appService.IsCurrentDaySession()) {
      this.subscriptions.add(
        this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/CalculateExpectedUrineOutput/` + this.appService.personId + "/" + this.appService.encounter.encounter_id)
          .subscribe((response) => {
            this.expectedVolume = response;
          })
      )
    }
    else {
      //get weight = check if there are any entries in fluidbalanceintakeoutput for urine output and take the last entry of weight max(Dateadded) else take weight from appervice.fluidbalancesession
      // get the age from appservice.fluidbalancesession
      // calculate expectedurine output      
      this.expectedVolume = this.appService.expectedHourlyUrineOutputRetro();
    }
  }
  acceptSBAR () {
    this.appService.showSingleOutputForm =false;
    this.showExpectedUrineOutputMonitoring =false;
    this.subjects.openSBARForm.next({status: "Accepted", fluidbalanceintakeoutput_id : this.fluidbalanceintakeoutput_id});
  }
  notRequiredSBAR () {
    this.appService.showSingleOutputForm =false;
    this.showExpectedUrineOutputMonitoring =false;
    this.subjects.openSBARForm.next({status: "Not Required", fluidbalanceintakeoutput_id : this.fluidbalanceintakeoutput_id});
  }
  close() {     
    this.appService.showSingleOutputForm = false;
  }
  closeMonttoring() {
    this.showExpectedUrineOutputMonitoring =false;
  }
  onHidden() {
    this.appService.showSingleOutputForm = false;
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
