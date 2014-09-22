/**
 * @submodule bus.api.Value
 */

/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class IntentsApiTypeValue
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiValue
 * @constructor
 *
 * @param {Object} config
 *@param {Object} config.entity
 * @param {String} config.entity.definitions the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiTypeValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    config=config || {};
    config.allowedContentTypes=["application/ozpIwc-intents-contentType-v1+json"];
    config.contentType="application/ozpIwc-intents-contentType-v1+json";

    ozpIwc.CommonApiValue.apply(this, arguments);
    this.pattern=new RegExp(ozpIwc.util.escapeRegex(this.resource)+"/[^/]*");
    this.entity={
        type: config.intentType,
        actions: []
    };
});

/**
 * Returns if an update is needed.
 * @todo (DOC).
 *
 * @method isUpdateNeeded
 * @param {?} node
 * @returns {Boolean}
 */
ozpIwc.IntentsApiTypeValue.prototype.isUpdateNeeded=function(node) {
    return this.pattern.test(node.resource);
};

/**
 * Updates the Intents Api Type value with a list of changed definitions.
 *
 * @method updateContent
 * @param {String[]} changedNodes
 */
ozpIwc.IntentsApiTypeValue.prototype.updateContent=function(changedNodes) {
    this.version++;
    this.entity.actions=changedNodes.map(function(changedNode) { 
        return changedNode.resource; 
    });
};