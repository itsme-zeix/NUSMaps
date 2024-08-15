// Function to determine the color based on bus stop name
export default function mapBusServiceColour(busService: string) {
  switch (busService) {
    case "A1":
      return "#FF0000"; // Red
    case "A2":
      return "#E4CE0C"; // Yellow
    case "D1":
      return "#CD82E2"; // Purple
    case "D2":
      return "#6F1B6F"; // Dark Purple
    case "K":
      return "#345A9B"; // Blue
    case "E":
      return "#00B050"; // Green
    case "BTC":
      return "#EE8136"; // Orange
    case "L":
      return "#BFBFBF"; // Gray
    case "E":
      return "#00B050"; // Green
    default:
      return "green"; // Default color for other bus stops
  }
}
