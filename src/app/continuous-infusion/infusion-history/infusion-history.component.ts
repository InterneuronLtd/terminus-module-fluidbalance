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
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CoreContinuousinfusion, CoreContinuousinfusionevent, CoreContinuousinfusionvalidation, CoreContinuousinfusionfluidloss } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from 'src/app/models/Filter.model';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { Fluidbalanceintakeoutput } from 'src/app/models/fluidbalance.model';

@Component({
  selector: 'app-infusion-history',
  templateUrl: './infusion-history.component.html',
  styleUrls: ['./infusion-history.component.css'],
  providers: [UpsertTransactionManager]
})
export class InfusionHistoryComponent implements OnInit,OnDestroy {

  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService, ) { }
  subscriptions: Subscription = new Subscription();
  timepicker: Date = new Date();

  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  @Output() reFreshMenu = new EventEmitter();

  continuousinfusionHistory: any;
  Showhistory: boolean = false;
  invalideDateMessage: string = "";

  reasonForRemove: string = "";

  deleteableEventid: string = "";
  reasonforremoval: string = "";

  minTime: Date = new Date();
  maxTime: Date = new Date();

  pausedEventdate:Date= new Date();;

  ngOnInit(): void {

    let varb = this.createEncounterFilter();
    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_cieventshistory", varb).subscribe(
      (response) => {
        this.continuousinfusionHistory = response;
        this.continuousinfusionHistory.sort((a, b) => b._sequenceid - a._sequenceid);
        let alldeletableevent = this.continuousinfusionHistory.filter(x => x.eventtype != 'start' && x.eventtype != 'removed');
       
        // alldeletableevent = alldeletableevent.filter(x => x.eventtype != 'removed');
        if (this.coreContinuousinfusion.ispaused) {
          let pauseEvent=this.continuousinfusionHistory.filter(x => x.eventtype == 'pause');
          this.pausedEventdate=new Date(moment(pauseEvent[0].datetime,moment.ISO_8601).toString());
          this.getdates();
        }
        if (alldeletableevent.length > 0) {
          alldeletableevent.sort((a, b) => b._sequenceid - a._sequenceid);
          this.deleteableEventid = alldeletableevent[0].continuousinfusionevent_id;
        }
        this.Showhistory = true;
      }));
    

  }

  deleteEvent(deletEvent: CoreContinuousinfusionevent) {

    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    let removeEventid = uuidv4();
    let removeEvent = this.continuousInfusionEvents(removeEventid, "removed", this.appService.getDateTimeinISOFormat(new Date()), this.coreContinuousinfusion.continuousinfusion_id, deletEvent.continuousinfusionevent_id);


    if (deletEvent.eventtype == 'pause') {
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
      this.coreContinuousinfusion.eventcorrelationid = removeEventid;
      this.coreContinuousinfusion.ispaused = false;
      this.coreContinuousinfusion.reasonforpause = "";
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      this.upsertManager.save((res) => {
        this.reFreshMenu.emit("refresh");
      },
        (error) => {
          // this.validationErrors = error;
        }
      );
    }
    else if (deletEvent.eventtype == 'restart') {
      this.coreContinuousinfusion.eventcorrelationid = removeEventid;
      this.coreContinuousinfusion.ispaused = true;
      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
      this.upsertManager.save((res) => {
        this.reFreshMenu.emit("refresh");
      },
        (error) => {
          // this.validationErrors = error;
        }
      );
    }
    else if (deletEvent.eventtype == 'pumpnumber') {

      let varb = this.createEncounterFilter();
      this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_cigetpreviousvalue", varb).subscribe(
        (response) => {
        
          let previousvalue = response.filter(x => x.eventtype == 'pumpnumber' && x.rownum == 2);
          if (previousvalue.length == 0) {
           previousvalue =   response.filter(x => x.eventtype == 'start' && x.rownum == 1);
          
          }

          if (previousvalue.length > 0) {
          this.coreContinuousinfusion.pumpnumber = previousvalue[0].pumpnumber;

          this.coreContinuousinfusion.eventcorrelationid = removeEventid;

          this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
          this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));


            this.upsertManager.save((res) => {
              this.reFreshMenu.emit("refresh");
            },
              (error) => {
                // this.validationErrors = error;
              }
            );
          }
        }));
    }
    else if (deletEvent.eventtype == 'flowrate') {

      let varb = this.createEncounterFilter();
      this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_cigetpreviousvalue", varb).subscribe(
        (response) => {


          let previousvalue = response.filter(x => x.eventtype == 'flowrate' && x.rownum == 2);
          if (previousvalue.length == 0) {
            previousvalue = response.filter(x => x.eventtype == 'start' && x.rownum == 1);
          }
          if (previousvalue.length > 0) {
            this.coreContinuousinfusion.flowrate = previousvalue[0].flowrate;

            this.coreContinuousinfusion.eventcorrelationid = removeEventid;

            this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
            this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));


            this.upsertManager.save((res) => {
              this.reFreshMenu.emit("refresh");
            },
              (error) => {
                // this.validationErrors = error;
              }
            );
          }
        }));
    }
    else if (deletEvent.eventtype == 'fluidloss') {

      this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionfluidloss&synapseattributename=eventcorrelationid&attributevalue=" + deletEvent.continuousinfusionevent_id).subscribe(
        (response) => {
          let FLose = <CoreContinuousinfusionfluidloss[]>JSON.parse(response);
          this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume + FLose[0].volume);

          this.coreContinuousinfusion.eventcorrelationid = removeEventid;
          FLose[0].eventcorrelationid = removeEventid;
          FLose[0].isremoved=true;
          this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
          this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
          this.upsertManager.addEntity('core', 'continuousinfusionfluidloss', JSON.parse(JSON.stringify(FLose[0])));

          this.upsertManager.save((res) => {
            this.reFreshMenu.emit("refresh");
          },
            (error) => {
              // this.validationErrors = error;
            }
          );
        }));
    }

    else if (deletEvent.eventtype == 'Bolus') {

      this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&synapseattributename=continuousinfusionevent_id&attributevalue=" + deletEvent.continuousinfusionevent_id).subscribe(
        (responseinput) => {
          let FBinput = <Fluidbalanceintakeoutput[]>JSON.parse(responseinput);
          this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume + FBinput[0].volume);
          this.coreContinuousinfusion.totaladministeredvolume = (this.coreContinuousinfusion.totaladministeredvolume - FBinput[0].volume);
          this.coreContinuousinfusion.eventcorrelationid = removeEventid;

          this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
          this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
          FBinput[0].isremoved = true;
          FBinput[0].reasonforremoval = this.reasonForRemove;
          FBinput[0].continuousinfusionevent_id = removeEventid;
          this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(FBinput[0])));

          this.upsertManager.save((res) => {
            this.reFreshMenu.emit("refresh");
          },
            (error) => {
              // this.validationErrors = error;
            }
          );

        }));
    }
    else if (deletEvent.eventtype == 'Flush') {

      this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&synapseattributename=continuousinfusionevent_id&attributevalue=" + deletEvent.continuousinfusionevent_id).subscribe(
        (responseinput) => {
          let FBinput = <Fluidbalanceintakeoutput[]>JSON.parse(responseinput);
          this.coreContinuousinfusion.eventcorrelationid = removeEventid;
          this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
          this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
          FBinput[0].isremoved = true;
          FBinput[0].reasonforremoval = this.reasonForRemove;
          FBinput[0].continuousinfusionevent_id = removeEventid;
          this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(FBinput[0])));

          this.upsertManager.save((res) => {
            this.reFreshMenu.emit("refresh");
          },
            (error) => {
              // this.validationErrors = error;
            }
          );
        }));
    }
    else if (deletEvent.eventtype == 'validation') {
      this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionvalidation&synapseattributename=eventcorrelationid&attributevalue=" + deletEvent.continuousinfusionevent_id).subscribe(
        (response) => {
          let validation = <CoreContinuousinfusionvalidation[]>JSON.parse(response);
          validation[0].isremoved = true;
          validation[0].eventcorrelationid = removeEventid
          this.coreContinuousinfusion.eventcorrelationid = removeEventid;
          this.coreContinuousinfusion.totaladministeredvolume = (this.coreContinuousinfusion.totaladministeredvolume - validation[0].administeredvolume);
          this.coreContinuousinfusion.totalremainingvolume = (this.coreContinuousinfusion.totalremainingvolume + validation[0].administeredvolume);
          this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&synapseattributename=continuousinfusionevent_id&attributevalue=" + deletEvent.continuousinfusionevent_id).subscribe(
            (responseinput) => {
              let FBinputlist = <Fluidbalanceintakeoutput[]>JSON.parse(responseinput);
              this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(removeEvent)));
              this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));
              this.upsertManager.addEntity('core', 'continuousinfusionvalidation', JSON.parse(JSON.stringify(validation[0])));
              for (var FBinput of FBinputlist) {

                FBinput.isremoved = true;
                FBinput.reasonforremoval = this.reasonForRemove;
                FBinput.continuousinfusionevent_id = removeEventid;
                this.upsertManager.addEntity('core', 'fluidbalanceintakeoutput', JSON.parse(JSON.stringify(FBinput)));
              }
              this.upsertManager.save((res) => {
                this.reFreshMenu.emit("refresh");
              },
                (error) => {
                  // this.validationErrors = error;
                }
              );
            }));
        }));
    }

  }
  getdates() {

    if (moment(this.appService.sessionStartDateTime).format("MMDDYYYY:HH") > moment(this.timepicker).format("MMDDYYYY:HH")) {
      this.minTime = this.appService.sessionStartDateTime;
    }
    else {
      this.minTime = new Date(moment(this.pausedEventdate,moment.ISO_8601).toString());
      // this.minTime.setMinutes(this.minTime.getMinutes() + 15);
    }


    let TempMinutes = new Date().getMinutes();
    if (TempMinutes >= 45) {

      this.maxTime.setMinutes(45);
    }
    else if (TempMinutes >= 30) {
      this.maxTime.setMinutes(30);
    }
    else if (TempMinutes >= 15) {
      this.maxTime.setMinutes(15);
    }
    else if (TempMinutes >= 0) {
      this.maxTime.setMinutes(0);
    }
    this.maxTime.setMilliseconds(0);
    this.maxTime.setSeconds(0);
    this.timepicker = new Date(moment(this.maxTime,moment.ISO_8601).toString());
    this.isValid(null);
  }

  isValid(event: boolean): void {
    this.invalideDateMessage = "";
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
      this.invalideDateMessage = "Please select time which is greater than or equal to Pause time";
    }
    if (this.timepicker > this.maxTime) {
      this.invalideDateMessage = "Please select time which is less than current time";
    }

  }
  createEncounterFilter() {
    let condition = "continuousinfusion_id = @continuousinfusion_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("continuousinfusion_id", this.coreContinuousinfusion.continuousinfusion_id));


    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 2");

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

  reStartInfusion() {
    if (this.invalideDateMessage != "") {

      return;
    }
    else {

      this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

      let restartEventid = uuidv4();
      this.coreContinuousinfusion.eventcorrelationid = restartEventid;
      this.coreContinuousinfusion.ispaused = false;
      this.coreContinuousinfusion.reasonforpause = "";
      let pumpnumberEvent = this.continuousInfusionEvents(restartEventid, "restart", this.appService.getDateTimeinISOFormat(this.timepicker), this.coreContinuousinfusion.continuousinfusion_id, "");

      this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(pumpnumberEvent)));
      this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));

      this.upsertManager.save((res) => {

        this.reFreshMenu.emit("refresh");
      },
        (error) => {
          this.invalideDateMessage = error;
        }
      );

    }



  }

  continuousInfusionEvents(
    Eventid: string,
    EventType: string,
    DateTime: any,
    ContinuousInfusion_ID: string,
    deletecorrelationid: string
  ) {
    let coreContinuousinfusionevent: CoreContinuousinfusionevent;
    coreContinuousinfusionevent = new CoreContinuousinfusionevent();
    coreContinuousinfusionevent.continuousinfusionevent_id = Eventid;
    coreContinuousinfusionevent.continuousinfusion_id = ContinuousInfusion_ID;
    coreContinuousinfusionevent.eventcorrelationid = "";
    coreContinuousinfusionevent.datetime = DateTime;
    coreContinuousinfusionevent.eventtype = EventType;
    coreContinuousinfusionevent.deletecorrelationid = deletecorrelationid;
    coreContinuousinfusionevent.addedby = this.appService.loggedInUserName;
    coreContinuousinfusionevent.modifiedby = this.appService.loggedInUserName;
    return coreContinuousinfusionevent;
  }

  CloseCIPopup(){
    this.subjects.closeCIPopup.next();
  }

}
