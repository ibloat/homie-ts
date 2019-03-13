[Home](./index) &gt; [@ibloat/homie-ts](./homie-ts.md) &gt; [encodePayload](./homie-ts.encodepayload.md)

# encodePayload function

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Encodes a payload to be set as a property value on the [Property](./homie-ts.property.md) topic

**Signature:**
```javascript
encodePayload
```
**Returns:** `string`

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  `type` | `PropertyType` | the property type |
|  `payload` | `object | string | number | boolean | ColorRGB | ColorHSV` | the value to encode |
|  `format` | `string` | the format to adhere to |

