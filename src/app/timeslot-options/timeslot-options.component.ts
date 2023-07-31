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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SubjectsService } from '../services/subjects.service';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { TimeslotOption } from '../models/timeslotoption.model';
import * as moment from 'moment';

@Component({
  selector: 'app-timeslot-options',
  templateUrl: './timeslot-options.component.html',
  styleUrls: ['./timeslot-options.component.css']
})

export class TimeslotOptionsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription = new Subscription();
  timeslotOption: TimeslotOption[];
  fluidbalancesessionroute_id: string;
  ioTypeId: string;  
  timeslot: moment.Moment;
  routeId: string;
  routename : string;
  iscontinuousinfusion: boolean = false;
  isintake: boolean = true;
  hasTimeslot: boolean;
  continuousinfusioncount: number;
  ioTypeSI : string;
  ioTypeSO: string;
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {
    this.subscriptions.add(this.subjects.openTimeSlotOptions.subscribe
      ((event: any) => {
        this.appService.logToConsole("timeslot clicked");
        this.appService.logToConsole(event);
        this.iscontinuousinfusion = false;           
        this.appService.showTimeSlotWindow = true;
        this.fluidbalancesessionroute_id = event.fluidbalancesessionroute_id;  
        this.routeId = event.route_id;      
        this.timeslot = moment(event.timeslot);

        this.appService.selectedTimeSlot = this.timeslot;
        this.appService.logToConsole("this.appService.selectedTimeSlot: " + this.appService.selectedTimeSlot);

        var routedata  = this.appService.MetaRoutes.find(x => x.route_id == this.routeId);       
        this.routename = routedata.route;        
        this.isintake = routedata.isintake;
        this.timeslotOption = [];
        if(this.timeslot.isValid()){
            this.ioTypeSI = this.appService.MetaIOType.find(x => x.iotype = "SI").fluidbalanceiotype_id;                            
            this.ioTypeSO = this.appService.MetaIOType.find(x => x.iotype = "SO").fluidbalanceiotype_id;                            
            this.appService.logToConsole(this.appService.FluidBalanceIntakeOutput);
            const iodata = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === this.fluidbalancesessionroute_id && moment(x.datetime).format("MMDDYYYY:HH") === this.timeslot.format("MMDDYYYY:HH") && x.isintake==this.isintake && (x.fluidbalanceiotype_id===this.ioTypeSI || x.fluidbalanceiotype_id===this.ioTypeSO)).sort((a, b) => { return ((a.datetime as Date) > (b.datetime as Date)) ? 0 : -1; });                
            for (const io of iodata) {
              var intake = new TimeslotOption();
              intake.fluidbalanceintakeoutput_id = io.fluidbalanceintakeoutput_id;
              intake.continuousinfusion_id = io.continuousinfusion_id;
              intake.volume = io.volume;
              intake.units = io.units;
              intake.isintake = io.isintake;
              intake.isremoved = io.isremoved;
              intake.datetime = io.datetime;
              if(this.appService.MetaRouteTypes.find(x => x.routetype_id == io.routetype_id))
                intake.routeType = this.appService.MetaRouteTypes.find(x => x.routetype_id == io.routetype_id).routetype;
              this.timeslotOption.push(intake);
            
            }
            for (const ci of event.continuousinfusion) {
              var intake = new TimeslotOption();
              intake.fluidbalanceintakeoutput_id = "";
              intake.continuousinfusion_id = ci.continuousinfusion_id;
              intake.volume = ci.flowrate;
              intake.units = ci.flowrateunit;
              intake.isintake = true;
              intake.isremoved = false;
              intake.datetime = ci.startdatetime;
              intake.pumpnumber = ci.pumpnumber;
              intake._createdDate = ci._createddate;
              intake.totalvolume = ci.totalvolume;
              intake.ispaused = ci.ispaused;
              intake.finishdatetime = ci.finishdatetime;
              if(this.appService.MetaRouteTypes.find(x => x.routetype_id == ci.routetype_id))
                intake.routeType = this.appService.MetaRouteTypes.find(x => x.routetype_id == ci.routetype_id).routetype;
              this.timeslotOption.push(intake);
              
            }
            this.timeslotOption.sort((a, b) => new Date(a._createdDate).getTime() - new Date(b._createdDate).getTime()).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
            
         } else {                             
              this.continuousinfusioncount = event.continuousinfusion.length ;
              for (const ci of event.continuousinfusion) {
                var intake = new TimeslotOption();
                intake.fluidbalanceintakeoutput_id = "";
                intake.continuousinfusion_id = ci.continuousinfusion_id;
                intake.volume = ci.flowrate;
                intake.units = ci.flowrateunit;
                intake.isintake = true;
                intake.isremoved = false;
                intake.datetime = ci.startdatetime;
                intake.pumpnumber = ci.pumpnumber;
                intake._createdDate = ci._createddate;
                intake.totalvolume = ci.totalvolume;
                intake.ispaused = ci.ispaused;
                intake.finishdatetime = ci.finishdatetime;
                if(this.appService.MetaRouteTypes.find(x => x.routetype_id == ci.routetype_id))
                  intake.routeType = this.appService.MetaRouteTypes.find(x => x.routetype_id == ci.routetype_id).routetype;
                this.timeslotOption.push(intake);
              }
              this.timeslotOption.sort((a, b) => new Date(a._createdDate).getTime() - new Date(b._createdDate).getTime()).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
              this.iscontinuousinfusion = false;  
         }


         this.iscontinuousinfusion = this.appService.MetaRoutes.find(x => x.route_id == this.routeId).iscontinuousinfusion;
         
        //  if(!this.isintake)   {
        //   this.appService.showTimeSlotWindow = false;   
        //   this.subjects.singleOutputNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot , route_id: this.routeId });
        // } else {
        //   
        //   // if (this.iscontinuousinfusion == false) {
        //   //   this.subjects.singleIntakeNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id , timeslot : this.timeslot, route_id: this.routeId});
        //   //   this.appService.showTimeSlotWindow = false;         
        //   // }
        // }


      }));

  }

  ngOnInit(): void {
    // this.appService.logToConsole("Timeslot route id:" + this.routeId);
    // if(!this.isintake)   {
    //   this.appService.showTimeSlotWindow = false;   
    //   this.subjects.singleOutputNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot , route_id: this.routeId });
    // } else {
      
    //   this.iscontinuousinfusion = true; 
    //   //this.appService.MetaRoutes.find(x => x.route_id == this.routeId).iscontinuousinfusion;
    //   if (this.iscontinuousinfusion = false) {
    //     this.subjects.singleIntakeNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id , timeslot : this.timeslot, route_id: this.routeId});
    //     this.appService.showTimeSlotWindow = false;         
    //   }
    // }

    
    
  }
  timeslotFilter(data): any[] {  
    return data.filter(i => i.continuousinfusion_id === null);
  }
  addObservation(): void {   
    if(!this.isintake)   {
      this.appService.showTimeSlotWindow = false;   
      this.subjects.singleOutputNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot , route_id: this.routeId });
    } else {
      this.iscontinuousinfusion = this.appService.MetaRoutes.find(x => x.route_id == this.routeId).iscontinuousinfusion;
      if (this.iscontinuousinfusion == false) {
        this.subjects.singleIntakeNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id , timeslot : this.timeslot, route_id: this.routeId});
        this.appService.showTimeSlotWindow = false;         
      }
    }
  }
  addSingleVolume() {
    if(this.isintake) {
      this.subjects.singleIntakeNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot , route_id: this.routeId});
      this.appService.showTimeSlotWindow = false; 
    }   
    if(!this.isintake) {
      this.appService.showTimeSlotWindow = false;    
      this.subjects.singleOutputNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot, route_id: this.routeId });         
    }        
  }
  historySingleVolumeIntake(timeslot: TimeslotOption) {
    if(timeslot.continuousinfusion_id)
     {
      this.subjects.openContinuosInfusionForm.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, route_id: this.routeId,  continuousinfusion_id: timeslot.continuousinfusion_id,  type: "Setting" ,timeslot : this.timeslot});    
     } 
     else {
       this.appService.logToConsole("Open History");
        this.subjects.openSingleIntakeHistory.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
     }
    this.appService.showTimeSlotWindow = false;         
  }
  amdendSingleVolumeIntake(timeslot: TimeslotOption) {    
    this.subjects.singleIntakeAmend.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
    this.appService.showTimeSlotWindow = false;         
  }
  removeSingleVolumeIntake(timeslot: TimeslotOption) {
    this.subjects.singleIntakeRemove.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
    this.appService.showTimeSlotWindow = false;         
  }
  addContinuousInfusion() {
    this.appService.logToConsole("Timeslot options add ci: " + this.timeslot);
    this.subjects.openContinuosInfusionForm.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, route_id: this.routeId,  continuousinfusion_id: "",  type: "New" ,timeslot : this.timeslot });    
    this.appService.showTimeSlotWindow = false;         
  }

  addSingleVolumeOutput() {
    this.appService.showTimeSlotWindow = false;    
    this.subjects.singleOutputNew.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, timeslot : this.timeslot, route_id: this.routeId });         
  }
  historySingleVolumeOutput(timeslot: TimeslotOption) {
    this.subjects.openSingleOutputHistory.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
    this.appService.showTimeSlotWindow = false;         
  }
  amdendSingleVolumeOutput(timeslot: TimeslotOption) {    
    this.subjects.singleOutputAmend.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
    this.appService.showTimeSlotWindow = false;         
  }
  removeSingleVolumeOutput(timeslot: TimeslotOption) {
    this.subjects.singleOutputRemove.next({ fluidbalancesessionroute_id: this.fluidbalancesessionroute_id, fluidbalanceintakeoutput_id: timeslot.fluidbalanceintakeoutput_id, route_id: this.routeId });
    this.appService.showTimeSlotWindow = false;         
  }
   
  onHidden() {
    this.appService.showTimeSlotWindow = false;
  }
  close(): void {
    this.appService.showTimeSlotWindow = false;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}