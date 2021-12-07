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
// #region Meta

export class Route {
  constructor(
    public route_id: string,
    public route: string,
    public isintake: boolean,
    public iscontinuousinfusion: boolean,
    public terminologycode: string,
    public istyperequired: boolean,
    public displayorder: number
  ) { }
}

export class RouteConfig {
  constructor(
    public routeconfig_id: string,
    public route_id: string,
    public key: string,
    public value: string

  ) { }
}

export class Routetype {
  constructor(
    public routetype_id: string,
    public route_id: string,
    public routetype: string,
    public terminologycode: string,
    public isflush: boolean,
    public displayorder: number,
  ) { }
}

export class Fluidcapturedevice {
  constructor(
    public fluidcapturedevice_id: string,
    public name: string
  ) { }
}

export class Routetypefluidcapturedevice {
  constructor(
    public routetypefluidcapturedevice_id: string,
    public routetype_id: string,
    public fluidcapturedevice_id: string
  ) { }
}

export class Fluidbalanceiotype {
  constructor(
    public fluidbalanceiotype_id: string,
    public iotype: string,
    public terminologycode: string,
    public description: string
  ) { }
}

export class Expectedurineoutput {
  constructor(
    public expectedurineoutput_id: string,
    public description: string,
    public agefrom: number,
    public ageto: number,
    public volume: number,
    public units: string
  ) { }
}
export class SingleVoulmeFluidIntakeOutput {
  constructor(
    public fluidbalanceintakeoutput_id: string,
    public fluidbalancesession_id: string,
    public fluidbalancesessionroute_id: string,
    public person_id: string,
    public fluidcapturedevice_id: string,
    public fluidbalanceiotype_id: string,
    public route_id: string,
    public routetype_id: string,
    public units: string,
    public datetime: any,
    public personweight: number,
    public expectedvolume: number,
    public reasonforamend: string,
    public reasonforremoval: string,
    public addedby: string,
    public modifiedby: string,
    public isremoved: boolean,
    public isamended: boolean,
    public isintake: boolean,
    public continuousinfusionevent_id: string,
    public continuousinfusionvalidation_id: string,
    public otherroutetype: string,
    public volume?: number
  ) { }
}


// #endregion


// #region core


export class FluidBalancePersonStatus {
  public fluidbalancepersonstatus_id: string;
  public person_id: string;
  public encounter_id: string;
  public isactive: boolean;
  public addedby: string;
  public modifiedby: string;
}


export class Fluidbalancesession {
  constructor(
    public fluidbalancesession_id: string,
    public startdate: any,
    public stopdate: any,
    public person_id: string,
    public encounter_id: string,
    public addedby: string,
    public modifiedby: string,
    public initialexpectedurineoutput: number,
    public initialweight: number,
    public initialage: number
  ) { }
}

export class Fluidbalancesessionroute {
  constructor()
  constructor(
    public fluidbalancesessionroute_id?: string,
    public fluidbalancesession_id?: string,
    public route_id?: string,
    public hasbeenamended?: boolean,
    public dateadded?: any,
    public displayorder?: number,
    public addedby?: string,
    public modifiedby?: string,
    public routename?: string,
    public isintake?: boolean
  ) { }
}

export class Fluidbalanceintakeoutput {
  constructor(
    public fluidbalanceintakeoutput_id: string,
    public fluidbalancesessionroute_id: string,
    public route_id: string,
    public routetype_id: string,
    public expectedvolume: number,
    public volume: number,
    public units: string,
    public datetime: any,
    public fluidcapturedevice_id: string,
    public fluidbalanceiotype_id: string,
    public isamended: boolean,
    public reasonforamend: string,
    public reasonforremoval: string,
    public isremoved: boolean,
    public personweight: number,
    public person_id: string,
    public addedby: string,
    public modifiedby: string,
    public continuousinfusionevent_id: string,
    public continuousinfusionvalidation_id: string,
    public isintake: boolean,
    public fluidbalancesession_id: string,
    public continuousinfusion_id?: string

  ) { }
}

export class Continuousinfusion {
  constructor(

    public continuousinfusion_id: string,
    public fluidbalancesessionroute_id: string,
    public routetype_id: string,
    public totalvolume: number,
    public flowrate: number,
    public flowrateunit: string,
    public pumpnumber: string,
    public startdatetime: Date,
    public finishdatetime: Date,
    public ispaused: boolean,
    public totaladministeredvolume: number,
    public totalremainingvolume: number,
    public eventcorrelationid: string,
    public islineremovedoncompletion: boolean,
    public completioncomments: string,
    public addedby: string,
    public modifiedby: string,
    public fluidbalancesession_id: string,
    public route_id?: string,
    public lastvalidated?: any,
    public _createdtimestamp?:any,
    public _createddate?:any
  ) { }

}

export class Continuousinfusionevent {
  constructor(

    public continuousinfusionevent_id: string,
    public continuousinfusion_id: string,
    public eventtype: string,
    public datetime: Date,
    public eventcorrelationid: string,
    public addedby: string,
    public modifiedby: string,
    public deletecorrelationid: string,
    public _createddate:any
    
  ) { }

}

export class Fluidbalancesessionroutesessions {
  constructor(
    public fluidbalancesessionroutesessions_id: string,
    public fluidbalancesession_id: string,
    public fluidbalancesessionroute_id: string
  ) { }
}

// #endregion



