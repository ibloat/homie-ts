import {
  PropertyType,
  encodePayload,
  parsePayload,
  ColorRGB,
  ColorHSV,
  MAX_PAYLOAD_LENGTH
} from "../src/misc";

interface ParseTestCase {
  in: { value: string; format?: string };
  out?: any;
  desc: string;
  success: boolean;
}

const integerParseTests = [
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
      in: { value: "s".repeat(MAX_PAYLOAD_LENGTH + 1) },
      success: false,
      desc: "maximum length observed"
    }
  ],
  [PropertyType.INTEGER]: integerParseTests,
  [PropertyType.FLOAT]: [
    ...integerParseTests,
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
  [PropertyType.BOOLEAN]: [
    { in: { value: "true" }, out: true, success: true, desc: "true value" },
    { in: { value: "false" }, out: false, success: true, desc: "false value" },
    { in: { value: "TRUE" }, success: false, desc: "only lowercase" },
    { in: { value: "wrong" }, success: false, desc: "arbitrary strings" },
    { in: { value: "" }, success: false, desc: "empty strings" }
  ],
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
      desc: "invalid value"
    },
    {
      in: { value: "", format: "VAL1,VAL2" },
      success: false,
      desc: "empty value"
    },
    {
      in: { value: "value", format: "VALUE" },
      success: false,
      desc: "case mismatch"
    },
    {
      in: { value: "noformat" },
      success: false,
      desc: "without format"
    }
  ],
  [PropertyType.COLOR]: [
    {
      in: { value: "0,0,0", format: "rgb" },
      out: new ColorRGB(0, 0, 0),
      success: true,
      desc: "rgb format"
    },
    {
      in: { value: "0,0,0", format: "hsv" },
      out: new ColorHSV(0, 0, 0),
      success: true,
      desc: "hsv format"
    },
    {
      in: { value: "0;0;0", format: "rgb" },
      success: false,
      desc: "invalid separator"
    },
    {
      in: { value: "-10,0,0", format: "rgb" },
      success: false,
      desc: "negative value"
    },
    {
      in: { value: "280,250,250", format: "rgb" },
      success: false,
      desc: "rgb values out of range"
    },
    {
      in: { value: "280,250,250", format: "hsv" },
      success: false,
      desc: "hsv values out of range"
    },
    {
      in: { value: "0,0", format: "hsv" },
      success: false,
      desc: "only two values"
    },
    {
      in: { value: "hi mom", format: "rgb" },
      success: false,
      desc: "random string"
    },
    { in: { value: "0,0,0" }, success: false, desc: "missing format" }
  ]
};

describe("test property parsing", () => {
  for (const [typeName, tests] of Object.entries(parseTests)) {
    for (const test of tests) {
      it(`should ${
        test.success ? "succeed" : "fail"
      } parsing ${typeName} with ${test.desc}`, () => {
        const parseFn = parsePayload.bind(
          null,
          typeName as PropertyType,
          test.in.value,
          test.in.format
        );
        if (!test.success) {
          expect(parseFn).toThrow(test.out);
        } else {
          const result = parseFn();
          if (result instanceof ColorRGB) {
            const { r, g, b } = test.out;
            expect(result).toMatchObject({ r, g, b });
          } else if (result instanceof ColorHSV) {
            const { h, s, v } = test.out;
            expect(result).toMatchObject({ h, s, v });
          } else {
            expect(result).toBe(test.out != null ? test.out : test.in.value);
          }
        }
      });
    }
  }
});

interface EncodeTestCase {
  in: any;
  format?: string;
  out?: string;
  desc: string;
  success: boolean;
}

const integerEncodeTests = [
  { in: 1, out: "1", success: true, desc: "single digit" },
  { in: -1, out: "-1", success: true, desc: "negative number" },
  { in: 1e1, out: "10", success: true, desc: "exponential notation" }
];

const encodeTests: { [key: string]: EncodeTestCase[] } = {
  [PropertyType.STRING]: [
    { in: "", out: "", success: true, desc: "empty string" },
    { in: "short", out: "short", success: true, desc: "short string" },
    {
      in: "s".repeat(MAX_PAYLOAD_LENGTH + 1),
      success: false,
      desc: "overly long string"
    }
  ],
  [PropertyType.INTEGER]: [
    ...integerEncodeTests,
    { in: 1.1, success: false, desc: "no automatic rounding" },
    {
      in: Number.MAX_SAFE_INTEGER + 1,
      success: false,
      desc: "unsafe positive integer"
    },
    {
      in: Number.MIN_SAFE_INTEGER - 1,
      success: false,
      desc: "unsafe negative integer"
    }
  ],
  [PropertyType.FLOAT]: [
    ...integerEncodeTests,
    { in: Number.NaN, success: false, desc: "not a number" },
    { in: Number.POSITIVE_INFINITY, success: false, desc: "infinity" }
  ],
  [PropertyType.BOOLEAN]: [
    { in: true, out: "true", success: true, desc: "true" },
    { in: false, out: "false", success: true, desc: "false" },
    { in: "truthy", out: "true", success: true, desc: "truthy" },
    { in: null, out: "false", success: true, desc: "falsey" }
  ],
  [PropertyType.ENUM]: [
    { in: "val1", format: "val1,val2", success: true, desc: "valid value" },
    { in: "val3", format: "val1,val2", success: false, desc: "invalid value" },
    { in: "", format: "val1,val2", success: false, desc: "empty value" },
    { in: "val", format: "", success: false, desc: "empty format" },
    { in: "val1", success: false, desc: "missing format" }
  ],
  [PropertyType.COLOR]: [
    {
      in: new ColorRGB(0, 0, 0),
      out: "0,0,0",
      success: true,
      desc: "rgb color"
    },
    {
      in: new ColorHSV(0, 0, 0),
      out: "0,0,0",
      success: true,
      desc: "hsv color"
    }
  ]
};

describe("test property encoding", () => {
  for (const [typeName, tests] of Object.entries(encodeTests)) {
    for (const test of tests) {
      it(`should ${
        test.success ? "succeed" : "fail"
      } encoding ${typeName} with ${test.desc}`, () => {
        const encodeFn = encodePayload.bind(
          null,
          typeName as PropertyType,
          test.in,
          test.format
        );
        if (!test.success) {
          expect(encodeFn).toThrow(test.out);
        } else {
          expect(encodeFn()).toEqual(test.out != null ? test.out : test.in);
        }
      });
    }
  }
});
