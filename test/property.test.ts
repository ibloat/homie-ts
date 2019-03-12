import { Property, PropertyOptions } from "../src/property";
import { PropertyType } from "../src/misc";

const minimalOptions: PropertyOptions = {
  id: "testproperty",
  value: true,
  name: "this is a test property",
  datatype: PropertyType.BOOLEAN
};

const optionalOptions = {
  format: "",
  settable: false,
  retained: true,
  unit: "",
  setHook(oldVal: any, newVal: any) {}
};

it("can be constructed", () => {
  let property = new Property(minimalOptions);
  expect(property).not.toEqual(undefined);
  property = new Property({ ...minimalOptions, ...optionalOptions });
  expect(property).not.toEqual(undefined);
});

it("sets attributes correctly", () => {
  // mandatory
  // optional
  // arbitrary
});

it("observes setHook", () => {
  const property = new Property(minimalOptions);
});
