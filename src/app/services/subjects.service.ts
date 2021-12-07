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


import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {

  encounterChange = new Subject();
  drawChart = new Subject();
  personIdChange = new Subject();
  apiServiceReferenceChange = new Subject();
  showMessage = new Subject();
  unload = new Subject();
  frameworkEvent = new Subject();
  weightChanged = new Subject();

  openTimeSlotOptions = new Subject();
  singleIntakeNew = new Subject();
  singleIntakeAmend = new Subject();
  singleIntakeRemove = new Subject();
  singleIntakeClose = new Subject();
  openSingleIntakeHistory = new Subject();

  singleOutputNew = new Subject();
  singleOutputAmend = new Subject();
  singleOutputRemove = new Subject();
  openSingleOutputHistory = new Subject();
  openSBARForm = new Subject();
  openContinuosInfusionForm = new Subject();
  openUrineOutputHistory = new Subject();
  saveUrineOuputAndSBARForm = new Subject();
  continuousInfusionMessage = new Subject();
  chartDateChange = new Subject();

  monitoringStopped = new Subject();
  monitoringStarted = new Subject();

  sessionChanged = new Subject();
  addRoute = new Subject();

  closeCIPopup = new Subject();

  constructor() {
  }
}
