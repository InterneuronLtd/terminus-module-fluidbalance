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
import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { ApirequestService } from './apirequest.service';
import { Subscription } from 'rxjs';
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement } from '../models/Filter.model';
import { Fluidbalancesession } from '../models/fluidbalance.model';
import { v4 as uuid } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class FluidbalanceService {

  subscriptions: Subscription = new Subscription();


  constructor(public appService: AppService, public apiRequest: ApirequestService) { }

  CreateSessionFilter() {

    const condition = "person_id=@person_id and encounter_id=@encounter_id and startdate::date = @startdate";
    const f = new filters()
    f.filters.push(new filter(condition));

    const pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.sessionStartDateTime.toDateString()));

    const select = new selectstatement("SELECT fluidbalancesession_id,startdate,stopdate,person_id, encounter_id,addedby,modifiedby");

    const orderby = new orderbystatement("ORDER BY startdate desc");

    const body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    this.appService.logToConsole(JSON.stringify(body));
    return JSON.stringify(body);
  }


  GetCurrentSession() {

    //returns the current session based on currentChartDate
    //if no session exists, creates a new session

    //move this to care record api
    //get sessions for this personid, encounterid, and start date

    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost/core/fluidbalancesession", this.CreateSessionFilter()).subscribe
      ((response: Fluidbalancesession) => {
        if (response instanceof Fluidbalancesession) {
          this.appService.FluidBalanceSession = response;
        }
        else {
          let sessionid = uuid();

          let newSession = new Fluidbalancesession(sessionid, this.appService.sessionStartDateTime, this.appService.sessionStopDateTime, this.appService.personId, this.appService.encounter.encounter_id, this.appService.loggedInUserName, "");

          this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesession", JSON.stringify(newSession)).
            subscribe((resp) => {
              this.appService.FluidBalanceSession = response;
            }));
        }

      }));


  }
}
