import { PropertyType, encodePayload, parsePayload } from "../src/misc";

interface ParseTestCase {
  in: { value: string; format?: string };
  out?: any;
  desc: string;
  success: boolean;
}

const integerTests = [
  { in: { value: "1" }, out: 1, success: true, desc: "single digit integer" },
  { in: { value: "-1" }, out: -1, success: true, desc: "negative integer" },
  { in: { value: "-" }, success: false, desc: "only negation sign" },
  { in: { value: "" }, success: false, desc: "empty string" },
  { in: { value: "woof" }, success: false, desc: "alpha string" }
];

const parseTests: { [key: string]: ParseTestCase[] } = {
  [PropertyType.STRING]: [
    { in: { value: "a string" }, success: true, desc: "a simple string" },
    { in: { value: "" }, success: true, desc: "an empty string" },
    {
      in: { value: "s".repeat(268435456 + 1) },
      success: false,
      desc: "maximum length observed"
    }
  ],
  [PropertyType.INTEGER]: integerTests,
  [PropertyType.FLOAT]: [
    ...integerTests,
    { in: { value: "1.0" }, out: 1.0, success: true, desc: "regular float" },
    {
      in: { value: ".0" },
      out: 0.0,
      success: true,
      desc: "starting with decimal point"
    },
    {
      in: { value: "1e10" },
      out: 1e10,
      success: true,
      desc: "exponential notation"
    },
    {
      in: { value: "-1e-10" },
      out: -1e-10,
      success: true,
      desc: "negative exponential notation"
    },
    {
      in: { value: "1e+10" },
      success: false,
      desc: "javascript exponential notation"
    },
    {
      in: { value: ".0.0" },
      success: false,
      desc: "multiple decimal points"
    }
  ],
  [PropertyType.BOOLEAN]: [],
  [PropertyType.ENUM]: [
    {
      in: { value: "VAL1", format: "VAL1" },
      success: true,
      desc: "single value enum"
    },
    {
      in: { value: "VAL2", format: "VAL1,VAL2" },
      success: true,
      desc: "enum values separated by comma"
    },
    {
      in: { value: "VAL3", format: "VAL1,VAL2" },
      success: false,
      desc: "invalid value fails"
    },
    {
      in: { value: "", format: "VAL1,VAL2" },
      success: false,
      desc: "empty value is invalid"
    },
    {
      in: { value: "value", format: "VALUE" },
      success: false,
      desc: "enums are case sensitive"
    },
    {
      in: { value: "noformat" },
      success: false,
      desc: "enums need a format attribute"
    }
  ],
  [PropertyType.COLOR]: []
};

describe("test property parsing", () => {
  for (const [typeName, tests] of Object.entries(parseTests)) {
    it("should parse correctly", () => {
      for (const test of tests) {
        const parseFn = parsePayload.bind(
          null,
          typeName as PropertyType,
          test.in.value,
          test.in.format
        );
        if (!test.success) {
          expect(parseFn).toThrow(test.out);
        } else {
          expect(parseFn()).toBe(test.out != null ? test.out : test.in.value);
        }
      }
    });
  }
});

interface EncodeTestCase {
  in: any;
  out?: string;
  desc: string;
  success: boolean;
}

const encodeTests: { [key: string]: ParseTestCase[] } = {
  [PropertyType.STRING]: [],
  [PropertyType.INTEGER]: [],
  [PropertyType.FLOAT]: [],
  [PropertyType.BOOLEAN]: [],
  [PropertyType.ENUM]: [],
  [PropertyType.COLOR]: []
};

describe("test property encoding", () => {
  for (const tests of Object.values(encodeTests)) {
    it("should encode correctly", () => {
      for (const test of tests) {
        if (!test.success) {
          expect(encodePayload.bind(null, test.in)).toThrow(test.out);
        } else {
          expect(encodePayload(test.in)).toEqual(test.out);
        }
      }
    });
  }
});
