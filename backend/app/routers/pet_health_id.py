"""
Pet Health ID Generator + API Routes
=====================================
Format: PET-CITYCODE-PETCODE-000001
Examples: PET-CBE-DOG-000001, PET-BLR-CAT-000003

City codes: 3-letter codes (free-text city name -> 3-letter code, falls back
to the first 3 letters of the city name if it isn't in our table).
Pet type codes: 3-letter codes, see PET_TYPE_CODES below.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.supabase_client import supabase

router = APIRouter()

# ── City codes (extend freely — fallback below covers anything missing) ──
CITY_CODES = {
    "abu road": "ABR", "adilabad": "ADB", "adoni": "AD", "adra": "ADRA",
    "agartala": "AGTL", "agra fort": "AF", "agra": "AGC", "ahmadnagar": "ANG",
    "ahmednagar": "ANG", "ahmedabad": "ADI", "ajmer": "AII", "ajni": "AJNI",
    "akola": "AK", "aligarh": "ALJN", "alipurduar": "APDJ", "allahabad": "ALD",
    "prayagraj": "ALD", "alappuzha": "ALLP", "alnawar": "LWR", "aluva": "AWY",
    "alwar": "AWR", "amalner": "AN", "amb andavra": "AADR", "ambala": "UMB",
    "ambikapur": "ABKP", "amla": "AMLA", "amritsar": "ASR", "anakapalle": "AKP",
    "anand": "ANND", "anand nagar": "ANDN", "anand vihar": "ANVT", "anantapur": "ATP",
    "angul": "ANGL", "annavaram": "ANV", "anuppur": "APR", "ara": "ARA",
    "arrah": "ARA", "arakkonam": "AJJ", "arsikere": "ASK", "asansol": "ASN",
    "aunrihar": "ARJ", "aurangabad": "AWB", "ayodhya": "AY", "azamgarh": "AMH",
    "azimganj": "AZ", "badarpur": "BPB", "badnera": "BD", "bagalkot": "BGK",
    "baghpat road": "BPM", "baidyanathdham": "BDME", "ahmadnagar bakthiyarpur": "BKP",
    "bakthiyarpur": "BKP", "balasore": "BLS", "balaghat": "BTC", "balangir": "BLGR",
    "balugaon": "BALU", "balurghat": "BLGT", "balharshah": "BPQ", "ballia": "BUI",
    "banarhat": "BNQ", "banda": "BNDA", "bandel": "BDC", "bandikui": "BKI",
    "bandra": "BDTS", "bangalore": "SBC", "bengaluru": "SBC", "bangarapet": "BWT",
    "bangriposi": "BGY", "bankura": "BQA", "banmankhi": "BNKI", "bapatla": "BPP",
    "barabanki": "BBK", "barabil": "BBN", "baran": "BAZ", "barauni": "BJU",
    "baraut": "BTU", "barapalli": "BRPL", "barddhaman": "BWN", "bareilly": "BE",
    "bargarh": "BRGA", "barhni": "BNY", "barkakana": "BRKA", "barmer": "BME",
    "barog": "BOF", "barsoi": "BOE", "barwadih": "BRWD", "basar": "BSX",
    "basti": "BST", "bathinda": "BTI", "bayana": "BXN", "beas": "BEAS",
    "beawar": "BER", "belapur": "BAP", "belgaum": "BGM", "bellary": "BAY",
    "bettiah": "BTH", "betul": "BZU", "bhadohi": "BOY", "bhadrak": "BHC",
    "bhagalpur": "BGP", "bhagat ki kothi": "BGKI", "bharatpur": "BTE",
    "bharuch": "BH", "bhatapara": "BYT", "bhatkal": "BTJL", "bhatni": "BTT",
    "bhavnagar": "BVC", "bhawanipatna": "BWPI", "bhilwara": "BHL",
    "bhimavaram": "BVRM", "bhimavaram town": "BVRT", "bhind": "BIX",
    "bhiwani": "BNW", "bhopal": "BPL", "bhubaneswar": "BBS", "bhuj": "BHUJ",
    "bhusaval": "BSL", "bijapur": "BJP", "bijnor": "BJO", "bikaner": "BKN",
    "bilaspur": "BSP", "bina": "BINA", "binnaguri": "BNV", "birur": "RRB",
    "bitragunta": "BTTR", "biyavara rajgarh": "BRRG", "bobbili": "VBL",
    "boinda": "BONA", "baghbahar": "BGBR", "bokaro steel city": "BKSC",
    "bolpur": "BHP", "shantiniketan": "BHP", "borivali": "BVI", "botad": "BTD",
    "budaun": "BEM", "bundi": "BUDI", "burhanpur": "BAU", "burhwal": "BUW",
    "buxar": "BXR", "canacona": "CNO", "chakia": "CAA", "chakki bank": "CHKB",
    "chakradharpur": "CKP", "chalisgaon": "CSN", "champa": "CPH", "chandausi": "CH",
    "chanderiya": "CNA", "chandigarh": "CDG", "chandil": "CNI", "chandrapur": "CD",
    "chandrapura": "CRP", "chaparmukh": "CPK", "chatrapur": "CAP",
    "chengalpattu": "CGL", "chengannur": "CNGR", "chennai": "MAS",
    "chennai egmore": "MS", "chhapra": "CPR", "chapra": "CPR", "chhindwara": "CWA",
    "chidambaram": "CDM", "chikjajur": "JRU", "chiplun": "CHI", "chirala": "CLX",
    "chitrakootdham karvi": "CKTD", "chittaranjan": "CRJ", "chittaurgarh": "COR",
    "chittorgarh": "COR", "chittoor": "CTO", "chopan": "CPU", "chunar": "CAR",
    "churu": "CUR", "coimbatore": "CBE", "coonoor": "ONR", "cuddalore": "CUPJ",
    "cuddapah": "HX", "cuttack": "CTC", "dadar": "DR", "dahanu road": "DRD",
    "dahod": "DHD", "dalgaon": "DLO", "daltonganj": "DTO", "dallirajhara": "DRZ",
    "damoh": "DMO", "danapur": "DNR", "darbhanga": "DBG", "daund": "DD",
    "davangere": "DVG", "dehradun": "DDN", "dehri-on-sone": "DOS", "dehri": "DOS",
    "delhi": "DLI", "new delhi": "NDLS", "delhi cantt": "DEC",
    "delhi sarai rohilla": "DEE", "delhi shahdara": "DSA", "deoria": "DEOS",
    "devlali": "DVL", "dhamangaon": "DMN", "dhanbad": "DHN", "dharmabad": "DAB",
    "dharmanagar": "DMR", "dharmapuri": "DPJ", "dharmavaram": "DMM",
    "dharwad": "DWR", "dhasa": "DAS", "dhaulpur": "DHO", "dhenuanal": "DNUL",
    "dhola": "DLJ", "dhone": "DHNE", "dhrangadhra": "DHG", "dhubri": "DBB",
    "dhuri": "DUI", "dibrugarh": "DBRG", "dibrugarh town": "DBRT", "digha": "DGHA",
    "dildarnagar": "DLN", "dimapur": "DMV", "dindigul": "DG", "dongargarh": "DGG",
    "dornakal": "DKJ", "dungarpur": "DNRP", "durg": "DURG", "durgapur": "DGR",
    "duvvada": "DVD", "dwarka": "DWK", "eluru": "EE", "ernakulam": "ERS",
    "kochi": "ERS", "cochin": "ERS", "ernakulam town": "ERN", "erode": "ED",
    "etawah": "ETW", "faizabad": "FD", "faridabad": "FDB", "farrukhabad": "FBD",
    "fatehabad chand": "FTD", "fatehpur": "FTP", "fatuha": "FUT", "fazilka": "FKA",
    "firozabad": "FZD", "firozpur city": "FZP", "firozpur cantt": "FZR",
    "forbesganj": "FBG", "furkating": "FKG", "gadag": "GDG", "gajraula": "GJL",
    "gandhidham": "GIM", "gandhinagar": "GADJ", "gangapur city": "GGC",
    "garwa road": "GHD", "gaya": "GAYA", "gevra road": "GAD", "ghatsila": "GTS",
    "ghaziabad": "GZB", "goalpara town": "GLPT", "godhra": "GDA",
    "gola gokarannath": "GK", "gonda": "GD", "gondia": "G", "gooty": "GY",
    "gorakhpur": "GKP", "gossaingaon hat": "GOGH", "gudivada": "GDV",
    "gudur": "GDR", "gulbarga": "GR", "guna": "GUNA", "guntakal": "GTL",
    "guntur": "GNT", "gurgaon": "GGN", "gurugram": "GGN", "guruvayur": "GUV",
    "guwahati": "GHY", "gwalior": "GWL", "gyanpur road": "GYN", "habibganj": "HBJ",
    "hajipur": "HJP", "haldia": "HLZ", "haldibari": "HDB", "hamiltonganj": "HOJ",
    "hanumangarh": "HMH", "hapa": "HAPA", "hapur": "HPU", "harda": "HD",
    "haridwar": "HW", "harihar": "HRR", "harpalpur": "HPP", "hasimara": "HSA",
    "hatia": "HTE", "hazur sahib nanded": "NED", "nanded": "NED", "hilsa": "HIL",
    "himmat nagar": "HMT", "hindupur": "HUP", "hingoli": "HNL", "hisar": "HSR",
    "hoshangabad": "HBD", "hospet": "HPT", "hosur": "HSRA", "howbadh": "HBG",
    "howrah": "HWH", "hubli": "UBL", "hyderabad": "HYB", "igatpuri": "IGP",
    "indara": "IAA", "indore": "INDB", "islampur": "IPR", "itarsi": "ET",
    "jabalpur": "JBP", "jagdalpur": "JDB", "jaipur": "JP", "jaisalmer": "JSM",
    "jajpur keonjhar road": "JJKR", "jakhal": "JHL", "jalamb": "JM",
    "jalandhar": "JUC", "jalgaon": "JL", "jalna": "J", "jalpaiguri": "JPG",
    "jamalpur": "JMP", "jammu": "JAT", "jamnagar": "JAM", "janghai": "JNH",
    "jasidih": "JSME", "jaunpur": "JNU", "jaynagar": "JYG", "jetalsar": "JLR",
    "jhajha": "JAJ", "jhansi": "JHS", "jhargram": "JGM", "jharsuguda": "JSG",
    "jind": "JIND", "jodhpur": "JU", "jogbani": "JBN", "jolarpettai": "JTJ",
    "jorhat": "JT", "junagadh": "JND", "kacheguda": "KCG", "kakinada": "COA",
    "kalchini": "KCF", "kalka": "KLK", "kalol": "KLL", "kalyan": "KYN",
    "kamakhya": "KYQ", "kanchipuram": "CJ", "kandhla": "KQL",
    "kanniyakumari": "CAPE", "kannur": "CAN", "kanpur": "CNB",
    "kanpur anwarganj": "CPA", "kaptanganj": "CPJ", "karaikal": "KIK",
    "karaikkudi": "KKDI", "karimganj": "KXJ", "karnal": "KUN", "karur": "KRR",
    "karwar": "KAWR", "kasaragod": "KGQ", "kasganj": "KSJ", "kathgodam": "KGM",
    "katihar": "KIR", "katni": "KTE", "katni murwara": "KMZ", "katpadi": "KPD",
    "katwa": "KWAE", "kazipet": "KZJ", "kesinga": "KSNG", "kendujhargarh": "KDJR",
    "khagaria": "KGG", "khalilabad": "KLD", "khammam": "KMT", "khandwa": "KNW",
    "kharagpur": "KGP", "khekra": "KEX", "khurda road": "KUR", "khurja": "KRJ",
    "kishanganj": "KNE", "kishangarh": "KSG", "kiul": "KIUL", "kochuveli": "KCVL",
    "kodaikanal road": "KQN", "kolkata": "KOAA", "kollam": "QLN",
    "kopergaon": "KPG", "koraput": "KRPU", "korba": "KRBA", "kota": "KOTA",
    "kotdwara": "KTW", "kot kapura": "KKP", "kottayam": "KTYM", "kozhikode": "CLT",
    "calicut": "CLT", "krishnanagar city": "KNJ", "krishnarajapuram": "KJM",
    "kumarghat": "KUGT", "kumbakonam": "KMU", "kundapura": "KUDA",
    "kurduwadi": "KWV", "kurnool town": "KRNT", "kurukshetra": "KKDE",
    "lakhimpur": "LMP", "laksar": "LRJ", "lalgarh": "LGH", "lalgola": "LGL",
    "lalitpur": "LAR", "lalkuan": "LKU", "latur": "LUR", "ledo": "LEDO",
    "loharu": "LHU", "lokmanya tilak": "LTT", "lonavla": "LNL", "londa": "LD",
    "lower halflong": "LFG", "lucknow": "LKO", "ludhiana": "LDH",
    "lumding": "LMG", "luni": "LUNI", "machilipatnam": "MTM", "madarihat": "MDT",
    "maddur": "MAD", "madgaon": "MAO", "goa": "MAO", "madhubani": "MBI",
    "madhupur": "MDP", "madurai": "MDU", "mahasamund": "MSMD",
    "mahbubnagar": "MBNR", "mahuva": "MHV", "muniguda": "MNGD",
    "mahesana": "MSH", "mahoba": "MBA", "mailani": "MLN", "maksi": "MKC",
    "malda town": "MLDT", "manamadurai": "MNM", "manduadih": "MUV",
    "mangalore central": "MAQ", "mangalore": "MAJN", "manikpur": "MKP",
    "mankapur": "MUR", "manmad": "MMR", "mannargudi": "MQ", "mansi": "MNE",
    "manu": "MANU", "mariani": "MXN", "marwar": "MJ", "mathura": "MTJ",
    "mau": "MAU", "mayiladuturai": "MV", "meerut": "MTC", "merta road": "MTD",
    "mettupalayam": "MTP", "midnapore": "MDN", "miraj": "MRJ",
    "miryalaguda": "MRGA", "mirzapur": "MZP", "moga": "MOF", "mokama": "MKA",
    "moradabad": "MB", "motihari": "MKI", "mudkhed": "MUE", "mughalsarai": "MGS",
    "mumbai": "CSTM", "mumbai central": "BCT", "muri": "MURI",
    "murkeongselek": "MZS", "murtajapur": "MZR", "muzaffar nagar": "MOZ",
    "muzaffarnagar": "MOZ", "muzaffarpur": "MFP", "mysore": "MYS",
    "mysuru": "MYS", "nabadwipdham": "NDAE", "nadiad": "ND", "nadikudi": "NDKD",
    "nagappattinam": "NGT", "nagarkata": "NKB", "nagarsol": "NSL",
    "nagbhir": "NAB", "nagda": "NAD", "nagercoil": "NCJ", "nagore": "NCR",
    "nagpur": "NGP", "nainpur": "NIR", "najibabad": "NBD", "nalanda": "NLD",
    "nalgonda": "NLDA", "namakkal": "NMKL", "nandalur": "NRE", "nandgaon": "NGN",
    "nandurbar": "NDB", "nandyal": "NDL", "nangal dam": "NLDM",
    "narkatiaganj": "NKE", "narasapur": "NS", "narsingpur": "NU",
    "narwana": "NRW", "nasik": "NK", "nashik": "NK", "naugarh": "NUH",
    "nellore": "NLR", "gomoh": "GMO", "new alipurduar": "NOQ",
    "new bongaigaon": "NBQ", "new coochbehar": "NCB", "new farakka": "NFK",
    "new jalpaiguri": "NJP", "newmal": "NMZ", "new tinsukia": "NTSK",
    "nidadavolu": "NDD", "nidamangalam": "NMJ", "nidubrolu": "NDO",
    "nimach": "NMH", "neemuch": "NMH", "nizamabad": "NZB", "nizamuddin": "NZM",
    "noli": "NOLI", "north lakhimpur": "NLP", "odlabari": "ODB", "okha": "OKHA",
    "ongole": "OGL", "orai": "ORAI", "pachora": "PC", "palani": "PLNI",
    "palanpur": "PNU", "palasa": "PSA", "palakkad": "PGT", "palghat": "PGT",
    "palakkad town": "PGTN", "paliakalan": "PLK", "pandharapur": "PVR",
    "panipat": "PNP", "paradeep": "PRDP", "parasnath": "PNME", "panvel": "PNVL",
    "parbhani": "PBN", "parvatipuram town": "PVPT", "pathankot": "PTK",
    "patiala": "PTA", "patna": "PNBE", "patna sahib": "PNC", "phalodi": "PLC",
    "phaphamau": "PFM", "phulera": "FL", "pilibhit": "PBE", "pipariya": "PPI",
    "podanur": "PTJ", "porbandar": "PBR", "pratapgarh": "PBH",
    "puducherry": "PDY", "pondicherry": "PDY", "pudukkottai": "PDKT",
    "pulgaon": "PLO", "pune": "PUNE", "puranpur": "PP", "puri": "PURI",
    "purna": "PAU", "purnia": "PRNA", "purulia": "PRR", "radhikapur": "RDP",
    "rae bareli": "RBL", "raichur": "RC", "raigarh": "RIG", "raipur": "R",
    "rajahmundry": "RJY", "raja-ka-sahaspur": "RJK", "raja-ki-mandi": "RKM",
    "rajendranagar": "RJQ", "rajgir": "RGD", "rajkot": "RJT",
    "rajnandgaon": "RJN", "rajpura": "RPJ", "ramagundam": "RDM",
    "ramanathapuram": "RMD", "rameswaram": "RMM", "ramnagar": "RMR",
    "rampur": "RMU", "rampurhat": "RPH", "ranaghat": "RHA", "ranchi": "RNC",
    "rangapara north": "RPAN", "rangiya": "RNY", "raninagar": "ROJ",
    "ratangarh": "RTGH", "ratlam": "RTM", "ratnagiri": "RN", "rawatganj": "RJ",
    "raxaul": "RXL", "rayagada": "RGDA", "renigunta": "RU", "rewa": "REWA",
    "rewari": "RE", "ringus": "RGS", "rohtak": "ROK", "roorkee": "RK",
    "rourkela": "ROU", "sadulpur": "SDLP", "sagar": "SRF", "sagauli": "SGL",
    "sagour": "SGO", "saharanpur": "SRE", "saharsa": "SHC", "sahibganj": "SBG",
    "sai nagar shirdi": "SNSI", "shirdi": "SNSI", "salem": "SA",
    "salempur": "SRU", "samalkot": "SLO", "samastipur": "SPJ",
    "sambalpur": "SBP", "sambalpur city": "SBPY", "samdari": "SMR",
    "samuktala road": "AMTA", "sangli": "SLI", "santragachi": "SRC",
    "sarnath": "SRNT", "satara": "STR", "satna": "STA", "sattenapalle": "SAP",
    "sawaimadhopur": "SWM", "sawai madhopur": "SWM", "sawantwadi road": "SWV",
    "sealdah": "SDAH", "secunderabad": "SC", "sengottai": "SCT",
    "sensoa": "SCF", "sewagram": "SEGM", "shahabad": "SDB", "shahganj": "SHG",
    "shahjahanpur": "SPN", "shahpur patoree": "SPP", "shaktinagar": "SKTN",
    "shalimar": "SHM", "shamgarh": "SGZ", "shamli": "SMQL",
    "shikohabad": "SKB", "shimla": "SML", "shimoga town": "SMET",
    "shivpuri": "SVPI", "shoranur": "SRR", "shri mahabirji": "SMBJ",
    "sihor gujarat": "SOJN", "sikar": "SIKR", "silchar": "SCL",
    "silghat": "SHTT", "siliguri": "SGUJ", "siliguri town": "SGUT",
    "simaluguri": "SLGR", "singrauli": "SGRL", "sirpur kagaznagar": "SKZR",
    "sirsa": "SSA", "siswa bazar": "SBZ", "sitamarhi": "SMI",
    "sitapur city": "SPC", "sitapur cantt": "SCC", "siuri": "SURI",
    "siwan": "SV", "sojat road": "SOD", "solan": "SOL", "solapur": "SUR",
    "somnath": "SMNH", "sompeta": "SPT", "sonpur": "SEE",
    "chhatrapati shahu maharaj": "CSMT", "sri dungargarh": "SDGH",
    "sriganga nagar": "SGNR", "sriganganagar": "SGNR", "srikakulam road": "CHE",
    "sri sathyasai prashanti nilayam": "SSPN", "sujangarh": "SUJH",
    "sultanpur": "SLN", "surat": "ST", "suratgarh": "SOG", "surathkal": "SL",
    "surendra nagar": "SUNR", "surendranagar": "SUNR",
    "tadepalligudem": "TDD", "tambaram": "TBM", "tatanagar": "TATA",
    "jamshedpur": "TATA", "thalassery": "TLY", "tenali": "TEL",
    "tenkasi": "TS", "tezpur": "TZTB", "thanjavur": "TJ", "thiruvarur": "TVR",
    "tiruchirappalli": "TPJ", "trichy": "TPJ", "tiruchendur": "TCN",
    "tirunelveli": "TEN", "tirupati": "TPTY", "tiruppur": "TUP",
    "tirur": "TIR", "titlagarh": "TIG", "thrissur": "TCR", "trichur": "TCR",
    "thiruvananthapuram": "TVC", "trivandrum": "TVC",
    "tiruvannamalai": "TNM", "tumsar road": "TMR", "tundla": "TDL",
    "tuni": "TUNI", "tuticorin": "TN", "udaipur": "UDZ", "udhampur": "UHP",
    "udhna": "UDN", "udupi": "UD", "ujjain": "UJN", "una": "UNA",
    "unchahar": "UCR", "unnao": "ON", "vadakara": "BDJ", "vadodara": "BRC",
    "valsad": "BL", "vanchi maniyachchi": "MEJ", "varanasi": "BSB",
    "varkala": "VAK", "vasai road": "BSR", "vasco-da-gama": "VSG",
    "velankanni": "VLKN", "veraval": "VRL", "vidisha": "BHS",
    "vijayawada": "BZA", "villupuram": "VM", "viramgam": "VG",
    "virudunagar": "VPT", "visakhapatnam": "VSKP", "vizianagaram": "VZM",
    "vriddhachalam": "VRI", "wadi": "WADI", "wankaner": "WKR",
    "warangal": "WL", "wardha": "WR", "yesvantpur": "YPR", "zafarabad": "ZBD",
}
# ── Pet type codes — 3-letter, as agreed in the team discussion ──
PET_TYPE_CODES = {
    "dog": "DOG",
    "cat": "CAT",
    "bird": "BRD",
    "rabbit": "RBT",
    "fish": "FSH",
    "turtle": "TRL",
    "hamster": "HMS",
    "horse": "HRS",
    "guinea pig": "GPG",
    "guineapig": "GPG",
    "ferret": "FRT",
    "hedgehog": "HDG",
    "parrot": "PRT",
    "mouse": "MOS",
    "rat": "RAT",
    "snake": "SNK",
    "lizard": "LZD",
    "tortoise": "TOR",
    "duck": "DCK",
    "goat": "GOT",
    "cow": "COW",
    "pig": "PIG",
    "chicken": "CHK",
    "other": "OTH",
    "unknown": "OTH",
}


def get_city_code(city_name: str) -> str:
    if not city_name:
        return "UNK"
    key = city_name.lower().strip()
    if key in CITY_CODES:
        return CITY_CODES[key]
    # Fallback: first 3 letters of the city name, uppercased, padded if short
    fallback = "".join(ch for ch in city_name.upper() if ch.isalpha())[:3]
    return fallback.ljust(3, "X") if fallback else "UNK"


def get_pet_type_code(pet_type: str) -> str:
    if not pet_type:
        return "OTH"
    key = pet_type.lower().strip()
    if key in PET_TYPE_CODES:
        return PET_TYPE_CODES[key]
    fallback = "".join(ch for ch in pet_type.upper() if ch.isalpha())[:3]
    return fallback.ljust(3, "X") if fallback else "OTH"


def get_next_sequence(city_code: str, pet_type_code: str) -> int:
    prefix = f"PET-{city_code}-{pet_type_code}-"
    try:
        result = (
            supabase.table("pet_profiles")
            .select("petolife_id")
            .like("petolife_id", f"{prefix}%")
            .order("petolife_id", desc=True)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            last_id = result.data[0]["petolife_id"]
            last_seq = int(last_id.split("-")[-1])
            return last_seq + 1
        return 1
    except Exception as e:
        print(f"[PetHealthID] Sequence error: {e}")
        return 1


def generate_pet_health_id(city_name: str, pet_type: str) -> str:
    city_code = get_city_code(city_name)
    pet_type_code = get_pet_type_code(pet_type)
    sequence = get_next_sequence(city_code, pet_type_code)
    health_id = f"PET-{city_code}-{pet_type_code}-{sequence:06d}"
    print(f"[PetHealthID] Generated: {health_id}")
    return health_id


def store_pet_health_id(health_id: str, pet_profile_id: str) -> bool:
    try:
        # health_id is already saved directly inside pet_profiles.petolife_id
        print(f"[PetHealthID] ID {health_id} associated with profile {pet_profile_id}")
        return True
    except Exception as e:
        print(f"[PetHealthID] Note: {e}")
        return False


def generate_and_store(city_name: str, pet_type: str, pet_profile_id: str) -> str:
    health_id = generate_pet_health_id(city_name, pet_type)
    store_pet_health_id(health_id, pet_profile_id)  # non-critical, never blocks
    try:
        supabase.table("pet_profiles").update({
            "petolife_id": health_id
        }).eq("id", pet_profile_id).execute()
    except Exception as e:
        print(f"[PetHealthID] Warning: {e}")
    return health_id


# ============ API ROUTES ============

from app.utils.auth import get_current_user_id, get_user_supabase
from fastapi import Depends
from supabase import Client

class GenerateHealthIdRequest(BaseModel):
    city: str
    pet_type: str
    pet_profile_id: Optional[str] = None


@router.post("/generate")
async def generate_health_id(
    body: GenerateHealthIdRequest,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    try:
        city = body.city.strip()
        pet_type = body.pet_type.strip()

        if not city:
            raise HTTPException(status_code=400, detail="City is required")
        if not pet_type:
            raise HTTPException(status_code=400, detail="Pet type is required")

        if body.pet_profile_id:
            # Check ownership before assigning
            pet = supabase.table("pet_profiles").select("user_id").eq("id", body.pet_profile_id).execute()
            if not pet.data or pet.data[0].get("user_id") != auth_user_id:
                raise HTTPException(status_code=403, detail="Not authorized to modify this pet profile")

            health_id = generate_and_store(city, pet_type, body.pet_profile_id)
            return {
                "message": "Health ID generated and saved",
                "health_id": health_id,
                "city": city,
                "pet_type": pet_type,
                "saved": True,
            }
        else:
            health_id = generate_pet_health_id(city, pet_type)
            return {
                "message": "Health ID generated (not saved - no pet_profile_id)",
                "health_id": health_id,
                "city": city,
                "pet_type": pet_type,
                "saved": False,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/preview/{city}/{pet_type}")
async def preview_health_id(city: str, pet_type: str):
    try:
        health_id = generate_pet_health_id(city, pet_type)
        return {
            "preview": health_id,
            "city": city,
            "pet_type": pet_type,
            "note": "This is a preview - not saved yet",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
