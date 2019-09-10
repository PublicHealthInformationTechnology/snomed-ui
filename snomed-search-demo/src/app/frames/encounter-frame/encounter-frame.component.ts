import { Component, OnInit, Input} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap, switchMap, finalize } from 'rxjs/operators';
import { ValueSet } from 'fhir-stu3';
import { DemoModelService } from 'src/app/demo-model.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material';
import { query } from '@angular/animations';

@Component({
  selector: 'app-encounter-frame',
  templateUrl: './encounter-frame.component.html',
  styleUrls: ['./encounter-frame.component.css']
})
export class EncounterFrameComponent implements OnInit {

  @Input() snomedServer: string;

  displayedEncounterColumns : string[] = ['reasonForEncounterDisplay', 'diagnosisDisplay', 'diagnosisNote', 'procedureDisplay', 'lateralityDisplay', 'encounterNote'];
  encounterDataSource = new MatTableDataSource(this.demoModelService.getEncounters());

  timestamp : Date;
  //boosted = false;
  
  filteredEncounterReasonValues = [];
  filteredProcedureValues = [];
  lateralityValues = [];
  filteredDiagnosisValues = [];

  encounterForm = new FormGroup({
    reasonForEncounter: new FormControl(''),
    procedure: new FormControl(''),
    diagnosis: new FormControl(''),
    diagnosisNote: new FormControl(''),
    laterality: new FormControl({value: '', disabled: true}),
    encounterNote: new FormControl(''),
    boosted: new FormControl(false),
  });

  preferredProcedureValues = [
    {value: '38341003', display:	'Hypertension'},
    {value: '195967001', display:	'Asthma'},
    {value: '35489007', display:	'Depression'},
    {value: '48694002', display:	'Anxiety'},
    {value: '73211009', display:	'Diabetes mellitus'},
    {value: '46635009', display:	'Type 1 diabetes mellitus'},
    {value: '44054006', display:	'Type 2 diabetes mellitus'},
    {value: '64859006', display:	'Osteoporosis'},
    {value: '49436004', display:	'Atrial fibrillation'},
    {value: '13645005', display:	'COPD'},
    {value: '414545008', display:	'Ischaemic heart disease'},
    {value: '42343007', display:	'Congestive heart failure'},
    {value: '230690007', display:	'Stroke'},
    {value: '13644009', display:	'Hypercholesterolaemia'},
    {value: '65323003', display:	'Polymyalgia rheumatica'},
    {value: '85898001', display:	'Cardiomyopathy'},
    {value: '371125006', display:	'Labile essential hypertension'},
    {value: '70995007', display:	'Pulmonary hypertension'},
    {value: '59621000', display:	'Essential hypertension'},
    {value: '233873004', display:	'Hypertrophic cardiomyopathy'},
    {value: '11687002', display:	'Gestational diabetes mellitus'},
    {value: '66931009', display:	'Hypercalcaemia'},
    {value: '14140009', display:	'Hyperkalaemia'},
    {value: '34486009', display:	'Hyperthyroidism'},
    {value: '45007003', display:	'Hypotension'},
    {value: '89627008', display:	'Hyponatraemia'},
    {value: '5291005', display:	'Hypocalcaemia'},
    {value: '40930008', display:	'Hypothyroidism'}
  ];

  encounterReasonChangeSubscription : Subscription;
  diagnosisChangeSubscription : Subscription;
  procedureChangeSubscription: Subscription;

  constructor(private httpClient: HttpClient, private demoModelService: DemoModelService) { 
  }

  ngOnInit() {

    this.timestamp = new Date();

    const ENCOUNTER_REASON_URL = this.snomedServer + '/ValueSet/$expand?url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent('< 404684003 OR < 71388002 OR < 243796009 OR < 272379006')
    + '&count=20&includeDesignations=true';

    const DIAGNOSIS_URL = this.snomedServer + '/ValueSet/$expand?url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent('< 404684003')
    + '&count=20&includeDesignations=true';

    // should be a value set
    const PREFERRED_DIAGNOSIS_URL = this.snomedServer + '/ValueSet/$expand?url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent('38341003 OR 195967001 OR 35489007 OR 48694002 OR ' +
    '73211009 OR 46635009 OR 44054006 OR 64859006 OR 49436004 OR 13645005 OR 414545008 OR 42343007 OR 230690007 OR ' +
    '13644009 OR 65323003 OR 85898001 OR 371125006 OR 70995007 OR 59621000 OR 233873004 OR 11687002 OR 66931009 OR ' +
    '14140009 OR 34486009 OR 45007003 OR 89627008 OR 5291005 OR 40930008') + '&includeDesignations=true'


    const PROCEDURE_URL = this.snomedServer + '/ValueSet/$expand?url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent('< 71388002')
    + '&count=20&includeDesignations=true';

    const LATERALITY_URL = 	this.snomedServer + '/ValueSet/$expand?_format=json&url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent('< 182353008') 
    + '&includeDesignations=true';
    
    //const LATERALITY_URL = this.snomedServer + '/ValueSet/bodysite-laterality/$expand';
   
    this.encounterReasonChangeSubscription = this.encounterForm.get('reasonForEncounter').valueChanges
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
      }),
      switchMap(value => this.httpClient.get<ValueSet>(ENCOUNTER_REASON_URL + '&filter=' + ((typeof value === 'string') ? value : value.display))
        .pipe(
          finalize(() => {
          }),
        )
      )
    )
    .subscribe(data => {
      if (data.expansion.contains) {
        this.filteredEncounterReasonValues = [];
        data.expansion.contains.forEach(val => {
          this.filteredEncounterReasonValues.push({value: val.code, display: val.display});
        });
      }
    });

    var filterTerm;

    this.diagnosisChangeSubscription = this.encounterForm.get('diagnosis').valueChanges
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap((value) => {
        // boost search
        if (this.encounterForm.get('boosted').value) {
          filterTerm = value;
          console.log("looking for ", this.encounterForm.get('procedure').value.value);
          this.preferredProcedureValues.filter(function(preferredVal) {
            console.log("preferredVal", preferredVal);
            return (preferredVal['display']).indexOf(value) > -1;
          }).forEach(val => {
            this.filteredDiagnosisValues.push(val);
          })
        }
      }),
      switchMap(value => this.httpClient.get<ValueSet>(DIAGNOSIS_URL + '&filter=' + ((typeof value === 'string') ? value : value.display))
        .pipe(
          finalize(() => {
          }),
        )
      )
    )
    .subscribe(data => {
      if (data.expansion.contains) {
        this.filteredDiagnosisValues = [];
        // boost search
        if (this.encounterForm.get('boosted').value) {
          console.log("looking for ", this.encounterForm.get('procedure').value.value);
          this.preferredProcedureValues.filter(function(preferredVal) {
            console.log("preferredVal", preferredVal);
            return (preferredVal['display']).indexOf(filterTerm) > -1;
          }).forEach(val => {
            this.filteredDiagnosisValues.push(val);
          })
        }
        data.expansion.contains.forEach(val => {
          this.filteredDiagnosisValues.push({value: val.code, display: val.display});
        });
      }
    });

    this.procedureChangeSubscription = this.encounterForm.get('procedure').valueChanges
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
      }),
      switchMap(value => this.httpClient.get<ValueSet>(PROCEDURE_URL + '&filter=' + ((typeof value === 'string') ? value : value.display))
        .pipe(
          finalize(() => {
          }),
        )
      )
    )
    .subscribe(data => {
      if (data.expansion.contains) {
        this.filteredProcedureValues = [];
        data.expansion.contains.forEach(val => {
          this.filteredProcedureValues.push({value: val.code, display: val.display});
        });
      }
    });

    // initialize the drop-downs with some data so it appears like the search is working
    // var encounterReasonSubscription = this.httpClient.get<ValueSet>(ENCOUNTER_REASON_URL)
    //   .subscribe(result => {
    //     result.expansion.contains.forEach(val => {
    //       this.filteredEncounterReasonValues.push({value: val.code, display: val.display});
    //     })
    //     encounterReasonSubscription.unsubscribe();
    //   });

    // var diagnosisSubscription = this.httpClient.get<ValueSet>(DIAGNOSIS_URL)
    //   .subscribe(result => {
    //     result.expansion.contains.forEach(val => {
    //       this.filteredDiagnosisValues.push({value: val.code, display: val.display});
    //     })
    //     diagnosisSubscription.unsubscribe();
    //   });

    // var procedureSubscription = this.httpClient.get<ValueSet>(PROCEDURE_URL)
    //   .subscribe(result => {
    //     result.expansion.contains.forEach(val => {
    //       this.filteredProcedureValues.push({value: val.code, display: val.display});
    //     })
    //     procedureSubscription.unsubscribe();
    //   });

    var lateralitySubscription = this.httpClient.get<ValueSet>(LATERALITY_URL)
      .subscribe(result => {
        result.expansion.contains.forEach(val => {
          this.lateralityValues.push({value: val.code, display: val.display});
        })
        this.lateralityValues.push({value: '', display: ''});
        lateralitySubscription.unsubscribe();
      }
    );

    var preferredDiagnosisSubscription = this.httpClient.get<ValueSet>(LATERALITY_URL)
      .subscribe(result => {
        result.expansion.contains.forEach(val => {
          this.lateralityValues.push({value: val.code, display: val.display});
        })
        this.lateralityValues.push({value: '', display: ''});
        lateralitySubscription.unsubscribe();
      }
    );
  }

  onNgDestroy() {
    this.encounterReasonChangeSubscription.unsubscribe();
    this.diagnosisChangeSubscription.unsubscribe();
    this.procedureChangeSubscription.unsubscribe();
  }

  displayFn(code) {
    if (!code) return '';
    return code.display;
  }

  procedureSelected(procedure) {
    console.log("procedure selected is", procedure);
    
    // extract procedure site from the selected procedure

    var querySubscription = this.httpClient.get<ValueSet>(this.snomedServer + '/ValueSet/$expand?_format=json&url=' + encodeURIComponent('http://snomed.info/sct') 
    + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent(procedure.value + '.<< 363704007'))
     .subscribe(data => {
       console.log("data", data);
        if (data.expansion.contains) {

          // extract the laterality if it exists and populate laterality field
          var queryLatSubscription = this.httpClient.get<ValueSet>(this.snomedServer + '/ValueSet/$expand?_format=json&url=' + encodeURIComponent('http://snomed.info/sct') 
          + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent(procedure.value + '.<< 363704007.272741003'))
           .subscribe(data => {
            if (data.expansion.contains) {
              var latDetails = data.expansion.contains[0];

              this.encounterForm.get('laterality').setValue({value: latDetails['code'], display: latDetails['display']});
            }
            else {
              // reset to laterality to blank in case a procedure was previously selected
              this.encounterForm.get('laterality').setValue({value: '', display: ''});
            }
            console.log("data2", data);
            queryLatSubscription.unsubscribe();
           });

          // value returned for procedure site
          // see if the procedure site permits laterality
          // var latQuerySubscription = this.httpClient.get<ValueSet>(this.snomedServer + '/ValueSet/$expand?_format=json&url=' + encodeURIComponent('http://snomed.info/sct') 
          // + encodeURIComponent('?fhir_vs=ecl/') + encodeURIComponent(procedure.value + '.<< 363704007'))
          this.encounterForm.get('laterality').enable();
        }
        else {
          // no procedure site, don't allow laterality to be specified
          // reset to laterality to blank in case a procedure was previously selected
          this.encounterForm.get('laterality').setValue({value: '', display: ''});
          this.encounterForm.get('laterality').disable();
        }
      
      querySubscription.unsubscribe();

    });
  }

  compareLaterality(laterality1: any, laterality2: any): boolean {
    var equal = false;
    if (laterality1 && laterality2) {
      if (laterality1.value === laterality2.value) {
        equal = true;
      }
    }
    return equal;
  }

  onSaveEncounter() {

    if (this.encounterForm.get('procedure').value) {
      this.demoModelService.addProcedure(
        this.encounterForm.get('procedure').value.value,
        this.encounterForm.get('procedure').value.display,
        this.timestamp.toString());
    }
    if (this.encounterForm.get('diagnosis').value) {
      this.demoModelService.addProblem(
        this.encounterForm.get('diagnosis').value.value,
        this.encounterForm.get('diagnosis').value.display,
        this.timestamp.toString());
    }
    console.log("this.encounterForm.get('laterality').value", this.encounterForm.get('laterality').value.value);
    console.log("this.encounterForm.get('laterality').value", this.encounterForm.get('laterality').value.display);

    this.demoModelService.addEncounter(
      this.encounterForm.get('reasonForEncounter').value.value,
      this.encounterForm.get('reasonForEncounter').value.display,
      this.encounterForm.get('procedure').value.value,
      this.encounterForm.get('procedure').value.display,
      this.encounterForm.get('diagnosis').value.value,
      this.encounterForm.get('diagnosis').value.display,
      this.encounterForm.get('diagnosisNote').value,
      this.encounterForm.get('laterality').value.value,
      this.encounterForm.get('laterality').value.display, 
      this.encounterForm.get('encounterNote').value,
    );

    // cause table refresh
    this.encounterDataSource = new MatTableDataSource(this.demoModelService.getEncounters());

    // empty fields for another encounter to be added
    this.encounterForm.reset({ emitEvent: false });

    console.log("this.demoModelService.getEncounters()", this.demoModelService.getEncounters());
  }

}
