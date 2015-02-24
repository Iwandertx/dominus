var helpers = {
    user: function() {
        return AlertUsers.findOne(this.vars.user_id)
    },

    title: function() {
        var user = AlertUsers.findOne(this.vars.user_id)
        if (user) {
            return this.vars.previousName +"'s new name is "+this.vars.newName
        }
    }
}


Template.ga_nameChange.helpers(_.extend(globalAlertSharedHelpers, helpers))
Template.ga_nameChange.events = alertSharedEvents
Template.ga_nameChange.rendered = alertSharedRendered


Template.ga_nameChange.created = function() {
    var self = this

    self.isOpen = new ReactiveVar(false)

    self.autorun(function() {
        if (Template.currentData()) {
            Meteor.subscribe('alertUser', Template.currentData().vars.user_id)
        }
    })
}