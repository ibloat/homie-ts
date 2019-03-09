import { PropertyType } from "./misc";
import { EventEmitter } from "events";

export enum Unit {
  CELSIUS = "°C",
  FAHRENHEIT = "°F",
  DEGREE = "°",
  LITER = "L",
  GALON = "gal",
  VOLTS = "V",
  WATT = "W",
  AMPERE = "A",
  PERCENT = "%",
  METER = "m",
  CENTIMETER = "cm",
  MILLIMETER = "mm",
  FEET = "ft",
  PASCAL = "Pa",
  PSI = "psi",
  ENUMERABLE = "#"
}

export interface PropertyBase {
  name: string;
  datatype: PropertyType;

  format?: string;
  settable?: boolean;
  retained?: boolean;
  unit?: Unit | string;
}

export interface PropertyOptions extends PropertyBase {
  id: string;
  value: any;
  setHook?(oldValue: any, newValue: any): void | boolean | undefined;
}

interface PropertyAttributes extends PropertyBase {
  [key: string]: any;
}

export class Property extends EventEmitter {
  readonly id: string;
  readonly attributes: PropertyAttributes;

  private _value: any;
  private setHook?: (
    oldValue: any,
    newValue: any
  ) => void | boolean | undefined;
  get value() {
    return this._value;
  }
  set value(v: any) {
    const oldValue = this._value;
    const inhibitSet = this.setHook ? this.setHook(oldValue, v) : false;
    if (!inhibitSet) {
      this._value = v;
      this.emit("change", oldValue, v);
    }
  }

  constructor({ id, value, setHook, retained, ...options }: PropertyOptions) {
    super();

    this.id = id;
    this.attributes = {
      ...options,
      retained: retained != false
    };

    this._value = value;

    if (setHook) {
      this.setHook = setHook;
    }
  }
}
