/**
 * @submodule bus.api.Value
 */

/**
 * @class DataApiValue
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiValue
 * @constructor
 *
 * @type {Function}
 */
ozpIwc.DataApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
	ozpIwc.CommonApiValue.apply(this,arguments);
    config = config || {};
	this.children=config.children || [];
	this.persist=config.persist || true;
	this.dirty=config.dirty || true;
});

/**
 * Adds a child resource to the Data Api value.
 *
 * @param {String} child - name of the child record of this
 */
ozpIwc.DataApiValue.prototype.addChild=function(child) {
    if(this.children.indexOf(child) < 0) {
        this.children.push(child);
    	this.version++;
    }
	this.dirty= true;
};

/**
 *
 * Removes a child resource from the Data Api value.
 *
 * @param {String} child - name of the child record of this
 */
ozpIwc.DataApiValue.prototype.removeChild=function(child) {
	this.dirty= true;
	var originalLen=this.children.length;
    this.children=this.children.filter(function(c) {
        return c !== child;
    });
    if(originalLen !== this.children.length) {
     	this.version++;
    }
};

/**
 * Lists all children resources of the Data Api value.
 *
 * @param {string} child - name of the child record of this
 * @returns {String[]}
 */
ozpIwc.DataApiValue.prototype.listChildren=function() {
    return ozpIwc.util.clone(this.children);
};

/**
 * Converts the Data Api value to a {{#crossLink "ozpIwc.TransportPacket"}}{{/crossLink}}.
 *
 * @param {String} child - name of the child record of this
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.DataApiValue.prototype.toPacket=function() {
	var packet=ozpIwc.CommonApiValue.prototype.toPacket.apply(this,arguments);
	packet.links=packet.links || {};
	packet.links.children=this.listChildren();
	return packet;
};

/**
 * Returns a comparison of the current Data Api value to a previous snapshot.
 * @param snapshot
 * @returns {Object}
 */
ozpIwc.DataApiValue.prototype.changesSince=function(snapshot) {
    var changes=ozpIwc.CommonApiValue.prototype.changesSince.apply(this,arguments);
	if(changes) {
        changes.removedChildren=snapshot.links.children.filter(function(f) {
            return this.indexOf(f) < 0;
        },this.children);
        changes.addedChildren=this.children.filter(function(f) {
            return this.indexOf(f) < 0;
        },snapshot.links.children);
	}
    return changes;
};

/**
 * Deserializes a Data Api value from a packet and constructs this Data Api value.
 *
 * @param {ozpIwc.TransportPacket} serverData
 */
ozpIwc.DataApiValue.prototype.deserialize=function(serverData) {
    this.entity=serverData.entity;
    this.contentType=serverData.contentType || this.contentType;
	this.permissions=serverData.permissions || this.permissions;
	this.version=serverData.version || this.version;
	this.self=serverData.version || this.self;
};

ozpIwc.DataApiValue.prototype.serialize=function() {
	var serverData = {};
	serverData.entity=this.entity;
	serverData.contentType=this.contentType;
	serverData.permissions=this.permissions;
	serverData.version=this.version;
	serverData.self=this.self;
	return serverData;
};

