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
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { HttpClientModule } from '@angular/common/http';
import { FluidBalanceMonitoringComponent } from './fluid-balance-monitoring/fluid-balance-monitoring.component';
import { RecordWeightComponent } from './record-weight/record-weight.component';
import { RunningTotalComponent } from './running-total/running-total.component';
import { ChartDateComponent } from './chart-date/chart-date.component';
import { EncounterComponent } from './encounter/encounter.component';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { FilterPipe } from './common/filter.pipe';
import { SingleVolumeFluidIntakeComponent } from './single-volume-fluid-intake/single-volume-fluid-intake.component';
import { StopFluidBalanceMonitoringComponent } from './stop-fluid-balance-monitoring/stop-fluid-balance-monitoring.component';
import { FluidbalanceChartComponent } from './fluidbalance-chart/fluidbalance-chart.component';
import { ContinuousInfusionComponent } from './continuous-infusion/continuous-infusion.component';
import { InfusionMenuComponent } from './continuous-infusion/infusion-menu/infusion-menu.component';
import { ValidateInfusionComponent } from './continuous-infusion/validate-infusion/validate-infusion.component';
import { ChangePumpComponent } from './continuous-infusion/change-pump/change-pump.component';
import { FluidLossComponent } from './continuous-infusion/fluid-loss/fluid-loss.component';
import { InfusionHistoryComponent } from './continuous-infusion/infusion-history/infusion-history.component';
import { CompleteInfusionComponent } from './continuous-infusion/complete-infusion/complete-infusion.component';
import { StartInfusionComponent } from './continuous-infusion/start-infusion/start-infusion.component';
import { TimeslotOptionsComponent } from './timeslot-options/timeslot-options.component';
import { SingleVolumeIntakeHistoryComponent } from './single-volume-intake-history/single-volume-intake-history.component';
import { AddRouteComponent } from './add-route/add-route.component';
import { AddBolusComponent } from './continuous-infusion/add-bolus/add-bolus.component';
import { AddFlushComponent } from './continuous-infusion/add-flush/add-flush.component';
import { SingleVolumeFluidOutputComponent } from './single-volume-fluid-output/single-volume-fluid-output.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { SingleVolumeOutputHistoryComponent } from './single-volume-output-history/single-volume-output-history.component';
import { SbarEscalationFormComponent } from './sbar-escalation-form/sbar-escalation-form.component';
import { NumberOnlyDirective } from './common/number-only.directive';
import { UrineOutputHistoryComponent } from './urine-output-history/urine-output-history.component';
import { CoreLibModule } from '@interneuroncic/interneuron-ngx-core-lib';
import { PauseInfusionComponent } from './continuous-infusion/pause-infusion/pause-infusion.component';
import { CompleteContinousInfusionComponent } from './continuous-infusion/complete-continous-infusion/complete-continous-infusion.component';
import { AutoGrowDirective } from './common/auto-grow.directive';
@NgModule({
  declarations: [
    AppComponent,
    FluidBalanceMonitoringComponent,
    RecordWeightComponent,
    RunningTotalComponent,
    ChartDateComponent,
    EncounterComponent,
    SingleVolumeFluidIntakeComponent,
    FilterPipe,
    StopFluidBalanceMonitoringComponent,
    FluidbalanceChartComponent,
    ContinuousInfusionComponent,
    InfusionMenuComponent,
    ValidateInfusionComponent,
    ChangePumpComponent,
    FluidLossComponent,
    InfusionHistoryComponent,
    CompleteInfusionComponent,
    StartInfusionComponent,
    TimeslotOptionsComponent,
    SingleVolumeIntakeHistoryComponent,
    AddRouteComponent,
    AddBolusComponent,
    AddFlushComponent,
    SingleVolumeFluidOutputComponent,
    SingleVolumeOutputHistoryComponent,
    SbarEscalationFormComponent,
    NumberOnlyDirective,
    UrineOutputHistoryComponent,
    PauseInfusionComponent,
    CompleteContinousInfusionComponent,
    AutoGrowDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BsDatepickerModule.forRoot(),
    BrowserAnimationsModule,
    FormsModule,
    CommonModule,
    ModalModule.forRoot(),
    TimepickerModule.forRoot(),
    PopoverModule.forRoot(),
    CoreLibModule 
  ],
  providers: [
    DatePipe,
    BsModalRef
  ],
  bootstrap: [],
  entryComponents: [AppComponent]
})
export class AppModule {

  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const el = createCustomElement(AppComponent, { injector: this.injector });
    customElements.define('app-fluidbalance', el); 
  }
}
