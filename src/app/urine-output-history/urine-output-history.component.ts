//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2024  Interneuron Limited

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
import { SubjectsService } from '../services/subjects.service';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { UrineOutputHistory } from '../models/urineoutputhistory.model';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';

@Component({
  selector: 'app-urine-output-history',
  templateUrl: './urine-output-history.component.html',
  styleUrls: ['./urine-output-history.component.css']
})
export class UrineOutputHistoryComponent implements OnInit, OnDestroy {
  subscriptions: Subscription = new Subscription();
  urineOutputHistotry = [];  
  fluidbalancesession_id: string;
  fluidbalancesessionroute_id: string;
  route_id: string;   
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { 
    this.subscriptions.add(this.subjects.openUrineOutputHistory.subscribe
      ((event: any) => {                      
        this.appService.showUrineOutputHistory = true; 
        this.urineOutputHistotry = [];            
        this.fluidbalancesession_id = this.appService.FluidBalanceSession.fluidbalancesession_id;
        this.fluidbalancesessionroute_id = this.appService.FluidBalanceSessionRoutes.find(x=>x.fluidbalancesession_id === this.appService.FluidBalanceSession.fluidbalancesession_id && x.routename==='Urine').fluidbalancesessionroute_id;
        this.route_id = this.appService.FluidBalanceSessionRoutes.find(x=>x.fluidbalancesession_id === this.appService.FluidBalanceSession.fluidbalancesession_id && x.routename==='Urine').route_id;        
        this.getUrineOutputHistory();
      }));

  }
  ngOnInit(): void {
  }
   // get urine output history
   getUrineOutputHistory() {      
    let verb = this.createUrineOutputHistoryFilter(); 
    this.appService.logToConsole(verb);
    this.subscriptions.add(
      this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/GetUrineOutputHistoryForSession/` + this.appService.personId +"/" + this.appService.FluidBalanceSession.fluidbalancesession_id + "/" +  this.fluidbalancesessionroute_id  + "/" + this.route_id)
        .subscribe((response) => {
          this.appService.logToConsole(response);  
          var data = JSON.parse(JSON.stringify(response));  
          this.urineOutputHistotry =  data;
          // var age = this.appService.getPatientCurrentAge();       
          // for(var i=0; i < data.length; i ++){
          //   var urine =  new UrineOutputHistory(); 
          //   urine.fluidbalanceescalation_id = data[i].fluidbalanceescalation_id;
          //   var avergaeurine=0;
          //   if(i==0)  {
          //     avergaeurine = data[i].volume;
          //   } else {
          //     avergaeurine = (data[i-1].volume + data[i].volume) /2;
          //   }              
          //   urine.volume = data[i].volume; 
          //   urine.averagevolume = avergaeurine; 
          //   urine.age = age;            
          //   urine.personweight = data[i].personweight; 
          //   urine.sbar = data[i].sbar;  
          //   urine.units = data[i].units;
          //   urine.expectedvolume = data[i].expectedvolume;
          //   urine.datetime = data[i].datetime;
          //   urine.modifiedby = data[i].modifiedby;
          //   this.urineOutputHistotry.push(urine);    
          //   //this.urineOutputHistotry = this.urineOutputHistotry.slice().sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());                 
          // }
        })
    )

  }
  openSBARFormData (fluidbalanceescalation_id:string) {
    this.appService.showUrineOutputHistory = false; 
    this.subjects.openSBARForm.next({fluidbalanceescalation_id: fluidbalanceescalation_id});   
  }
  createUrineOutputHistoryFilter() {    
    let f = new filters()
    let condition = "fluidbalancesession_id=@fluidbalancesession_id and fluidbalancesessionroute_id=@fluidbalancesessionroute_id and route_id=@route_id";
    f.filters.push(new filter(condition));
 

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("fluidbalancesession_id", this.fluidbalancesession_id));   
    pm.filterparams.push(new filterparam("fluidbalancesessionroute_id", this.fluidbalancesessionroute_id));   
    pm.filterparams.push(new filterparam("route_id", this.route_id));   

 
    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1 DESC");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }
  onHidden() {
    this.appService.showUrineOutputHistory = false;
  }
  close(): void {
    this.appService.showUrineOutputHistory = false;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
