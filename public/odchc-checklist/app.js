
// ===================== DATA =====================
const CHECKLISTS = {
  primary: {
    title: 'Accreditation Checklist — Primary Services',
    profileFields: [
      {id:'name',label:'Name of Facility',span:'full'},
      {id:'address',label:'Address',span:'full'},
      {id:'physician',label:'Name of Physician-in-Charge'},{id:'physician_phone',label:'Phone No'},
      {id:'desk_officer',label:'Name of Desk Officer'},{id:'desk_phone',label:'Phone No'},
      {id:'beds',label:'Number of Hospital Beds',span:'full'},
      {id:'nhia',label:'NHIA Registration',type:'yesno',reg:true},
      {id:'smoh',label:'Current SMOH Registration',type:'yesno',reg:true},
      {id:'email',label:'Facility Email'},{id:'inspection_date',label:'Date of Inspection',type:'date'},
    ],
    sections: [
      {
        id:'personnel', label:'B — Personnel (Sight current practicing licence)',
        scoreType: '3col',
        items: [
          {num:9,  label:'Medical Doctors with professional licences/reg. no (at least 1)', max:3},
          {num:10, label:'Pharmacist with professional licence/reg.no', max:2},
          {num:11, label:'Pharmacy technician with professional licence/reg.no (at least 1)', max:2},
          {num:12, label:'Registered Nurse or midwife with professional licence/reg.no (at least 2) (BNSC)', max:3},
          {num:13, label:'Nurse/Midwife with professional licence/reg. no (RN, RM, RN/RM)', max:2},
          {num:14, label:'Chew/CHO with professional licence (at least 2)', max:2},
          {num:15, label:'Med/Lab scientist with professional licence/reg.no', max:3},
          {num:16, label:'Med/Lab technician with professional licence/reg.no', max:2},
          {num:17, label:'Medical records officers with professional licence/reg.no', max:2},
          {num:18, label:'Medical records technician with professional licence/reg.no (at least 1)', max:2},
          {num:19, label:'Hospital Attendant (at least 2)', max:2},
        ]
      },
      {
        id:'infrastructure', label:'C — Infrastructure',
        scoreType: '2col',
        items: [
          {num:20, label:'Waiting or reception area at least 4×3 metres', max:2},
          {num:21, label:'Medical record keeping facilities', max:2},
          {num:22, label:'Consulting room of 4×3 metres', max:2},
          {num:23, label:'Treatment room with wash hand basin and safety box for sharps', max:3},
          {num:24, label:'Pharmacy with drug cabinet', max:5},
          {num:25, label:'Medical Laboratory (USS machine, MP, Urinalysis, PCV, blood sugar & pregnancy test kits, Spirit lamps, lab glassware, haematocrit centrifuge etc.)', max:3},
          {num:26, label:'Surgical operating theatre with male circumcision set, ear piercing set, catheterization materials, I&D instruments with other surgical sets', max:3},
          {num:27, label:'Possession of adequate ICT with internet access', max:3},
          {num:28, label:'Lying-in ward with minimum distance of 1m in-between beds', max:2},
          {num:29, label:'A locker and an over-bed table per bed', max:1},
          {num:30, label:'Color coded containers', max:2},
          {num:31, label:'Separate wards for male, female and children', max:3},
          {num:32, label:'Delivery room with required gadgets, consumables and instruments with emergency drugs', max:2},
          {num:33, label:'Wheel Chair / Patient\'s examination couch', max:2},
          {num:34, label:'Sluice Room', max:3},
          {num:35, label:'Possession of appropriate equipment and staff for other specialization', max:3},
          {num:36, label:'Laundry Service', max:2},
          {num:38, label:'Stadiometer', max:2},
          {num:39, label:'Oxygen', max:4},
          {num:40, label:'Resuscitative equipment e.g. ambu bag, suction machine etc.', max:4},
          {num:41, label:'Bed Pan / Urinal', max:2},
          {num:42, label:'At least 4 Bed Linens Per Bed', max:2},
        ]
      },
      {
        id:'essential', label:'D — Essential Services',
        scoreType: '3col',
        items: [
          {num:43, label:'Vital signs tray or trolley containing sphygmomanometer, thermometer, stethoscope etc.', max:2},
          {num:44, label:'Sterilizer / Autoclave', max:2},
          {num:45, label:'Screens and weighing scale', max:2},
          {num:46, label:'Emergency tray or trolley containing necessary drugs e.g. hydrocortisone, adrenaline etc.', max:2},
          {num:47, label:'Instrument tray containing requisite instruments for specific service', max:1},
          {num:48, label:'Adequate Water source', max:2},
          {num:49, label:'Adequate and alternative Power Source', max:2},
          {num:50, label:'Firefighting Equipment', max:2},
          {num:51, label:'Emergency parking space', max:1},
          {num:52, label:'Ambulance services', max:2},
        ]
      }
    ]
  },

  dental: {
    title: 'Accreditation Checklist — Dental Services',
    profileFields: [
      {id:'name',label:'Name of Facility',span:'full'},
      {id:'address',label:'Address',span:'full'},
      {id:'lga',label:'Local Government Area',span:'full'},
      {id:'physician',label:'Name of Physician-in-Charge'},{id:'physician_phone',label:'Phone Number'},
      {id:'desk_officer',label:'Name of Desk Officer'},{id:'desk_phone',label:'Phone Number'},
      {id:'nhia',label:'NHIA Registration',type:'yesno',reg:true},
      {id:'smoh',label:'Current SMOH Registration',type:'yesno',reg:true},
      {id:'email',label:'Facility Email'},{id:'inspection_date',label:'Date of Inspection',type:'date'},
    ],
    sections: [
      {
        id:'personnel', label:'B — Personnel (Sight current practicing licence)',
        scoreType: '2col',
        items: [
          {num:10, label:'Dentist/Dental Surgeon with current practicing license', max:4},
          {num:11, label:'Dental Surgery Technician / Dental Nurse / Dental Assistants with professional license', max:3},
          {num:12, label:'Dental Therapist (at least 1)', max:2},
          {num:13, label:'Dental Technologist (at least 1)', max:2},
          {num:14, label:'Attendant/Cleaner', max:1},
        ]
      },
      {
        id:'infrastructure', label:'C — Infrastructure',
        scoreType: '2col',
        items: [
          {num:18, label:'Waiting or reception area at least 4×3 metres', max:2},
          {num:19, label:'Medical record keeping facilities (Digital/Paper)', max:3},
          {num:20, label:'Consulting room of 4×3 metres', max:2},
          {num:21, label:'Surgical operating theatre with surgical sets for covered procedures', max:2},
          {num:22, label:'Possession of adequate ICT (must include internet access)', max:4},
          {num:23, label:'Wash hand basin', max:2},
          {num:26, label:'X-ray machine (intraoral) with film and developer or digital sensor', max:4},
          {num:29, label:'Porcelain', max:2},
          {num:30, label:'Polishing Leather', max:2},
          {num:31, label:'Mouth tray', max:2},
          {num:32, label:'Brush and paste', max:2},
        ]
      },
      {
        id:'dental_operatory', label:'C1 — Dental Operatory Equipment',
        scoreType: '2col',
        items: [
          {num:'C1-1', label:'Dental chair unit (with light, spittoon bowl)', max:5},
          {num:'C1-2', label:'Air compressor', max:2},
          {num:'C1-4', label:'Ultrasonic scaler', max:2},
          {num:'C1-5', label:'Dental syringe', max:2},
          {num:'C1-9', label:'Suction machine', max:2},
        ]
      },
      {
        id:'dental_diagnostic', label:'C2 — Diagnostic Equipment',
        scoreType: '2col',
        items: [
          {num:'C2-1', label:'Basic dental instruments (dental mirror, probe, tweezers etc.)', max:4},
          {num:'C2-2', label:'Dental X-ray unit (intraoral) with film and developer or digital sensor', max:4},
        ]
      },
      {
        id:'dental_instruments', label:'C3 — Instruments',
        scoreType: '2col',
        items: [
          {num:'C3-1', label:'Extraction forceps and elevators', max:2},
          {num:'C3-2', label:'Scaling instruments', max:2},
          {num:'C3-3', label:'Filling instruments', max:2},
          {num:'C3-4', label:'Endodontic instruments (files, reamers)', max:2},
          {num:'C3-5', label:'Surgical instruments for minor oral surgeries (Luxating elevators, Periosteal elevators, Scalpel blade and handle, Needle holder, Irrigation syringe, Surgical suction tip)', max:2},
        ]
      },
      {
        id:'dental_materials', label:'C4 — Materials & Consumables',
        scoreType: '2col',
        items: [
          {num:'C4-1', label:'Restorative materials (GIC, composite, ZOE, Calcium hydroxide, Zinc polycarboxylate etc.)', max:2},
          {num:'C4-2', label:'Local anesthetics', max:2},
          {num:'C4-3', label:'Impression materials', max:2},
          {num:'C4-4', label:'Suturing materials', max:2},
        ]
      },
      {
        id:'essential', label:'D — Essential Services',
        scoreType: '2col',
        items: [
          {num:47, label:'Vital signs tray or trolley containing sphygmomanometer, thermometer, stethoscope etc.', max:2},
          {num:48, label:'Sterilizer / Autoclave', max:2},
          {num:49, label:'Screens / Partitioned Cubicle', max:2},
          {num:50, label:'AC units or fans / Adequate ventilation', max:2},
          {num:51, label:'Adequate Water source', max:3},
          {num:52, label:'Adequate and alternative Power Source', max:2},
          {num:53, label:'Clean toilet facilities', max:2},
          {num:54, label:'Adequate waste and sharp disposal', max:3},
          {num:55, label:'Firefighting Equipment', max:2},
          {num:56, label:'Adequate parking space', max:2},
        ]
      }
    ]
  },

  pharmacy: {
    title: 'Accreditation Checklist — Pharmacy Services',
    profileFields: [
      {id:'name',label:'Name of Pharmacy',span:'full'},
      {id:'address',label:'Address',span:'full'},
      {id:'telephone',label:'Telephone Number',span:'full'},
      {id:'superintendent',label:'Name of Superintendent Pharmacist',span:'full'},
      {id:'nhia',label:'NHIA Registration',type:'yesno',reg:true},
      {id:'smoh',label:'Current SMOH & PCN Registration',type:'yesno',reg:true},
      {id:'premises',label:'Premises Registration License',span:'full'},
      {id:'cac',label:'CAC Registration',span:'full'},
      {id:'email',label:'Facility Email'},{id:'inspection_date',label:'Date of Inspection',type:'date'},
    ],
    sections: [
      {
        id:'personnel', label:'B — Personnel (Sight current practicing licence)',
        scoreType: '3col',
        items: [
          {num:11, label:'Pharmacist with professional license/reg. no (at least 1)', max:10},
          {num:12, label:'Pharmacy Technician with Professional license/reg. no (at least 1)', max:5},
          {num:13, label:'Pharmacy Attendants (at least 2)', max:5},
        ]
      },
      {
        id:'infrastructure', label:'C — Infrastructure',
        scoreType: '3col',
        items: [
          {num:14, label:'Dispensing Area', max:5},
          {num:16, label:'Waiting / Reception Area with chairs', max:4},
          {num:17, label:'Patient Counselling Area', max:4},
          {num:18, label:'Refrigerator', max:5},
          {num:19, label:'Poison Cupboard and Book', max:5},
          {num:20, label:'Equipment for Extemporaneous preparation', max:3},
          {num:21, label:'Facility for Filtration', max:4},
          {num:22, label:'Weighing Scales', max:4},
          {num:23, label:'Pallets or Shelves', max:4},
          {num:'23b', label:'Copy of Reference Material (recent)', max:5},
          {num:24, label:'Air Conditioner / Ceiling fans', max:4},
          {num:25, label:'Drug Information Service', max:5},
          {num:26, label:'Records of Sales / Computer', max:3},
          {num:27, label:'Source of drugs (See Receipts)', max:4},
        ]
      },
      {
        id:'essential', label:'D — Essential Services',
        scoreType: '3col',
        items: [
          {num:'27b', label:'Adequate Water Source', max:3},
          {num:28, label:'Adequate and Alternative Power Source', max:3},
          {num:29, label:'Firefighting Equipment', max:3},
          {num:30, label:'Emergency Parking Space', max:2},
          {num:31, label:'Internet Connectivity', max:5},
          {num:32, label:'Laptop / Desktop / Tablet / Phone', max:5},
        ]
      }
    ]
  }
};

// QA Checklist
CHECKLISTS.qa = {
  title: 'Quality Assurance Checklist — ORANGHIS (HCP)',
  isQA: true,
  profileFields: [
    {id:'name', label:'Name of Facility', span:'full'},
    {id:'address', label:'Address of Facility / Location', span:'full'},
    {id:'lga', label:'Local Government / Senatorial District', span:'full'},
    {id:'email', label:'Facility Email', span:'full'},
    {id:'nhia', label:'Is your facility accredited by NHIA?', type:'yesno', reg:true, regLabel:'NHIA Accreditation Number'},
    {id:'oranghis_enrollees', label:'Number of ORANGHIS Enrollees', span:'full', type:'quarterfield'},
    {id:'oranghis_accessing', label:'Number of ORANGHIS Enrollees Accessing Care', span:'full', type:'quarterfield'},
  ],
  sections: [
    {
      id:'admin', label:'B — Administration and Governance',
      scoreType:'qa',
      items:[
        {num:'Q007', label:'Is there a functional Management Committee for the health facility?', type:'yesno'},
        {num:'Q008', label:'When last did the Health Facility Management Committee meet? (Check for minutes/attendance)', type:'quartertext'},
        {num:'Q009', label:'Is there a dedicated officer responsible for ORANGHIS in the facility?', type:'yesno'},
        {num:'Q010', label:'Name of desk officer', type:'text'},
        {num:'Q010b', label:'Phone number of desk officer', type:'text'},
        {num:'Q011', label:'Did you receive monthly supervisory visits from the TPA? (Ask for supervisory visit report or score)', type:'quarteryn'},
        {num:'Q012', label:'Did you receive quarterly supervisory visits from the ODCHC? (Check for report of last visit)', type:'quarteryn'},
        {num:'Q013', label:'Does your facility provide 24-hour service? (Check facility roster/shift)', type:'yesno'},
        {num:'Q014', label:'Total number of staff (skilled and non-skilled) in your health facility', type:'text'},
        {num:'Q015', label:'Number of health workers by category', type:'table', tableRows:[
          'Number of Consultants','Number of Medical Doctors','Number of Pharmacists',
          'Number of Laboratory Scientists','Number of Midwives/Nurses','Number of Pharmacy Technician',
          'Number of Laboratory Technician','Number of CHEW','Number of JCHEW',
          'Number of Medical Record Officer','Number of Medical Record Technicians',
          'Number of Health Attendant/Assistant','Number of Security Personnel','Others (specify)','Total Number of Beds','Total Number of Wards'
        ]},
        {num:'Q015b', label:'Available Consultant Specialists in the facility', type:'table', tableRows:[
          'Number of Obstetricians/Gynecologists','Number of Cardiologists','Number of Pediatricians',
          'Number of General Surgeons','Number of Pulmonologists','Number of Endocrinologists',
          'Number of Gastroenterologists','Number of Neurologists','Number of ENT Specialist',
          'Number of Ophthalmologists','Number of Nephrologists','Number of Dermatologists',
          'Number of Radiologists','Number of Orthopaedics','Others (specify)'
        ]},
        {num:'Q016', label:'Have the health workers been trained on the operationalization of ORANGHIS?', type:'yesno'},
        {num:'Q017', label:'If yes in Q016, state designation of those trained (Ask for certificate/evidence of training)', type:'table', tableRows:[
          'Number of Consultants','Number of Medical Doctors','Number of Pharmacists',
          'Number of Laboratory Scientists','Number of Midwives/Nurses','Number of Pharmacy Technician',
          'Number of Laboratory Technician','Number of CHEW','Number of JCHEW',
          'Number of Medical Record Officer','Number of Medical Record Technicians',
          'Number of Health Attendant/Assistant','Number of Security Personnel','Others (specify)'
        ]},
      ]
    },
    {
      id:'drug', label:'B — Drug Management System (Q018)',
      scoreType:'qa',
      items:[
        {num:'Q018-1', label:'Is the pharmacy/dispensary adequately stocked with ACT, Antibacterial, Antihypertensive, Antidiabetic drugs etc.?', type:'yesno'},
        {num:'Q018-2', label:'Prescribed drugs (appropriateness, dose & duration)', type:'yesno'},
        {num:'Q018-3', label:'Is Drug Revolving Fund (DRF) Committee in place and functional?', type:'yesno'},
        {num:'Q018-3a', label:'If no, how do you ensure availability of drugs in the hospital?', type:'text'},
        {num:'Q018-4', label:'Availability of drug counseling', type:'yesno'},
        {num:'Q018-5', label:'Provision for out-of-stock (O/S) for enrollees', type:'yesno'},
        {num:'Q018-5a', label:'If yes, what does facility do?', type:'text'},
        {num:'Q018-6', label:'Adequate drug storage with A/C', type:'yesno'},
        {num:'Q018-7', label:'Assess the drug store for labelling', type:'yesno'},
        {num:'Q018-8', label:'Amount budgeted for drugs per month/quarter (record the figure)', type:'text'},
        {num:'Q019', label:'How much did you generate apart from ORANGHIS fund?', type:'quartertext'},
      ]
    },
    {
      id:'programme', label:'C — Programme Implementation',
      scoreType:'qa',
      items:[
        {num:'Q020', label:'Does your facility have the ODCHC workplan?', type:'yesno'},
        {num:'Q021a', label:'Number of referrals for secondary services by your facility', type:'quartertext'},
        {num:'Q021b', label:'Number of referrals to SHF approved for your facility', type:'quartertext'},
        {num:'Q021c', label:'Did you refer ORANGHIS beneficiaries to SHC facility?', type:'quarteryn'},
        {num:'Q021d', label:'If yes in Q021c, number of cases referred to ODCHC accredited facilities', type:'table', tableRows:[
          'Specialist Consultation','Malaria','Hypertension','Diabetes','Delivery','Surgery',
          'HIV/AIDS & STD Treatment','Mental Health Management','Diagnostics','Optical','Dental',
          'Pharmacy','Diseases of public health concern (TB, Leprosy etc)','Others (specify)'
        ], tableCol:'Number of Cases'},
        {num:'Q022a', label:'Did you refer ORANGHIS beneficiaries to other facilities?', type:'quarteryn'},
        {num:'Q022b', label:'If yes in Q022a, cases referred to other facilities', type:'table', tableRows:[
          'Specialist Consultation','Malaria','Hypertension','Diabetes','Delivery','Surgery',
          'HIV/AIDS & STD Treatment','Mental Health Management','Diagnostics','Optical','Dental',
          'Pharmacy','Diseases of public health concern (TB, Leprosy etc)','Others (specify)'
        ], tableCol:'Number of Cases'},
        {num:'Q023-stock1', label:'Number of times: Stock out of any of the essential drugs', type:'quartertext'},
        {num:'Q023-stock2', label:'Number of times: Stock out of laboratory commodities and other consumables', type:'quartertext'},
        {num:'Q023-infra1', label:'Physical Infrastructure — Adequate water supply', type:'yesno'},
        {num:'Q023-infra2', label:'Physical Infrastructure — Efficient power supply', type:'yesno'},
        {num:'Q023-infra3', label:'Physical Infrastructure — Is the consultation room clean?', type:'yesno'},
        {num:'Q023-infra4', label:'Physical Infrastructure — Are the wards clean and well ventilated?', type:'yesno'},
        {num:'Q023-infra5', label:'Physical Infrastructure — Are the wards adequately illuminated?', type:'yesno'},
        {num:'Q023-infra6', label:'Physical Infrastructure — Are there mosquito screens on windows or bed nets?', type:'yesno'},
        {num:'Q023-infra7', label:'Physical Infrastructure — Are the toilets clean?', type:'yesno'},
        {num:'Q023-infra8', label:'Physical Infrastructure — Is the hospital environment clean/grass well cut?', type:'yesno'},
      ]
    },
    {
      id:'financial', label:'D — Financial Management',
      scoreType:'qa',
      items:[
        {num:'Q024a', label:'Did you receive capitation from ODCHC?', type:'quarteryn'},
        {num:'Q024b', label:'If no in Q024a, when last did you receive capitation?', type:'text'},
        {num:'Q024c', label:'Evidence of capitation received — amounts per month (from Q024a quarter)', type:'monthly_q024'},
        {num:'Q025-1', label:'Amount spent on Essential drugs and consumables', type:'monthly_q025'},
        {num:'Q025-2', label:'Amount spent on Maintenance of facilities, laboratory, equipment and transport', type:'monthly_q025'},
        {num:'Q025-3', label:'Amount spent on Human resource development', type:'monthly_q025'},
        {num:'Q025-4', label:'Amount spent on Other things (specify)', type:'monthly_q025'},
        {num:'Q026a', label:'Total amount received from ODCHC — CAPITATION (Check bank statement)', type:'quartertext'},
        {num:'Q026a-ffs', label:'Total amount received from ODCHC — FEE FOR SERVICE', type:'quartertext'},
        {num:'Q026b', label:'Are funds from both CAPITATION and FEE-FOR-SERVICE paid into the same facility bank account?', type:'yesno'},
        {num:'Q026b-acct', label:'If yes, state Account Details', type:'acctdetails'},
        {num:'Q027', label:'Signatories to your account — Panel A', type:'designations_only'},
        {num:'Q027b', label:'Signatories — Panel B', type:'designations_only'},
        {num:'Q028', label:'Personnel — CMD/MD/OIC', type:'person'},
        {num:'Q028b', label:'Personnel — Desk Officer', type:'person'},
        {num:'Q028c', label:'Personnel — Head of Account', type:'person'},
        {num:'Q028d', label:'Personnel — Head of Pharmacy', type:'person'},
        {num:'Q028e', label:'Personnel — Head of Scheme', type:'person'},
      ]
    },
    {
      id:'challenges', label:'E — Challenges and Recommendations',
      scoreType:'qa',
      items:[
        {num:'Q029', label:'What are the challenges facing ORANGHIS in your facility?', type:'text'},
        {num:'Q030', label:'What are your recommendations?', type:'text'},
        {num:'Q031', label:'Apart from these questions, are there other information you would like to share with the ODCHC concerning the operations of ORANGHIS in your facility?', type:'text'},
        {num:'OBS', label:'Please provide details of your observations here', type:'textarea'},
      ]
    }
  ]
};
let currentType = null;
let scores = {};
let remarks = {};
let profileData = {};
let numAvailable = {};
let yesno = {};
let recommendation = null;
let inspectionTeam = [{name:'',date:''},{name:'',date:''},{name:'',date:''},{name:'',date:''}];
let contactPerson = '';
let facilityAccount = '';
let clientSubmissionId = null;

// QA quarter state
let qaQuarter = {q: '', year: ''}; // global quarter (Section A / most questions)
let qa024Quarter = {q: '', year: ''}; // Q024a quarter
let qa025Quarter = {q: '', year: ''}; // Q025 quarter

// Supabase session is supplied by the authenticated NMIS host page.
let odchcSupabaseSession = null;
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === 'ODCHC_LOAD_SUBMISSION' && event.data.submission) {
    loadSavedSubmissionForEdit(event.data.submission);
    return;
  }
  if (event.data?.type !== 'ODCHC_SUPABASE_SESSION') return;
  odchcSupabaseSession = {
    url: event.data.url,
    anonKey: event.data.anonKey,
    accessToken: event.data.accessToken || null,
  };
});
setTimeout(() => {
  if (window.parent !== window) window.parent.postMessage({type: 'ODCHC_CHECKLIST_READY'}, window.location.origin);
}, 0);

const QUARTER_MONTHS = {
  '1': ['January','February','March'],
  '2': ['April','May','June'],
  '3': ['July','August','September'],
  '4': ['October','November','December']
};

function getMonthsFromQuarter(qObj) {
  if (qObj.q && QUARTER_MONTHS[qObj.q]) {
    const yr = qObj.year ? ` ${qObj.year}` : '';
    return QUARTER_MONTHS[qObj.q].map(m => m + yr);
  }
  return ['Month 1', 'Month 2', 'Month 3'];
}

function quarterLabel(qObj) {
  if (!qObj.q) return '(select quarter)';
  const yr = qObj.year ? ` ${qObj.year}` : '';
  return `Q${qObj.q}${yr}`;
}

function quarterPickerHTML(stateVar, onchangeFn) {
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px;">
    <select style="border:1px solid var(--gray-200);border-radius:6px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:14px;" onchange="${onchangeFn}.q=this.value; ${onchangeFn}_changed()">
      <option value="">-- Quarter --</option>
      <option value="1">Q1 (Jan–Mar)</option>
      <option value="2">Q2 (Apr–Jun)</option>
      <option value="3">Q3 (Jul–Sep)</option>
      <option value="4">Q4 (Oct–Dec)</option>
    </select>
    <input type="number" min="2000" max="2099" placeholder="Year e.g. 2025" style="border:1px solid var(--gray-200);border-radius:6px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:14px;width:120px;" oninput="${onchangeFn}.year=this.value; ${onchangeFn}_changed()">
  </div>`;
}

function qaQuarter_changed() { updateQAQuarterLabels(); }
function qa024Quarter_changed() { updateQ024cTable(); }
function qa025Quarter_changed() { updateQ025Tables(); }

function updateQAQuarterLabels() {
  const months = getMonthsFromQuarter(qaQuarter);
  const label = quarterLabel(qaQuarter);
  // Update enrollee field labels
  const el1 = document.getElementById('qa_enrollees_label');
  const el2 = document.getElementById('qa_accessing_label');
  if (el1) el1.textContent = `Number of ORANGHIS Enrollees — ${label}`;
  if (el2) el2.textContent = `Number of ORANGHIS Enrollees Accessing Care — ${label}`;
  // Update quartertext/quarteryn labels
  document.querySelectorAll('.qa-quarter-label').forEach(el => {
    el.textContent = label;
  });
}

function updateQ024cTable() {
  const months = getMonthsFromQuarter(qa024Quarter);
  const label = quarterLabel(qa024Quarter);
  const el = document.getElementById('q024c-table-body');
  if (!el) return;
  el.innerHTML = months.map((m, i) => {
    const mk = `financial_Q024c_m${i}`;
    return `<tr style="border-bottom:1px solid var(--gray-100);">
      <td style="padding:5px 8px;color:var(--gray-700);font-weight:600;">${m}</td>
      <td style="padding:4px 6px;">
        <select style="border:1px solid var(--gray-200);border-radius:5px;padding:4px 6px;font-size:14px;" oninput="autoSave();remarks['${mk}_rcvd']=this.value">
          <option value="">--</option><option value="yes">Yes</option><option value="no">No</option>
        </select>
      </td>
      <td style="padding:4px 6px;"><input type="number" min="0" style="width:100%;border:1px solid var(--gray-200);border-radius:5px;padding:4px 6px;font-size:14px;box-sizing:border-box;" placeholder="0.00" oninput="autoSave();remarks['${mk}_amt']=this.value"></td>
      <td style="padding:4px 6px;"><input style="width:100%;border:1px solid var(--gray-200);border-radius:5px;padding:4px 6px;font-size:14px;box-sizing:border-box;" placeholder="Comment…" oninput="autoSave();remarks['${mk}_comment']=this.value"></td>
    </tr>`;
  }).join('');
  const lbl = document.getElementById('q024c-quarter-label');
  if (lbl) lbl.textContent = label;
}

function updateQ025Tables() {
  const months = getMonthsFromQuarter(qa025Quarter);
  const label = quarterLabel(qa025Quarter);
  ['Q025-1','Q025-2','Q025-3','Q025-4'].forEach(qnum => {
    const safeId = qnum.replace('-','_');
    const el = document.getElementById(`q025-table-body-${safeId}`);
    if (!el) return;
    el.innerHTML = months.map((m, i) => {
      const mk = `financial_${qnum}_m${i}`;
      return `<tr style="border-bottom:1px solid var(--gray-100);">
        <td style="padding:5px 8px;color:var(--gray-700);font-weight:600;">${m}</td>
        <td style="padding:4px 6px;"><input type="number" min="0" style="width:100%;border:1px solid var(--gray-200);border-radius:5px;padding:4px 6px;font-size:14px;box-sizing:border-box;" placeholder="0.00" oninput="autoSave();remarks['${mk}_amt']=this.value"></td>
        <td style="padding:4px 6px;"><input style="width:100%;border:1px solid var(--gray-200);border-radius:5px;padding:4px 6px;font-size:14px;box-sizing:border-box;" placeholder="Comment…" oninput="autoSave();remarks['${mk}_comment']=this.value"></td>
      </tr>`;
    }).join('');
    const lbl = document.getElementById(`q025-quarter-label-${safeId}`);
    if (lbl) lbl.textContent = label;
  });
}

// ===================== LOAD =====================
function loadChecklist(type) {
  currentType = type;
  clientSubmissionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  scores = {}; remarks = {}; profileData = {}; numAvailable = {}; yesno = {};
  qaQuarter = {q:'', year:''}; qa024Quarter = {q:'', year:''}; qa025Quarter = {q:'', year:''};
  recommendation = null;
  inspectionTeam = [{name:'',signature:'',date:''},{name:'',signature:'',date:''},{name:'',signature:'',date:''},{name:'',signature:'',date:''}];
  contactPerson = ''; facilityAccount = '';

  const cl = CHECKLISTS[type];
  document.getElementById('landing').style.display = 'none';
  document.getElementById('checklist-screen').style.display = 'block';
  document.getElementById('top-title').textContent = cl.title;
  renderForm(cl);
  updateScore();

  // Check for saved draft
  const savedAt = loadFromStorage(type);
  if (savedAt) {
    const when = new Date(savedAt).toLocaleString();
    showDraftPrompt(when, type, cl);
  }
}

function showDraftPrompt(when, type, cl) {
  const existing = document.getElementById('draft-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'draft-modal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(10,30,70,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`;
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="font-size:17px;font-weight:700;color:#0a4fa8;margin-bottom:8px;">📂 Draft Found</div>
      <div style="font-size:14px;color:#6b7a99;margin-bottom:18px;">A saved draft was found for this checklist.<br><span style="font-size:12px;">Last saved: ${when}</span></div>
      <div style="display:flex;gap:10px;flex-direction:column;">
        <button onclick="restoreDraft('${type}'); document.getElementById('draft-modal').remove();"
          style="background:#0a4fa8;color:white;border:none;border-radius:8px;padding:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;width:100%;">
          📂 Restore Draft
        </button>
        <button onclick="clearDraft('${type}'); document.getElementById('draft-modal').remove();"
          style="border:1.5px solid #c8d6f0;background:white;border-radius:8px;padding:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;color:#6b7a99;cursor:pointer;width:100%;">
          🗑 Start Fresh
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function restoreDraft(type) {
  loadFromStorage(type);
  renderForm(CHECKLISTS[type]);
  updateScore();
  // Re-apply yesno button states
  Object.entries(yesno).forEach(([key, val]) => setYesNo(key, val));
  if (recommendation) setRecommendation(recommendation);
}

function loadSavedSubmissionForEdit(submission) {
  const payload = submission.raw_payload || {};
  const type = submission.checklist_type || payload.currentType;
  if (!type || !CHECKLISTS[type]) return;
  loadChecklist(type);
  const draftModal = document.getElementById('draft-modal');
  if (draftModal) draftModal.remove();
  currentType = type;
  clientSubmissionId = payload.clientSubmissionId || submission.id;
  scores = payload.scores || {};
  remarks = payload.remarks || {};
  profileData = payload.profileData || submission.profile_data || {};
  numAvailable = payload.numAvailable || {};
  yesno = payload.yesno || {};
  recommendation = payload.recommendation || null;
  inspectionTeam = payload.inspectionTeam || inspectionTeam;
  contactPerson = payload.contactPerson || '';
  facilityAccount = payload.facilityAccount || '';
  qaQuarter = payload.qaQuarter || qaQuarter;
  qa024Quarter = payload.qa024Quarter || qa024Quarter;
  qa025Quarter = payload.qa025Quarter || qa025Quarter;
  renderForm(CHECKLISTS[type]);
  hydrateSavedSubmissionInputs();
  updateScore();
  Object.entries(yesno).forEach(([key, val]) => setYesNo(key, val));
  if (recommendation) setRecommendation(recommendation);
  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
}

function hydrateSavedSubmissionInputs() {
  document.querySelectorAll('#form-body input, #form-body textarea').forEach(el => {
    const binding = el.getAttribute('oninput') || '';
    let keyMatch = binding.match(/(?:profileData|scores|remarks|numAvailable)\['([^']+)'\]/);
    if (keyMatch) {
      const sourceName = binding.match(/^(?:.*?)(profileData|scores|remarks|numAvailable)/)?.[1];
      const source = sourceName === 'profileData' ? profileData : sourceName === 'scores' ? scores : sourceName === 'numAvailable' ? numAvailable : remarks;
      if (source[keyMatch[1]] !== undefined) {
        el.value = source[keyMatch[1]];
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    const teamMatch = binding.match(/inspectionTeam\[(\d+)\]\.(name|date)/);
    if (teamMatch && inspectionTeam[Number(teamMatch[1])]) {
      el.value = inspectionTeam[Number(teamMatch[1])][teamMatch[2]] || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (binding.includes('contactPerson') && contactPerson) el.value = contactPerson;
    if (binding.includes('facilityAccount') && facilityAccount) el.value = facilityAccount;
  });
  const quarterStates = [qaQuarter, qa024Quarter, qa025Quarter];
  let quarterIndex = 0;
  document.querySelectorAll('#form-body select').forEach(select => {
    const state = quarterStates[quarterIndex++];
    if (!state) return;
    select.value = state.q || '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const yearInput = select.parentElement?.querySelector('input[type="number"]');
    if (yearInput) {
      yearInput.value = state.year || '';
      yearInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function goBack() {
  document.getElementById('checklist-screen').style.display = 'none';
  document.getElementById('landing').style.display = 'flex';
}

// ===================== RENDER =====================
function renderForm(cl) {
  const fb = document.getElementById('form-body');
  let html = '';

  // Eligibility criteria — shown FIRST for primary, dental, pharmacy
  if (!cl.isQA) {
    html += `<div style="margin:0 0 2px 0;">
      <div class="section-header">📌 Eligibility Criteria for Provider Registration with ODCHC</div>
      <div class="section-body">
        <p style="font-size:13px;color:var(--gray-600);margin:0 0 10px 0;font-style:italic;">All Prospective Providers must meet the following criteria before registration:</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[
            'Be accredited by the National Health Insurance Authority (NHIA)',
            'Be registered with the Ondo State Ministry of Health (SMOH)',
            'Pay prescribed fees',
            'Have / Purchase Health Insurance Plan for staff of the facility'
          ].map((criterion, i) => {
            const ck = `eligibility_${i}`;
            return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100);">
              <div style="min-width:22px;height:22px;border-radius:50%;background:var(--blue);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${i+1}</div>
              <div style="flex:1;">
                <div style="font-size:13px;color:var(--gray-700);margin-bottom:5px;">${criterion}</div>
                <div class="yesno-cell">
                  <button class="yn-btn" id="yn_${ck}_yes" onclick="setYesNo('${ck}','yes')">✓ Met</button>
                  <button class="yn-btn" id="yn_${ck}_no"  onclick="setYesNo('${ck}','no')">✗ Not Met</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // Profile
  html += `<div class="section-header">📋 A — General Requirements / Facility Profile</div>`;
  html += `<div class="section-body"><div class="info-grid">`;

  // For QA: global quarter picker at the top
  if (cl.isQA) {
    html += `<div class="info-field full">
      <div class="field-label">Reference Quarter & Year (applies to all questions)</div>
      ${quarterPickerHTML('qaQuarter','qaQuarter')}
    </div>`;
  }

  cl.profileFields.forEach(f => {
    const full = f.span === 'full';
    html += `<div class="info-field ${full ? 'full' : ''}">`;
    html += `<div class="field-label" ${f.type === 'quarterfield' ? `id="qa_${f.id}_label"` : ''}>${f.label}${f.type === 'quarterfield' ? ' — <span class="qa-quarter-label">(select quarter above)</span>' : ''}</div>`;
    if (f.type === 'yesno') {
      html += `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <div class="radio-row">
          <label class="radio-label"><input type="radio" name="${f.id}" value="yes" onchange="profileData['${f.id}']='yes'"> Yes</label>
          <label class="radio-label"><input type="radio" name="${f.id}" value="no" onchange="profileData['${f.id}']='no'"> No</label>
        </div>`;
      if (f.reg) html += `<input class="field-input" style="flex:1;min-width:120px;" placeholder="Registration Number" oninput="autoSave();profileData['${f.id}_reg']=this.value">`;
      html += `</div>`;
    } else if (f.type === 'date') {
      html += `<input type="date" class="field-input" oninput="autoSave();profileData['${f.id}']=this.value">`;
    } else if (f.type === 'quarterfield') {
      html += `<input class="field-input" placeholder="Enter number…" oninput="autoSave();profileData['${f.id}']=this.value">`;
    } else {
      html += `<input class="field-input" placeholder="Enter ${f.label.toLowerCase()}" oninput="autoSave();profileData['${f.id}']=this.value">`;
    }
    html += `</div>`;
  });
  html += `</div></div>`;

  // Sections
  cl.sections.forEach(sec => {
    html += `<div class="section-header">📊 ${sec.label}</div>`;
    html += `<div class="section-body">`;

    if (sec.scoreType === 'qa') {
      sec.items.forEach(item => {
        const key = `${sec.id}_${item.num}`;
        html += `<div style="padding:12px 14px;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:11px;font-weight:700;color:var(--blue-dark);background:var(--blue-light);padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0;">${item.num}</span>
              <div class="row-label" style="flex:1;min-width:0;">${item.label}</div>
            </div>`;

        if (item.type === 'yesno') {
          html += `<div class="yesno-cell">
            <button class="yn-btn" id="yn_${key}_yes" onclick="setYesNo('${key}','yes')">✓ Yes</button>
            <button class="yn-btn" id="yn_${key}_no"  onclick="setYesNo('${key}','no')">✗ No</button>
          </div>
          <div class="remarks-cell"><input placeholder="Comment…" oninput="autoSave();remarks['${key}']=this.value" style="width:100%;box-sizing:border-box;"/></div>`;

        } else if (item.type === 'quarteryn') {
          html += `<div style="font-size:13px;color:var(--blue-dark);font-weight:600;">Quarter: <span class="qa-quarter-label">(select quarter in Section A)</span></div>
          <div class="yesno-cell">
            <button class="yn-btn" id="yn_${key}_yes" onclick="setYesNo('${key}','yes')">✓ Yes</button>
            <button class="yn-btn" id="yn_${key}_no"  onclick="setYesNo('${key}','no')">✗ No</button>
          </div>
          <div class="remarks-cell"><input placeholder="Comment…" oninput="autoSave();remarks['${key}']=this.value" style="width:100%;box-sizing:border-box;"/></div>`;

        } else if (item.type === 'quartertext') {
          html += `<div style="font-size:13px;color:var(--blue-dark);font-weight:600;">Quarter: <span class="qa-quarter-label">(select quarter in Section A)</span></div>
          <div class="remarks-cell"><input placeholder="Enter response…" oninput="autoSave();remarks['${key}']=this.value" style="width:100%;box-sizing:border-box;"/></div>`;

        } else if (item.type === 'table') {
          html += `<div style="width:100%;margin-top:6px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;">
            <thead><tr style="background:var(--blue-light);">
              <th style="text-align:left;padding:7px 8px;color:var(--blue-dark);">Category</th>
              <th style="text-align:center;padding:7px 6px;color:var(--blue-dark);width:52px;">No.</th>
            </tr></thead><tbody>`;
          item.tableRows.forEach((row, i) => {
            const rk = `${key}_r${i}`;
            html += `<tr style="border-bottom:1px solid var(--gray-100);${i%2===0?'background:#f7f9fc;':''}">
              <td style="padding:7px 8px;color:var(--gray-700);vertical-align:middle;word-break:break-word;">${row}</td>
              <td style="padding:4px 6px;vertical-align:middle;text-align:center;width:52px;">
                <input type="number" min="0" style="width:46px;border:1px solid var(--gray-200);border-radius:5px;padding:5px 2px;font-size:13px;text-align:center;box-sizing:border-box;" placeholder="0" oninput="autoSave();remarks['${rk}_val']=this.value">
              </td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-200);">
              <td colspan="2" style="padding:0 8px 7px 8px;">
                <input style="width:100%;border:1px solid var(--gray-200);border-radius:5px;padding:6px 8px;font-size:12px;box-sizing:border-box;color:var(--gray-600);background:var(--gray-50);" placeholder="Comment…" oninput="autoSave();remarks['${rk}_comment']=this.value">
              </td>
            </tr>`;
          });
          html += `</tbody></table></div>`;

        } else if (item.type === 'monthly_q024') {
          html += `<div style="font-size:13px;color:var(--blue-dark);font-weight:600;margin-bottom:4px;">
            Quarter for Q024a: <span id="q024c-quarter-label">(pick quarter below)</span>
          </div>
          ${quarterPickerHTML('qa024Quarter','qa024Quarter')}
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:4px;">
            <thead><tr style="background:var(--blue-light);">
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Month</th>
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Received?</th>
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Amount (₦)</th>
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Comment</th>
            </tr></thead>
            <tbody id="q024c-table-body">
              <tr><td colspan="4" style="padding:8px;color:var(--gray-400);font-style:italic;">Select quarter above to load months</td></tr>
            </tbody>
          </table>`;

        } else if (item.type === 'monthly_q025') {
          const safeId = String(item.num).replace('-','_');
          // Only show quarter picker on the first Q025 item
          const isFirst = item.num === 'Q025-1';
          if (isFirst) {
            html += `<div style="font-size:13px;color:var(--blue-dark);font-weight:600;margin-bottom:4px;">Select quarter for Q025 (applies to all Q025 items)</div>
            ${quarterPickerHTML('qa025Quarter','qa025Quarter')}`;
          }
          html += `<div style="font-size:13px;color:var(--blue-dark);font-weight:600;margin-top:4px;">Quarter: <span id="q025-quarter-label-${safeId}">(select quarter above)</span></div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:4px;">
            <thead><tr style="background:var(--blue-light);">
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Month</th>
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Amount (₦)</th>
              <th style="text-align:left;padding:5px 8px;color:var(--blue-dark);">Comment</th>
            </tr></thead>
            <tbody id="q025-table-body-${safeId}">
              <tr><td colspan="3" style="padding:8px;color:var(--gray-400);font-style:italic;">Select quarter above to load months</td></tr>
            </tbody>
          </table>`;

        } else if (item.type === 'acctdetails') {
          html += `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;min-width:110px;flex-shrink:0;">Account Name:</span>
              <input class="field-input" style="flex:1;min-width:0;" placeholder="Enter account name" oninput="autoSave();remarks['${key}_acct_name']=this.value">
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;min-width:110px;flex-shrink:0;">Account Number:</span>
              <input class="field-input" style="flex:1;min-width:0;" placeholder="Enter account number" oninput="autoSave();remarks['${key}_acct_num']=this.value">
            </div>
          </div>`;

        } else if (item.type === 'designations_only') {
          html += `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
            ${[1,2,3].map(n => `<div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;min-width:100px;flex-shrink:0;">Designation ${n}:</span>
              <input class="field-input" style="flex:1;min-width:0;" placeholder="Enter designation ${n}" oninput="autoSave();remarks['${key}_d${n}']=this.value">
            </div>`).join('')}
          </div>`;

        } else if (item.type === 'person') {
          html += `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;min-width:90px;flex-shrink:0;">Name:</span>
              <input class="field-input" style="flex:1;min-width:0;" placeholder="Enter full name" oninput="autoSave();remarks['${key}_name']=this.value">
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;min-width:90px;flex-shrink:0;">Phone:</span>
              <input class="field-input" style="flex:1;min-width:0;" placeholder="Enter phone number" oninput="autoSave();remarks['${key}_phone']=this.value">
            </div>
          </div>`;

        } else if (item.type === 'textarea') {
          html += `<textarea style="width:100%;min-height:80px;border:1px solid var(--gray-200);border-radius:8px;padding:8px;font-family:'DM Sans',sans-serif;font-size:13px;box-sizing:border-box;resize:vertical;" placeholder="Provide details here…" oninput="autoSave();remarks['${key}']=this.value"></textarea>`;

        } else {
          html += `<div class="remarks-cell"><input placeholder="Enter response…" oninput="autoSave();remarks['${key}']=this.value" style="width:100%;box-sizing:border-box;"/></div>`;
        }

        html += `</div></div>`;
      });
    } else {
      sec.items.forEach(item => {
        const key = `${sec.id}_${item.num}`;
        const showNum = sec.id === 'personnel';
        const showYesNo = sec.id === 'infrastructure' || sec.id === 'essential' || sec.id === 'dental_operatory' || sec.id === 'dental_diagnostic' || sec.id === 'dental_instruments' || sec.id === 'dental_materials';
        const showScore = sec.id === 'personnel' || sec.id === 'infrastructure' || sec.id === 'essential' || sec.id === 'dental_operatory' || sec.id === 'dental_diagnostic' || sec.id === 'dental_instruments' || sec.id === 'dental_materials';
        const maxVal = (typeof item.max === 'number') ? item.max : null;
        html += `<div style="padding:12px 14px;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
            <span style="font-size:12px;font-weight:700;color:var(--gray-400);flex-shrink:0;min-width:26px;">${item.num}</span>
            <div class="row-label" style="flex:1;min-width:0;">${item.label}</div>
            ${maxVal !== null ? `<span style="font-size:11px;font-weight:700;color:var(--blue-dark);background:var(--blue-light);padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0;">Max: ${maxVal}</span>` : ''}
          </div>
          ${showNum ? `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:nowrap;">
            <div style="flex:1;display:flex;align-items:center;gap:6px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:8px 12px;min-width:0;">
              <span style="font-size:13px;color:var(--gray-600);font-weight:600;white-space:nowrap;">No. Available</span>
              <input type="number" min="0" placeholder="0" style="flex:1;min-width:0;border:none;background:transparent;font-size:15px;font-weight:700;text-align:center;outline:none;color:var(--blue-dark);" oninput="autoSave();numAvailable['${key}']=this.value">
            </div>
            <div style="flex:1;display:flex;align-items:center;gap:6px;background:var(--blue-light);border:1px solid var(--blue);border-radius:8px;padding:8px 12px;min-width:0;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;white-space:nowrap;">Score</span>
              <input type="number" min="0" ${maxVal !== null ? `max="${maxVal}"` : ''} placeholder="0" style="flex:1;min-width:0;border:none;background:transparent;font-size:15px;font-weight:700;text-align:center;outline:none;color:var(--blue-dark);" oninput="clampScore(this,${maxVal !== null ? maxVal : 'null'},'${key}')">
            </div>
          </div>` : ''}
          ${showYesNo ? `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:nowrap;">
            <button class="yn-btn" id="yn_${key}_yes" onclick="setYesNo('${key}','yes')" style="flex:0 0 auto;">✓ Yes</button>
            <button class="yn-btn" id="yn_${key}_no"  onclick="setYesNo('${key}','no')" style="flex:0 0 auto;">✗ No</button>
            ${showScore ? `<div style="flex:1;display:flex;align-items:center;gap:6px;background:var(--blue-light);border:1px solid var(--blue);border-radius:8px;padding:8px 10px;min-width:0;">
              <span style="font-size:13px;color:var(--blue-dark);font-weight:600;white-space:nowrap;">Score</span>
              <input type="number" min="0" ${maxVal !== null ? `max="${maxVal}"` : ''} placeholder="0" style="flex:1;min-width:0;border:none;background:transparent;font-size:15px;font-weight:700;text-align:center;outline:none;color:var(--blue-dark);" oninput="clampScore(this,${maxVal !== null ? maxVal : 'null'},'${key}')">
            </div>` : ''}
          </div>` : ''}
          <input style="width:100%;box-sizing:border-box;border:1px solid var(--gray-200);border-radius:8px;padding:9px 12px;font-family:'DM Sans',sans-serif;font-size:14px;background:var(--gray-50);outline:none;" placeholder="Remark…" oninput="autoSave();remarks['${key}']=this.value"/>
        </div>`;
      });
    }

    html += `</div>`;
  });

  // Recommendation
  if (!cl.isQA) {
    html += `<div class="section-header">✅ General Remarks / Recommendation</div>`;
    html += `<div class="section-body">
      <div class="info-grid">
        <div class="info-field full"><div class="field-label">Name of Contact Person</div>
          <input class="field-input" placeholder="Contact person name" oninput="autoSave();contactPerson=this.value">
        </div>
        <div class="info-field full"><div class="field-label">Facility Account Details</div>
          <input class="field-input" placeholder="Account details" oninput="autoSave();facilityAccount=this.value">
        </div>
        <div class="info-field"><div class="field-label">Account Number</div>
          <input class="field-input" placeholder="Enter account number" oninput="autoSave();profileData['account_number']=this.value">
        </div>
        <div class="info-field"><div class="field-label">Account Name</div>
          <input class="field-input" placeholder="Enter account name" oninput="autoSave();profileData['account_name']=this.value">
        </div>
        <div class="info-field"><div class="field-label">Bank Name</div>
          <input class="field-input" placeholder="Enter bank name" oninput="autoSave();profileData['bank_name']=this.value">
        </div>
        <div class="info-field"><div class="field-label">Date</div>
          <input type="date" class="field-input" oninput="autoSave();profileData['rec_date']=this.value">
        </div>
      </div>
      <div class="recommend-row">
        <button class="recommend-btn rec-yes" id="rec-yes" onclick="setRecommendation('yes')">✓ Recommended</button>
        <button class="recommend-btn rec-no"  id="rec-no"  onclick="setRecommendation('no')">✗ Not Recommended</button>
      </div>
    </div>`;

    // Inspection team
    html += `<div class="section-header">👥 Inspection Team</div>`;
    html += `<div class="section-body"><div class="inspection-team">`;
    for (let i = 0; i < 4; i++) {
      html += `<div class="info-field">
        <div class="field-label">Team Member ${i+1} — Name</div>
        <input class="field-input" placeholder="Full name" oninput="autoSave();inspectionTeam[${i}].name=this.value">
      </div>
      <div class="info-field">
        <div class="field-label">Team Member ${i+1} — Date</div>
        <input type="date" class="field-input" oninput="autoSave();inspectionTeam[${i}].date=this.value">
      </div>`;
    }
    html += `</div></div>`;
  } else {
    // QA — interviewer info only, no recommendation or signatures
    html += `<div class="section-header">🎤 Interviewer Details</div>`;
    html += `<div class="section-body"><div class="info-grid">
      <div class="info-field full"><div class="field-label">Interviewer Name</div>
        <input class="field-input" placeholder="Enter interviewer full name" oninput="autoSave();profileData['interviewer_name']=this.value">
      </div>
      <div class="info-field"><div class="field-label">Date</div>
        <input type="date" class="field-input" oninput="autoSave();profileData['interview_date']=this.value">
      </div>
    </div>
    <div style="padding:8px 12px 0;font-size:12px;font-weight:700;color:var(--blue-dark);">QA Team Members</div>
    <div class="inspection-team">`;
    for (let i = 0; i < 4; i++) {
      html += `<div class="info-field">
        <div class="field-label">QA Team Member ${i+1} — Name</div>
        <input class="field-input" placeholder="Full name" oninput="autoSave();inspectionTeam[${i}].name=this.value">
      </div>`;
    }
    html += `</div></div>`;
  }

  // Summary bar
  html += `<div class="summary-bar">
    <div class="summary-info">
      <span>Score: <strong id="total-score-bar">—</strong></span>
      <span>/ <strong id="max-score-bar">—</strong></span>
      <span>| <strong id="pct-score-bar">—</strong></span>
      <span id="save-indicator" style="color:var(--green);font-weight:700;opacity:0;transition:opacity 0.5s;font-size:11px;"></span>
    </div>
    <div class="summary-buttons">
      <button class="clear-btn" onclick="confirmClearDraft()">🗑 Clear</button>
      <button class="export-btn" style="background:var(--green);" onclick="submitChecklist()">☁ Submit to NMIS</button>
      <button class="export-btn" onclick="exportPDF()">📄 Export PDF</button>
    </div>
  </div>`;

  fb.innerHTML = html;
}

// ===================== PERSISTENCE =====================
function saveToStorage() {
  if (!currentType) return;
  try {
    const draft = {
      currentType,
      scores, remarks, profileData, numAvailable, yesno,
      recommendation, inspectionTeam, contactPerson, facilityAccount,
      clientSubmissionId,
      qaQuarter, qa024Quarter, qa025Quarter,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`odchc_draft_${currentType}`, JSON.stringify(draft));
    showSaveIndicator();
  } catch(e) { console.warn('Save failed:', e); }
}

function loadFromStorage(type) {
  try {
    const raw = localStorage.getItem(`odchc_draft_${type}`);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    scores = draft.scores || {};
    remarks = draft.remarks || {};
    profileData = draft.profileData || {};
    numAvailable = draft.numAvailable || {};
    yesno = draft.yesno || {};
    recommendation = draft.recommendation || null;
    inspectionTeam = draft.inspectionTeam || [{name:'',date:''},{name:'',date:''},{name:'',date:''},{name:'',date:''}];
    contactPerson = draft.contactPerson || '';
    facilityAccount = draft.facilityAccount || '';
    clientSubmissionId = draft.clientSubmissionId || clientSubmissionId;
    qaQuarter = draft.qaQuarter || {q:'',year:''};
    qa024Quarter = draft.qa024Quarter || {q:'',year:''};
    qa025Quarter = draft.qa025Quarter || {q:'',year:''};
    return draft.savedAt;
  } catch(e) { return false; }
}

function clearDraft(type) {
  try { localStorage.removeItem(`odchc_draft_${type}`); } catch(e) {}
}

function showSaveIndicator() {
  let el = document.getElementById('save-indicator');
  if (!el) return;
  el.textContent = '✓ Draft saved';
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

// Debounced auto-save — fires 800ms after last input
let _saveTimer = null;
function autoSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveToStorage, 800);
}

// ===================== SCORING =====================
function clampScore(input, max, key) {
  autoSave();
  let val = parseFloat(input.value);
  if (isNaN(val)) { scores[key] = input.value; updateScore(); return; }
  if (val < 0) val = 0;
  if (max !== null && val > max) val = max;
  input.value = val;
  scores[key] = val;
  updateScore();
}

function setScore(key, val, btn, activeClass) {
  document.querySelectorAll(`[id^="btn_${key}_"]`).forEach(b => b.className = 'score-btn');
  btn.classList.add(activeClass);
  scores[key] = val === 'yes' ? 1 : val === 'no' ? 0 : val;
  updateScore();
  autoSave();
}

function setYesNo(key, val) {
  yesno[key] = val;
  const yBtn = document.getElementById(`yn_${key}_yes`);
  const nBtn = document.getElementById(`yn_${key}_no`);
  if (yBtn) { yBtn.className = 'yn-btn' + (val === 'yes' ? ' yn-yes' : ''); }
  if (nBtn) { nBtn.className = 'yn-btn' + (val === 'no'  ? ' yn-no'  : ''); }
  autoSave();
}

function setRecommendation(val) {
  recommendation = val;
  document.getElementById('rec-yes').classList.toggle('active', val === 'yes');
  document.getElementById('rec-no').classList.toggle('active',  val === 'no');
  autoSave();
}

function updateScore() {
  const cl = CHECKLISTS[currentType];
  if (!cl) return;
  let total = 0, totalMax = 0;
  Object.values(scores).forEach(v => { const n = parseFloat(v); if (!isNaN(n)) total += n; });
  // Compute max from all scored sections — use item.max where defined, else count 1 per item
  if (!cl.isQA) {
    cl.sections.forEach(sec => {
      sec.items.forEach(item => {
        totalMax += (typeof item.max === 'number') ? item.max : 1;
      });
    });
  }
  const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : (total > 0 ? Math.min(total, 100) : 0);
  const tsb = document.getElementById('total-score-bar');
  const msb = document.getElementById('max-score-bar');
  const psb = document.getElementById('pct-score-bar');
  if (tsb) tsb.textContent = total;
  if (msb) msb.textContent = totalMax;
  if (psb) psb.textContent = pct + '%';
}

// ===================== VALIDATION =====================
function validateForm() {
  const errors = [];
  // Required profile fields
  const requiredFields = {name: 'Facility Name', address: 'Address'};
  if (!CHECKLISTS[currentType]?.isQA) requiredFields.inspection_date = 'Date of Inspection';
  Object.entries(requiredFields).forEach(([id, label]) => {
    if (!profileData[id] || profileData[id].trim() === '') {
      errors.push(`• ${label} is required in Section A`);
    }
  });
  // Score range validation — check against per-question max where defined, else 0-100
  const cl = CHECKLISTS[currentType];
  const maxLookup = {};
  if (cl && !cl.isQA) {
    cl.sections.forEach(sec => {
      sec.items.forEach(item => {
        if (typeof item.max === 'number') maxLookup[`${sec.id}_${item.num}`] = item.max;
      });
    });
  }
  const badScores = Object.entries(scores).filter(([k, v]) => {
    const n = parseFloat(v);
    if (isNaN(n)) return false;
    const itemMax = maxLookup[k] !== undefined ? maxLookup[k] : 100;
    return n < 0 || n > itemMax;
  });
  if (badScores.length > 0) {
    errors.push(`• ${badScores.length} score(s) exceed their question's maximum allowed value`);
  }
  // Numeric fields — no. available must be non-negative
  const badNums = Object.entries(numAvailable).filter(([k, v]) => {
    const n = parseFloat(v);
    return v !== '' && (!isNaN(n) && n < 0);
  });
  if (badNums.length > 0) {
    errors.push(`• "No. available" values cannot be negative`);
  }
  return errors;
}

function checklistSubmissionPayload() {
  const score = parseFloat(document.getElementById('total-score-bar')?.textContent || '');
  const maximum = parseFloat(document.getElementById('max-score-bar')?.textContent || '');
  const percentage = parseFloat(document.getElementById('pct-score-bar')?.textContent || '');
  const inspectionDate = profileData.inspection_date || new Date().toISOString().slice(0, 10);
  const clientId = clientSubmissionId || `${currentType}:${Date.now()}`;
  return {
    client_submission_id: clientId,
    checklist_type: currentType,
    checklist_title: CHECKLISTS[currentType]?.title || currentType,
    facility_name: profileData.name || '',
    inspection_date: inspectionDate,
    overall_score: Number.isFinite(score) ? score : null,
    maximum_score: Number.isFinite(maximum) ? maximum : null,
    percentage: Number.isFinite(percentage) ? percentage : null,
    recommendation,
    profile_data: { ...profileData, contact_person: contactPerson, facility_account: facilityAccount },
    responses: { scores, remarks, numAvailable, yesno, qaQuarter, qa024Quarter, qa025Quarter, inspectionTeam },
    raw_payload: { currentType, profileData, scores, remarks, numAvailable, yesno, recommendation, inspectionTeam, contactPerson, facilityAccount, qaQuarter, qa024Quarter, qa025Quarter },
  };
}

async function submitChecklist() {
  const errors = validateForm();
  if (errors.length > 0) {
    alert(`Please fix the following before submitting:\n\n${errors.join('\n')}`);
    return;
  }
  if (!odchcSupabaseSession?.url || !odchcSupabaseSession?.anonKey || !odchcSupabaseSession?.accessToken) {
    alert('Your NMIS session is not ready. Please sign in again, then reopen the checklist.');
    return;
  }
  const button = [...document.querySelectorAll('.summary-buttons button')].find(b => /Submit to NMIS/.test(b.textContent || ''));
  if (button) { button.disabled = true; button.textContent = '⏳ Saving…'; }
  try {
    const response = await fetch(`${odchcSupabaseSession.url}/rest/v1/rpc/nmis_save_odchc_checklist_submission`, {
      method: 'POST',
      headers: {
        apikey: odchcSupabaseSession.anonKey,
        Authorization: `Bearer ${odchcSupabaseSession.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_payload: checklistSubmissionPayload() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error_description || 'Supabase rejected the checklist submission.');
    const saved = Array.isArray(result) ? result[0] : result;
    alert(`Checklist submitted successfully.\n\nSubmission code: ${saved.submission_code || 'saved'}`);
    saveToStorage();
  } catch (error) {
    console.error('ODCHC checklist submission failed:', error);
    alert(`Checklist submission failed.\n\n${error instanceof Error ? error.message : 'Please try again.'}`);
  } finally {
    if (button) { button.disabled = false; button.textContent = '☁ Submit to NMIS'; }
  }
}

function showValidationModal(errors, onProceed) {
  const existing = document.getElementById('validation-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'validation-modal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(10,30,70,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`;
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="font-size:17px;font-weight:700;color:#c0392b;margin-bottom:8px;">⚠️ Incomplete Form</div>
      <div style="font-size:14px;color:#6b7a99;margin-bottom:14px;">Please fix the following before exporting:</div>
      <div style="background:#fff5f5;border:1px solid #fcd4d4;border-radius:8px;padding:12px;margin-bottom:18px;">
        ${errors.map(e => `<div style="font-size:14px;color:#c0392b;margin-bottom:6px;">${e}</div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="document.getElementById('validation-modal').remove()"
          style="border:1.5px solid #c8d6f0;background:white;border-radius:8px;padding:9px 18px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:#6b7a99;cursor:pointer;">
          Go Back & Fix
        </button>
        <button onclick="document.getElementById('validation-modal').remove(); ${onProceed}()"
          style="background:#e67e22;color:white;border:none;border-radius:8px;padding:9px 18px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
          Export Anyway
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function confirmClearDraft() {
  if (confirm('Clear all data and start fresh? This cannot be undone.')) {
    clearDraft(currentType);
    loadChecklist(currentType);
  }
}

// ===================== PDF EXPORT =====================
async function exportPDF() {
  // Run validation first
  const errors = validateForm();
  if (errors.length > 0) {
    showValidationModal(errors, 'proceedExport');
    return;
  }
  proceedExport();
}

async function proceedExport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cl = CHECKLISTS[currentType];
  const pageW = 210, margin = 14, contentW = pageW - margin * 2;
  let y = 0;

  function addWatermark() {
    try {
      const wmImg = new Image();
      wmImg.src = 'icon-192.png';
      const pageW = 210, pageH = 297;
      const wmSize = 100;
      const wmX = (pageW - wmSize) / 2;
      const wmY = (pageH - wmSize) / 2;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.addImage(wmImg, 'PNG', wmX, wmY, wmSize, wmSize);
      doc.restoreGraphicsState();
    } catch(e) { /* skip watermark if image not available */ }
  }

  function checkPage(needed = 10) {
    if (y + needed > 275) { doc.addPage(); y = 14; addWatermark(); }
  }

  function drawHeader() {
    // Blue header band
    doc.setFillColor(10, 79, 168);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('ONDO STATE CONTRIBUTORY HEALTH COMMISSION', margin, 11);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(cl.title.toUpperCase(), margin, 19);
    // Accent stripe
    doc.setFillColor(240, 165, 0);
    doc.rect(0, 28, 210, 3, 'F');
    y = 40;
  }

  function sectionTitle(title) {
    checkPage(12);
    doc.setFillColor(10, 79, 168);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 3, y + 5.5);
    y += 11;
  }

  function fieldRow(label, value) {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 120);
    doc.text(label.toUpperCase(), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 42, 64);
    const val = value || '—';
    const lines = doc.splitTextToSize(val, contentW - 45);
    doc.text(lines, margin + 46, y);
    y += Math.max(6, lines.length * 5);
  }

  function itemRow(item, key, sec) {
    const num = item.num;
    const label = item.label;
    const itemMax = (typeof item.max === 'number') ? item.max : null;
    const scoreVal = scores[key];
    const hasScore = scoreVal !== undefined && scoreVal !== '';
    const ynVal = yesno[key];
    const showYesNo = sec.id === 'infrastructure' || sec.id === 'essential' || sec.id === 'dental_operatory' || sec.id === 'dental_diagnostic' || sec.id === 'dental_instruments' || sec.id === 'dental_materials';
    const showNum = sec.id === 'personnel';
    const avail = numAvailable[key];
    const remark = remarks[key] || '';

    const labelLines = doc.splitTextToSize(label, contentW - 58);
    let extraLines = 0;
    if (showNum && avail !== undefined && avail !== '') extraLines++;
    if (remark) extraLines += doc.splitTextToSize(remark, contentW - 16).length;
    const rowH = Math.max(7, labelLines.length * 4.2 + 3 + extraLines * 4);

    checkPage(rowH + 2);
    if (num % 2 === 0) {
      doc.setFillColor(247, 249, 252);
      doc.rect(margin, y - 1, contentW, rowH, 'F');
    }
    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(138, 154, 184);
    doc.text(String(num), margin + 2, y + 4);
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 42, 64);
    doc.text(labelLines, margin + 9, y + 4);
    let lineY = y + 4 + labelLines.length * 4.2;

    // No. Available (personnel only)
    if (showNum && avail !== undefined && avail !== '') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(10, 79, 168);
      doc.text(`No. Available: ${avail}`, margin + 9, lineY);
      lineY += 4;
    }

    // Yes/No pill
    let badgeX = pageW - margin - 24;
    if (showYesNo) {
      const ynColor = ynVal === 'yes' ? [26,138,74] : ynVal === 'no' ? [192,57,43] : [216,224,236];
      const ynText = ynVal === 'yes' ? 'YES' : ynVal === 'no' ? 'NO' : '—';
      const ynTextColor = ynVal ? [255,255,255] : [138,154,184];
      doc.setFillColor(...ynColor);
      doc.roundedRect(pageW - margin - 50, y, 14, 5.2, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(...ynTextColor);
      doc.text(ynText, pageW - margin - 43, y + 3.6, { align: 'center' });
      badgeX = pageW - margin - 33;
    }

    // Score badge "X / Max"
    const scoreColor = hasScore ? [10, 79, 168] : [216, 224, 236];
    const scoreTextColor = hasScore ? [255,255,255] : [138,154,184];
    const scoreLabel = hasScore
      ? (itemMax !== null ? `${scoreVal}/${itemMax}` : `${scoreVal}`)
      : (itemMax !== null ? `—/${itemMax}` : '—');
    doc.setFillColor(...scoreColor);
    doc.roundedRect(badgeX, y, pageW - margin - badgeX, 5.2, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...scoreTextColor);
    doc.text(scoreLabel, badgeX + (pageW - margin - badgeX) / 2, y + 3.6, { align: 'center' });

    // Remark
    if (remark) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 100, 120);
      const remLines = doc.splitTextToSize(`Remark: ${remark}`, contentW - 16);
      doc.text(remLines, margin + 9, lineY);
      lineY += remLines.length * 4;
    }

    y += rowH + 1;
  }

  function sectionTotal(label, score, max) {
    checkPage(8);
    doc.setFillColor(232, 241, 251);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(7, 47, 107);
    doc.text(`${label} — Total: ${score} / ${max}`, margin + 3, y + 5);
    y += 10;
  }

  // ---- BUILD PDF ----
  drawHeader();
  addWatermark();

  // Eligibility Criteria (non-QA only)
  if (!cl.isQA) {
    const eligibilityCriteria = [
      'Be accredited by the National Health Insurance Authority (NHIA)',
      'Be registered with the Ondo State Ministry of Health (SMOH)',
      'Pay prescribed fees',
      'Have / Purchase Health Insurance Plan for staff of the facility'
    ];
    checkPage(35);
    sectionTitle('Eligibility Criteria for Provider Registration with ODCHC');
    eligibilityCriteria.forEach((criterion, i) => {
      const ck = `eligibility_${i}`;
      const val = yesno[ck] ? yesno[ck].toUpperCase() : '—';
      checkPage(8);
      const rowH = 7;
      if (i % 2 === 0) {
        doc.setFillColor(247, 249, 252);
        doc.rect(margin, y - 1, contentW, rowH, 'F');
      }
      // Number badge
      doc.setFillColor(10, 79, 168);
      doc.circle(margin + 3, y + 3, 2.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), margin + 3, y + 4, { align: 'center' });
      // Criterion text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 42, 64);
      const lines = doc.splitTextToSize(criterion, contentW - 40);
      doc.text(lines, margin + 8, y + 4);
      // Status badge
      const statusColor = yesno[ck] === 'yes' ? [26, 138, 74] : yesno[ck] === 'no' ? [192, 57, 43] : [138, 154, 184];
      doc.setFillColor(...statusColor);
      doc.roundedRect(margin + contentW - 18, y, 18, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      const statusText = yesno[ck] === 'yes' ? 'MET' : yesno[ck] === 'no' ? 'NOT MET' : '—';
      doc.text(statusText, margin + contentW - 9, y + 4.2, { align: 'center' });
      y += rowH + 1;
    });
    y += 4;
  }

  // Facility Profile
  sectionTitle('A — Facility Profile');
  cl.profileFields.forEach(f => {
    let val = profileData[f.id] || '';
    if (f.type === 'yesno') {
      val = profileData[f.id] ? profileData[f.id].toUpperCase() : '—';
      if (f.reg && profileData[f.id + '_reg']) val += `  |  Reg No: ${profileData[f.id + '_reg']}`;
    }
    fieldRow(f.label, val);
  });
  y += 4;

  // Sections
  cl.sections.forEach(sec => {
    sectionTitle(sec.label);
    let secScore = 0, secMax = 0;
    sec.items.forEach(item => {
      const key = `${sec.id}_${item.num}`;
      const maxPer = (typeof item.max === 'number') ? item.max : 1;
      secMax += maxPer;
      const s = parseFloat(scores[key]);
      if (!isNaN(s)) secScore += s;
      itemRow(item, key, sec);
    });
    sectionTotal(sec.label.split('—')[0].trim(), secScore, secMax);
  });

  // Overall score
  checkPage(20);
  let totalScore = 0, totalMax = 0;
  cl.sections.forEach(sec => {
    sec.items.forEach(item => {
      const key = `${sec.id}_${item.num}`;
      const maxPer = (typeof item.max === 'number') ? item.max : 1;
      totalMax += maxPer;
      const s = parseFloat(scores[key]);
      if (!isNaN(s)) totalScore += s;
    });
  });
  const pct = totalMax > 0 ? Math.round((totalScore/totalMax)*100) : 0;
  doc.setFillColor(10, 79, 168);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255,255,255);
  doc.text(`OVERALL SCORE:  ${totalScore} / ${totalMax}   (${pct}%)`, margin + 6, y + 9);
  y += 18;

  // Recommendation
  checkPage(16);
  sectionTitle('Recommendation');
  const recText = recommendation === 'yes' ? '✓ RECOMMENDED FOR ACCREDITATION'
                : recommendation === 'no'  ? '✗ NOT RECOMMENDED FOR ACCREDITATION'
                : 'Not specified';
  const recColor = recommendation === 'yes' ? [26,138,74] : recommendation === 'no' ? [192,57,43] : [138,154,184];
  doc.setFillColor(...recColor);
  doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255,255,255);
  doc.text(recText, margin + 4, y + 6);
  y += 13;
  if (contactPerson) fieldRow('Contact Person', contactPerson);
  if (facilityAccount) fieldRow('Facility Account', facilityAccount);
  y += 4;

  // Inspection team
  checkPage(40);
  sectionTitle('Inspection Team');
  inspectionTeam.forEach((m, i) => {
    if (m.name || m.date) {
      checkPage(8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 42, 64);
      doc.text(`Member ${i+1}: ${m.name || '—'}`, margin + 3, y + 5);
      doc.text(`Date: ${m.date || '—'}`, margin + 100, y + 5);
      // Signature line
      doc.setDrawColor(180, 190, 210);
      doc.line(margin + 3, y + 9, margin + 80, y + 9);
      doc.setFontSize(6.5);
      doc.setTextColor(138, 154, 184);
      doc.text('Signature', margin + 3, y + 12);
      y += 16;
    }
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(10, 79, 168);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255,255,255);
    doc.text('Ondo State Contributory Health Commission — Confidential', margin, 293);
    doc.text(`Page ${p} of ${pageCount}`, 195, 293, { align: 'right' });
  }

  // Prompt for filename then save
  showSaveModal(doc);
}

function showSaveModal(doc) {
  // Remove any existing modal
  const existing = document.getElementById('save-modal');
  if (existing) existing.remove();

  const facilityName = profileData['name'] || '';
  const safeDate = new Date().toISOString().slice(0,10);
  const suggested = `ODCHC_${(CHECKLISTS[currentType].title.split('—')[1]||currentType).trim().replace(/\s+/g,'_')}_${facilityName.replace(/\s+/g,'_') || 'Report'}_${safeDate}`;

  const modal = document.createElement('div');
  modal.id = 'save-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(10,30,70,0.55);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="font-size:16px;font-weight:700;color:#0a4fa8;margin-bottom:6px;">💾 Save PDF</div>
      <div style="font-size:12px;color:#6b7a99;margin-bottom:16px;">Enter a name for the PDF file</div>
      <input id="save-filename" type="text" value="${suggested}"
        style="width:100%;box-sizing:border-box;border:1.5px solid #c8d6f0;border-radius:8px;padding:10px 12px;
               font-size:13px;font-family:'DM Sans',sans-serif;color:#1e2a40;outline:none;margin-bottom:16px;"
      >
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="document.getElementById('save-modal').remove()"
          style="border:1.5px solid #c8d6f0;background:white;border-radius:8px;padding:9px 18px;
                 font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#6b7a99;cursor:pointer;">
          Cancel
        </button>
        <button onclick="doSavePDF(window._pendingDoc)"
          style="background:#0a4fa8;color:white;border:none;border-radius:8px;padding:9px 20px;
                 font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
          📄 Save PDF
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  window._pendingDoc = doc;
  // Auto-select filename text
  setTimeout(() => {
    const inp = document.getElementById('save-filename');
    if (inp) { inp.focus(); inp.select(); }
  }, 100);
}

async function doSavePDF(doc) {
  const inp = document.getElementById('save-filename');
  let fileName = (inp ? inp.value.trim() : '') || 'ODCHC_Report';
  if (!fileName.endsWith('.pdf')) fileName += '.pdf';
  document.getElementById('save-modal').remove();

  try {
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      const { Filesystem, Share } = window.Capacitor.Plugins;

      // Save to Documents directory (persists on device)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: 'DOCUMENTS',
      });

      // Show Android share sheet so user can open/move the file
      await Share.share({
        title: 'ODCHC Report',
        text: `Report saved: ${fileName}`,
        url: result.uri,
        dialogTitle: 'Open or Share PDF',
      });
    } else {
      // Browser fallback
      doc.save(fileName);
    }
  } catch (err) {
    console.error('PDF save error:', err);
    try { doc.save(fileName); } catch(e) {}
    alert('PDF saved! Check your Downloads folder.');
  }
}

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
