import { Property, PropertyOptions } from "./property";
import { EventEmitter } from "events";

import Debug from "debug";
const debug = Debug("homie:node");

export interface NodeOptions {
  id: string;
  name: string;
  type: string;
  properties: (Property | PropertyOptions)[];
  additionalAttributes?: { [key: string]: string };
}

interface NodeAttributes {
  [key: string]: any;
  name: string;
  type: string;
  properties: { [key: string]: Property };
}

export class Node extends EventEmitter {
  readonly id: string;
  readonly attributes: NodeAttributes;
  get properties() {
    return this.attributes.properties;
  }

  constructor({
    id,
    properties = [],
    additionalAttributes = {},
    ...attributes
  }: NodeOptions) {
    super();

    const propertyInstances: { [key: string]: Property } = {};
    for (const property of properties) {
      if (property instanceof Property) {
        propertyInstances[property.id] = property;
      } else {
        propertyInstances[property.id] = new Property(property);
      }
      propertyInstances[property.id].on("change", this.onChange.bind(this));
    }

    this.id = id;
    this.attributes = {
      ...additionalAttributes,
      ...attributes,
      properties: Object.freeze(propertyInstances)
    };
  }

  addProperty(property: PropertyOptions | Property, replace = false) {
    if (!replace && this.properties[property.id]) {
      debug(this.id, `property ${property.id} already exists`);
      throw new Error(`property with id ${property.id} already exists!`);
    }

    const properties = { ...this.properties };

    if (properties[property.id]) {
      debug(this.id, `replacing existing property ${property.id}`);
      properties[property.id].off("change", this.onChange);
      delete properties[property.id];
    } else {
      debug(this.id, `adding property ${property.id}`);
    }

    if (property instanceof Property) {
      properties[property.id] = property;
    } else {
      properties[property.id] = new Property(property);
    }
    properties[property.id].on("change", this.onChange.bind(this));

    this.attributes.properties = Object.freeze(properties);

    this.onChange();
  }

  private onChange() {
    debug(this.id, `emitting change`);
    this.emit("change");
  }

  removeProperty(property: string | Property) {
    const id = property instanceof Property ? property.id : property;

    if (!this.properties[id]) {
      return;
    }

    const properties = { ...this.properties };
    properties[id].off("change", this.onChange);
    delete properties[id];
    this.attributes.properties = Object.freeze(properties);

    this.onChange();
  }
}
