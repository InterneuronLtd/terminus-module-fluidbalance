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
export class EPMAEvent {
    public encounter_id: string;
    public prescription_id: string;
    public posology_id: string;
    public dose_id: string;
    public frequency: string;
    public prescriptionroutes_id: string;
    public frequencysize: number;
    public dosesize: number;
    public strengthneumerator: string;
    public strengthdenominator: string;
    public doseunit: string;
    public strengthneumeratorunit: string;
    public strengthdenominatorunit: string;
    public bnf: string;
    public HospitalNumber: string;
    public medicine: string;
    public dose_datetime: any;
    public logicalid:string;
    public prescription_startdatetime: any;
    public prescription_lastmodifiedfrom: any;
    public prescription_enddatetime: any;
    public calculatedendtime: any;
    public iscancelled: string;
    public orderformtype: string;
    public ivtype:string;
    public route:string;
    public medication_id: string;
    public code: string;
}

export class PrescriptionInfusions {
    public fluidbalance_prescriptioninfusions_id  :string;
    public prescription_id: string;
    public posology_id: string;
    public dose_id: string;
    public logicalid: string;
    public continuousinfusionid: string;
    public dosedatetime: any;
    public iscancelled: boolean;
    public encounter_id: string;
}
export class EpmaSignals {
    public fluidbalance_epmasignals_id: string;
    public prescription_id: string;
    public posology_id: string;
    public eventtype: string;
    public datetime: any;
    public isaddressed: boolean;
}

export class Medicationadministration {

	public medicationadministration_id: string
	public site: string
	public method: string
	public dose_id: string
	public prescription_id: string
	public posology_id: string
	public administrationstartime: any
	public administrationendtime: any
	public administredby: string
	public planneddatetime: any
	public administeredstrengthneumerator: number
	public administeredstrengthneumeratorunits: string
	public administeredstrengthdenominator: number
	public administeredstrengthdenominatorunits: string
	public plannedstrengthneumerator: number
	public plannedstrengthneumeratorunits: string
	public plannedstrengthdenominator: number
	public plannedstrengthdenominatorunits: string
	public administreddosesize: string
	public administreddoseunit: string
	public administreddosemeasure: string
	public planneddosesize: string
	public planneddoseunit: string
	public planneddosemeasure: string
	public plannedinfustionrate: number
	public administredinfusionrate: number
	public comments: string
	public adminstrationstatus: string
	public adminstrationstatusreason: string
	public adminstrationstatusreasontext: string
	public requestresupply: boolean
	public doctorsordercomments: string
	public witness: string
	public substituted: boolean
	public administrationdevice: string
	public administrationsite: string
	public medication_id: string
	public person_id: string
	public encounter_id: string
	public logicalid: string
	public batchnumber: string
	public expirydate: any
	public prescriptionroutesid: string
	public routename: string;
	public planneddosesizerangemax: string
	public levelofselfadmin: string;
	public administereddescriptivedose: string;
	public _recordstatus: number;
	public correlationid: string
	public createdon: any
	public modifiedon: any
	public __administerMedication: Array<AdministerMedication>;
	public __witnessName: string;
	public isadhoc : boolean;
	public isdifferentproductadministered : boolean;
	public isenterinerror : boolean
	public isinfusionkitchange:boolean
    public isadministerdfromfb: boolean
}


export class AdministerMedication {
	public administermedication_id: string;
	public medicationadministrationid: string;
	public name: string;
	public genericname: string;
	public medicationtype: string;
	public displayname: string;
	public form: string;
	public formcode: string;
	public strengthneumerator: number;
	public strengthdenominator: number;
	public strengthneumeratorunit: string;
	public strengthdenominatorunit: string;
	public doseformunits: string;
	public doseformsize: number;
	public doseformunitofmeasure: string;
	public bnf: string;
	public defineddailydose: string;
	public doseform: string;
	public doseperweight: string;
	public doseperweightunit: string;
	public roundingfactor: number;
	public actgroupcode: string;
	public actgroupname: string;
	public orderformtype: string;
	public maxdoseperdayunit: string;
	public maxdoseperday: number;
	public maxdoseperweek: number;
	public maxdoseperweekunit: string;
	public titrationtype: string;
	public producttype: string;
	public isformulary: boolean;
	public isblacktriangle: boolean;
	public iscontrolled: boolean;
	public iscritical: boolean;
	public markedmodifier: string;
	public modifiedreleasehrs: number;
	public reviewreminderdays: number;
	public isprimary: boolean;
	public personid: string;
	public encounterid: string;
	public classification: string;
	public __ingredients: Array<AdministerMedicationingredients>;
	public __codes: Array<AdministerMedicationcodes>;
	public isclinicaltrial: boolean;
	public isexpensive: boolean;
	public isunlicenced: boolean;
	public ishighalert: boolean;
	public customgroup: string;
	public _index: number;
	public correlationid: string
	public administreddosesize: string
	public administreddoseunit: string
	public administeredstrengthneumerator: number
	public administeredstrengthneumeratorunits: string
	public administeredstrengthdenominator: number
	public administeredstrengthdenominatorunits: string
	public administredinfusionrate: number
	public administereddescriptivedose: string
	public batchnumber: string
	public expirydate: any
	public dosetype : string
}

export class AdministerMedicationcodes {
	public administermedicationcodes_id: string
	public administermedicationid: string;
	public medicationadministrationid: string;
	public code: string
	public terminology: string
	public correlationid: string
}

export class AdministerMedicationingredients {
	public administermedicationingredients_id: string
	public administermedicationid: string;
	public medicationadministrationid: string;
	public name: string
	public displayname: string
	public strengthneumerator: number
	public strengthdenominator: string
	public strengthneumeratorunit: string
	public strengthdenominatorunit: string
	public isprimaryingredient: boolean
	public correlationid: string
}


export class Detail {
    rowId: string;
    createddate: Date;
    createdby: string;
    updateddate: Date;
    updatedby: string;
    formularyVersionId: string;
    medicationTypeCode?: any;
    medicationTypeDesc?: any;
    codeSystem: string;
    atcCode?: any;
    rnohFormularyStatuscd: string;
    rnohFormularyStatusDesc?: any;
    orderableCd?: any;
    orderableDesc?: any;
    inpatientMedicationCd?: any;
    outpatientMedicationCd?: any;
    isBloodProduct: boolean;
    isDiluent: boolean;
    isModifiedRelease: boolean;
    isPrescriptionPrintingRequired:boolean;
    isGastroResistant: boolean;
    prescribable: boolean;
    prescribableSource: string;
    prescribingStatusCd: string;
    prescribingStatusDesc?: any;
    rulesCd?: any;
    unlicensedMedicationCd?: any;
    definedDailyDose?: any;
    notForPrn?: any;
    highAlertMedication?: any;
    ignoreDuplicateWarnings?: any;
    medusaPreparationInstructions?: string[];
    criticalDrug?: any;
    controlledDrugCategories?: any;
    cytotoxic?: any;
    clinicalTrialMedication?: any;
    fluid?: any;
    antibiotic?: any;
    anticoagulant?: any;
    antipsychotic?: any;
    antimicrobial?: any;
    addReviewReminder?: any;
    ivToOral?: any;
    titrationTypes: any;
    roundingFactorCd?: any;
    roundingFactorDesc?: any;
    maxDoseNumerator?: any;
    maximumDoseUnitCd?: any;
    maximumDoseUnitDesc?: any;
    witnessingRequired?: any;
    niceTa?: any;
    markedModifierCd?: any;
    markedModifierDesc?: any;
    insulins?: any;
    mentalHealthDrug?: any;
    basisOfPreferredNameCd: string;
    basisOfPreferredNameDesc?: any;
    sugarFree: string;
    glutenFree?: any;
    preservativeFree?: any;
    cfcFree?: any;
    doseFormCd: string;
    doseFormDesc: string;
    unitDoseFormSize: number;
    unitDoseFormUnits: string;
    unitDoseFormUnitsDesc: string;
    unitDoseUnitOfMeasureCd: string;
    unitDoseUnitOfMeasureDesc: string;
    formCd: string;
    formDesc: string;
    tradeFamilyCd?: any;
    tradeFamilyName?: any;
    expensiveMedication?: any;
    modifiedReleaseCd?: any;
    modifiedReleaseDesc?: any;
    blackTriangle: string;
    supplierCd?: any;
    supplierDesc?: any;
    currentLicensingAuthorityCd?: any;
    currentLicensingAuthorityDesc?: any;
    emaAdditionalMonitoring?: any;
    parallelImport?: any;
    restrictionsOnAvailabilityCd?: any;
    restrictionsOnAvailabilityDesc?: any;
    drugClass?: any;
    restrictionNote?: any;
    restrictedPrescribing?: any;
    sideEffects: SideEffect[];
    cautions: Caution[];
    contraIndications: ContraIndication[];
    safetyMessages: any[];
    customWarnings: any[];
    endorsements: string[];
    licensedUses: LicensedUs[];
    unLicensedUses: UnLicensedUs[];
    orderableFormtypeCd?: any;
    orderableFormtypeDesc?: any;
    childFormulations: ChildFormulation[];
    modifiedReleases: any[];
    diluents: any[];
    isCustomControlledDrug: boolean;
    isIndicationMandatory: boolean;
    reminders: Reminder[];
}
export interface Caution {
    cd: string;
    desc: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source: string;
    additionalProperties?: any;
}
export interface Reminder {
    active: boolean;
    duration: number;
    reminder: string;
    source: string;
}

export interface SideEffect {
    cd: string;
    desc: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source: string;
    additionalProperties?: any;
}

export class FormularyIngredient {
    rowId: string;
    createddate: Date;
    createdby: string;
    updateddate: Date;
    updatedby: string;
    formularyVersionId: string;
    ingredientCd: string;
    ingredientName: string;
    basisOfPharmaceuticalStrengthCd: string;
    basisOfPharmaceuticalStrengthDesc: string;
    strengthValueNumerator: string;
    strengthValueNumeratorUnitCd: string;
    strengthValueNumeratorUnitDesc: string;
    strengthValueDenominator?: any;
    strengthValueDenominatorUnitCd: string;
    strengthValueDenominatorUnitDesc?: any;
}

export class FormularyRouteDetail {
    rowId: string;
    createddate: Date;
    createdby: string;
    updateddate: Date;
    updatedby: string;
    formularyVersionId: string;
    routeCd: string;
    routeDesc: string;
    routeFieldTypeCd: string;
    routeFieldTypeDesc: string;
}

export class Product {
    rowId: string;
    createddate: Date;
    createdby: string;
    updateddate: Date;
    updatedby: string;
    formularyId: string;
    versionId: number;
    formularyVersionId: string;
    code: string;
    name: string;
    productType: string;
    parentCode: string;
    parentName?: any;
    parentProductType: string;
    recStatusCode: string;
    recStatuschangeTs?: any;
    recStatuschangeDate: Date;
    recStatuschangeTzname?: any;
    recStatuschangeTzoffset?: any;
    isDuplicate: boolean;
    recStatuschangeMsg?: any;
    duplicateOfFormularyId?: any;
    isLatest: boolean;
    recSource: string;
    vtmId: string;
    vmpId?: any;
    formularyAdditionalCodes?: any;
    detail: Detail;
    formularyIndications?: any;
    formularyIngredients: FormularyIngredient[];
    formularyRouteDetails: FormularyRouteDetail[];
    formularyOntologyForms?: any;
}


export interface ContraIndication {
    cd?: string;
    desc?: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source?: string;
    additionalProperties?: any;
}


export interface LicensedUs {
    cd?: string;
    desc?: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source?: string;
    additionalProperties?: any;
}
export interface UnLicensedUs {
    cd?: string;
    desc?: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source?: string;
    additionalProperties?: any;
}

export interface ChildFormulation {
    cd?: string;
    desc?: string;
    type?: any;
    isDefault?: any;
    recordstatus?: any;
    source?: any;
    additionalProperties?: any;
}

