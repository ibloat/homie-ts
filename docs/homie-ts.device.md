[Home](./index) &gt; [@ibloat/homie-ts](./homie-ts.md) &gt; [Device](./homie-ts.device.md)

# Device class

A Homie Device It holds the [Node](./homie-ts.node.md)<!-- -->s and is generally responsible for interactions with the broker

## Properties

|  Property | Access Modifier | Type | Description |
|  --- | --- | --- | --- |
|  [`attributes`](./homie-ts.device.attributes.md) |  | `DeviceAttributes` |  |
|  [`connected`](./homie-ts.device.connected.md) |  | `boolean` |  |
|  [`id`](./homie-ts.device.id.md) |  | `string` |  |
|  [`nodes`](./homie-ts.device.nodes.md) |  | `{`<p/>`        [key: string]: Node;`<p/>`    }` |  |

## Methods

|  Method | Access Modifier | Returns | Description |
|  --- | --- | --- | --- |
|  [`constructor(__0)`](./homie-ts.device.constructor.md) |  |  | Constructs a new instance of the [Device](./homie-ts.device.md) class |
|  [`addNode(node)`](./homie-ts.device.addnode.md) |  | `void` |  |
|  [`cleanupTopics(staleOnly, timeout)`](./homie-ts.device.cleanuptopics.md) |  | `Promise<void>` |  |
|  [`connect()`](./homie-ts.device.connect.md) |  | `Promise<void>` |  |
|  [`disconnect()`](./homie-ts.device.disconnect.md) |  | `Promise<void>` |  |
|  [`removeNode(node)`](./homie-ts.device.removenode.md) |  | `void` |  |

