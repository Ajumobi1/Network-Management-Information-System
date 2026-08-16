import json
import re
from pathlib import Path
from difflib import SequenceMatcher

def normalize(text):
    if not text: return ""
    text = re.sub(r'\.xlsx$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[,\.\(\)]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip().upper()
    return text

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

providers_file = Path('/home/ubuntu/.mcp/tool-results/2026-08-15_22-14-31.680275649_supabase_execute_sql_652211c1.json')
with open(providers_file, 'r') as f:
    data = json.load(f)
    result_text = data['result']
    json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
    providers = json.loads(json_match.group(0))

filenames = [
    "ADULOJUMEMORIALHOSPITAL,AKUNGBA.xlsx",
    "DIAMONDMEDICALCLINIC,IKAREAKOKO.xlsx",
    "PRIMARYHEALTHCENTREISHAKUNMI.xlsx",
    "STATESPECIALISTHOSPITAL,IKARE.xlsx",
    "TOTALCAREMEDICALCLINIC,UGBEAKOKO.xlsx",
    "GENERALHOSPITALIRUNAKOKO.xlsx",
    "PRIMARYHEALTHCENTREARIGIDI.xlsx",
    "RUFUSGIWAMEMORIALHOSPITALOKEAGBE.xlsx",
    "GENERALHOSPITALIPE-AKOKO.xlsx",
    "PRIMARYHEALTHCENTREISUAOKE.xlsx",
    "GENERALHOSPITALIWAROOKA.xlsx",
    "PRIMARYHEALTHCENTREOWASE.xlsx",
    "DEBORAHMULTISPECIALISTHOSPITALANDDIAGNOSTICCENTRE.xlsx",
    "ETONCLINIC&MATERNITYOBA-ILE.xlsx",
    "GENERALHOSPITALIJUITAOGBOLU.xlsx",
    "PRIMARYHEALTHCLINICIGOBA.xlsx",
    "AKINTANMEMORIALHOSPITAL(CLINIC).xlsx",
    "AKUREANGLICANDIOC.MED.CENTERANGLICANCOMMUNITY,AKURE.xlsx",
    "BOLCOMHOSPITAL.xlsx",
    "CHRISTBAYCONS.CLINICFUTASOUTHGATEAKURE.xlsx",
    "COLLEGEOFHEALTHCLINICODARDAKURE.xlsx",
    "COMPREHENSIVEHEALTHCENTREARAKALEAKURE.xlsx",
    "DELIGHTSPECIALISTCLINICSANDMATERNITY.xlsx",
    "FUTATEACHINGHOSPITAL,AKURE.xlsx",
    "J&EFATUNLAHOSPITALOKEAROTITUNAKURE.xlsx",
    "KINGSROYALMEDICLINICILEKUNODAROADAKURE.xlsx",
    "MAOHOSPITALSGBANGBALOGUNAKURE.xlsx",
    "MERCYSPECIALISTHOSPITALGBOGISTRAKURE.xlsx",
    "NETCAREMULTISPECIALTYHOSPITAL,AKURE.xlsx",
    "NEWDAYMEDICALCENTERIJAPOESTATEAKURE.xlsx",
    "OMOLOLUHOSPITALOKEIJEBUAKURE.xlsx",
    "ONDOSTATEREFRENCEHOSPITALIGBATOROROAD,AKURE.xlsx",
    "POLICEMEDICALSERVICESALAGBAKAAKURE.xlsx",
    "PRIMARYHEALTHCLINICDANJUMAAKURE.xlsx",
    "SCKYEHOSPITALOBAADESIDARDAKURE.xlsx",
    "SIJUWADEHOSPITAL,AKURE.xlsx",
    "SIMLONHOSPITALOFFILESHARDAKURE.xlsx",
    "ST.MICHAELSHOSP.ARAKALEAKURE.xlsx",
    "STATESPECIALISTHOSPITALOKE-ARO,AKURE.xlsx",
    "COMPREHENSIVEHEALTHCENTREAROGBO.xlsx",
    "GENERALHOSPITALIGBEKEBO.xlsx",
    "TOPTARIMEDICALSAGADAGBA-OBON.xlsx",
    "GENERALHOSPITALIDANRE.xlsx",
    "HOPEHOSPITAL&MATERNITY,PALACEROADIDANRE.xlsx",
    "PRIMARYHEALTHCENTREOWENA.xlsx",
    "GENERALHOSPITALIGBARA-OKE.xlsx",
    "PRIMARYHEALTHCENTREIJARE.xlsx",
    "PRIMARYHEALTHCENTREILARAII.xlsx",
    "GENERALHOSPITALIGBOKODA.xlsx",
    "PRIMARYHEALTHCENTREZIONPEPE.xlsx",
    "REDEEMERHOSPITALIGBOKODA.xlsx",
    "GENERALHOSPITAL,ILE-OLUJI.xlsx",
    "PRIMARYHEALTHCENTREILEOLUJI.xlsx",
    "PRIMARYHEALTHCENTREOKEIGBO.xlsx",
    "GENERALHOSPITALODE-IRELE.xlsx",
    "PRIMARYHEALTHCENTREAJAGBA1.xlsx",
    "GENERALHOSPITALARAROMI-OBU.xlsx",
    "GENERALHOSPITAL,ORE.xlsx",
    "PEACEMED.CLINIC,ORE.xlsx",
    "PIMAHOSPITALORE.xlsx",
    "PRIMARYHEALTHCENTREPANAPANAORE.xlsx",
    "GENERALHOSPITALIGBOTAKO.xlsx",
    "PRIMARYHEALTHCENTREODEAYE1.xlsx",
    "STATESPECIALISTHOSPITAL,OKITIPUPA.xlsx",
    "WESTPOINTHOSPITALOKITIPUPA.xlsx",
    "GENERALHOSPITALBOLORUNDURO.xlsx",
    "PRIMARYHEALTHCENTREOWENABRIDGE.xlsx",
    "GOODIESCLINIC&MATIFERDONDO.xlsx",
    "MERCYLANDHOSPITALADEYEMIRDONDO.xlsx",
    "PRIMARYHEALTHCENTREMAROKO.xlsx",
    "STATESPECIALISTHOSPITAL,ONDO.xlsx",
    "UNIMEDTHCLAJEROAD,ONDO.xlsx",
    "GENERALHOSPITALIDO-ANI.xlsx",
    "GENERALHOSPITALIFON.xlsx",
    "PRIMARYHEALTHCLINICOKELUSECOTTAGE.xlsx",
    "FEDERALMEDICALCENTREOWO.xlsx",
    "GENERALHOSPITAL,OWO.xlsx",
    "PRIMARYHEALTHCENTREEMUREILE.xlsx",
    "PRIMARYHEALTHCENTREIPELE.xlsx"
]

aliases = []
for filename in filenames:
    norm_filename = normalize(filename)
    best_match = None
    max_score = 0
    
    for p in providers:
        p_name = normalize(p['provider_name'])
        score = similarity(norm_filename, p_name)
        if score > max_score:
            max_score = score
            best_match = p
            
    if best_match and max_score > 0.6:
        if normalize(best_match['provider_name']) != norm_filename:
            aliases.append({
                'provider_id': best_match['id'],
                'alias_name': norm_filename,
                'provider_name': best_match['provider_name']
            })

sql_parts = []
for a in aliases:
    clean_alias = a['alias_name'].replace("'", "''")
    norm_alias = re.sub(r'[^a-z0-9]', '', clean_alias.lower())
    sql_parts.append(f"INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source, confidence, active) VALUES ('{a['provider_id']}', '{clean_alias}', '{norm_alias}', 'workbook_import', 1.0, true) ON CONFLICT ON CONSTRAINT provider_alias_unique DO NOTHING;")

print(f"Generated {len(aliases)} aliases.")
with open('/home/ubuntu/nmis-frontend-authoritative/insert_aliases.sql', 'w') as f:
    f.write("\n".join(sql_parts))
