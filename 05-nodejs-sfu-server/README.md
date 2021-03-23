# Description

Attempt at creating an SFU (selective forwarding unit) server for WebRTC. It works in the following way:

* we treat the server as a WebRTC peer
* each client connects only to the server (which mitigates the WebRTC peer-to-peer grid explosion problem, as more and more user join the room)
* the server takes care of blending all the streams and sending them to the clients.

