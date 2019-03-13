[Home](./index) &gt; [@ibloat/homie-ts](./homie-ts.md)

# homie-ts package

## Classes

|  Class | Description |
|  --- | --- |
|  [`ColorHSV`](./homie-ts.colorhsv.md) | **_(BETA)_** Wraps HSV colors for [PropertyType.COLOR](./homie-ts.propertytype.color.md) property values |
|  [`ColorRGB`](./homie-ts.colorrgb.md) | **_(BETA)_** Wraps RGB colors for [PropertyType.COLOR](./homie-ts.propertytype.color.md) property values |
|  [`Device`](./homie-ts.device.md) | A Homie Device It holds the [Node](./homie-ts.node.md)<!-- -->s and is generally responsible for interactions with the broker |
|  [`Node`](./homie-ts.node.md) | A [Device](./homie-ts.device.md) node It contains [Property](./homie-ts.property.md) instances |
|  [`Property`](./homie-ts.property.md) | [Node](./homie-ts.node.md) properties The attributes affect how the property gets advertised. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [`DeviceAttributes`](./homie-ts.deviceattributes.md) | [Device](./homie-ts.device.md) attributes |
|  [`DeviceOptions`](./homie-ts.deviceoptions.md) | **_(BETA)_** Options for [Device](./homie-ts.device.md) creation |
|  [`NodeAttributes`](./homie-ts.nodeattributes.md) | Mandatory attributes for [Node](./homie-ts.node.md)<!-- -->s |
|  [`NodeOptions`](./homie-ts.nodeoptions.md) | **_(BETA)_** Options for [Node](./homie-ts.node.md) creation |
|  [`PropertyOptions`](./homie-ts.propertyoptions.md) | **_(BETA)_** Options for [Property](./homie-ts.property.md) creation |

## Functions

|  Function | Returns | Description |
|  --- | --- | --- |
|  [`defaultPayload`](./homie-ts.defaultpayload.md) | `any` | **_(BETA)_** Return a default value for the supplied [PropertyType](./homie-ts.propertytype.md) |
|  [`encodePayload`](./homie-ts.encodepayload.md) | `string` | **_(BETA)_** Encodes a payload to be set as a property value on the [Property](./homie-ts.property.md) topic |
|  [`parsePayload`](./homie-ts.parsepayload.md) | `any` | **_(BETA)_** Parses a payload received from MQTT |
|  [`validFormat`](./homie-ts.validformat.md) | `boolean | "" | undefined` | **_(BETA)_** Checks if a given format is valid for the property type |

## Enumerations

|  Enumeration | Description |
|  --- | --- |
|  [`Lifecycle`](./homie-ts.lifecycle.md) | Valid values of a [Device](./homie-ts.device.md)<!-- -->'s [DeviceAttributes.state](./homie-ts.deviceattributes.state.md) attribute. |
|  [`PropertyType`](./homie-ts.propertytype.md) | Property types as specified by the Homie Convention |
|  [`Unit`](./homie-ts.unit.md) | Units specified in the Homie Convention. They are not binding and the user is free to set PropertyBase.datatype to whatever they like. |

