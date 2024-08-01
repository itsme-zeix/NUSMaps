const codeNameFullNameDict = [
  { value: "All", label: "All" },
  { value: "COM3", label: "COM 3" },
  { value: "TCOMS-OPP", label: "Opp TCOMS" },
  { value: "PGP", label: "Prince George's Park" },
  { value: "KR-MRT", label: "Kent Ridge MRT" },
  { value: "LT27", label: "LT 27" },
  { value: "UHALL", label: "University Hall" },
  { value: "UHC-OPP", label: "Opp University Health Centre" },
  { value: "MUSEUM", label: "Museum" },
  { value: "UTOWN", label: "University Town" },
  { value: "UHC", label: "University Health Centre" },
  { value: "UHALL-OPP", label: "Opp University Hall" },
  { value: "S17", label: "S17" },
  { value: "KR-MRT-OPP", label: "Opp Kent Ridge MRT" },
  { value: "PGPR", label: "Prince George's Park Foyer" },
  { value: "TCOMS", label: "TCOMS" },
  { value: "HSSML-OPP", label: "Opp HSSML" },
  { value: "NUSS-OPP", label: "Opp NUSS" },
  { value: "LT13-OPP", label: "Ventus" },
  { value: "IT", label: "Information Technology" },
  { value: "YIH-OPP", label: "Opp Yusof Ishak House" },
  { value: "YIH", label: "Yusof Ishak House" },
  { value: "CLB", label: "Central Library" },
  { value: "LT13", label: "LT13" },
  { value: "AS5", label: "AS5" },
  { value: "BIZ2", label: "BIZ 2" },
  { value: "KRB", label: "Kent Ridge Bus Terminal" },
  { value: "SDE3-OPP", label: "Opp SDE 3" },
  { value: "JP-SCH-16151", label: "The Japanese Primary School" },
  { value: "KV", label: "Kent Vale" },
  { value: "OTH", label: "Oei Tiong Ham Building" },
  { value: "BG-MRT", label: "Botanic Gardens MRT (PUDO)" },
  { value: "CG", label: "College Green" },
  { value: "RAFFLES", label: "Raffles Hall" },
];

export const mapNUSCodeNametoFullName = (busStopName: string) => {
  if (busStopName.startsWith("NUSSTOP_")) {
    const code = busStopName.replace("NUSSTOP_", "");
    const fullNameEntry = codeNameFullNameDict.find((entry) => entry.value === code);
    return fullNameEntry ? fullNameEntry.label : busStopName;
  }
  return busStopName;
};
