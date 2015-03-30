Cue.addJob('check_for_dominus', {retryOnError:false, maxMs:1000*60*2}, function(task, done) {
	var num_users = Meteor.users.find({castle_id: {$exists: true}}).count()

	if (num_users <= 1) {
		done();
		return;
	}

	var dominus = Meteor.users.findOne({is_dominus: true}, {fields: {_id:1}})
	var is_still_dominus = false

	// set everyone to not dominus
	Meteor.users.find({is_dominus: true}).forEach(function(u) {
		Meteor.users.update(u._id, {$set: {is_dominus: false}})
	})

	// find dominus
	Meteor.users.find({num_allies_below: num_users-1}).forEach(function(d) {
		Meteor.users.update(d._id, {$set: {is_dominus: true}})

		if (dominus) {
			if (d._id == dominus._id) {
				is_still_dominus = true
			} else {
				new_dominus_event(d)
			}
		} else {
			new_dominus_event(d)
		}
	})

	// if old dominus is no longer dominus
	// there is a new dominus
	if (dominus) {
		if (!is_still_dominus) {
			alert_noLongerDominus(dominus._id)
		}
	}

	done()
})


Cue.addJob('removeDominus', {retryOnError:false, maxMs:1000*60*2}, function(task, done) {
	remove_dominus()
	done()
})

// called when new user joins the game
remove_dominus = function() {
	var dominus = Meteor.users.findOne({is_dominus:true}, {fields:{_id:1}})
	if (dominus) {
		gAlert_noLongerDominusNewUser(dominus._id)
		alert_noLongerDominusNewUser(dominus._id)
		Meteor.users.update(dominus._id, {$set: {is_dominus: false}})
	}
}


// happens when there is a new dominus
new_dominus_event = function(dominus_user) {
	check(dominus_user, Object);
	check(dominus_user._id, String);
	check(dominus_user.emails[0].address, String);

	// make sure dominus and last dominus are not the same
	var lastDominus = Settings.findOne({name: 'lastDominusUserId'})

	if (lastDominus) {
		var lastDominusUserId = lastDominus.value
	} else {
		var lastDominusUserId = null
	}

	if (dominus_user._id != lastDominusUserId) {

		// set game end date
		var endDate = moment(new Date()).add(s.time_til_game_end_when_new_dominus, 'ms').toDate()
		Settings.upsert({name: 'gameEndDate'}, {$set: {name: 'gameEndDate', value: endDate}})
		Settings.upsert({name: 'lastDominusUserId'}, {$set: {name: 'lastDominusUserId', value: dominus_user._id}})
	}

	// send notifications
	gAlert_newDominus(dominus_user._id, lastDominusUserId);
	alert_youAreDominus(dominus_user._id);

	// update profile
	var options = {};
	callLandingMethod('profile_becameDominus', dominus_user.emails[0].address, options);
}