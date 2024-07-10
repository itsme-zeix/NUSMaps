const getLuminance = (rgbColor: string) => {
  const color = rgbColor.substring(1); // Remove the '#' character
  const rgb = parseInt(color, 16); // Convert to an integer
  const r = (rgb >> 16) & 0xff; // Extract the red component
  const g = (rgb >> 8) & 0xff; // Extract the green component
  const b = (rgb >> 0) & 0xff; // Extract the blue component

  // Calculate luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance;
};

export const determineFontColor = (bgColor: string) => {
  const luminance = getLuminance(bgColor);
  return luminance > 160 ? "black" : "white";
};
