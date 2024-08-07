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
import { Component,NgModule, Pipe, PipeTransform } from '@angular/core'
@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: Array<any>, filter: {[key: string]: any },arrayValues): Array<any> {
      if(filter){        
        return items.filter(item => {          
          let notMatchingField = Object.keys(filter).find(key => filter[key].indexOf(item[key]) == -1);
                  return !notMatchingField;
        });                 
    }else{
        let notMatchingField=items;
        return notMatchingField
      }               
    }
}