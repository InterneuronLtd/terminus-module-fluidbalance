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

import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[autoGrow]'
})
export class AutoGrowDirective {


  constructor(private _el: ElementRef) {
  }

  @HostListener('blur', ['$event'])
  @HostListener('change', ['$event'])
  @HostListener('input', ['$event'])
  @HostListener('keydown', ['$event']) onKeyDown(event) {
    event.target.style.height = "100px";
    if(event.target.scrollHeight>100)
    {
        event.target.style.height = "0px";
        event.target.style.height = (event.target.scrollHeight + 5)+"px";
    }
    else{
        event.target.style.height = "100px";
    }
    if(event.target.value.trim()==="")
    {
        event.target.style.height = "100px";
    }

  }

}
