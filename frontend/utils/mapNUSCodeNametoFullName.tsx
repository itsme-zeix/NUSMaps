const codeNameFullNameDict = {
  COM3: "COM 3",
  "TCOMS-OPP": "Opp TCOMS",
  PGP: "Prince George's Park",
  "KR-MRT": "Kent Ridge MRT",
  LT27: "LT 27",
  UHALL: "University Hall",
  "UHC-OPP": "Opp University Health Centre",
  MUSEUM: "Museum",
  UTOWN: "University Town",
  UHC: "University Health Centre",
  "UHALL-OPP": "Opp University Hall",
  S17: "S17",
  "KR-MRT-OPP": "Opp Kent Ridge MRT",
  PGPR: "Prince George's Park Foyer",
  TCOMS: "TCOMS",
  "HSSML-OPP": "Opp HSSML",
  "NUSS-OPP": "Opp NUSS",
  "LT13-OPP": "Ventus",
  IT: "Information Technology",
  "YIH-OPP": "Opp Yusof Ishak House",
  YIH: "Yusof Ishak House",
  CLB: "Central Library",
  LT13: "LT13",
  AS5: "AS5",
  BIZ2: "BIZ 2",
  KRB: "Kent Ridge Bus Terminal",
  "SDE3-OPP": "Opp SDE 3",
  "JP-SCH-16151": "The Japanese Primary School",
  KV: "Kent Vale",
  OTH: "Oei Tiong Ham Building",
  "BG-MRT": "Botanic Gardens MRT (PUDO)",
  CG: "College Green",
  RAFFLES: "Raffles Hall",
};

export const mapNUSCodeNametoFullName = (busStopName: string) => {
  console.log(`Original busStopName: "${busStopName}"`);

  if (busStopName.startsWith("NUSSTOP_")) {
    const codeName = busStopName.replace("NUSSTOP_", "").trim();
    const fullName = codeNameFullNameDict[codeName] || codeName;
    return fullName;
  }

  return busStopName;
};

// INTERFACES
interface BusService {
  busNumber: string;
  timings: string[]; // ISO format
}
interface BusStop {
  busStopName: string;
  busStopId: string;
  distanceAway: string;
  savedBuses: BusService[];
  latitude: number;
  longitude: number;
  isFavourited: boolean;
}
