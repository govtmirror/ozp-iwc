##Connecting
To use IWC between applications, IWC client connections must be added to each application.
These clients connect to an IWC bus that is bound by the browser as well as the domain it is obtained from.

```
var iwc = new ozpIwc.Client("http://localhost:13000");

iwc.connect().then(function(){
   /* client use goes here */
});
```

In this example, an IWC connection is made to the bus on domain `http://localhost:13000.`
The actual javascript that makes up the bus is gathered from that url and ran locally enclosed in the same domain.

All aspects of the client use promises to simplify integration with asynchronous applications.

When connecting to a platform hosts bus, the host should provide documention on where to connect. In many cases it may
not be the root path of a domain.

***

##Disconnecting
Disconnecting an application from the IWC bus is as simple as calling `disconnect().`

```
var iwc = new ozpIwc.Client("http://localhost:13000");

iwc.connect().then(function(){
    iwc.disconnect();
});
```
