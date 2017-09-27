<img src="http://i.imgur.com/7ddbE0q.gif" width="300">


Networked-Aframe
=======

**Multi-user VR on the Web**

Write full-featured multi-user VR experiences entirely in HTML.

Built on top of the wonderful [A-Frame](https://aframe.io/).

<div>
  <a href="#features">Features</a>
  &mdash;
  <a href="#getting-started">Getting Started</a>
  &mdash;
  <a href="#more-examples">Examples</a>
  &mdash;
  <a href="#documentation">Documentation</a>
  &mdash;
  <a href="#stay-in-touch">Contact</a>
</div>

<br>


Features
--------
* Includes everything you need to create multi-user WebVR apps and games.
* Support for WebRTC and/or WebSocket connections.
* Voice chat. Audio streaming to let your users talk in-app (WebRTC only).
* Bandwidth sensitive. Only send network updates when things change. Option to further compress network packets.
* Extendable. Sync any A-Frame component, including your own, without changing the component code at all.
* Cross-platform. Works on all modern Desktop and Mobile browsers. Oculus Rift, HTC Vive and Google Cardboard + Daydream support.
* Firebase WebRTC signalling support


Getting Started
---------------

Follow [this tutorial](https://github.com/haydenjameslee/networked-aframe/blob/master/docs/getting-started-local.md) to build your own example.

Edit online example with [glitch.com/~networked-aframe/](https://glitch.com/~networked-aframe/)

To run the examples on your own PC:

 ```sh
git clone https://github.com/haydenjameslee/networked-aframe.git  # Clone the repository.
cd networked-aframe
npm install && npm run easyrtc-install  # Install dependencies.
npm run dev  # Start the local development server.
```
With the server running, browse the examples at `http://localhost:8080`. Open another browser tab and point it to the same URL to see the other client.

For info on how to host your experience on the internet, see the [NAF Hosting Guide](https://github.com/haydenjameslee/networked-aframe/blob/toward-0.3.0/docs/hosting-networked-aframe-on-a-server.md).


Basic Example
-------------
```html
<html>
  <head>
    <title>My Networked-Aframe Scene</title>
    <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.5/socket.io.min.js"></script>
    <script src="easyrtc/easyrtc.js"></script>
    <script src="https://unpkg.com/networked-aframe/dist/networked-aframe.min.js"></script>
  </head>
  <body>
    <a-scene networked-scene>
      <a-assets>
        <script id="avatar-template" type="text/html">
          <a-sphere></a-sphere>
        </script>
      </a-assets>
      <a-entity id="player" networked="template:#avatar-template;showLocalTemplate:false;" camera wasd-controls look-controls>
      </a-entity>
    </a-scene>
  </body>
</html>
```

More Examples
-------------

Open in two tabs if nobody else is online.

* [Basic](http://haydenlee.io/networked-aframe/basic.html)
* [Basic with 4 clients](http://haydenlee.io/networked-aframe/basic-4.html)
* [Dance Club](http://haydenlee.io/networked-aframe/a-saturday-night/index.html)
* [Google Blocks](http://haydenlee.io/networked-aframe/google-blocks.html)
* [Tracked Controllers](http://haydenlee.io/networked-aframe/tracked-controllers.html)
* [Nametags](https://glitch.com/edit/#!/naf-nametags)
* [Minecraft Clone](https://uxvirtual.com/demo/blocks/)
* [More...](http://haydenlee.io/networked-aframe/)

Made something awesome with Networked-Aframe? [Let me know](https://twitter.com/haydenlee37) and I'll include it here!


Documentation
-------------

### Overview

Networked-Aframe works by syncing entities and their components to connected users. To connect to a room you need to add the [`networked-scene`](#scene-component) component to the `a-scene` element. For an entity to be synced, add the `networked` component to it. By default the `position` and `rotation` components are synced, but if you want to sync other components or child components you need to define a [schema](#syncing-custom-components). For more advanced control over the network messages see the sections on [Broadcasting Custom Messages](#sending-custom-messages) and [Options](#options).


### Scene component

Required on the A-Frame `<a-scene>` component.

```html
<a-scene networked-scene="
  serverURL: /;
  app: <appId>;
  room: <roomName>;
  connectOnLoad: true;
  onConnect: onConnect;
  adapter: wseasyrtc;
  audio: false;
  debug: false;
">
  ...
</a-scene>
```

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| serverURL  | Choose where the WebSocket / signalling server is located. | / |
| app  | Unique app name. Spaces are not allowed. | default |
| room  | Unique room name. Can be multiple per app. Spaces are not allowed. There can be multiple rooms per app and clients can only connect to clients in the same app & room. | default |
| connectOnLoad  | Connect to the server as soon as the webpage loads. | true |
| onConnect  | Function to be called when client has successfully connected to the server. | onConnect |
| adapter | The network service that you wish to use, see [adapters](#adapters). | wseasyrtc |
| audio  | Turn on / off microphone audio streaming for your app. Only works if the chosen adapter supports it. | false |
| debug  | Turn on / off Networked-Aframe debug logs. | false |


### Creating Networked Entities

```html
<a-entity networked="template=YOUR_TEMPLATE;showLocalTemplate=true"></a-entity>
```

Create an instance of a template to be synced across clients. The position and rotation will be synced by default. The [`aframe-lerp-component`](https://github.com/haydenjameslee/aframe-lerp-component) is added to allow for less network updates while keeping smooth motion.


| Parameter | Description | Default
| -------- | ------------ | --------------
| template  | A css selector to a script tag stored in `<a-assets>` - [Template documentation](https://github.com/ngokevin/kframe/tree/master/components/template) | ''
| showLocalTemplate  | Set to false to hide the template for the local user. This is most useful for hiding your own avatar's head | true


### Deleting Networked Entities

Currently only the creator of a network entity can delete it. To delete, simply delete the element from the HTML using regular DOM APIs and Networked-Aframe will handle the syncing automatically.


### Syncing Custom Components

By default, the `position` and `rotation` components on the root entity are synced.

To sync other components and components of child entities you need to define a schema per template. Here's how to define and add a schema:

```javascript
NAF.schemas.add({
  template: '#avatar-template',
  components: [
    'position',
    'rotation',
    'scale',
    {
      selector: '.hairs',
      component: 'show-child'
    },
    {
      selector: '.head',
      component: 'material',
      property: 'color'
    },
  ]
});
```

Components of the root entity can be defined with the name of the component. Components of child entities can be defined with an object with both the `selector` field, which uses a standard CSS selector to be used by `document.querySelector`, and the `component` field which specifies the name of the component. To only sync one property of a multi-property component, add the `property` field with the name of the property.

Once you've defined the schema then add it to the list of schemas by calling `NAF.schemas.add(YOUR_SCHEMA)`.

Component data is retrieved by the A-Frame Component `data` property. During the network tick each component's data is checked against its previous synced value; if the data object has changed at all it will be synced across the network.


### Syncing nested templates - eg. hands

To sync nested templates setup your HTML nodes like so:

```HTML
<a-entity id="player" networked="template:#player-template;showLocalTemplate:false;" wasd-controls>
  <a-entity camera look-controls networked="template:#head-template;showLocalTemplate:false;"></a-entity>
  <a-entity hand-controls="left" networked="template:#left-hand-template"></a-entity>
  <a-entity hand-controls="right" networked="template:#right-hand-template"></a-entity>
</a-entity>
```

In this example the head/camera, left and right hands will spawn their own templates which will be networked independently of the root player. Note: this parent-child relationship only works between one level, ie. a child entity's direct parent must have the `networked` component.

### Sending Custom Messages

```javascript
NAF.connection.subscribeToDataChannel(dataType, callback)
NAF.connection.unsubscribeToDataChannel(dataType)

NAF.connection.broadcastData(dataType, data)
NAF.connection.broadcastDataGuaranteed(dataType, data)

NAF.connection.sendData(clientId, dataType, data)
NAF.connection.sendDataGuaranteed(clientId, dataType, data)
```

Subscribe and unsubscribe callbacks to network messages specified by `dataType`. Broadcast data to all clients in your room with the `broadcastData` functions. To send only to a specific client, use the `sendData` functions instead.

| Parameter | Description
| -------- | -----------
| clientId | ClientId to send this data to
| dataType  | String to identify a network message. `u` is a reserved data type, don't use it pls
| callback  | Function to be called when message of type `dataType` is received. Parameters: function(senderId, dataType, data, targetId)
| data | Object to be sent to all other clients


### Events

Events are fired when certain things happen in NAF. To subscribe to these events follow this pattern:

```javascript
document.body.addEventListener('clientConnected', function (evt) {
  console.error('clientConnected event. clientId =', evt.detail.clientId);
});
```
Events need to be subscribed after the document.body element has been created. This could be achieved by waiting for the document.body `onLoad` method, or by using NAF's `onConnect` function. Use the [NAF Events Demo](https://github.com/haydenjameslee/networked-aframe/blob/toward-0.3.0/server/static/basic-events.html#L30) as an example.

List of events:

| Event | Description | Values |
| -------- | ----------- | ------------- |
| clientConnected | Fired when another client connects to you | `evt.detail.clientId` - ClientId of connecting client |
| clientDisconnected | Fired when another client disconnects from you | `evt.detail.clientId` - ClientId of disconnecting client |
| entityCreated | Fired when a networked entity is created | `evt.detail.el` - new entity |
| entityDeleted | Fired when a networked entity is deleted | `evt.detail.networkId` - networkId of deleted entity |


### Adapters

NAF can be used with multiple network libraries and services. An adapter is a class which adds support for a library to NAF. If you're just hacking on a small project or proof of concept you'll probably be fine with the default configuration and you can skip this section. Considerations you should make when evaluating different adapters are:

- How many concurrent users do you need to support in one room?
- Do you want to host your own server? Or would a "serverless" solution like Firebase do the job?
- Do you need audio (microphone) streaming?
- Do you need custom server-side logic?
- Do you want a WebSocket (client-server) network architecture or WebRTC (peer-to-peer)?

I'll write up a post on the answers to these questions soon (please [bug me](https://twitter.com/haydenlee37) about it if you're interested).

By default the `wsEasyRtc` adapter is used, which is an implementation of the open source [EasyRTC](https://github.com/priologic/easyrtc) library that only uses the WebSocket connection. To quickly try WebRTC instead of WebSockets, change the adapter to `easyrtc`, which also supports audio. If you're interested in contributing to NAF a great opportunity is to add support for more adapters and send a pull request.

List of the supported adapters:

| Adapter | Description | Supports Audio | WebSockets vs WebRTC | How to start |
| -------- | ----------- | ------------- | ----------- | ---------- |
| wsEasyRTC | DEFAULT - [EasyRTC](https://github.com/priologic/easyrtc) that only uses the WebSocket connection | No | WebSockets | `npm run start` |
| EasyRTC | [EasyRTC](https://github.com/priologic/easyrtc) | Yes | WebRTC with WebSocket signalling | `npm run start` |
| uWS | Custom implementation of [uWebSockets](https://github.com/uNetworking/uWebSockets) | No | WebSockets | `npm run start:uws` |
| Firebase | Uses [Firebase](https://firebase.google.com/) for WebRTC signalling | Yes | WebRTC with Firebase signalling | See [Firebase Config](#firebase) |

#### Firebase

Firebase is a "serverless" network solution provided by Google. In NAF's case it can be used to establish connections between clients in a peer-to-peer fashion, without having to host a signalling (connection) server.

Steps to setup Firebase:

1. [Sign up for a Firebase account](https://firebase.google.com/)
2. Create a new Firebase project
3. Go to Database -> Rules and change them to the following (warning: not safe for production, just developing)
```javascript
    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }
```
4. Click publish
5. Go back to the project overview
6. Click "Add Firebase to your web app"
7. Copy the credentials into your HTML page, for example see the [Firebase NAF Demo](https://github.com/haydenjameslee/networked-aframe/blob/toward-0.3.0/server/static/firebase-basic.html)
8. Open two tabs of this page and you should see the other tab's avatar

Thanks to [@takahirox](https://github.com/takahirox) for adding Firebase signalling support to NAF!

### Audio

After enabling audio streaming on the `networked-scene` component (and using an adapter that supports it) you will still not hear anything by default. Though the audio will be streaming, it will not be audible until an entity with a `networked-audio-source` is created. The audio from the owner of the entity will be emitted in 3d space from the position of the entity with then `networked-audio-source` attached.

### Misc

```javascript
NAF.connection.isConnected()
```

Returns true if a connection has been established to the signalling server.

```javascript
NAF.connection.getConnectedClients()
```

Returns the list of currently connected clients.


### Options

```javascript
NAF.options.updateRate
```

Frequency the network component `sync` function is called, per second. 10-20 is normal for most Social VR applications. Default is `15`.

```javascript
NAF.options.useLerp
```

By default when an entity is created the [`aframe-lerp-component`](https://github.com/haydenjameslee/aframe-lerp-component) is attached to smooth out position and rotation network updates. Set this to false if you don't want the lerp component to be attached on creation.

```javascript
NAF.options.compressSyncPackets
```

Compress each sync packet into a minimized but harder to read JSON object for saving bandwidth. Default is `false`.

To measure bandwidth usage, run two clients on Chrome and visit chrome://webrtc-internals

Stay in Touch
-------------

- Follow Hayden on [Twitter](https://twitter.com/haydenlee37)
- Follow changes on [GitHub](https://github.com/haydenjameslee/networked-aframe/subscription)
- Join the [A-Frame Slack](https://aframevr-slack.herokuapp.com) and add the #networked-aframe channel
- Let us know if you've made something with Networked-Aframe. We'd love to see it!


Help and More Information
------------------------------

* [Getting started tutorial](https://github.com/haydenjameslee/networked-aframe/blob/master/docs/getting-started-local.md)
* [Edit live example on glitch.com](https://glitch.com/~networked-aframe)
* [Live demo site](http://haydenlee.io/networked-aframe)
* [A-Frame](https://aframe.io/)
* [WebVR](https://webvr.info/)
* [EasyRTC WebRTC library](http://www.easyrtc.com/)
* Bugs and requests can be filed on [GitHub Issues](https://github.com/haydenjameslee/networked-aframe/issues)


Folder Structure
----------------

 * `/ (root)`
   * Licenses and package information
 * `/dist/`
   * Packaged source code for deployment
 * `/server/`
   * Server code
 * `/server/static/`
   * Examples
 * `/src/`
   * Client source code
 * `/tests/`
   * Unit tests


Roadmap
-------

* More examples!
* [Roadmap](https://github.com/haydenjameslee/networked-aframe/projects/1)
* [Add your suggestions](https://github.com/haydenjameslee/networked-aframe/issues)

Interested in contributing? [Shoot me a message](https://twitter.com/haydenlee37) or send a pull request.


Warning
--------

NAF is not supported on nodejs version 7.2.0. Please use a different version of nodejs.



License
-------

This program is free software and is distributed under an [MIT License](LICENSE).
