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
import { SubjectsService } from '../services/subjects.service';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { SingleVolumeHistory } from '../models/singlevolumehistory.model';
import * as moment from 'moment';

@Component({
  selector: 'app-single-volume-intake-history',
  templateUrl: './single-volume-intake-history.component.html',
  styleUrls: ['./single-volume-intake-history.component.css']
})
export class SingleVolumeIntakeHistoryComponent implements OnInit, OnDestroy {
  subscriptions: Subscription = new Subscription();
  singleVolumeHistotry = [];   
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) { 
    this.subscriptions.add(this.subjects.openSingleIntakeHistory.subscribe
      ((event: any) => {             
        this.appService.logToConsole("open single intake");   
        this.appService.showSingleVolumeIntakeHistory = true; 
        this.singleVolumeHistotry = [];         
        this.getFluidIntakeHistory(event.fluidbalanceintakeoutput_id);
      }));

  }
  ngOnInit(): void {
  }
   // get single voulme fluid intake
   getFluidIntakeHistory(id: string) { 
     this.appService.logToConsole(id);   
    this.subscriptions.add(
      this.apiRequest.getRequest(this.appService.baseURI + '/GetObjectHistory?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&id=' + id + "&orderby=_createddate DESC")
        .subscribe((response) => {
          this.appService.logToConsole(response);  
          var data = JSON.parse(response); 
        
          for(var i=0; i < data.length; i ++){
            var intake =  new SingleVolumeHistory(); 
            if(this.appService.MetaRouteTypes.find(x=>x.routetype_id==data[i].routetype_id))
              intake.devicetype = this.appService.MetaRouteTypes.find(x=>x.routetype_id==data[i].routetype_id).routetype;            
            intake.volume= data[i].volume + " " + data[i].units;          
            intake.amendedby = data[i].modifiedby;
            intake.isremoved = data[i].isremoved;
           // intake.datetime = moment(data[i]._createddate).format("DD-MM-YYYY HH:mm:ss");
            intake.datetime =  new Date(this.appService.formatUTCDate(data[i]._createdtimestamp));
            if(data[i].isamended)
              intake.reason = data[i].reasonforamend
            if(data[i].isremoved)
              intake.reason = data[i].reasonforremoval
            if(!data[i].isamended && !data[i].isremoved)
                intake.reason = "Observation created"
            
            this.singleVolumeHistotry.push(intake);
            this.singleVolumeHistotry = this.singleVolumeHistotry.slice().sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());     
          }
        })
    )

  }
  onHidden() {
    this.appService.showSingleVolumeIntakeHistory = false;
  }
  close(): void {
    this.appService.showSingleVolumeIntakeHistory = false;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
