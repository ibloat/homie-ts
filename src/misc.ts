import cconvert from "color-convert";

export const MAX_PAYLOAD_LENGTH = 268435456;

export enum PropertyType {
  INTEGER = "integer",
  FLOAT = "float",
  BOOLEAN = "boolean",
  STRING = "string",
  ENUM = "enum",
  COLOR = "color"
}

export function cie_to_rgb(x: number, y: number, brightness: number) {
  //Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
  if (brightness === undefined) {
    brightness = 254;
  }

  var z = 1.0 - x - y;
  var Y = Math.floor((brightness / 254) * 100) / 100;
  var X = (Y / y) * x;
  var Z = (Y / y) * z;

  //Convert to RGB using Wide RGB D65 conversion
  var red = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  var green = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  var blue = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  //If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
  if (red > blue && red > green && red > 1.0) {
    green = green / red;
    blue = blue / red;
    red = 1.0;
  } else if (green > blue && green > red && green > 1.0) {
    red = red / green;
    blue = blue / green;
    green = 1.0;
  } else if (blue > red && blue > green && blue > 1.0) {
    red = red / blue;
    green = green / blue;
    blue = 1.0;
  }

  //Reverse gamma correction
  red =
    red <= 0.0031308
      ? 12.92 * red
      : (1.0 + 0.055) * Math.pow(red, 1.0 / 2.4) - 0.055;
  green =
    green <= 0.0031308
      ? 12.92 * green
      : (1.0 + 0.055) * Math.pow(green, 1.0 / 2.4) - 0.055;
  blue =
    blue <= 0.0031308
      ? 12.92 * blue
      : (1.0 + 0.055) * Math.pow(blue, 1.0 / 2.4) - 0.055;

  //Convert normalized decimal to decimal
  red = Math.round(red * 255);
  green = Math.round(green * 255);
  blue = Math.round(blue * 255);

  if (isNaN(red)) red = 0;

  if (isNaN(green)) green = 0;

  if (isNaN(blue)) blue = 0;

  return [red, green, blue];
}

export function rgb_to_cie(red: number, green: number, blue: number) {
  //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
  var red =
    red > 0.04045 ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : red / 12.92;
  var green =
    green > 0.04045
      ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4)
      : green / 12.92;
  var blue =
    blue > 0.04045
      ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4)
      : blue / 12.92;

  //RGB values to XYZ using the Wide RGB D65 conversion formula
  var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
  var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
  var Z = red * 0.000088 + green * 0.07231 + blue * 0.986039;

  //Calculate the xy values from the XYZ values
  var x = Math.floor((X / (X + Y + Z)) * 10000) / 10000;
  var y = Math.floor((Y / (X + Y + Z)) * 10000) / 10000;

  if (isNaN(x)) x = 0;

  if (isNaN(y)) y = 0;

  return [x, y];
}

export class ColorRGB {
  r: number;
  g: number;
  b: number;

  constructor(r: number | ColorHSV, g: number, b: number) {
    if (r instanceof ColorHSV) {
      [this.r, this.g, this.b] = cconvert.hsv.rgb([r.h, r.s, r.v]);
    } else {
      if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
        throw new Error("Out of range!");
      }
      this.r = r;
      this.g = g;
      this.b = b;
    }
  }

  toHSV(): ColorHSV {
    return new ColorHSV(...cconvert.rgb.hsv([this.r, this.g, this.b]));
  }

  toString(): string {
    return [this.r, this.g, this.b].join(",");
  }
}
export class ColorHSV {
  h: number;
  s: number;
  v: number;

  constructor(h: number | ColorRGB, s: number, v: number) {
    if (h instanceof ColorRGB) {
      [this.h, this.s, this.v] = cconvert.rgb.hsv([h.r, h.g, h.b]);
    } else {
      if (h > 300 || s > 100 || v > 100 || h < 0 || s < 0 || v < 0) {
        throw new Error("Out of range!");
      }
      this.h = h;
      this.s = s;
      this.v = v;
    }
  }

  toRGB(): ColorRGB {
    return new ColorRGB(...cconvert.hsv.rgb([this.h, this.s, this.v]));
  }

  toString(): string {
    return [this.h, this.s, this.v].join(",");
  }
}

export function encodePayload(
  payload: object | string | number | boolean | ColorRGB | ColorHSV
): string {
  const to = typeof payload;
  if (
    to === "string" ||
    payload instanceof Buffer ||
    payload instanceof String
  ) {
    const result = payload.toString();
    if (result.length > 268435456) {
      throw new Error("the string payload is too big");
    }
    return result;
  } else if (
    to === "boolean" ||
    payload instanceof ColorRGB ||
    payload instanceof ColorHSV
  ) {
    return payload.toString();
  } else if (to === "number") {
    const number = payload as number;
    if (Number.isNaN(number) || !Number.isFinite(number)) {
      throw new Error("number can not be NaN or inifinite");
    }
    return number.toString().replace("+", "");
  } else {
    return JSON.stringify(payload);
  }
}

export function parsePayload(
  type: PropertyType,
  value: string,
  format?: string
): any {
  let errorMessage = "";
  if (type === PropertyType.BOOLEAN) {
    if (!["true", "false"].includes(value)) {
      throw new Error(`invalid boolean (${value})`);
    }
    return value === "true";
  } else if (type === PropertyType.COLOR) {
    const splitValue = value.split(",").map(s => parseInt(s));
    if (
      splitValue.length != 3 ||
      !format ||
      ["rgb", "hsv"].indexOf(format) < 0
    ) {
      errorMessage = `missing or malformed format for color (${value})`;
    } else {
      return format === "rgb"
        ? new ColorRGB(splitValue[0], splitValue[1], splitValue[2])
        : new ColorHSV(splitValue[0], splitValue[1], splitValue[2]);
    }
  } else if (type === PropertyType.ENUM) {
    if (!format || format.split(",").indexOf(value) < 0) {
      errorMessage = `enum value ${value} not in ${format}`;
    } else {
      return value;
    }
  } else if (type === PropertyType.FLOAT || type === PropertyType.INTEGER) {
    const parseFunc =
      type === PropertyType.FLOAT ? Number.parseFloat : Number.parseInt;
    const parsed = parseFunc(value);
    if (
      Number.isNaN(parsed) ||
      !Number.isFinite(parsed) ||
      (value.match(/\./g) || []).length > 1 ||
      value.match(/e\+/)
    ) {
      errorMessage = `parsed number is invalid ${parsed}`;
    } else if (!format) {
      return parsed;
    } else {
      const [start, end] = format.split(":").map(s => parseFunc(s));
      if (parsed >= start && parsed <= end) {
        return parsed;
      }
      errorMessage = `value ${parsed} outside of format range ${start}:${end}`;
    }
  } else if (type === PropertyType.STRING) {
    if (value.length <= 268435456) {
      return value;
    }
    errorMessage = "string value is too long";
  }
  throw new Error(errorMessage);
}

export interface Indexable {
  [index: string]: any;
}

export abstract class WithAttributes<O, A extends Indexable> {
  readonly attributes: A;

  protected optionsToAttributes(options: O): A {
    return (options as any) as A;
  }

  constructor(options: O) {
    this.attributes = this.optionsToAttributes(options);
  }
}
