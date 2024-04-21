export function darken(color: string, factor: number) {
  // Ensure the factor is within 0 to 1 range
  factor = Math.max(0, Math.min(1, factor));

  // Validate the hex color format and remove the leading '#' if it's there
  if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) {
    throw new Error("Invalid HEX color format");
  }
  color = color.replace(/^#/, "");

  // Parse the hex string into integers using parseInt
  let r = parseInt(color.substr(0, 2), 16);
  let g = parseInt(color.substr(2, 2), 16);
  let b = parseInt(color.substr(4, 2), 16);

  // Darken each color component by the factor
  r = Math.floor(r * (1 - factor));
  g = Math.floor(g * (1 - factor));
  b = Math.floor(b * (1 - factor));

  // Use Intl.NumberFormat to format numbers as hexadecimal
  const toHex = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false,
    })
      .format(value)
      .toUpperCase();
  };

  // Convert each component back to hex and format properly
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
