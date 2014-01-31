Number.prototype.toRad = function() {
	return this * Math.PI / 180;
};

Number.prototype.toDeg = function() {
	return this * 180 / Math.PI;
};

var  
// geo functions
geo_bearing = function(ll_from, ll_to) {
	var lat1 = ll_from.lat().toRad(), lat2 = ll_to.lat().toRad(),
		dLon = (ll_to.lng() - ll_from.lng()).toRad(),
		y = Math.sin(dLon) * Math.cos(lat2),
		x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon),
		brng = Math.atan2(y, x);
	return (brng.toDeg() + 360) % 360;
},
earth_radius = 6371000, // in meters
geo_ll_to = function(ll_from, bearing, distance) {
	var lat1 = ll_from.lat().toRad(), lon1 = ll_from.lng().toRad(), brng = bearing.toRad(),
		lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / earth_radius) + Math.cos(lat1) * Math.sin(distance / earth_radius) * Math.cos(brng)),
		lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / earth_radius) * Math.cos(lat1), Math.cos(distance / earth_radius) - Math.sin(lat1) * Math.sin(lat2));
	return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
},
geo_distance = function(ll_from, ll_to) {
	var lat1 = ll_from.lat().toRad(), lat2 = ll_to.lat().toRad(),
		dLat = lat2 - lat1, dLon = (ll_to.lng() - ll_from.lng()).toRad(),
		a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earth_radius * c;
},
geo_cross_track_angle = function(d13, b13, b12) {
	return Math.asin(Math.sin(d13 / earth_radius) * Math.sin((b13 - b12).toRad()));
},
geo_cross_track_distance = function(point, ll_from, bearing) {
	var d13 = geo_distance(ll_from, point),
		b13 = geo_bearing(ll_from, point);
	return geo_cross_track_angle(d13, b13, bearing) * earth_radius;
},
geo_cross_track_point = function(point, ll_from, bearing) {
	var d13 = geo_distance(ll_from, point),
		b13 = geo_bearing(ll_from, point);
	return geo_ll_to(ll_from, bearing,
		Math.acos(Math.cos(d13 / earth_radius) / Math.cos(geo_cross_track_angle(d13, b13, bearing))) * earth_radius);
},
// heading functions
heading_angle = function(heading2, heading1) {
	var angle = Math.abs(heading2 - heading1);
	return angle > 180 ? 360 - angle : angle;
},
heading_delta = function(new_heading, old_heading) {
	var delta = new_heading - old_heading;
	return Math.abs(delta) > 180 ? delta > 0 ? delta - 360 : delta + 360 : delta;
},
heading_normalize = function(heading) {
	heading %= 360;
	return heading < 0 ? heading + 360 : heading;
},
heading_turn = function(heading, delta) {
	return heading_normalize(heading + delta);
},
heading_discrete = function(heading, heading_step) {
	var rm = heading % heading_step;
	return Math.round(rm >= heading_step / 2 ? heading + heading_step - rm : heading - rm);
},
heading_opposite = function(heading) { return heading < 180 ? heading + 180 : heading - 180; },
geo_path_distance = function(path1, path2, point) {
	var brng = geo_bearing(path1, path2);
	if (heading_angle(geo_bearing(path1, point), brng) >= 90)
		return geo_distance(path1, point);
	else if (heading_angle(geo_bearing(path2, point), heading_opposite(brng)) >= 90)
		return geo_distance(path2, point);
	else
		return geo_cross_track_distance(point, path1, brng);
},
geo_path_point = function(path1, path2, point) {
	var brng = geo_bearing(path1, path2);
	if (heading_angle(geo_bearing(path1, point), brng) >= 90)
		return path1;
	else if (heading_angle(geo_bearing(path2, point), heading_opposite(brng)) >= 90)
		return path2;
	else
		return geo_cross_track_point(point, path1, brng);
};
