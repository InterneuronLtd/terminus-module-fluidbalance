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
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { CoreContinuousinfusion, CoreContinuousinfusionevent } from 'src/app/models/CoreContinuousinfusion.model';
import { SubjectsService } from 'src/app/services/subjects.service';
import { ApirequestService } from 'src/app/services/apirequest.service';
import { AppService } from 'src/app/services/app.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import * as moment from 'moment';


@Component({
  selector: 'app-complete-infusion',
  templateUrl: './complete-infusion.component.html',
  styleUrls: ['./complete-infusion.component.css'],
  providers: [UpsertTransactionManager]
})
export class CompleteInfusionComponent implements OnInit,OnDestroy {

  @Output() reFreshMenu = new EventEmitter();

  @Input() coreContinuousinfusion: CoreContinuousinfusion;

  subscriptions: Subscription = new Subscription();

  showspinner: boolean = false;

  allevent: CoreContinuousinfusionevent[] = [];
  filterevent: CoreContinuousinfusionevent[] = [];

  constructor(private upsertManager: UpsertTransactionManager, private subjects: SubjectsService, private apiRequest: ApirequestService, public appService: AppService) {

  }

  ngOnInit(): void {
    this.Getlastevent();
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  Getlastevent() {

    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=continuousinfusionevent&synapseattributename=continuousinfusion_id&attributevalue=" + this.coreContinuousinfusion.continuousinfusion_id + "&returnsystemattributes= &orderby=\"_sequenceid\" desc").subscribe(
      (response) => {

        this.allevent = <CoreContinuousinfusionevent[]>JSON.parse(response);
        this.filterevent = <CoreContinuousinfusionevent[]>JSON.parse(response).filter(x => x.eventtype == 'start' || x.eventtype == 'restart' || x.eventtype == 'validation');
        // this.allevent.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
        // this.filterevent.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }));
  }
  loadValidationscreen() {
    this.reFreshMenu.emit("loadvalidation");
  }
  saveComplete() {


    this.upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let completeEventid = uuidv4();
    this.coreContinuousinfusion.eventcorrelationid = completeEventid;
    this.coreContinuousinfusion.finishdatetime=this.appService.getDateTimeinISOFormat(new Date());
 
    let eventDate=new Date(moment(this.filterevent[0].datetime,moment.ISO_8601).toString());


    let completeEvent = this.continuousInfusionEvents(completeEventid, "complete", this.appService.getDateTimeinISOFormat(eventDate), this.coreContinuousinfusion.continuousinfusion_id);

    this.upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(completeEvent)));
    this.upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(this.coreContinuousinfusion)));

    this.upsertManager.save((res) => {

      this.reFreshMenu.emit("refresh");
      this.subjects.continuousInfusionMessage.next(true);
    },
      (error) => {

      }
    );
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

}
