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
export class CoreContinuousinfusion {
	continuousinfusion_id: string
	fluidbalancesessionroute_id: string
	routetype_id: string
	totalvolume: number
	flowrate: number
	flowrateunit: string = "ml";
	pumpnumber: string
	startdatetime: any
	finishdatetime: any
	ispaused: boolean = false;
	totaladministeredvolume: number = 0;
	totalremainingvolume: number
	eventcorrelationid: string
	islineremovedoncompletion: boolean
	completioncomments: string
	addedby: string = "";
	modifiedby: string = "";
	fluidbalancesession_id: string
	notes:string="";
	route_id:string;
	reasonforpause:string="";
	timeslot: any;

}

export class  CoreContinuousinfusionvalidation
{

	 continuousinfusionvalidation_id: string
	 continuousinfusion_id: string
	 datetime: any
	 calculatedvolume: number
	 administeredvolume: number
	 checkedline: boolean
	 flowrate: number
	 pumpnumber: string
	 eventcorrelationid: string
	 addedby: string
	 modifiedby: string
	 isremoved: boolean
}
export class CoreContinuousinfusionevent {
	continuousinfusionevent_id: string
	continuousinfusion_id: string
	eventtype: string
	datetime: any
	eventcorrelationid: string
	addedby: string
	modifiedby: string
	deletecorrelationid:string="";
}

export class CoreContinuousinfusionfluidloss {
	continuousinfusionfluidloss_id: string
	continuousinfusion_id: string
	volume: number
	datetime: any
	hasbeenamended: boolean
	eventcorrelationid: string
	addedby: string
	modifiedby: string
	note: string
	isremoved: boolean
}