# Provider address research evidence — Aug 18, 2026

## High-confidence address sources

| Provider | Address evidence | Source |
|---|---|---|
| Aduloju Memorial Hospital, Akungba | 70, Iwaro Road, Akungba Akoko, Ondo State | https://adulojuhospital.com/contact-us/ |
| Akintan Memorial Hospital | No. 13 Ilemobayo Street, beside Osukoti Police Station, off Oke-Ijebu, Akure; another source cites No. 8 Adegbola Street, Oshukoti Layout | https://www.goafricaonline.com/ng/966003-akintan-memorial-hospital ; https://m.wikidata.org/wiki/Q133339142 |
| Bolcom Hospital | 5 Moses Orimolade Street, Ijapo Estate, Akure, Ondo State | https://bolcomhospital.com/hospital-in-akure |
| Betak Pharmacy | CE/K9A, Hospital Road, Ilepa, Ikare-Akoko, Ondo State | https://www.goafricaonline.com/ng/1265215-betak-pharmacy ; https://telemed.com.ng/pharmacies/ |
| Kings Medi-Clinic | 66MC+QF8, Oda Road, Akure, Ondo State | https://m.wikidata.org/wiki/Q133309224 ; https://ng.polomap.com/akure/8675 |
| His Grace Pharmacy | 1 Aule Road, off Oyemekun Road, Akure, Ondo State | https://www.medpages.info/sf/index.php?page=organisation&orgcode=371650 ; https://www.facebook.com/Hisgracepharma/ |
| Hugeworth Pharmacy | Oda Road, Akure, with Igbatoro branch also reported | https://hugeworthpharmacy.com/ |
| Mercyland Medical Centre | 177 Ore-Ondo Road, Ondo, Ondo State; registered address 3 Okeayo Street also appears | https://www.places.com.ng/mercyland-medical-centre/ ; https://b2bhint.com/en/company/ng/mercyland-medical-centre-nigeria-limited--RC-324310 |
| Moladent Dental Clinic | Plot 7, Block 33, Aule Road, Road C5, Akure, Ondo State | https://me.maptons.com/p/10241966654 |
| Netcare Multispecialty Hospital | 10 Owo Avenue, opposite Royal Birds Hotel, Ijapo, Akure, Ondo State | https://netcarehospital.ng/contact/ |
| Pima Hospital, Ore | 63 Okitipupa Road, Ore, Ondo State; another source says Orisumbare, Odigbo | https://www.finelib.com/listing/Pima-Hospital/59233/ ; https://thehospitalbook.com/pima-hospital/ |
| General Hospital Igbokoda | Omonira Street, Igbokoda, Ilaje, Ondo State | https://thehospitalbook.com/general-hospital-igbokoda/ |
| General Hospital Iju/Itaogbolu | Akure/Ado Road, Iju/Itaogbolu, Ayetoro, Akure North, Ondo State | https://thehospitalbook.com/general-hospital-iju-itaogbolu/ |
| General Hospital Ore | Ore 1, Odigbo, Ondo State | https://thehospitalbook.com/ore-general-hospital/ |
| General Hospital Owo | Isaipen, Owo, Ondo State; St Catherine Road also appears in another directory | https://thehospitalbook.com/general-hospital-owo/ ; https://www.medpages.info/sf/index.php?page=organisation&orgcode=339877 |
| General Hospital Igbotako | Igbotako 1, 350109, Ilado, Nigeria / Igbotako 2, Okitipupa | https://ng.worldorgs.com/catalog/ilado/hospital/generalhospitaligbotako ; https://thehospitalbook.com/hospital/gastroenterology/ondo-gastroenterology/ |
| General Hospital Ile-Oluji | Ile-Oluji 4, Ile-Oluji/Okeigbo, Ondo State | https://thehospitalbook.com/general-hospital-ile-oluji/ |
| Arogbo Primary Health Centre | Arogbo 1, Ese Odo, Ondo State | https://thehospitalbook.com/hospital/public/ondo/page/10/ |
| Sijuade Specialist Hospital | Sijuade Basegun Hospital Road, Akure; an external listing also refers to Atosin Road | https://www.aiicomultishield.com/index.php/hospital-access/standard-hospital-access ; https://is.maptons.com/p/10188632315 |
| St. Michael Hospital | 40 Danjuma Street, Akure, Ondo State | https://ng.linkedin.com/company/st-michael-s-hospital-nigeria |
| Pima Hospital | 63 Okitipupa Road, Ore, Ondo State | https://www.finelib.com/listing/Pima-Hospital/59233/ |
| General Hospital Bolorunduro | Beside St. Peters Primary School, Bolorunduro, Ondo State | https://listarn.com/l/general-hospital--bolorunduro/68076a7c28d4f543d8c835d3 |
| Primary Health Clinic Danjuma | Danjuma, Akure, Ondo State | https://www.ondostatemoi.gov.ng/ (provider listing cited through search results) |

## Important coordinate integrity finding

The live database contains repeated coordinate pairs shared by multiple unrelated providers, including `7.257,5.205` shared by 34 providers and `7.1,4.84` shared by 9 providers. These are generic city/LGA centroids, not facility-specific pins. They have been cleared from active providers so the frontend’s coordinate-only navigation guard fails safely rather than routing users to a nearby or unrelated facility.

## Research limitation

Many public directory pages provide the facility locality but not a reliable exact GPS pin. These addresses are safe to display as physical locality information, but their navigation buttons must remain disabled until an exact facility coordinate is independently verified. No coordinates should be fabricated from an LGA centroid.
