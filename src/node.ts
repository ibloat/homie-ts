import { Property, PropertyOptions } from "./property";
import { EventEmitter } from "events";

export interface NodeOptions {
  id: string;
  name: string;
  type: string;
  properties: (Property | PropertyOptions)[];
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

  constructor({ id, properties = [], ...attributes }: NodeOptions) {
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
      ...attributes,
      properties: Object.freeze(propertyInstances)
    };
  }

  addProperty(property: PropertyOptions | Property) {
    if (this.properties[property.id]) {
      throw new Error(`property with id ${property.id} already exists!`);
    }

    const properties = { ...this.properties };
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
