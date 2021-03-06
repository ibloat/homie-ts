import { PropertyType, defaultPayload, validFormat } from "./misc";
import { EventEmitter } from "events";

import Debug from "debug";
const debug = Debug("homie:property");

/**
 * Units specified in the Homie Convention.
 * They are not binding and the user is free to set {@link PropertyOptions.datatype} to whatever they like.
 * @public
 */
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

interface PropertyBase {
  name: string;
  datatype: PropertyType;

  format?: string;
  settable?: boolean;
  retained?: boolean;
  unit?: Unit | string;
}

/**
 * Options for {@link Property} creation
 * @beta
 */
export interface PropertyOptions extends PropertyBase {
  id: string;
  value?: any;
  setHook?(oldValue: any, newValue: any): void | boolean | undefined;
  additionalAttributes?: { [key: string]: string };
}

/**
 * Valid property attributes when there are no extensions specified
 * @beta
 */
interface PropertyAttributes extends PropertyBase {
  [key: string]: any;
}

/**
 * {@link Node} properties
 * The attributes affect how the property gets advertised.
 * @public
 */
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
    if (!v) debugger;
    const oldValue = this._value;
    const inhibitSet = this.setHook ? this.setHook(oldValue, v) : false;
    if (!inhibitSet) {
      debug(this.id, `value changed, emitting`, oldValue, v);
      this._value = v;
      this.emit("change", oldValue, v);
    } else {
      debug(this.id, `value change inhibited`, oldValue, v);
    }
  }

  constructor({
    id,
    value,
    setHook,
    format,
    unit,
    retained,
    settable,
    additionalAttributes = {},
    ...attributes
  }: PropertyOptions) {
    super();

    this.id = id;
    this.attributes = {
      ...additionalAttributes,
      ...attributes
    };

    if (!validFormat(this.attributes.datatype, format)) {
      throw new Error(
        `invalid format '${format}' for datatype ${this.attributes.datatype}`
      );
    }
    if (format) {
      this.attributes.format = format;
    }
    if (unit) {
      this.attributes.unit = unit;
    }
    if (retained === false) {
      this.attributes.retained = false;
    }
    if (settable) {
      this.attributes.settable = true;
    }

    this.attributes = Object.freeze(this.attributes);

    if (setHook) {
      this.setHook = setHook;
    }

    this._value =
      value == null ? defaultPayload(this.attributes.datatype, format) : value;
  }
}
