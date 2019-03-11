import { default as MQTT } from "async-mqtt";
import { Node, NodeOptions } from "./node";
import { encodePayload, parsePayload } from "./misc";
import { EventEmitter } from "events";

import Debug from "debug";
const debug = Debug("homie:device");

export enum Lifecycle {
  INIT = "init",
  READY = "ready",
  DISCONNECTED = "disconnected",
  SLEEPING = "sleeping",
  LOST = "lost",
  ALERT = "alert"
}

export interface DeviceOptions {
  id: string;
  name: string;
  baseTopic?: string;
  extensions?: string[];
  implementation?: string;
  nodes?: (Node | NodeOptions)[];
  mqtt?: MQTT.IClientOptions;
  onBroadcast?(self: Device, level: string, message: string): void;
}

export interface DeviceAttributes {
  homie: string;
  state: Lifecycle;
  name: string;
  extensions: string[];
  nodes: { [key: string]: Node };
  implementation: string;
}

export class Device extends EventEmitter {
  readonly id: string;
  readonly attributes: DeviceAttributes;
  get nodes() {
    return this.attributes.nodes;
  }

  private baseTopic: string = "homie";
  private client?: MQTT.AsyncMqttClient;
  get connected(): boolean {
    return !!this.client && this.client.connected;
  }

  private mqttOptions: MQTT.IClientOptions;
  private onBroadcast?: (self: Device, level: string, message: string) => void;

  private onMessage(topic: string, message: string | Buffer) {
    message = message.toString();
    const split = topic.split("/");
    const leaf = split.pop();
    debug(this.id, "subscription triggered!", topic, message, split, leaf);

    if (split.slice(-1)[0] === "$broadcast") {
      debug(this.id, "broadcast triggered! level=", leaf);
      this.emit("broadcast", leaf, message);
      if (this.onBroadcast) {
        this.onBroadcast(this, leaf!, message);
      }
    } else if (leaf === "set") {
      const node = this.attributes.nodes[split[2]];
      const property = node.attributes.properties[split[3]];
      const { datatype, format, settable } = property.attributes;
      try {
        if (!settable) {
          throw new Error(`property ${property.id} not settable`);
        }
        const value = parsePayload(datatype, message, format);
        debug(this.id, "setting property", property, "to", value, typeof value);

        property.value = value;
        this.client!.publish(split.join("/"), encodePayload(property.value), {
          retain: property.attributes.retained !== false,
          qos: 1
        }).catch(err => debug(this.id, "Error publishing new value", err));
      } catch (err) {
        debug(this.id, "failed to set property", err.message);
      }
    }
  }

  private async publishObject(
    client: MQTT.AsyncMqttClient,
    basePath: string,
    obj: object
  ) {
    for (const [key, value] of Object.entries(obj)) {
      if (value == null) {
        continue;
      }

      const payload =
        "object" === typeof value
          ? Object.keys(value).join(",")
          : value.toString();

      try {
        await client.publish(`${basePath}${key}`, payload, {
          retain: true,
          qos: 1
        });
      } catch (err) {
        debug(this.id, "error publishing", err);
      }
    }
  }

  constructor({ id, baseTopic, mqtt, onBroadcast, ...options }: DeviceOptions) {
    super();

    this.id = id;
    this.onBroadcast = onBroadcast;
    if (baseTopic) {
      this.baseTopic = baseTopic;
    }

    this.mqttOptions = {
      ...mqtt,
      will: {
        topic: `${this.baseTopic}/${this.id}/$state`,
        payload: Lifecycle.LOST,
        qos: 1,
        retain: true
      }
    };

    const {
      extensions = [],
      implementation = "homie-ts",
      nodes = [],
      ...partialAttributes
    } = options;

    const nodeInstances: { [key: string]: Node } = {};
    for (const node of nodes) {
      if (node instanceof Node) {
        nodeInstances[node.id] = node;
      } else {
        nodeInstances[node.id] = new Node(node);
      }
    }

    this.attributes = {
      ...partialAttributes,
      homie: "4.0.0",
      extensions,
      implementation,
      nodes: Object.freeze(nodeInstances),
      state: Lifecycle.INIT
    };
  }

  private async advertise() {
    if (!this.client) {
      return;
    }

    const client = this.client;
    const devicePath = `${this.baseTopic}/${this.id}`;

    for (const [nodeId, node] of Object.entries(this.attributes.nodes)) {
      const nodePath = `${devicePath}/${nodeId}`;

      for (const [propertyId, property] of Object.entries(
        node.attributes.properties
      )) {
        const propertyPath = `${nodePath}/${propertyId}`;
        try {
          await this.publishObject(
            client,
            propertyPath + "/$",
            property.attributes
          );
          await client.publish(propertyPath, encodePayload(property.value), {
            retain: property.attributes.retained !== false,
            qos: 1
          });
        } catch (err) {
          debug(
            this.id,
            "error publishing attributes or value for property",
            propertyPath,
            property,
            err
          );
        }
      }
      try {
        await this.publishObject(client, nodePath + "/$", node.attributes);
      } catch (err) {
        debug(this.id, "error publishing attributes for node", nodePath, err);
      }
    }

    try {
      const { state, ...deviceAttributes } = this.attributes;
      await this.publishObject(client, devicePath + "/$", deviceAttributes);
    } catch (err) {
      debug(this.id, "error publishing attributes for device", devicePath, err);
    }
  }

  async connect() {
    if (this.client && (this.client.connected || this.client.reconnecting)) {
      return;
    }

    this.attributes.state = Lifecycle.INIT;

    if (!this.client) {
      this.client = MQTT.connect(this.mqttOptions);
      this.client.on("connect", () => debug(this.id, "connection established"));
      this.client.on("error", err => debug(this.id, "error encountered", err));

      this.client.on("message", this.onMessage.bind(this));
    } else if (!this.client.reconnecting) {
      this.client.reconnect();
    }
    const client = this.client;

    const devicePath = `${this.baseTopic}/${this.id}`;
    const broadcastPath = `${this.baseTopic}/$broadcast/+`;
    const setterPath = `${devicePath}/+/+/set`;

    try {
      await client.publish(`${devicePath}/$state`, this.attributes.state, {
        retain: true,
        qos: 1
      });

      await client.subscribe([broadcastPath, setterPath]);
      await this.advertise();

      await client.publish(`${devicePath}/$state`, Lifecycle.READY, {
        retain: true,
        qos: 1
      });
      this.attributes.state = Lifecycle.READY;
    } catch (err) {
      this.attributes.state = Lifecycle.ALERT;
      debug(this.id, "error connecting", err);
    }
  }

  async disconnect() {
    if (!this.client || !this.client.connected) {
      return;
    }

    try {
      this.attributes.state = Lifecycle.ALERT;
      await this.client.publish(
        `${this.baseTopic}/${this.id}/$state`,
        Lifecycle.DISCONNECTED,
        {
          retain: true,
          qos: 1
        }
      );
      await this.client.end();
      this.attributes.state = Lifecycle.DISCONNECTED;
    } catch (err) {
      debug(this.id, "error disconnecting", err);
    }
  }

  async cleanupTopics(staleOnly = false, timeout = 3000): Promise<void> {
    const client = MQTT.connect({ ...this.mqttOptions, will: undefined });
    const subscriptionTopic = `${this.baseTopic}/${this.id}/#`;
    const deviceTopics: { [key: string]: boolean } = {};

    const isStale = (topic: string) => {
      const [node, propertyOrAttribute, attribute] = topic.split("/").slice(2);
      if (this.nodes[node]) {
        if (propertyOrAttribute && propertyOrAttribute.startsWith("$")) {
          return !this.nodes[node].attributes[propertyOrAttribute.slice(1)];
        } else {
          const property = this.nodes[node].properties[propertyOrAttribute];
          if (property && !attribute) {
            return false;
          }
          if (property && attribute && property.attributes[attribute]) {
            return false;
          }
        }
      }
      return true;
    };

    client.on("message", (topic, _message) => {
      deviceTopics[topic] = true;
    });

    try {
      await client.subscribe(subscriptionTopic);
      await new Promise(resolve => setTimeout(() => resolve(), timeout));
      const topics = Object.keys(deviceTopics).filter(
        t => !staleOnly || isStale(t)
      );
      for (const topic of topics) {
        await client.publish(topic, "", { retain: true, qos: 1 });
      }
      await client.end();
    } catch (err) {
      debug(this.id, "error cleaning up topics", staleOnly, err);
    }
  }

  addNode(node: NodeOptions | Node) {
    if (this.nodes[node.id]) {
      throw new Error(`node with id ${node.id} already exists!`);
    }

    const nodes = { ...this.nodes };
    if (node instanceof Node) {
      nodes[node.id] = node;
    } else {
      nodes[node.id] = new Node(node);
    }
    nodes[node.id].on("change", this.onChange.bind(this));

    this.attributes.nodes = Object.freeze(nodes);

    this.onChange();
  }

  private onChange(advertise = true) {
    this.emit("change");
    if (advertise && this.client) {
      this.advertise();
    }
  }

  removeNode(node: string | Node) {
    const id = node instanceof Node ? node.id : node;

    if (!this.nodes[id]) {
      return;
    }

    const nodes = { ...this.nodes };
    nodes[id].off("change", this.onChange);
    delete nodes[id];
    this.attributes.nodes = Object.freeze(nodes);

    this.onChange(false);
    if (this.client) {
      this.cleanupTopics(true).then(() => this.advertise());
    }
  }
}
