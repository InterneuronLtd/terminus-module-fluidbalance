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
import { Component, OnInit, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SubjectsService } from '../services/subjects.service';
import { AppService } from '../services/app.service';
import { ApirequestService } from '../services/apirequest.service';
import * as moment from 'moment';
import { FluidbalanceHelper } from './fluidbalance-helpers';
import { Chart, HeaderCell, ChartRow, TimeSlotCell, DataCell, IOData, ExpectedCI, RunningTotalCell, RunningTotalData, RunningTotalType, CIEvents } from '../models/chart.model';
import { Continuousinfusion, Fluidbalancesession } from '../models/fluidbalance.model';
import { AddRouteComponent } from '../add-route/add-route.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { filters, filterParams, filterparam, filter, selectstatement, orderbystatement } from '../models/Filter.model';
import { InfusionHistoryComponent } from '../continuous-infusion/infusion-history/infusion-history.component';



@Component({
  selector: 'app-fluidbalance-chart',
  templateUrl: './fluidbalance-chart.component.html',
  styleUrls: ['./fluidbalance-chart.component.css']
})
export class FluidbalanceChartComponent implements OnInit, OnDestroy {

  subscriptions = new Subscription();
  chartSubscriptions = new Subscription();
  helper: FluidbalanceHelper;
  fbchart = new Chart();
  intakeRoutesCount = 0;
  outputRoutesCount = 0;
  bsModalRef: BsModalRef;
  confirmModalRef: BsModalRef;
  chartLoadingComplete = false;


  constructor(public subjects: SubjectsService, public appService: AppService, public apiRequest: ApirequestService, private modalService: BsModalService) {
    this.subscriptions.add(this.subjects.chartDateChange.subscribe(async () => {
      this.chartLoadingComplete = false;
      this.appService.logToConsole("getting signal from chart date component");
      this.fbchart = new Chart();
      this.appService.resetFluidBalanceDaySession();
      this.chartSubscriptions.unsubscribe();
      this.chartSubscriptions = new Subscription();

      const currentDate = this.appService.currentChartDate;
      currentDate.setHours(0);
      currentDate.setMinutes(0)
      currentDate.setMilliseconds(0);
      currentDate.setSeconds(0);

      this.appService.sessionStartDateTime = new Date(moment(currentDate).add(this.appService.appConfig.appsettings.sessionStartTime, "hours").toISOString());
      this.appService.sessionStopDateTime = new Date(moment(this.appService.sessionStartDateTime).add(24, "hours").toISOString());


      this.helper = new FluidbalanceHelper(appService, apiRequest, this.chartSubscriptions);
      this.helper.GetCurrentSession().subscribe(() => {
        this.DrawChart();
      });
    }));

    this.subscriptions.add(this.subjects.drawChart.subscribe(async () => {
      this.chartSubscriptions.unsubscribe();
      this.chartSubscriptions = new Subscription();
      this.helper = new FluidbalanceHelper(appService, apiRequest, this.chartSubscriptions);

      this.DrawChart();
    }));

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  public DrawChart() {
    this.chartLoadingComplete = false;
    this.fbchart = new Chart();

    if (this.appService.FluidBalanceSession && this.appService.FluidBalanceSession.hasOwnProperty("fluidbalancesession_id")) {
      this.helper.GetRoutesInSession().subscribe(() => {
        this.helper.GetIntakeOutputForSession().subscribe(() => {
          this.subjects.sessionChanged.next();
          this.generateChartData();
          this.chartLoadingComplete = true;
        });
      });
    }
    else {
      this.chartLoadingComplete = true;
    }
  }

  generateChartData() {
    this.generateHeaderRow();
    this.generateDataRows();

    //round values in running total cells to 2 decimal digits
    this.fbchart.rows.forEach(x => x.cells.filter(y => y.getType() == "RunningTotalCell")
      .forEach((rt: RunningTotalCell) => {
        rt.runningtotaldata
          .forEach((d) => {
            d.total = this.RoundDecimalToTwoPosition(d.total)
          })
      })
    );
    this.intakeRoutesCount = this.appService.FluidBalanceSessionRoutes.filter(x => x.isintake === true).length + 1;
    this.outputRoutesCount = this.appService.FluidBalanceSessionRoutes.filter(x => x.isintake === false).length + 1;

    this.appService.logToConsole(this.fbchart);
  }

  RoundDecimalToTwoPosition(num: any) {
    return +(Math.round(parseFloat(num + "e+2")) + "e-2");
  }


  generateHeaderRow() {
    const headerrow = new ChartRow();
    //const tcell = new TimeSlotCell();
    //tcell.hour = null;
    //headerrow.cells.push(tcell);

    const isIntake = [true, false];

    for (const d of isIntake) {
      for (const sessionroute of this.appService.FluidBalanceSessionRoutes.filter(x => x.isintake == d).sort((a, b) => { return a.displayorder - b.displayorder })) {
        const cell = new HeaderCell();
        cell.routeid = sessionroute.route_id;
        cell.displayorder = sessionroute.displayorder;
        cell.fbsessionrouteid = sessionroute.fluidbalancesessionroute_id;
        cell.isintake = sessionroute.isintake;
        cell.routename = sessionroute.routename;
        cell.canbecontinuousinfusion = this.appService.MetaRoutes.filter(x => x.route_id === sessionroute.route_id)[0].iscontinuousinfusion;
        headerrow.cells.push(cell);
      }
      //add running total header cell for each direction type
      const runningtotalcell = new HeaderCell();
      runningtotalcell.routename = d ? "Intake Running Total" : "Output Running Total";
      runningtotalcell.routeid = d ? "irt" : "ort";
      runningtotalcell.isintake = d;
      runningtotalcell.displayorder = -1;
      headerrow.cells.push(runningtotalcell);
    }

    //add the header row to chart
    this.fbchart.rows.push(headerrow);
  }

  generateDataRows() {

    const minHour = this.appService.sessionStartDateTime;
    const isIntake = [true, false];

    //generate each data row
    //iterate over minhour through session stop datetime
    //for each hour iterate through all sessionroutes and add a data cell for each route
    for (const i = moment(minHour).clone(); i < moment(this.appService.sessionStopDateTime); i.add(1, "hour")) {

      //create new data row
      const datarow = new ChartRow();

      //Add TimeSlot Cell
      const timecell = new TimeSlotCell()
      timecell.hour = i.get("hour");
      datarow.cells.push(timecell)



      //add IO data cells for each session route in the row
      //first intake,then output in this order. 
      for (const d of isIntake) {
        //Create running total cell//addlater
        let runningtotalcell_hour = new RunningTotalCell();
        runningtotalcell_hour.hour = i.get("hour");
        runningtotalcell_hour.isintake = d;
        runningtotalcell_hour.runningtotaldata.push(new RunningTotalData(RunningTotalType.hourly, 0));
        runningtotalcell_hour.runningtotaldata.push(new RunningTotalData(RunningTotalType.running, 0));

        //for each session route in this session, in displyaorder order
        for (const sessionroute of this.appService.FluidBalanceSessionRoutes.filter(x => x.isintake == d).sort((a, b) => { return a.displayorder - b.displayorder })) {
          //create a new datacell
          const datacell = new DataCell();
          datacell.fbsessionrouteid = sessionroute.fluidbalancesessionroute_id;
          datacell.routeid = sessionroute.route_id;
          datacell.timeslot = i.toDate();
          let comparedatemin = i.clone().set("minute", 1);
          let comparedatemax = comparedatemin.clone().add(59, "minute");

          //const iodata = this.appService.FluidBalanceIntakeOutput.filter(x => moment(x.datetime).format("MMDDYYYY:HH") === i.format("MMDDYYYY:HH")
          //  && x.fluidbalancesessionroute_id === sessionroute.fluidbalancesessionroute_id && !x.isremoved && x.isintake === sessionroute.isintake);

          const iodata = this.appService.FluidBalanceIntakeOutput.filter(x =>
            ((moment(x.datetime).isBetween(comparedatemin, comparedatemax, undefined, '[]') && this.appService.MetaIOType.filter(y => y.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype === 'CI')
              ||
              (moment(x.datetime).format("MMDDYYYY:HH") === i.format("MMDDYYYY:HH") && this.appService.MetaIOType.filter(z => z.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype !== 'CI'))
            && x.fluidbalancesessionroute_id === sessionroute.fluidbalancesessionroute_id && !x.isremoved && x.isintake === sessionroute.isintake).sort((a, b) => { return moment(a.datetime).diff(moment(b.datetime)) });

          datacell.hasremovedobs = this.appService.FluidBalanceIntakeOutput.filter(x =>
            ((moment(x.datetime).isBetween(comparedatemin, comparedatemax, undefined, '[]') && this.appService.MetaIOType.filter(y => y.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype === 'CI')
              ||
              (moment(x.datetime).format("MMDDYYYY:HH") === i.format("MMDDYYYY:HH") && this.appService.MetaIOType.filter(z => z.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype !== 'CI'))
            && x.fluidbalancesessionroute_id === sessionroute.fluidbalancesessionroute_id && x.isremoved && x.isintake === sessionroute.isintake).length > 0;;

          datacell.hasamendedobs = this.appService.FluidBalanceIntakeOutput.filter(x =>
            ((moment(x.datetime).isBetween(comparedatemin, comparedatemax, undefined, '[]') && this.appService.MetaIOType.filter(y => y.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype === 'CI')
              ||
              (moment(x.datetime).format("MMDDYYYY:HH") === i.format("MMDDYYYY:HH") && this.appService.MetaIOType.filter(z => z.fluidbalanceiotype_id === x.fluidbalanceiotype_id)[0].iotype !== 'CI'))
            && x.fluidbalancesessionroute_id === sessionroute.fluidbalancesessionroute_id && !x.isremoved && x.isamended && x.isintake === sessionroute.isintake).length > 0;;


          //datacell.hasremovedobs = this.appService.FluidBalanceIntakeOutput.filter(x => moment(x.datetime).format("MMDDYYYY:HH") === i.format("MMDDYYYY:HH")
          //  && x.fluidbalancesessionroute_id === sessionroute.fluidbalancesessionroute_id && x.isremoved && x.isintake === sessionroute.isintake).length > 0;

          //populate data cells's intake output data 
          if (iodata)
            for (const io of iodata) {
              const iodata = new IOData()
              //io.fluidbalanceiotype_id = "fe17c644-0510-411c-be3e-687486520419";  //remove this line
              iodata.iotype = this.appService.MetaIOType.filter(x => x.fluidbalanceiotype_id === io.fluidbalanceiotype_id)[0].iotype;
              iodata.iodatetime = io.datetime;
              iodata.volume = io.volume;
              iodata.displayname = this.appService.MetaRouteTypes.filter(x => x.routetype_id === io.routetype_id)[0].routetype;
              iodata.description = "";
              iodata.fbintakeoutputid = io.fluidbalanceintakeoutput_id;
              iodata.isamended = io.isamended;
              iodata.devicename = io.fluidcapturedevice_id != "" ? this.appService.MetaFluidCaptureDevices.filter(x => x.fluidcapturedevice_id === io.fluidcapturedevice_id)[0].name : "";
              iodata.routeid = io.route_id;
              //running totals
              //runningtotalcell_hour.runningtotaldata.total += io.volume;
              runningtotalcell_hour.runningtotaldata.find(x => x.totaltype === RunningTotalType.hourly).total += io.volume;
              datacell.data.push(iodata);
            }

          //for all Continuous infusions in this route, calculate estimated infusion for this hour. 
          datacell.cidata = this.CalculateExpectedCI(i, sessionroute.fluidbalancesessionroute_id);
          //for all Continuous infusions in this route, get paused and restarted events. 
          datacell.cievents = this.GetCIEvents(i, sessionroute.fluidbalancesessionroute_id, ["pause", "restart"]);

          //add the route datacell to the row.
          datarow.cells.push(datacell);

        }

        //calculate running total for this hour
        //running total of all routes for this for this hour. 
        let prevHourTotal = 0;

        //getting most latest non zero runining total - where type = hourly. 
        //get all the rows that have a running total not equal to 0 and of the current direction type - where type = hourly. 
        const allrowswithrunningtotal = (this.fbchart.rows.filter(x => this.getInstanceType(x) === 'ChartRow') as Array<ChartRow>).
          filter((a => (a.cells.filter(b => this.getInstanceType(b) === 'RunningTotalCell') as Array<RunningTotalCell>).filter(c => c.isintake === d && c.runningtotaldata.find(x => x.totaltype === RunningTotalType.hourly).total !== 0).length !== 0));

        //if there are rows with running total, get the running total value of the most latest row for the current direction type
        if (allrowswithrunningtotal && allrowswithrunningtotal.length !== 0)
          prevHourTotal = (allrowswithrunningtotal[allrowswithrunningtotal.length - 1].cells
            .filter(x => this.getInstanceType(x) === 'RunningTotalCell') as Array<RunningTotalCell>)
            .filter(c => c.isintake === d)[0].runningtotaldata.find(x => x.totaltype === RunningTotalType.running).total;

        //if there is no total for this hour, do not add previous to current total. next iteration will get the most latest non zero running total.
        const t = runningtotalcell_hour.runningtotaldata.find(x => x.totaltype === RunningTotalType.hourly).total;
        if ((t !== 0))
          runningtotalcell_hour.runningtotaldata.find(x => x.totaltype === RunningTotalType.running).total
            = runningtotalcell_hour.runningtotaldata.find(x => x.totaltype === RunningTotalType.hourly).total + prevHourTotal;

        datarow.cells.push(runningtotalcell_hour);

      }
      // add this row to the chart. 
      this.fbchart.rows.push(datarow);
    }

    //all the hour rows are done. 
    //add running totals row
    //running total of each route, for all hours.  
    const runningtotalsrow = new ChartRow();
    //Add TimeSlot Cell
    const timecell = new TimeSlotCell();
    timecell.displaytext = "Total";
    runningtotalsrow.cells.push(timecell)

    //loop through each session route (headercell) in the chartdatamodel. 
    for (const sessionroute of this.fbchart.rows[0].cells as Array<HeaderCell>) {
      //create a new datacell
      let runningtotalcell_route = new RunningTotalCell();
      runningtotalcell_route.runningtotaldata.push(new RunningTotalData(RunningTotalType.route, 0));
      runningtotalcell_route.isintake = sessionroute.isintake;
      runningtotalcell_route.fbsessionrouteid = sessionroute.fbsessionrouteid;
      runningtotalcell_route.routeid = sessionroute.routeid;

      let total = 0;
      if (sessionroute.routeid === "irt" || sessionroute.routeid === "ort") {

        const allrowswithrunningtotal = (this.fbchart.rows.filter(x => this.getInstanceType(x) === 'ChartRow') as Array<ChartRow>).
          filter((a => (a.cells.filter(b => this.getInstanceType(b) === 'RunningTotalCell') as Array<RunningTotalCell>).filter(c => c.isintake === sessionroute.isintake && c.runningtotaldata.find(x => x.totaltype === RunningTotalType.running).total !== 0).length !== 0));

        //if there are rows with running total, get the running total value of the most latest row for the current direction type
        if (allrowswithrunningtotal && allrowswithrunningtotal.length !== 0)
          total = (allrowswithrunningtotal[allrowswithrunningtotal.length - 1].cells
            .filter(x => this.getInstanceType(x) === 'RunningTotalCell') as Array<RunningTotalCell>)
            .filter(x => x.isintake === sessionroute.isintake)[0].runningtotaldata.find(x => x.totaltype === RunningTotalType.running).total;

      }
      else {
        const lett = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === sessionroute.fbsessionrouteid);

        total = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === sessionroute.fbsessionrouteid && !x.isremoved && x.isintake === sessionroute.isintake).
          map((e) => { return e.volume }).reduce((a, b) => { return a + b; }, 0)


      }
      runningtotalcell_route.runningtotaldata[0].total = total;
      runningtotalsrow.cells.push(runningtotalcell_route);
    }

    this.fbchart.rows.push(runningtotalsrow);
  }

  //public CalculateExpectedCI(hour: moment.Moment, sessionrouteid: string): Array<ExpectedCI> {

  //  let currenttime = hour.clone();

  //  //get all ci for the sessionroute
  //  const expectedcilist = []
  //  const cilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === sessionrouteid);

  //  for (const ci of cilist) {
  //    currenttime = hour.clone();
  //    const administeredci = this.appService.FluidBalanceIntakeOutput.filter(x => x.continuousinfusion_id === ci.continuousinfusion_id).filter
  //      (x => x.fluidbalanceiotype_id !== this.appService.MetaIOType.filter(v => v.iotype === "Flush")[0].fluidbalanceiotype_id);


  //    let lastvalidatetime = moment.max(administeredci.map((e) => { return moment(e.datetime) }));

  //    if (administeredci.length == 0)
  //      lastvalidatetime = moment(ci.startdatetime);

  //    let steps = ci.totalremainingvolume / ci.flowrate;
  //    const diff = steps - Math.floor(steps);

  //    const maxtime = lastvalidatetime.add(Math.ceil(steps) - 1, "hour");

  //    if (currenttime.format("MMDDYYYY:HH") >= moment(ci.startdatetime.toString(), moment.ISO_8601).format("MMDDYYYY:HH")
  //      && (currenttime.format("MMDDYYYY:HH") <= maxtime.format("MMDDYYYY:HH"))) {
  //      const administeredci = this.appService.FluidBalanceIntakeOutput.filter(x => moment(x.datetime).format("MMDDYYYY:HH") === currenttime.format("MMDDYYYY:HH") && x.continuousinfusion_id === ci.continuousinfusion_id).filter
  //        (x => x.fluidbalanceiotype_id !== this.appService.MetaIOType.filter(v => v.iotype === "Flush")[0].fluidbalanceiotype_id &&
  //          x.fluidbalanceiotype_id !== this.appService.MetaIOType.filter(v => v.iotype === "Bolus")[0].fluidbalanceiotype_id);
  //      const administeredcinexthour = this.appService.FluidBalanceIntakeOutput.filter(x => moment(x.datetime).format("MMDDYYYY:HH") === currenttime.clone().add(1, "hour").format("MMDDYYYY:HH") && x.continuousinfusion_id === ci.continuousinfusion_id)

  //      const totaladmadministedvolume = administeredci.map((e) => { return e.volume; }).reduce((a, b) => { return a + b }, 0);

  //      if (!(administeredcinexthour.length > 0)) //this is not the latest validation no Grey 
  //      {
  //        let calulatedci = ci.flowrate;
  //        if (totaladmadministedvolume > 0)
  //          calulatedci -= totaladmadministedvolume;
  //        const expectedci = new ExpectedCI();
  //        expectedci.ciid = ci.continuousinfusion_id;
  //        if (currenttime.format("MMDDYYYY:HH") == maxtime.format("MMDDYYYY:HH") && diff != 0)
  //          expectedci.volume = Math.round(calulatedci * diff);
  //        else
  //          expectedci.volume = calulatedci;
  //        try {
  //          expectedci.displayname = this.appService.MetaRouteTypes.filter(x => x.routetype_id === ci.routetype_id)[0].routetype;
  //        } catch{ expectedci.displayname = "unknown"; }

  //        expectedcilist.push(expectedci);
  //      }
  //    }
  //  }
  //  return expectedcilist;
  //}

  public CalculateExpectedCI(charthour: moment.Moment, sessionrouteid: string): Array<ExpectedCI> {


    //get all ci for the sessionroute
    const expectedcilist = []
    const cilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === sessionrouteid);

    for (const ci of cilist) {

      if (ci.finishdatetime)
        continue;

      // const administeredci = this.appService.FluidBalanceIntakeOutput.filter(x => x.continuousinfusion_id === ci.continuousinfusion_id && !x.isremoved).filter
      //   (x => x.fluidbalanceiotype_id !== this.appService.MetaIOType.filter(v => v.iotype === "Flush")[0].fluidbalanceiotype_id).filter
      //   (x => x.fluidbalanceiotype_id !== this.appService.MetaIOType.filter(v => v.iotype === "Bolus")[0].fluidbalanceiotype_id);


      let totalremainingvolume = ci.totalremainingvolume;
      // let lastvalidatetime = moment.max(administeredci.map((e) => { return moment(e.datetime) }));
      let lastvalidatetime = moment(ci.lastvalidated);
      const restartevents = this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(x => x.continuousinfusion_id === ci.continuousinfusion_id
        && x.eventtype === "restart"
        && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0);
      let lastresumedatetime = moment.max(restartevents.map((e) => { return moment(e.datetime) }));

      //if (administeredci.length == 0)
      if (!ci.lastvalidated)
        lastvalidatetime = moment(ci.startdatetime);

      if (restartevents.length != 0 && lastresumedatetime > lastvalidatetime)
        lastvalidatetime = lastresumedatetime;

      if (charthour.format("MMDDYYYY:HH") === lastvalidatetime.format("MMDDYYYY:HH") || charthour >= lastvalidatetime) {

        let currenttime = lastvalidatetime.clone();
        while (totalremainingvolume > 0) {
          let percentadministred = 1;
          const wholehour = 1;
          if (currenttime.format("MMDDYYYY:HH") === lastvalidatetime.format("MMDDYYYY:HH")) {
            percentadministred = wholehour - (currenttime.get("minute") / 60)
          }

          // if (there is a pause in this hour and no resume > than pause time)
          const pausedevent = this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(x => x.continuousinfusion_id == ci.continuousinfusion_id &&
            moment(x.datetime).format("MMDDYYYY:HH") === currenttime.format("MMDDYYYY:HH") && x.eventtype === "pause"
            && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0);
          if (pausedevent.length !== 0) {
            const resumeevent = this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(x => x.continuousinfusion_id == ci.continuousinfusion_id &&
              moment(x._createddate) >= moment.max(pausedevent.map((e) => { return moment(e._createddate) })) && x.eventtype === "restart"
              && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0);
            if (resumeevent.length == 0) {
              if (charthour.format("MMDDYYYY:HH") === currenttime.format("MMDDYYYY:HH")) {

                // const expectedci = new ExpectedCI();
                // expectedci.ciid = ci.continuousinfusion_id;
                // try {
                //   expectedci.displayname = this.appService.MetaRouteTypes.filter(x => x.routetype_id === ci.routetype_id)[0].routetype + '- Paused';
                // } catch{ expectedci.displayname = "unknown - Paused"; }

                // expectedcilist.push(expectedci);
                break;
              }
              else break;
            }
            else {
              const maxresumedate = moment.max(resumeevent.map((e) => { return moment(e.datetime) }))
              percentadministred = 1 - (maxresumedate.get("minute") / 60)
              if (currenttime.format("MMDDYYYY:HH") === lastvalidatetime.format("MMDDYYYY:HH")
                && lastvalidatetime >= maxresumedate) {
                percentadministred = wholehour - (currenttime.get("minute") / 60)
              }
            }
          }

          let calulatedci = percentadministred * ci.flowrate;
          if (totalremainingvolume < calulatedci)
            calulatedci = totalremainingvolume;
          totalremainingvolume -= calulatedci;

          //break if the currenttime is equal charthour 
          if (charthour.format("MMDDYYYY:HH") === currenttime.format("MMDDYYYY:HH")) {
            const expectedci = new ExpectedCI();
            expectedci.ciid = ci.continuousinfusion_id;
            expectedci.volume = calulatedci;
            try {
              expectedci.displayname = this.appService.MetaRouteTypes.filter(x => x.routetype_id === ci.routetype_id)[0].routetype;
            } catch { expectedci.displayname = "unknown"; }

            expectedcilist.push(expectedci);
            break;

          }

          currenttime.set('minute', 0).add(1, 'hour');
        }
      }
    }


    return expectedcilist;
  }

  public GetCIEvents(charthour: moment.Moment, sessionrouteid: string, eventtypes: string[]) {
    const cievents = []
    const cilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === sessionrouteid);

    for (const ci of cilist) {
      const events = this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(x => x.continuousinfusion_id === ci.continuousinfusion_id
        && eventtypes.includes(x.eventtype) && charthour.format("MMDDYYYY:HH") === moment(x.datetime).format("MMDDYYYY:HH")
        && (this.appService.FluidBalanceSessionContinuousInfusionsEvents.filter(y => y.deletecorrelationid === x.continuousinfusionevent_id)).length === 0)
        .sort((a, b) => { return moment(a._createddate).diff(moment(b._createddate)) })
        .map((e) => {
          cievents.push(
            new CIEvents(
              ci.continuousinfusion_id,
              this.appService.MetaRouteTypes.filter(x => x.routetype_id === ci.routetype_id)[0].routetype,
              e.continuousinfusionevent_id,
              e.eventtype,
              e.datetime
            ))
        });
    }

    return cievents;
  }

  public getInstanceType(obj: any) {
    //return obj.constructor.name;
    return obj.getType();
  }
  public handleclick(e: any, action?: string) {
    this.appService.logToConsole(this.getInstanceType(e));
    this.appService.logToConsole(e.fbsessionrouteid);
    this.appService.logToConsole(e.routeid);
    this.appService.logToConsole(e.timeslot);

    if (this.appService.IsMonitoringActive() && this.appService.IsCurrentEncounter()) {
      if (this.getInstanceType(e) === "DataCell") {

        //get all ci running at this hour
        //this data is available in fbchartcell
        const cell = (e as DataCell);
        let ci: Array<Continuousinfusion> = [];

        //all cis from expected ci array
        ci = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => cell.cidata.filter(y => y.ciid === x.continuousinfusion_id).length !== 0 && this.sendCIToTimeSlotOptions(x));

        //push all cis from iodata if not already pushed from expected ci array
        for (const iodata of cell.data) {
          if (iodata.iotype === "Flush" || iodata.iotype === "Bolus" || iodata.iotype === "CI") {
            const ciid = this.appService.FluidBalanceIntakeOutput.find(x => x.fluidbalanceintakeoutput_id === iodata.fbintakeoutputid).continuousinfusion_id;
            if (ci.filter(x => x.continuousinfusion_id === ciid).length === 0) {
              const iodataci = this.appService.FluidBalanceSessionContinuousInfusions.find(x => x.continuousinfusion_id === ciid);
              ci.push(iodataci);
            }
          }
        }

        //push all cis from cievents (paused and restarted CIs) if not already pushed from expected ci array
        for (const ciwithevent of cell.cievents) {
          if (ci.filter(x => x.continuousinfusion_id === ciwithevent.ciid).length === 0) {
            const prci = this.appService.FluidBalanceSessionContinuousInfusions.find(x => x.continuousinfusion_id === ciwithevent.ciid);
            ci.push(prci);
          }
        }

        this.subjects.openTimeSlotOptions.next({
          "fluidbalancesessionroute_id": (e as DataCell).fbsessionrouteid,
          "route_id": (e as DataCell).routeid,
          "timeslot": (e as DataCell).timeslot,
          "continuousinfusion": ci

        });
      }
      else if (this.getInstanceType(e) === "HeaderCell" && (e as HeaderCell).displayorder !== -1) {
        const cell = (e as HeaderCell);
        if (action === "add") {
          let ci: Array<Continuousinfusion> = [];

          //all cis from expected ci array
          ci = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid && this.sendCIToTimeSlotOptions(x));

          if ((e as HeaderCell).canbecontinuousinfusion) {
            this.subjects.openTimeSlotOptions.next({
              "fluidbalancesessionroute_id": (e as HeaderCell).fbsessionrouteid,
              "route_id": (e as DataCell).routeid,
              "timeslot": null,
              "continuousinfusion": ci
            });
          }
          else {
            if (cell.isintake) {
              this.subjects.singleIntakeNew.next({
                "fluidbalancesessionroute_id": (e as HeaderCell).fbsessionrouteid,
                "route_id": (e as DataCell).routeid,
                "timeslot": null
              });
            }
            else if (!cell.isintake) {
              this.subjects.singleOutputNew.next({
                "fluidbalancesessionroute_id": (e as HeaderCell).fbsessionrouteid,
                "route_id": (e as DataCell).routeid,
                "timeslot": null
              });
            }
          }
        }
        else if (action === "remove") {
          this.removeRoute(cell.fbsessionrouteid);
        }
      }
    }
  }

  sendCIToTimeSlotOptions(infusion: Continuousinfusion) {
    let addtolist = false;
    if (moment(infusion.startdatetime) >= moment(this.appService.sessionStartDateTime) && moment(infusion.startdatetime) < moment(this.appService.sessionStopDateTime)) //if started today, show in the list
      addtolist = true;
    else
      if (moment(infusion.finishdatetime) >= moment(this.appService.sessionStartDateTime)) //if not started today, but completed today, show in the list
        addtolist = true;
      else
        if (moment(infusion.startdatetime) < moment(this.appService.sessionStartDateTime)) // if not started today and completion datetime is before today do not show
        {
          let expectedcompletion = null;
          if (!infusion.lastvalidated)
            infusion.lastvalidated = infusion.startdatetime;
          if (infusion.lastvalidated) {
            let lastValidatedTime = moment(infusion.lastvalidated);
            let hours = infusion.totalremainingvolume / infusion.flowrate;
            expectedcompletion = lastValidatedTime.add(hours, "hour").toDate();
          }
          if (expectedcompletion && expectedcompletion >= this.appService.sessionStartDateTime)
            addtolist = true; // show if completion date time is today or future
        }
    return addtolist;
  }

  removeRoute(fbsessoionrouteid: string) {
    this.subscriptions.add(
      this.apiRequest.deleteRequest(this.appService.baseURI + "/DeleteObjectByAttribute?synapsenamespace=core&synapseentityname=fluidbalancesessionroute&synapseattributename=fluidbalancesessionroute_id&attributevalue=" + fbsessoionrouteid)
        .subscribe(() => {
          this.subscriptions.add(
            this.apiRequest.deleteRequest(this.appService.baseURI + "/DeleteObjectByAttribute?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions&synapseattributename=fluidbalancesessionroute_id&attributevalue=" + fbsessoionrouteid)
              .subscribe(() => {
                this.DrawChart();
                this.deletingsessionrouteid = "";

              }));
        }));
  }

  CreateFluidBalanceSessionRouteSessionsFilter(sessionid: string, sessionrouteid: string) {
    const condition = "fluidbalancesession_id = @a and fluidbalancesessionroute_id = @b"
    const pm = new filterParams();
    pm.filterparams.push(new filterparam("@a", sessionid));
    pm.filterparams.push(new filterparam("@b", sessionrouteid));
    const f = new filters()
    f.filters.push(new filter(condition));

    const select = new selectstatement("SELECT fluidbalancesessionroutesessions_id");

    const orderby = new orderbystatement("ORDER BY fluidbalancesessionroutesessions_id desc");

    const body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }


  removeRoutefromSession(sessionionid: string, sessionrouteid: string) {

    //get fluidbalancesessionroutesessions id for the route and session 

    this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions", this.CreateFluidBalanceSessionRouteSessionsFilter(sessionionid, sessionrouteid)).subscribe
      ((response) => {
        if (response && response.length !== 0) {
          {
            const id = response[0].fluidbalancesessionroutesessions_id;
            this.subscriptions.add(
              this.apiRequest.deleteRequest(this.appService.baseURI + "/DeleteObject?synapsenamespace=core&synapseentityname=fluidbalancesessionroutesessions&id=" + id)
                .subscribe(() => {
                  this.DrawChart();
                  this.deletingsessionrouteid = "";
                }));
          }
        }
      }));


  }

  openAddRouteModal(e) {
    const config = {
      backdrop: true,
      ignoreBackdropClick: true,
      class: 'modal-dialog-centered modal-lg',
      initialState: {
        selectedRouteTypeText: "Please select",
        selectedRouteText: "Please select",
        selectedRouteId: "",
        ioRoutes: [],
        showErrorMessage: false,
        errorMessage: ""
      }
    }

    this.bsModalRef = this.modalService.show(AddRouteComponent, config);
    this.subjects.addRoute.next({ "value": e });
  }

  IsRouteRemovable(cell: HeaderCell) {

    if (!this.appService.IsCurrentEncounter() || !this.appService.IsCurrentDaySession() || !this.appService.IsMonitoringActive())
      return false;

    //check if there are any single volume io for this session
    const iodata = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid && !x.isremoved && x.fluidbalancesession_id === this.appService.FluidBalanceSession.fluidbalancesession_id);
    const cilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid);


    if (iodata.length > 0 || cilist.length > 0 || (cell.displayorder === 1 && cell.isintake === true) || (cell.displayorder === this.appService.appConfig.appsettings.maxIntakeRoutes + 1 && cell.isintake === false))
      return false;
    else
      return true;

  }

  IsCIRemovable(cell: HeaderCell) {
    if (this.IsRouteRemovable(cell))
      return false;
    else {

      //if there is an Continuous infustion that has been started  today 
      const toadycilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid && (moment(x.startdatetime).isSameOrAfter(moment(this.appService.sessionStartDateTime))));

      //if there are any Continuous infusions that on going
      const activecilist = this.appService.FluidBalanceSessionContinuousInfusions.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid && x.totalremainingvolume > 0 && !x.finishdatetime);

      //if there are any io
      const iodata = this.appService.FluidBalanceIntakeOutput.filter(x => x.fluidbalancesessionroute_id === cell.fbsessionrouteid && !x.isremoved && x.fluidbalancesession_id === this.appService.FluidBalanceSession.fluidbalancesession_id);

      if ((cell.displayorder === 1 && cell.isintake === true) || (cell.displayorder === this.appService.appConfig.appsettings.maxIntakeRoutes + 1 && cell.isintake === false))
        return false;
      else
        if (iodata.length == 0 && toadycilist.length == 0 && activecilist.length == 0)
          return true;
        else
          return false;

    }
  }

  deletingsessionrouteid = "";

  openConfirmModal(template: TemplateRef<any>, fbsessionrouteid: string) {
    this.confirmModalRef = this.modalService.show(template, {
      backdrop: true,
      ignoreBackdropClick: true,
      class: 'modal-sm modal-dialog-centered'

    });

    this.deletingsessionrouteid = fbsessionrouteid;

  }

  openCIRouteRemoveConfirmModal(template: TemplateRef<any>, fbsessionrouteid: string) {
    this.confirmModalRef = this.modalService.show(template, {
      backdrop: true,
      ignoreBackdropClick: true,
      class: 'modal-sm modal-dialog-centered'

    });

    this.deletingsessionrouteid = fbsessionrouteid;

  }

  confirmDelete() {
    this.removeRoute(this.deletingsessionrouteid);
    this.confirmModalRef.hide();
  }

  confirmCIRouteDelete() {
    this.removeRoutefromSession(this.appService.FluidBalanceSession.fluidbalancesession_id, this.deletingsessionrouteid);
    this.confirmModalRef.hide();
  }


  cancelDelete() {
    this.deletingsessionrouteid = "";
    this.confirmModalRef.hide();
  }


  ngOnInit(): void {
  }

}
