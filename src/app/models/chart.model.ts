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
export abstract class ChartCell {
  public fbsessionrouteid: string
  public routeid: string
  getType() {
    return "ChartCell";
  }
}

export class IOData {
  constructor()
  constructor(
    public iotype?: string,
    public iodatetime?: any,
    public volume?: number,
    public displayname?: string,
    public description?: string,
    public fbintakeoutputid?: string,
    public isamended?:boolean,
    public devicename?: string,
    public routeid?: string
  ) { }

  getType() {
    return "IOData";
  }
}
export class ExpectedCI extends IOData {
  constructor()
  constructor(public ciid?: string
  ) { super(); }
  getType() {
    return "ExpectedCI";
  }
}

export class CIEvents {
  constructor(public ciid?: string, public ciname?: string,public eventid?: string,public eventtype?:string, public eventdatetime?:any)
  { }
  getType() {
    return "CIEvents";
  }
}

export class HeaderCell extends ChartCell {
  constructor()
  constructor(
    public routename?: string,
    public isintake?: boolean,
    public canbecontinuousinfusion?: boolean,
    public displayorder?: number
  ) {
    super();
  }

  getType() {
    return "HeaderCell";
  }
}

export class DataCell extends ChartCell {
  constructor()
  constructor(
    public data?: Array<IOData>,
    public cidata?: Array<ExpectedCI>,
    public cievents?: Array<CIEvents>,
    public timeslot?: any,
    public hasremovedobs?: boolean,
    public hasamendedobs?:boolean
  ) { super(); this.data = []; this.cidata = []; this.cievents = []; }

  getType() {
    return "DataCell";
  }
}

export class TimeSlotCell extends ChartCell {
  constructor()
  constructor(public hour?: number, public displaytext?: string) { super(); }

  getType() {
    return "TimeSlotCell";
  }
}

export class RunningTotalData {
  constructor(
    public totaltype?: RunningTotalType,
    public total?: number,
  ) { }

  getType() {
    return "RunningTotalData";
  }
}

export class RunningTotalCell extends ChartCell {
  constructor()
  constructor(public runningtotaldata?: RunningTotalData[], public hour?: number, public isintake?: boolean) { super(); this.runningtotaldata = []; }
  getType() {
    return "RunningTotalCell";
  }
}

export class ChartRow {
  constructor()
  constructor(public cells?: Array<ChartCell>) { this.cells = []; }

  getType() {
    return "ChartRow";
  }
}

export class Chart {
  constructor()
  constructor(public rows?: Array<ChartRow>) { this.rows = [] }

  getType() {
    return "Chart";
  }
}

export enum RunningTotalType {
  ["hourly"] = "hourly",
  ["running"] = "running",
  ["route"] = "route"
}


