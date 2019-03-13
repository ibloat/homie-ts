import { Property, PropertyOptions, Unit } from "../src/property";
import { PropertyType } from "../src/misc";

export const minimalOptions: PropertyOptions = {
  id: "testproperty",
  value: true,
  name: "this is a test property",
  datatype: PropertyType.BOOLEAN
};

const additionalOptions = {
  datatype: PropertyType.ENUM,
  format: "val1,val2",
  settable: true,
  retained: false,
  unit: Unit.AMPERE,
  additionalAttributes: { foo: "bar" }
};

it("can be constructed", () => {
  expect(() => new Property(minimalOptions)).not.toThrow();
  expect(
    () => new Property({ ...minimalOptions, ...additionalOptions })
  ).not.toThrow();
});

it("sets attributes correctly", () => {
  // mandatory
  let property = new Property(minimalOptions);
  expect(Object.isFrozen(property.attributes)).toBe(true);
  expect(property.attributes).toEqual({
    name: minimalOptions.name,
    datatype: minimalOptions.datatype
  });

  // optional
  const { additionalAttributes, ...optionalAttributes } = additionalOptions;
  property = new Property({ ...minimalOptions, ...optionalAttributes });
  expect(property.attributes).toEqual({
    name: minimalOptions.name,
    datatype: minimalOptions.datatype,
    ...optionalAttributes
  });

  // arbitrary
  property = new Property({ ...minimalOptions, additionalAttributes });
  expect(property.attributes).toEqual({
    name: minimalOptions.name,
    datatype: minimalOptions.datatype,
    ...additionalAttributes
  });
});

it("observes setHook", () => {
  const setHook = jest
    .fn()
    .mockReturnValueOnce(false)
    .mockReturnValue(true);
  const property = new Property({ ...minimalOptions, setHook });
  expect(property.value).toBe(minimalOptions.value);
  property.value = "val2";
  expect(property.value).toBe("val2");
  property.value = minimalOptions.value;
  expect(property.value).toBe("val2");
  expect(setHook.mock.calls.length).toBe(2);
});
