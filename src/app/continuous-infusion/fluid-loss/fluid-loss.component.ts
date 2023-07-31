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
import { Component, OnInit, Input, Output ,EventEmitter, OnDestroy } from '@angular/core';
import { CoreContinuousinfusion, CoreContinuousinfusionfluidloss, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { v4 as uuidv4 } from 'uuid';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { Subscription } from 'rxjs';
import * as moment from 'moment';


@Component({
  selector: 'app-fluid-loss',
  templateUrl: './fluid-loss.component.html',
  styleUrls: ['./fluid-loss.component.css'],
  providers:[UpsertTransactionManager]
})
export class FluidLossComponent implements OnInit , OnDestroy  {

  completInfusionenow: boolean = false;

  isLineremoved: boolean = false;

  remainingfluid:number=10;

  infusionComplete: boolean = false;

  timepicker: Date;

  minTime: Date = new Date();

  validationErrors:string="";

  subscriptions: Subscription = new Subscription();
  @Input() selectedTimeslot: Date;
  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Output() reFreshMenu =new EventEmitter();
  
  coreContinuousinfusionfluidloss: CoreContinuousinfusionfluidloss;


  constructor(private upsertManager:UpsertTransactionManager,private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { }
  ngOnDestroy(): void {
    this.upsertManager.destroy();
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.remainingfluid= this.coreContinuousinfusion.totalremainingvolume;
    this.coreContinuousinfusionfluidloss = new CoreContinuousinfusionfluidloss();
    this.coreContinuousinfusionfluidloss.volume = 0;
 
   
    this.timepicker =new Date();
    if(moment(this.selectedTimeslot).isValid()) {
      this.timepicker = new Date(moment(this.selectedTimeslot).toDate().setHours(moment(this.selectedTimeslot).get("hours"), 0, 0, 0));
    } else {
      this.gettimerdate();
    }
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
      (response) => {

        let allevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start');

        this.minTime = new Date(moment(allevent[allevent.length - 1].datetime,moment.ISO_8601).toString());

        this.isValid(true);

      }));
  }
  gettimerdate() {

    let TempMinutes = new Date().getMinutes();
    if (TempMinutes >= 45) {

      this.timepicker.setMinutes(45);
    }
    else if (TempMinutes >= 30) {
      this.timepicker.setMinutes(30);
    }
    else if (TempMinutes >= 15) {
      this.timepicker.setMinutes(15);
    }
    else if (TempMinutes >= 0) {
      this.timepicker.setMinutes(0);
    }
    this.timepicker.setMilliseconds(0);
    this.timepicker.setSeconds(0);

  }
  isValid(event: boolean): void {
    this.validationErrors ="";
    let StartHour = this.appService.sessionStartDateTime.getHours();
    let selectedHour = this.timepicker.getHours();
    this.timepicker.setFullYear(this.appService.sessionStartDateTime.getFullYear());
    this.timepicker.setMonth(this.appService.sessionStartDateTime.getMonth());
    this.timepicker.setDate(this.appService.sessionStartDateTime.getDate());
    if (StartHour > selectedHour) {
      this.timepicker.setDate(this.appService.sessionStartDateTime.getDate() + 1);
    }
    // else {
    //   this.timepicker.setMonth(this.appService.sessionStartDateTime.getMonth());
    //   this.timepicker.setDate(this.appService.sessionStartDateTime.getDate());

    // }
    if (this.timepicker < this.minTime) {
      this.validationErrors = "Please select time greater than infusion start time"
    }
  }

  fluioLostchange() {
    this.infusionComplete = false;
    if (this.coreContinuousinfusionfluidloss.volume > this.coreContinuousinfusion.totalremainingvolume) {
      this.coreContinuousinfusionfluidloss.volume = 0;

    }
    if (this.coreContinuousinfusionfluidloss.volume == this.coreContinuousinfusion.totalremainingvolume) {
      this.infusionComplete = true;
    }
  }
  continuousInfusionEvents(
    Eventid: string,
    EventType: string,
    DateTime: any,
    ContinuousInfusion_ID: string
  ) {
    let coreContinuousinfusionevent: CoreContinuousinfusionevent;
    coreContinuousinfusionevent = new CoreContinuousinfusionevent();
    coreContinuousinfusionevent.continuousinfusionevent_id = Eventid;
    coreContinuousinfusionevent.continuousinfusion_id = ContinuousInfusion_ID;
    coreContinuousinfusionevent.eventcorrelationid = "";
    coreContinuousinfusionevent.datetime = DateTime;
    coreContinuousinfusionevent.eventtype = EventType;
    coreContinuousinfusionevent.addedby=this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby=this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
  }

  recordFluidLoss() { 
    this.validationErrors ="";
    if (this.timepicker < this.minTime) {
      this.validationErrors = "Please select time greater than infusion start time"
      return;
    }
    if (this.coreContinuousinfusionfluidloss.volume > 0) {

      let FLEventid = uuidv4();
      this.coreContinuousinfusionfluidloss.continuousinfusionfluidloss_id = uuidv4();
      this.coreContinuousinfusionfluidloss.continuousinfusion_id = this.coreContinuousinfusion.continuousinfusion_id;
      this.coreContinuousinfusionfluidloss.datetime = this.appService.getDateTimeinISOFormat(this.timepicker);
      this.coreContinuousinfusionfluidloss.eventcorrelationid = FLEventid;

      this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
     
     
      let fluidLossEvent = this.continuousInfusionEvents(FLEventid, "fluidloss", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);

      this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume - this.coreContinuousinfusionfluidloss.volume);     
      this.coreContinuousinfusion.eventcorrelationid = FLEventid;

      this.upsertManager.addEntity('core', 'continuousinfusionfluidloss', JSON.parse(JSON.stringify(this.coreContinuousinfusionfluidloss)));
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(fluidLossEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
    

      if (this.completInfusionenow) {

        let completeEventid = uuidv4();
        let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id);
        this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
        this.coreContinuousinfusion.islineremovedoncompletion = this.isLineremoved;
        this.coreContinuousinfusion.finishdatetime = this.appService.getDateTimeinISOFormat(this.timepicker)
        this.coreContinuousinfusion.eventcorrelationid = completeEventid;

        this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      }

      this.upsertManager.save((res) => {
        this.appService.logToConsole(res);
      
        this.reFreshMenu.emit("refresh");
      },
        (error) => {
          this.validationErrors = error;
        }
      );

    }
    else {
      this.validationErrors = "Please enter a volume amount which is greater than zero.";
    }


  }
}
