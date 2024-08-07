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
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { EscalationForm } from '../models/fluidbalanceescalation.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-sbar-escalation-form',
  templateUrl: './sbar-escalation-form.component.html',
  styleUrls: ['./sbar-escalation-form.component.css']
})
export class SbarEscalationFormComponent implements OnInit,OnDestroy {
  subscriptions: Subscription = new Subscription();  
  sbar : EscalationForm;    
  formStatus:string;
  fluidbalanceintakeoutput_id :string;
  readonly: boolean = false;
  showSpinner : boolean =false;
  constructor(private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {    
    this.sbar = new EscalationForm();
    this.sbar.escalationofcare = true;
    this.sbar.escalatedtowhom = "Registered Nurse";    
    this.subscriptions.add(this.subjects.openSBARForm.subscribe
      ((event: any) => { 
        this.showSpinner =false;        
        if(event.fluidbalanceescalation_id) {
          this.subscriptions.add(
            this.apiRequest.getRequest(this.appService.baseURI + '/GetObject?synapsenamespace=core&synapseentityname=fluidbalanceescalation&id=' + event.fluidbalanceescalation_id)
              .subscribe((response) => {
                var data = JSON.parse(response); 
                this.sbar = data; 
                this.appService.showSBAREscalationForm =true;
                this.formStatus = data.issbaraccepted ? "Accepted" : "Not required"; 
                this.readonly = true;
              })
          )
        } else {
          this.formStatus = event.status; 
          this.sbar.monitoringcomments = "";
          this.fluidbalanceintakeoutput_id = event.fluidbalanceintakeoutput_id;           
          this.appService.showSBAREscalationForm =true;
          this.readonly = false;
        }
    }));
   }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  close() {     
    this.appService.showSBAREscalationForm =false;
  }
  submitSBARForm() {    
    this.showSpinner =true;
    this.sbar.fluidbalanceescalation_id = uuidv4();
    this.sbar.issbaraccepted =true;  
    if(String(this.sbar.escalationofcare) == "true" || this.sbar.escalationofcare==true) {
      this.sbar.escalationofcare = true;
    } else {
      this.sbar.escalationofcare = false;
      this.sbar.escalatedtowhom="";
    }
    this.sbar.fluidbalanceintakeoutput_id = this.fluidbalanceintakeoutput_id;  
    this.appService.logToConsole(this.sbar);
    this.subjects.saveUrineOuputAndSBARForm.next({sbar : this.sbar });  
    // this.subscriptions.add(
    //   this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalanceescalation", JSON.stringify(this.sbar))
    //     .subscribe((response) => {         
    //       this.appService.showSBAREscalationForm =false;                        
    //     })
    // )
  }
  submitSBARNotRequired () {
    this.showSpinner =true;
    this.sbar.fluidbalanceescalation_id = uuidv4();
    this.sbar.issbaraccepted =false;   
    this.sbar.escalatedtowhom="";
    this.sbar.escalationofcare = false; 
    this.sbar.fluidbalanceintakeoutput_id = this.fluidbalanceintakeoutput_id; 
    this.subjects.saveUrineOuputAndSBARForm.next({sbar : this.sbar });  
    // this.subscriptions.add(
    //   this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalanceescalation", JSON.stringify(this.sbar))
    //     .subscribe((response) => {         
    //       this.appService.showSBAREscalationForm =false;                        
    //     })
    // )
  }
  showSBAR() {
    if(String(this.sbar.escalationofcare) == "true" || this.sbar.escalationofcare==true) {
      return true;
    } else {
      return false;
    }
  }
}
