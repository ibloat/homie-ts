import { Client as MQTTClient } from "mqtt";
import { default as MQTT, AsyncClient } from "async-mqtt";

export interface ControllerOptions {
  baseTopic?: string;
  mqtt?: MQTT.IClientOptions | MQTTClient;
}

interface DeviceLookup {
  [key: string]: {
    attributes: { [key: string]: string };
    nodes: {
      [key: string]: {
        attributes: { [key: string]: string };
        properties: {
          [key: string]: {
            attributes: { [key: string]: string };
            value?: any;
          };
        };
      };
    };
  };
}

export class Controller {
  private baseTopic: string = "homie";
  private client: MQTT.AsyncMqttClient;

  private lookup: DeviceLookup = {};

  constructor(options: ControllerOptions = {}) {
    if (options.baseTopic) {
      this.baseTopic = options.baseTopic;
    }

    if (options.mqtt instanceof MQTTClient) {
      this.client = new AsyncClient(options.mqtt);
    } else {
      this.client = MQTT.connect(options.mqtt);
    }

    this.client.on("connect", () => console.log("Connection established"));
    this.client.on("error", err => console.log("Error encountered", err));
    this.client.on("connack", (packet: any) => console.log("CONNACK", packet));

    this.client.on("message", (topic, message) => {
      console.log("device activity!", topic, message.toString());
      const split = topic.split("/").slice(1);
      const leaf = split.pop()!;
      const [device, node, property] = split;

      if (leaf === "set") {
        console.log("set seen");
      } else if (leaf.startsWith("$")) {
        this.updateAttribute(
          leaf.slice(1),
          message.toString(),
          device,
          node,
          property
        );
        console.log("attribute found or updated");
      } else if (split.length === 2) {
        console.log("setting property value", split, leaf);
        this.updatePropertyValue(device, node, leaf, message.toString());
      } else {
        console.log("FOUND SOMETHING UNKNOWN!", split, leaf);
      }
    });

    this.client.subscribe([
      `${this.baseTopic}/+/+`, // device attributes
      `${this.baseTopic}/+/+/+`, // node attributes, prop value
      `${this.baseTopic}/+/+/+/+` // property attributes
    ]);
  }

  updateAttribute(
    attribute: string,
    value: string,
    device: string,
    node?: string,
    property?: string
  ) {
    const d = (this.lookup[device] = this.lookup[device] || {
      attributes: {},
      nodes: {}
    });
    let attr = d.attributes;

    if (node) {
      const n = (d.nodes[node] = d.nodes[node] || {
        attributes: {},
        properties: {}
      });
      attr = n.attributes;

      if (property) {
        attr = (n.properties[property] = n.properties[property] || {
          attributes: {}
        }).attributes;
      }
    }

    attr[attribute] = value;
  }

  updatePropertyValue(
    device: string,
    node: string,
    property: string,
    value: string
  ) {
    // we might not know the datatype of the value yet
    const d = (this.lookup[device] = this.lookup[device] || {
      attributes: {},
      nodes: {}
    });
    const n = (d.nodes[node] = d.nodes[node] || {
      attributes: {},
      properties: {}
    });
    const p = (n.properties[property] = n.properties[property] || {
      attributes: {}
    });
    p.value = value;
  }

  broadcast(level: string, payload: string) {
    return this.client.publish(
      `${this.baseTopic}/$broadcast/${level}`,
      payload
    );
  }
}
