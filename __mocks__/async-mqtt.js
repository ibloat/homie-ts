"use strict";

const url = require("url");
const EventEmitter = require("events");
const emitter = new EventEmitter();

const mqtt = jest.genMockFromModule("async-mqtt");

let subscriptions = {};
let topics = {};
let will = {};

mqtt.__topics = () => topics;
mqtt.__subscriptions = () => subscriptions;
mqtt.__will = () => will;
mqtt.__pathInSubscriptions = (path, lookup = subscriptions) => {
  const split = path.split("/");
  const values = Array.isArray(lookup)
    ? Object.values(lookup)
    : Object.keys(lookup);

  for (const idx in values) {
    const ssplit = values[idx].split("/");
    if (ssplit.length != split.length) {
      continue;
    }
    let hit = true;
    for (let i = 0; i < split.length; i++) {
      if (ssplit[i] === "+") {
        continue;
      } else if (ssplit[i] === "#") {
        break;
      } else if (ssplit[i] !== split[i]) {
        hit = false;
        break;
      }
    }
    if (hit) {
      return true;
    }
  }
  return false;
};

mqtt.on = emitter.on.bind(mqtt);
mqtt.once = emitter.once.bind(mqtt);
mqtt.off = emitter.off.bind(mqtt);

mqtt.connect = jest.fn((pathOrOptions, options) => {
  subscriptions = {};
  topics = {};
  will = {};

  if (typeof pathOrOptions === "string") {
    options = { ...(options || {}), ...url.parse(pathOrOptions) };
  } else {
    options = pathOrOptions;
  }

  will = options.will || {};
  return mqtt;
});
mqtt.subscribe = jest.fn(paths => {
  Array.isArray(paths)
    ? paths.forEach(p => (subscriptions[p] = true))
    : (subscriptions[paths] = true);
  return Promise.resolve([]);
});
mqtt.publish = jest.fn((path, value, options) => {
  if (!topics[path]) {
    topics[path] = [];
  }

  topics[path].push({ value, options });

  if (pathInSubscriptions(path)) {
    setImmediate(() => {
      emitter.emit("message", value);
    });
  }
  return Promise.resolve({});
});

module.exports = mqtt;
