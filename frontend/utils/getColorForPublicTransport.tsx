export const getColorForPublicTransport = (legType: string, serviceName: string): string => {
  switch (legType) {
    case "BUS":
      return "#4ABF50";
    case "NUS_BUS":
      switch (serviceName) {
        case "D1":
          return "#CD82E2";
        case "D2":
          return "#6F1B6F";
        case "A1":
          return "#FF0000";
        case "A2":
          return "#E4CE0C";
        case "BTC":
          return "#EE8136";
        case "K":
          return "#345A9B";
        case "L":
          return "#BFBFBF";
        case "E":
          return "#00B050";
        default:
          return "#4ABF50"; // PUBLIC BUSES
      }
    case "SUBWAY":
      switch (serviceName) {
        case "NS":
          return "#E22726";
        case "DT":
          return "#005EA8";
        case "EW":
          return "#00964C";
        case "CG":
          return "#00964C";
        case "NE":
          return "#8F4199";
        case "CC":
          return "#F99D26";
        case "TE":
          return "#9D5B26";
        default:
          return "black";
      }
    case "TRAM":
      return "#718573";
    default:
      return "green"; // Default color for unknown types
  }
};
