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
import { Injectable, ModuleWithComponentFactories } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement } from '../models/Filter.model';
import { v4 as uuid } from 'uuid';
import { AppService } from '../services/app.service';
import { ApirequestService } from '../services/apirequest.service';
import { AdministerMedication, AdministerMedicationcodes, AdministerMedicationingredients, EPMAEvent, Medicationadministration, PrescriptionInfusions } from '../models/epmaevent.model';
import * as moment from 'moment';
import { v4 as uuidv4 } from "uuid";
import { Fluidbalancesession, Fluidbalancesessionroute, Route, Routetype } from '../models/fluidbalance.model';
import { CoreContinuousinfusion, CoreContinuousinfusionevent } from '../models/CoreContinuousinfusion.model';
import { UpsertTransactionManager } from 'src/app/common/upsert-transaction-manager';
import { SubjectsService } from '../services/subjects.service';
export class EPMAIntegrationHelper {

    constructor(public appService: AppService, public subjects: SubjectsService, public apiRequest: ApirequestService, public subscriptions: Subscription) { }
    uniqueRecord = [];
    uniqueMedicine = [];

    arrayInfusionObject: Array<SaveModel>;

    GetEPMAEvents(cb: () => any) {
        // 1. Get Prescriptionevents
        this.appService.empaEvent = [];
        this.GetPrescriptionInfusion(() => {
            // 2. Get EPMA Events
            this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/fluidbalance_epmaevents`, this.CreateEPMAEventFilter())
                .subscribe((response: EPMAEvent[]) => {
                    this.appService.logToConsole(response);
                    this.appService.empaEvent.push(...response);
                    this.uniqueMedicine = [];
                    this.uniqueMedicine = [...new Set(response.map(item => item.medicine + '|' + item.ivtype))];
                    // 3. Create any route that is not in metaroute based on configuration
                    this.GetOrCreateRoute(() => {
                        // 4. Create route type for each based on the configuration
                        this.GetOrCreateRouteType(response, () => {
                            this.arrayInfusionObject = []
                            this.uniqueRecord=[];
                            if (response.length <= 0) {
                                cb();
                            }
                           // response[response.length -1];
                            for (let i = 0; i< response.length; i++) {
                                let element = response[i];
                                if (this.uniqueRecord && this.uniqueRecord.find(x => moment(x.dose_datetime, "YYYY-MM-DD").format("YYYYMMDD") == moment(element.dose_datetime, "YYYY-MM-DD").format("YYYYMMDD"))) {
                                    console.log(element.prescription_id + " " + element.dose_datetime);
                                   
                                } else {
                                    this.uniqueRecord.push(element);
                                }
                            }
                           // let lastrecord = this.uniqueRecord[this.uniqueRecord.length-1]
                           let  counter =0
                            this.uniqueRecord.forEach(element => {  
                              
                                    // 5. for each distinct dose time get or create session
                                    this.GetOrCreateSession(element.dose_datetime, (session) => {
                                        // 6. get all existig session route
                                        this.GetSessionRoute(session, (data) => {
                                            
                                            let mindate = moment(element.dose_datetime);
                                            moment(mindate).set({ 'hour': 8, 'minute': 0, 'second': 0, 'millisecond': 0 })
                                            let maxdate = moment(element.dose_datetime);
                                            maxdate.add(1, 'days')
                                            maxdate.set({ hour: 7, minute: 59, second: 0, millisecond: 0 })
                                            counter++;
                                            let doseData = response.filter(x => moment(x.dose_datetime).isBetween(moment(mindate), maxdate, undefined, '[]'))
                                            if (doseData) {
                                                let coreContinuousinfusion = new CoreContinuousinfusion();
                                                let saveModel = new SaveModel();
                                                coreContinuousinfusion.fluidbalancesession_id = session.fluidbalancesession_id;

                                                saveModel.CoreContinuousinfusion = Object.assign({}, coreContinuousinfusion)
                                                saveModel.data = doseData;
                                              //  counter=counter+doseData.length;
                                                saveModel.sessionroute = data;
                                                this.arrayInfusionObject.push(Object.assign({}, saveModel));
                                            }
                                            console.log( "counter" +counter+"  leng" +  response.length)
                                            if (counter == this.uniqueRecord.length) {
                                                this.saveTransaction(() => {
                                                    cb();
                                                })
                                            }


                                        });
                                    });
                                
                               
                            });

                        });
                    });
                }));
        });
    }
    GetOrCreateRouteType(empaevent, cb: () => any) {
        let newMedicine = [];
        let upsertManager: UpsertTransactionManager;
        upsertManager = new UpsertTransactionManager();
        upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
        this.uniqueMedicine.forEach((item) => {
            let event = empaevent.find(x => x.medicine + '|' + x.ivtype == item);
            let route = this.appService.MetaRoutes.find(x => x.route == event.ivtype);
            let rt = item.split('|')[0];
            let routype = this.appService.MetaRouteTypes.find(x => x.routetype == rt && x.route_id == route.route_id);
            if (!routype) {
                let routetypeobject = new Routetype(uuid(), route.route_id, rt, "", false, 1)
                newMedicine.push(routetypeobject);
                upsertManager.addEntity('meta', 'routetype', JSON.parse(JSON.stringify(routetypeobject)));
            }
        });
        if (upsertManager.entities.length > 0) {
            upsertManager.save((res) => {
                this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=routetype").subscribe(
                    (response) => {
                        let responseArray = JSON.parse(response);
                        this.appService.MetaRouteTypes = [];
                        for (let r of responseArray) {
                            this.appService.MetaRouteTypes.push(<Routetype>r);
                        }
                        cb();
                    }));
            },
                (error) => {
                    console.log(error)
                }
            );
        } else {
            cb()
        }

    }
    GetOrCreateSession(sessiondate, cb: (data) => any) {
        let endpoint = "GetSession";
        //get session for this personid, encounterid, and start date
        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=fluidbalancesession", this.CreateFluidBalanceSessionFilter(this.appService.getDateTimeinISOFormat(moment(sessiondate).toDate()))).subscribe
            ((response) => {
                if (response && response.length > 0) {
                    cb(response[0]);
                } else {
                    this.CreateSession(sessiondate, (data) => {
                        cb(data);
                    });
                }
            }));

        // this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/${endpoint}/${this.appService.personId}/${this.appService.encounter.encounter_id}/${this.appService.getDateTimeinISOFormat(moment(sessiondate).toDate())}`).subscribe
        //     ((response) => {
        //         response = JSON.parse(response);
        //         if (response) {
        //             if (Array.isArray(response) && response.length !== 0)
        //                 response = response[0];
        //             if (response.hasOwnProperty("fluidbalancesession_id")) {
        //                 cb(response as Fluidbalancesession);
        //             } else {
        //                 this.CreateSession(sessiondate, (data) => {
        //                     cb(data);
        //                 });
        //             }
        //         }
        //     }));
    }
    CreateSession(sessiondate, cb: (data) => any) {
        let endpoint = "GetSessionwithcreate";
        //get session for this personid, encounterid, and start date
        this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/${endpoint}/${this.appService.personId}/${this.appService.encounter.encounter_id}/${this.appService.getDateTimeinISOFormat(moment(sessiondate).toDate())}`).subscribe
            ((response) => {
                response = JSON.parse(response);
                if (response) {
                    if (Array.isArray(response) && response.length !== 0)
                        response = response[0];
                    if (response.hasOwnProperty("fluidbalancesession_id")) {
                        cb(response as Fluidbalancesession);
                    }
                }
            }));
    }
    GetSessionRoute(session, cb: (data) => any) {
        let sessionroute = [];
        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_fluidbalancesessionroutes", this.CreateSessionRoutesFilter(session.fluidbalancesession_id)).subscribe
            ((response) => {
                sessionroute.push(...response);
                let ivtype = this.appService.appConfig.appsettings.ivtype;
                let lastType = ivtype[ivtype.length - 1];
                let counter = 0;
                ivtype.forEach((r) => {
                    let route = this.appService.MetaRoutes.find(x => x.route == r);
                    let sessionrouteexist = response.find(x => x.route_id == route.route_id);
                    if (sessionrouteexist) {
                        counter = counter + 1;
                        if (counter == ivtype.length) {
                            this.appService.logToConsole("Session Route Returned");
                            cb(sessionroute);
                        }
                    }
                    if (!sessionrouteexist) {
                        this.CreateSessionRoute(session, route, (data) => {
                            sessionroute.push(data);
                            this.appService.logToConsole("Session Route Created");
                            counter = counter + 1;
                            if (counter == ivtype.length) {
                                this.appService.logToConsole("Session Route Returned");
                                cb(sessionroute);
                            }
                        });
                    }
                });
            }));
    }
    async CreateSessionRoute(session, route, cb: (data) => any) {
        let sessionroute = new Fluidbalancesessionroute()
        sessionroute.fluidbalancesessionroute_id = uuidv4();
        sessionroute.fluidbalancesession_id = session.fluidbalancesession_id;
        sessionroute.route_id = route.route_id;
        sessionroute.hasbeenamended = false;
        sessionroute.dateadded = this.appService.getDateTimeinISOFormat(moment(session.startdate).toDate());
        sessionroute.displayorder = 1;
        sessionroute.addedby = this.appService.loggedInUserName;
        sessionroute.modifiedby = this.appService.loggedInUserName;
        sessionroute.routename = route.route;
        sessionroute.isintake = true;
        await firstValueFrom(this.apiRequest.postRequest(`${this.appService.appConfig.uris.carerecordbaseuri}/AddSessionRoute`, JSON.stringify(sessionroute)))
           .then(response => {
                cb(JSON.parse(response)[0]["core|fluidbalancesessionroute"]);
            });
    }
    GetOrCreateRoute(cb: () => any) {
        let upsertManager: UpsertTransactionManager;
        upsertManager = new UpsertTransactionManager();
        upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
        let ivtype = this.appService.appConfig.appsettings.ivtype;
        ivtype.forEach((r) => {
            let route = this.appService.MetaRoutes.find(x => x.route == r);
            if (!route) {
                let route = new Route(uuidv4(), r, true, false, "", false, 1);
                upsertManager.addEntity('meta', 'route', JSON.parse(JSON.stringify(route)));
            }
        });
        if (upsertManager.entities.length > 0) {
            upsertManager.save((res) => {
                this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=route").subscribe(
                    (response) => {
                        let responseArray = JSON.parse(response);
                        this.appService.MetaRoutes = new Array<Route>();
                        for (let r of responseArray) {
                            this.appService.MetaRoutes.push(<Route>r);
                        }
                        cb();
                    }));
            },
                (error) => {
                    console.log(error)
                }
            );
        } else {
            cb();
        }
    }
    // GetOrSessionRouteSession(cb: (data) => any) {
    //     this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/fluidbalance_getroute", this.CreateRoutesFilter()).subscribe
    //         ((response) => {
    //             if (response && response.length > 0) {
    //                 cb(response[0]);
    //             } else {
    //                 let route = new Route(uuidv4(), "IV-Fluid", true, false, "", false, 1);
    //                 this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=meta&synapseentityname=route", JSON.stringify(route)).subscribe
    //                     ((response) => {
    //                         if (response && response.route == "IV-Fluid") {
    //                             cb(response);
    //                         }
    //                     }));
    //             }
    //         }));
    // }
    CreateEPMAEventFilter() {
        const condition = "encounter_id=@encounter_id";
        const f = new filters()
        f.filters.push(new filter(condition));
        const pm = new filterParams();
        pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
        const select = new selectstatement("SELECT *");
        const orderby = new orderbystatement("ORDER BY 1 desc");
        const body = [];
        body.push(f);
        body.push(pm);
        body.push(select);
        body.push(orderby);
        this.appService.logToConsole(JSON.stringify(body));
        return JSON.stringify(body);
    }
    CreateFluidBalanceSessionFilter(date) {
        const condition = "person_id = @person_id and encounter_id = @encounter_id and startdate::date = @startdate::date";
        const f = new filters()
        f.filters.push(new filter(condition));
        const pm = new filterParams();
        pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
        pm.filterparams.push(new filterparam("person_id", this.appService.personId));
        pm.filterparams.push(new filterparam("startdate", date));
        const select = new selectstatement("SELECT *");
        const orderby = new orderbystatement("ORDER BY 1 desc");
        const body = [];
        body.push(f);
        body.push(pm);
        body.push(select);
        body.push(orderby);
        this.appService.logToConsole(JSON.stringify(body));
        return JSON.stringify(body);
    }

    CreateSessionRoutesFilter(sessionid: string) {
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
    CreateRoutesFilter() {
        let ivtype = this.appService.appConfig.appsettings.ivtype;
        let index = 0
        const pm = new filterParams();
        const condition = []
        for (let r of ivtype) {
            let para = this.makeId(5);
            if (index === 0)
                condition.push("route =@" + para);
            else
                condition.push(" or route =@" + para);

            pm.filterparams.push(new filterparam("@" + para, r));
            index = index + 1
        }
        const f = new filters()
        f.filters.push(new filter(condition.join('')));
        let select = new selectstatement("SELECT *");
        const orderby = new orderbystatement("ORDER BY 1");

        let body = [];
        body.push(f);
        body.push(pm);
        body.push(select);
        body.push(orderby);

        return JSON.stringify(body);
    }
    GetPrescriptionInfusion(cb: () => any) {
        this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=local&synapseentityname=fluidbalance_prescriptioninfusions&synapseattributename=encounter_id&attributevalue=" + this.appService.encounter.encounter_id).subscribe(
            (response) => {
                let responseArray = JSON.parse(response);
                this.appService.PrescriptionInfusion = [];
                for (let r of responseArray) {
                    this.appService.PrescriptionInfusion.push(<PrescriptionInfusions>r);
                }
                cb();
            }));
    }
    createLogicalId(dosedate: any, dose_id: any) {
        let logicalid = moment(dosedate).format('YYYYMMDDHHmm') + "_" + dose_id.toString();
        return logicalid;
    }
    private makeId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
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
        coreContinuousinfusionevent.addedby = this.appService.loggedInUserName;
        coreContinuousinfusionevent.modifiedby = this.appService.loggedInUserName;
        return coreContinuousinfusionevent;
    }

    saveTransaction(cb: () => any) {
        let upsertManager: UpsertTransactionManager;
        upsertManager = new UpsertTransactionManager();
        upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
        for (let responcedata of this.arrayInfusionObject) {
            let coreContinuousinfusion = responcedata.CoreContinuousinfusion;
            for (let data of responcedata.data) {
                let sessionRoute = responcedata.sessionroute.find(x => x.routename == data.ivtype);
                if (sessionRoute) {
                    coreContinuousinfusion.fluidbalancesessionroute_id = sessionRoute.fluidbalancesessionroute_id;
                    coreContinuousinfusion.route_id = sessionRoute.route_id;
                    let routeType = this.appService.MetaRouteTypes.find(x => x.route_id == coreContinuousinfusion.route_id && x.routetype == data.medicine);
                    if (!routeType) {
                        let a = routeType;
                    }
                    coreContinuousinfusion.routetype_id = routeType.routetype_id;

                    let totalvolume = data.dosesize;

                    totalvolume = data.dosesize;
                    if (data.doseunit == 'litre') {

                        totalvolume = (data.dosesize * 1000)
                    }
                    if (data.frequency == 'h') {
                        coreContinuousinfusion.flowrate = Math.round(totalvolume / data.frequencysize)
                    }
                    if (data.frequency == 'x') {
                        coreContinuousinfusion.flowrate = Math.round(totalvolume / (24 / data.frequencysize))
                    }
                    coreContinuousinfusion.totalvolume = +totalvolume
                    coreContinuousinfusion.totalremainingvolume = +totalvolume
                    let logicalId = this.createLogicalId(data.dose_datetime, data.dose_id);


                    coreContinuousinfusion.continuousinfusion_id = logicalId;
                    coreContinuousinfusion.startdatetime = this.appService.getDateTimeinISOFormat(moment(data.dose_datetime).toDate());
                    coreContinuousinfusion.ispaused = false;
                    coreContinuousinfusion.islineremovedoncompletion = false;
                    coreContinuousinfusion.islineremovedoncompletion = false;
                    coreContinuousinfusion.addedby = this.appService.loggedInUserName;
                    coreContinuousinfusion.modifiedby = this.appService.loggedInUserName;
                    coreContinuousinfusion.flowrateunit = "ml";
                    coreContinuousinfusion.pumpnumber = ""

                    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------

                    let prescriptionInfusions = new PrescriptionInfusions();

                    prescriptionInfusions.fluidbalance_prescriptioninfusions_id = this.createLogicalId(data.dose_datetime, data.dose_id)
                    prescriptionInfusions.dose_id = data.dose_id;
                    prescriptionInfusions.dosedatetime = data.dose_datetime;
                    prescriptionInfusions.continuousinfusionid = this.createLogicalId(data.dose_datetime, data.dose_id);
                    prescriptionInfusions.iscancelled = data.iscancelled == "Cancel" ? true : false;
                    prescriptionInfusions.logicalid = this.createLogicalId(data.dose_datetime, data.dose_id);
                    prescriptionInfusions.posology_id = data.posology_id;
                    prescriptionInfusions.prescription_id = data.prescription_id;
                    prescriptionInfusions.encounter_id = this.appService.encounter.encounter_id;

                    //Infusion Start
                    let startEventid = uuid();
                    let startEvent = this.continuousInfusionEvents(startEventid, "start", coreContinuousinfusion.startdatetime, coreContinuousinfusion.continuousinfusion_id);
                    coreContinuousinfusion.eventcorrelationid = startEventid;

                    let pInfusion = this.appService.PrescriptionInfusion.find(x => x.continuousinfusionid == logicalId);
                    if (!pInfusion) {
                        upsertManager.addEntity('core', 'continuousinfusion', JSON.parse(JSON.stringify(coreContinuousinfusion)));
                        upsertManager.addEntity('core', 'continuousinfusionevent', JSON.parse(JSON.stringify(startEvent)));
                    }
                    upsertManager.addEntity('local', 'fluidbalance_prescriptioninfusions', JSON.parse(JSON.stringify(prescriptionInfusions)));

                }
            }
        }
        upsertManager.save((res) => {
            this.GetPrescriptionInfusion(() => {

                cb();
            });
        },
            (error) => {
                cb();
            }
        );
    }

    saveAdministration(continuousinfusion: CoreContinuousinfusion,  cb: () => any) {
        let prescription= this.appService.PrescriptionInfusion.find(x=>x.continuousinfusionid== continuousinfusion.continuousinfusion_id);
        let epmaevent =  this.appService.empaEvent.find(x=>x.prescription_id== prescription.prescription_id && x.dose_id==prescription.dose_id && moment(x.dose_datetime).format("YYYYMMDDHHmm") ==  moment(prescription.dosedatetime).format("YYYYMMDDHHmm"));

        if(prescription && epmaevent) {
         this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=medicationadministration&synapseattributename=logicalid&attributevalue=" + epmaevent.logicalid).subscribe(
                (response) => {
                  let responseArray = JSON.parse(response);
                  if(responseArray.length==0) {
                    let administration = new Medicationadministration();
                    administration.correlationid = uuid();
                    administration.medicationadministration_id = uuid();
                    administration.administrationstartime = this.appService.getDateTimeinISOFormat(moment(continuousinfusion.startdatetime, 'YYYY-MM-DD HH:mm').toDate());
                    administration.isenterinerror =false;
                    administration.logicalid = this.createLogicalId(administration.administrationstartime, prescription.dose_id);
                    administration.planneddatetime = this.appService.getDateTimeinISOFormat(moment(continuousinfusion.startdatetime, 'YYYY-MM-DD HH:mm').toDate());
                    administration.adminstrationstatus = "given";
                    administration.prescription_id = prescription.prescription_id;
                    administration.posology_id = prescription.posology_id;
                    administration.dose_id = prescription.dose_id;
                    administration.person_id = this.appService.personId;
                    administration.encounter_id = this.appService.encounter.encounter_id;
                    administration.prescriptionroutesid = epmaevent.prescriptionroutes_id;
                    administration.routename = epmaevent.route;  
                    administration.medication_id = epmaevent.medication_id;                  
                    administration.administredby = this.appService.loggedInUserName;

                    administration.planneddosesize = epmaevent.dosesize;
                    administration.planneddoseunit = epmaevent.doseunit;
                    administration.plannedstrengthneumerator = epmaevent.strengthdenominator;
                    administration.plannedstrengthneumeratorunits = epmaevent.strengthneumeratorunit;
                    administration.plannedstrengthdenominator = epmaevent.strengthdenominator;
                    administration.plannedstrengthdenominatorunits = epmaevent.strengthdenominatorunit;

                    administration.administreddosesize = epmaevent.dosesize;
                    administration.administreddoseunit = epmaevent.doseunit;
                    administration.administeredstrengthdenominator = epmaevent.strengthdenominator;
                    administration.administeredstrengthneumeratorunits = epmaevent.strengthneumeratorunit;
                    administration.administeredstrengthdenominator = epmaevent.strengthdenominator;
                    administration.administeredstrengthdenominatorunits = epmaevent.strengthdenominatorunit;

                    
                    administration.createdon = this.appService.getDateTimeinISOFormat(moment().toDate());
                    administration.modifiedon = this.appService.getDateTimeinISOFormat(moment().toDate());
                    administration.isadministerdfromfb =true;
                    var upsertManager = new UpsertTransactionManager();
                    upsertManager.beginTran(this.appService.baseURI, this.apiRequest); 
                    this.getFormularyDetail(epmaevent.code, (m:AdministerMedication)=> {
                        upsertManager.addEntity('core', "medicationadministration", JSON.parse(JSON.stringify(administration)));
                      
                        m.medicationadministrationid = administration.medicationadministration_id;
                        m.correlationid = administration.correlationid;
                        let administermed = Object.assign({}, m);
                        Object.keys(administermed).map((e) => { if (e.startsWith("_")) delete administermed[e]; });
                        upsertManager.addEntity('core', 'administermedication', JSON.parse(JSON.stringify(administermed)));
            
                        m.__ingredients.forEach(mig => {
                          mig.medicationadministrationid = administration.medicationadministration_id;
                          mig.correlationid = administration.correlationid;
                          upsertManager.addEntity('core', 'administermedicationingredients', JSON.parse(JSON.stringify(mig)));
                        });
                        m.__codes.forEach(mcd => {
                          mcd.medicationadministrationid = administration.medicationadministration_id;
                          mcd.correlationid = administration.correlationid;
                          upsertManager.addEntity('core', 'administermedicationcodes', JSON.parse(JSON.stringify(mcd)));
                        }); 
                        upsertManager.save((resp) => {          
                          this.appService.logToConsole(resp);
                          upsertManager.destroy();
                          cb();
            
                        },
                          (error) => {
                            this.appService.logToConsole(error);
                            upsertManager.destroy();   
                            cb();        
                          }
                          
                        );
                    })  
                  } else {
                    cb();
                  }
            }));    
        } else {
            cb();
        }      
      }
    getFormularyDetail(code, cb: (data) => any) {
        var endpoint = this.appService.appConfig.uris.terminologybaseuri + "/Formulary/getformularydetailruleboundbycode"
        this.subscriptions.add(this.apiRequest.getRequest(`${endpoint}/${code}?api-version=1.0`)
          .subscribe((response) => {
            if (response && response.length != 0) {
              this.appService.logToConsole(response);
              var m = new AdministerMedication();
              m.administermedication_id = uuid();
              m.personid = this.appService.encounter.person_id;
              m.encounterid = this.appService.encounter.encounter_id;
              m.name = response.name;
              m.producttype = response.productType;
              m.roundingfactor = response.detail.roundingFactorDesc;
    
              m.__ingredients = [];
              m.__codes = [];
    
              var fdbc = response.formularyAdditionalCodes ? response.formularyAdditionalCodes.find(x => x.additionalCodeSystem.toString().toLowerCase() == "fdb") : null;
              var cgc = response.formularyAdditionalCodes ? response.formularyAdditionalCodes.find(x => x.additionalCodeSystem.toString().toLowerCase() == "customgroup") : null;
    
              if (fdbc && fdbc.additionalCodeDesc) {
                m.classification = fdbc.additionalCodeDesc;
                m.bnf = fdbc.additionalCode;
              }
              else {
                m.classification = "Others";
              }
              if (cgc) {
                m.customgroup = cgc.additionalCode;
              }
              else {
                m.customgroup = "Others";
              }
              this.appService.logToConsole(m.classification);
              this.appService.logToConsole(m.customgroup);
    
              m.isprimary = true;
              m.form = response.detail.formDesc;
              m.doseformunitofmeasure = response.detail.unitDoseUnitOfMeasureDesc;               
              if (response.formularyIngredients) {
                response.formularyIngredients.forEach((fi) => {
                  var mig = new AdministerMedicationingredients();
                  mig.administermedicationingredients_id = uuid();
                  mig.name = fi.ingredientName;
                  mig.strengthneumerator = +fi.strengthValueNumerator;
                  mig.strengthneumeratorunit = fi.strengthValueNumeratorUnitDesc;
                  mig.strengthdenominator = fi.strengthValueDenominator;
                  mig.strengthdenominatorunit = fi.strengthValueDenominatorUnitDesc;
                  mig.administermedicationid = m.administermedication_id;
                  m.__ingredients.push(mig);
    
                  m.strengthneumerator = +fi.strengthValueNumerator;
                  m.strengthneumeratorunit = fi.strengthValueNumeratorUnitDesc;
                  m.strengthdenominator = +fi.strengthValueDenominator;
                  m.strengthdenominatorunit = fi.strengthValueDenominatorUnitDesc;
                });
              }
    
              m.isblacktriangle = this.MedicationHasFlag("blacktriangle", response);
              m.isclinicaltrial = this.MedicationHasFlag("clinicaltrial", response);
              m.iscontrolled = this.MedicationHasFlag("controlled", response);
              m.isexpensive = this.MedicationHasFlag("expensive", response);
              m.isformulary = !this.MedicationHasFlag("nonformulary", response);
              m.ishighalert = this.MedicationHasFlag("highalert", response);
              m.isunlicenced = this.MedicationHasFlag("unlicenced", response);
              m.iscritical = this.MedicationHasFlag("critical", response);
    
              var fid = new AdministerMedicationcodes();
              fid.administermedicationcodes_id = uuid();
              fid.code = response.code;
              fid.terminology = "formulary";
              fid.administermedicationid = m.administermedication_id;
              m.__codes.push(fid);
              cb(m);
            }
            else {
              this.appService.logToConsole("Medication not found");
            }
          }));
      }
      
  MedicationHasFlag(flag, m?: any) {
    return this.appService.MedicationHasFlag(flag, m);
  }
}


export class SaveModel {
    CoreContinuousinfusion: CoreContinuousinfusion;
    data: any;
    sessionroute: any;
}