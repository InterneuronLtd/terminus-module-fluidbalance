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
export class UrineOutputHistory {
    public fluidbalanceintakeoutput_id: string;  
    public fluidbalanceescalation_id: string;  
    public units: string;
    public datetime: any;
    public volume: number;
    public age: number;
    public personweight: number;
    public expectedvolume: number; 
    public averagevolume: number; 
    public sbar: string;    
    public addedby: string;
    public modifiedby: string;
}