[Home](./index) &gt; [@ibloat/homie-ts](./homie-ts.md) &gt; [DeviceOptions](./homie-ts.deviceoptions.md)

# DeviceOptions interface

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Options for [Device](./homie-ts.device.md) creation

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [`additionalAttributes`](./homie-ts.deviceoptions.additionalattributes.md) | `{`<p/>`        [key: string]: string;`<p/>`    }` |  |
|  [`baseTopic`](./homie-ts.deviceoptions.basetopic.md) | `string` |  |
|  [`extensions`](./homie-ts.deviceoptions.extensions.md) | `string[]` |  |
|  [`id`](./homie-ts.deviceoptions.id.md) | `string` |  |
|  [`implementation`](./homie-ts.deviceoptions.implementation.md) | `string` |  |
|  [`mqtt`](./homie-ts.deviceoptions.mqtt.md) | `MQTT.IClientOptions` |  |
|  [`name`](./homie-ts.deviceoptions.name.md) | `string` |  |
|  [`nodes`](./homie-ts.deviceoptions.nodes.md) | `(Node | NodeOptions)[]` |  |

## Methods

|  Method | Returns | Description |
|  --- | --- | --- |
|  [`onBroadcast(self, level, message)`](./homie-ts.deviceoptions.onbroadcast.md) | `void` |  |

