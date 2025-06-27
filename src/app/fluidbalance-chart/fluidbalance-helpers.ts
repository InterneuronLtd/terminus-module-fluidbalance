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
import { Subscription, Observable, Subject } from 'rxjs';
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement } from '../models/Filter.model';
import { Fluidbalancesession, Fluidbalancesessionroute, Fluidbalanceintakeoutput, Continuousinfusion, Fluidbalancesessionroutesessions } from '../models/fluidbalance.model';
import { AppService } from '../services/app.service';
import { ApirequestService } from '../services/apirequest.service';


export class FluidbalanceHelper {


  constructor(public appService: AppService, public apiRequest: ApirequestService, public subscriptions: Subscription) { }

  CreateSessionFilter(sessiondate: Date) {
    const condition = "person_id=@person_id and encounter_id=@encounter_id and startdate::date = @startdate::date";
    const f = new filters()
    f.filters.push(new filter(condition));

    const pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
    pm.filterparams.push(new filterparam("startdate", sessiondate.toDateString()));

    const select = new selectstatement("SELECT fluidbalancesession_id,startdate,stopdate,person_id, encounter_id,addedby,modifiedby");

    const orderby = new orderbystatement("ORDER BY startdate desc");

    const body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }


  CreateCIEventFilter(ci: Array<Continuousinfusion>) {

    const params = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"]; //there will not be more than 14 possible CIs
    const pm = new filterParams();
    const condition = []
    for (let i = 0; i < ci.length; i++) {
      if (i === 0)
        condition.push("continuousinfusion_id =@" + params[i]);
      else
        condition.push(" or continuousinfusion_id =@" + params[i]);

      pm.filterparams.push(new filterparam("@" + params[i], ci[i].continuousinfusion_id));
    }

    const f = new filters()
    f.filters.push(new filter(condition.join('')));

    const select = new selectstatement("SELECT continuousinfusionevent_id,continuousinfusion_id,eventtype,datetime, eventcorrelationid,addedby,modifiedby,_createddate");

    const orderby = new orderbystatement("ORDER BY datetime desc");

    const body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }


  CreateCIFilter(sr: Array<Fluidbalancesessionroute>) {

    const params = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"]; //there will not be more than 14 routes
    const pm = new filterParams();
    const condition = []
    for (let i = 0; i < sr.length; i++) {
      if (i === 0)
        condition.push("fluidbalancesessionroute_id =@" + params[i]);
      else
        condition.push(" or fluidbalancesessionroute_id =@" + params[i]);

      pm.filterparams.push(new filterparam("@" + params[i], sr[i].fluidbalancesessionroute_id));
    }

    const f = new filters()
    f.filters.push(new filter(condition.join('')));

    const select = new selectstatement("SELECT * ");
    const orderby = new orderbystatement("ORDER BY fluidbalancesessionroute_id");


    const body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }



  CreateRoutesFilter(sessionid: string) {
    let condition = "fluidbalancesession_id = @fbsessionid";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("fbsessionid", sessionid));

    let select = new selectstatement("SELECT *");
    const orderby = new orderbystatement("ORDER BY fluidbalancesession_id");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }



  //GetCurrentSession(): Observable<any> {

  //  const sub = new Subject();
  //  //returns the current session based on currentChartDate
  //  //if no session exists, creates a new session

  //  //move this to care record api
  //  //get sessions for this personid, encounterid, and start date
  //  this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=fluidbalancesession", this.CreateSessionFilter(this.appService.sessionStartDateTime)).subscribe
  //    ((response) => {

  //      if (response && response.length !== 0) {
  //        {
  //          this.appService.FluidBalanceSession = response[0];
  //          sub.next(true);
  //          sub.complete();
  //        }
  //      }
  //      else {
  //        const sessionid = uuid();

  //        const newSession = new Fluidbalancesession(sessionid, this.appService.getDateTimeinISOFormat(this.appService.sessionStartDateTime), this.appService.getDateTimeinISOFormat(this.appService.sessionStopDateTime), this.appService.personId, this.appService.encounter.encounter_id, this.appService.loggedInUserName, "");

  //        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesession", JSON.stringify(newSession)).
  //          subscribe((newsession) => {

  //            this.appService.FluidBalanceSession = newsession[0];

  //            //add oral and urine routes
  //            let sessionroute = new Fluidbalancesessionroute();

  //            sessionroute.fluidbalancesessionroute_id = uuid(),
  //              sessionroute.fluidbalancesession_id = sessionid,
  //              sessionroute.route_id = 'cb93583a-8885-11ea-bc55-0242ac130003',
  //              sessionroute.dateadded = this.appService.getDateTimeinISOFormat(this.appService.sessionStartDateTime),
  //              sessionroute.displayorder = 1,
  //              sessionroute.modifiedby = this.appService.loggedInUserName,
  //              sessionroute.addedby = this.appService.loggedInUserName,
  //              sessionroute.routename = "Oral",
  //              sessionroute.isintake = true

  //            //urine
  //            this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroute", JSON.stringify(sessionroute)).
  //              subscribe((oralresponse) => {
  //                //insert oral route into session mapping entity
  //                const oralsessionroutemapping = new Fluidbalancesessionroutesessions(uuid(), sessionroute.fluidbalancesession_id, sessionroute.fluidbalancesessionroute_id);

  //                this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions", JSON.stringify(oralsessionroutemapping)).
  //                  subscribe(() => {
  //                    sessionroute.fluidbalancesessionroute_id = uuid();
  //                    sessionroute.route_id = 'e387930e-3fe4-4c54-bdce-ebb3b763f3df';
  //                    sessionroute.isintake = false;
  //                    sessionroute.routename = "Urine",
  //                      sessionroute.displayorder = this.appService.appConfig.appsettings.maxIntakeRoutes + 1;

  //                    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroute",
  //                      JSON.stringify(sessionroute)).
  //                      subscribe((urineresponse) => {
  //                        //insert urine route into session mapping entity

  //                        const urinesessionroutemapping = new Fluidbalancesessionroutesessions(uuid(), sessionroute.fluidbalancesession_id, sessionroute.fluidbalancesessionroute_id);

  //                        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions",
  //                          JSON.stringify(urinesessionroutemapping)).
  //                          subscribe(() => {

  //                            //get previous session
  //                            this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=fluidbalancesession",
  //                              this.CreateSessionFilter(moment(this.appService.sessionStartDateTime).clone().add(-24, "hour").toDate())).subscribe
  //                              ((prevsession) => {

  //                                if (prevsession && prevsession.length !== 0) {
  //                                  {

  //                                    //get all session routes for prevsession.
  //                                    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_fluidbalancesessionroutes",
  //                                      this.CreateRoutesFilter(prevsession[0].fluidbalancesession_id)).subscribe
  //                                      ((prevsessionroutesresp) => {

  //                                        const prevsessionroutes = prevsessionroutesresp
  //                                        if (prevsessionroutes && prevsession.length !== 0) {

  //                                          this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI +
  //                                            "/GetListByPost?synapsenamespace=core&synapseentityname=continuousinfusion", this.CreateCIFilter(prevsessionroutes)).subscribe
  //                                            ((ciresponse) => {
  //                                              const continuousinfusions = ciresponse as Array<Continuousinfusion>;
  //                                              const ongoinginfusions = continuousinfusions.filter(x => x.totalremainingvolume > 0);

  //                                              let intakedisplayorder = this.appService.appConfig.appsettings.maxIntakeRoutes + 1;
  //                                              let outputdisplayorder = this.appService.appConfig.appsettings.maxOutputRoutes + 1;

  //                                              const ciroutes: Array<Fluidbalancesessionroute> = [];
  //                                              const ciroutesmapping: Array<Fluidbalancesessionroutesessions> = [];
  //                                              for (const ci of ongoinginfusions) {
  //                                                if (ciroutesmapping.filter(x => x.fluidbalancesessionroute_id === ci.fluidbalancesessionroute_id).length == 0) {
  //                                                  //sessionroute = new Fluidbalancesessionroute();
  //                                                  //sessionroute.fluidbalancesession_id = this.appService.FluidBalanceSession.fluidbalancesession_id;
  //                                                  //sessionroute.fluidbalancesessionroute_id = ci.fluidbalancesessionroute_id;
  //                                                  //sessionroute.route_id = ci.route_id;
  //                                                  //sessionroute.isintake = this.appService.MetaRoutes.find(x => x.route_id === ci.route_id).isintake;
  //                                                  //sessionroute.routename = this.appService.MetaRoutes.find(x => x.route_id === ci.route_id).route;
  //                                                  //sessionroute.displayorder = (sessionroute.isintake) ? intakedisplayorder++ : outputdisplayorder++;
  //                                                  //sessionroute.modifiedby = this.appService.loggedInUserName;
  //                                                  //sessionroute.addedby = this.appService.loggedInUserName;
  //                                                  //sessionroute.dateadded = this.appService.getDateTimeinISOFormat(this.appService.sessionStartDateTime);

  //                                                  //ciroutes.push(sessionroute);
  //                                                  ciroutesmapping.push(new Fluidbalancesessionroutesessions(uuid(), this.appService.FluidBalanceSession.fluidbalancesession_id,
  //                                                    ci.fluidbalancesessionroute_id));
  //                                                }
  //                                              }
  //                                              if (ciroutesmapping.length > 0)
  //                                                //this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObjectArray?synapsenamespace=core&synapseentityname=fluidbalancesessionroute", JSON.stringify(ciroutes)).
  //                                                //  subscribe(() => {
  //                                                this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObjectArray?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions", JSON.stringify(ciroutesmapping)).
  //                                                  subscribe((mapping) => {
  //                                                    sub.next(true);
  //                                                    sub.complete();
  //                                                  }));
  //                                              //}));
  //                                              else {
  //                                                sub.next(true);
  //                                                sub.complete();
  //                                              }
  //                                            }));
  //                                        } else {
  //                                          sub.next(true);
  //                                          sub.complete();
  //                                        }
  //                                      }));
  //                                  }
  //                                }
  //                              }));
  //                          }));
  //                      }));
  //                  }));
  //              }));
  //          }));
  //      }
  //    }));
  //  return sub.asObservable();
  //}

  GetCurrentSession(): Observable<any> {
    const sub = new Subject();
    let endpoint = "GetSessionwithcreate";
    if (!this.appService.isCurrentEncouner) {
      endpoint = "GetSession";
    }


    //get session for this personid, encounterid, and start date
    this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/${endpoint}/${this.appService.personId}/${this.appService.encounter.encounter_id}/${this.appService.getDateTimeinISOFormat(this.appService.sessionStartDateTime)}`).subscribe
      ((response) => {
        this.appService.logToConsole("created or got a session:");
        this.appService.logToConsole(response);
        response = JSON.parse(response);
        if (response) {
          if (Array.isArray(response) && response.length !== 0)
            response = response[0];

          if (response.hasOwnProperty("fluidbalancesession_id")) {
            {
              this.appService.FluidBalanceSession = response as Fluidbalancesession;
              Object.keys(this.appService.FluidBalanceSession).map((e) => { if (e.startsWith("_")) delete this.appService.FluidBalanceSession[e]; })
              sub.next(true);
              sub.complete();
            }
          }
          else {
            sub.next(true);
            sub.complete();
          }
        }
        else {
          sub.next(true);
          sub.complete();
        }
      }));
    return sub.asObservable();

  }


  GetRoutesInSession(): Observable<any> {
    const sub = new Subject();

    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_fluidbalancesessionroutes", this.CreateRoutesFilter(this.appService.FluidBalanceSession.fluidbalancesession_id)).subscribe
      ((response) => {

        const sessionroutes = response
        this.appService.FluidBalanceSessionRoutes = sessionroutes as Array<Fluidbalancesessionroute>;

        //get all cis for all routes. 
        this.appService.FluidBalanceSessionContinuousInfusions = [];
        // this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=continuousinfusion", this.CreateCIFilter(this.appService.FluidBalanceSessionRoutes)).subscribe
        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getallcontinuousinfusions", this.CreateCIFilter(this.appService.FluidBalanceSessionRoutes)).subscribe
          ((response) => {
            const continuousinfusions = response;
            this.appService.FluidBalanceSessionContinuousInfusions = continuousinfusions as Array<Continuousinfusion>;
            this.appService.urineCatheterFlowrate = this.appService.getUrineCatheterFlowrate();
            if (this.appService.FluidBalanceSessionContinuousInfusions.length !== 0)
              this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=continuousinfusionevent&returnsystemattributes=1", this.CreateCIEventFilter(this.appService.FluidBalanceSessionContinuousInfusions)).subscribe
                ((response) => {

                  if (response && response.length !== 0) {
                    {
                      this.appService.FluidBalanceSessionContinuousInfusionsEvents = response;
                    }
                  }
                  sub.next(true);
                  sub.complete();
                }));
            else {
              sub.next(true);
              sub.complete();
            }
          }));

      }));
    return sub.asObservable();

  }

  GetIntakeOutputForSession(): Observable<any> {
    const sub = new Subject();

    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=fluidbalanceintakeoutput&synapseattributename=fluidbalancesession_id&attributevalue=" + this.appService.FluidBalanceSession.fluidbalancesession_id).subscribe
      ((response) => {

        const intakeoutput = JSON.parse(response);
        this.appService.FluidBalanceIntakeOutput = intakeoutput as Array<Fluidbalanceintakeoutput>;
        sub.next(true);
        sub.complete();

      }));
    return sub.asObservable();

  }
}
