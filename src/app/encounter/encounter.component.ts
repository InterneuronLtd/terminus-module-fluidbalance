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
import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ApirequestService } from '../services/apirequest.service';
import { filters, filter, filterParams, filterparam, selectstatement, orderbystatement } from '../models/Filter.model';
import { SubjectsService } from '../services/subjects.service';
import { AppService } from '../services/app.service';
import { Encounter } from '../models/encounter.model';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-encounter',
  templateUrl: './encounter.component.html',
  styleUrls: ['./encounter.component.css']
})

export class EncounterComponent implements OnInit, OnDestroy {

  encounters: Array<Encounter> = [];

  selectedEncounterText: string = "Visits";

  @Output() loadComplete: EventEmitter<string> = new EventEmitter();
  @Output() clicked: EventEmitter<string> = new EventEmitter();
  @Output() encountersLoaded: EventEmitter<boolean> = new EventEmitter();

  subscriptions: Subscription = new Subscription();

  constructor(private callAPI: ApirequestService, private subjects: SubjectsService, private appService: AppService, private datePipe: DatePipe) {
    this.subscriptions.add(
      this.subjects.personIdChange.subscribe(() => {
        this.fillEncounters();
      }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  fillEncounters() {
    this.subscriptions.add(this.callAPI.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/bv_core_inpatientappointments", this.createEncounterFilter())
      .subscribe((response) => {
        this.encounters = [];
        this.appService.encounter = null;
        this.selectedEncounterText = "";
        for (var i = 0; i < response.length; i++) {
          if (i == 0) {
            if (response[i].dischargedatetime == "" || response[i].dischargedatetime == null)
              response[i].displayText = "Current Visit (" + this.datePipe.transform(response[i].admitdatetime, 'dd-MMM-yyyy', 'en-GB') + ")";
            else
              response[i].displayText = this.datePipe.transform(response[i].admitdatetime, 'dd-MMM-yyyy', 'en-GB')
          }
          else
            response[i].displayText = this.datePipe.transform(response[i].admitdatetime, 'dd-MMM-yyyy', 'en-GB')

          this.encounters.push(<Encounter>response[i])
        }
        if (response != null && response.length > 0) {
          this.selectEncounter(this.encounters[0]);
          this.encountersLoaded.emit(true);
        }
        else
          this.encountersLoaded.emit(false);
      })
    );
  }

  createEncounterFilter() {
    let condition = "person_id = @person_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));

    let select = new selectstatement("SELECT person_id, encounter_id, admitdatetime, dischargedatetime");

    let orderby = new orderbystatement("ORDER BY admitdatetime desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  ngOnInit() {
    this.loadComplete.emit("Encounter component Ready");
  }

  public selectEncounter(encounter: Encounter) {
    this.selectedEncounterText = encounter.displayText;
    this.appService.encounter = encounter;
    if ((encounter.displayText.indexOf("Current Visit") != -1))
      this.appService.isCurrentEncouner = true;
    else
      this.appService.isCurrentEncouner = false;

    this.appService.setPatientAgeAtAdmission();
    this.subjects.encounterChange.next(encounter);
  }

  encounterClicked() {
    this.clicked.emit("Encounter component clicked");
  }
}
