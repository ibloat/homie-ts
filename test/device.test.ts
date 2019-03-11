import mqtt from "async-mqtt";
import { Device, Lifecycle } from "../src/device";

describe("attributes", () => {
  // check if attributes get set correctly
});

describe("mqtt", () => {
  it("uses the base topic correctly", () => {
    // base_topic = homie && !homie
  });

  it("sets its will correctly", () => {
    const mock = mqtt as any;
    function checkWill() {
      const will = mock.__will();
      expect(will.payload).toEqual(Lifecycle.LOST);
      expect(mock.__pathInSubscriptions(will.topic, ["+/+/$state"])).toBe(true);
    }
    new Device({ id: "testdevice", name: "a test device" }).connect();
    checkWill();
    new Device({
      id: "testdevice",
      name: "a test device",
      mqtt: { will: { topic: "wrong", payload: "wrong", qos: 1, retain: true } }
    }).connect();
    checkWill();
  });

  it("publishes to the correct topics", () => {
    new Device({ id: "testdevice", name: "a test device" }).connect();
    // base/device/$attr
    // base/device/node/$attr
    // base/device/node/property
    // base/device/node/property/$attr
  });

  it("subscribes to the correct topics", () => {
    // $broadcast
    // /set
  });

  it("triggers onBroadcast", () => {});

  it("cleans up stale topics", () => {
    // create device, publish to random topic in the device path (value, attribute)
    // see if that gets unset
  });

  it("addNode/removeNode works", () => {});
  it("addProperty/removeProperty on node triggers cleanup+advert", () => {});
});
