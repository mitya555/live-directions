/**
 * 
 */
RegExp.prototype.split = function(s) {
	var old_g = this.global;
	this.global = true;
	var res = [];
	var last_index = this.lastIndex = 0;
	while (true) {
		var match = this.exec(s);
		if (match != null) {
			res.push(s.substring(last_index, this.lastIndex - match[0].length));
			last_index = this.lastIndex;
		}
		else {
			res.push(s.substring(last_index));
			break;
		}
	}
	this.global = old_g;
	return res;
};
Array.prototype.remove = function(o) {
	for (var j = 0; j < this.length; j++)
		if (this[j] === o) {
			this.splice(j, 1);
			break;
		}
};
String.prototype.startsWith = function(c) { return (this.substring(0, c.length) == c); };
String.prototype.endsWith = function(c) { return (this.substring(this.length - c.length) == c); };

function geocode() {

	function trimStart(s, c) {
		while (s.substring(0, c.length) == c)
			s = s.substring(c.length);
		return s;
	}
	function trimEnd(s, c) {
		while (s.substring(s.length - c.length) == c)
			s = s.substring(0, s.length - c.length);
		return s;
	}
	
	var googleGeocodeUrl =
		"http://maps.googleapis.com/maps/api/geocode/json?sensor=false&";
	
	function findAddress(s, func, err_func) {
		var coords = /[,;:&\*#'"]/g.split(s);
		var lat0, lng0;
		if (coords.length == 2 &&
				coords[0].startsWith("(") && coords[1].endsWith(")") &&
				!isNaN(lat0 = parseFloat(trimStart(coords[0], '('))) &&
				!isNaN(lng0 = parseFloat(trimEnd(coords[1], ')')))) {
			// no geocoding when coords are in parentheses
			func({
					"type": "latlon",
					"a": [{
							"name": "(" + lat0 + "," + lng0 + ")",
							"lat": lat0,
							"lon": lng0,
							"conf_level": 100,
							"max_conf_level": 100
					}]
			});
		}
		else if (coords.length == 2 &&
				!isNaN(lat0 = parseFloat(coords[0])) &&
				!isNaN(lng0 = parseFloat(coords[1]))) {
			// reverse geocoding
			var ll0 = new google.maps.LatLng(lat0, lng0);
//			var bounds = new google.maps.LatLngBounds(
//				geo_ll_to(ll0, 225, 100 * Math.sqrt(2)),
//				geo_ll_to(ll0, 45, 100 * Math.sqrt(2)));
			new google.maps.Geocoder().geocode({
				"location": ll0/*,
				"bounds": bounds*/
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var ret = results.length > 0 ? results : [{
						formatted_address: "" + ll0.lat() + "," + ll0.lng(),
						geometry: {
							location: ll0,
							location_type: google.maps.GeocoderLocationType.ROOFTOP
						}
					}];
						rankReverseGeocodingResult(ret.slice(0), ll0, 100);
						var max_conf_level = ret.slice(0).sort(function(a1, a2) {
							return a1.conf_level - a2.conf_level;
						})[ret.length - 1].conf_level;
						sort_by_distance(ret, ll0);
						var res = {
								"type": "reverse",
								"lat": ll0.lat(),
								"lng": ll0.lng(),
								"a": []
						};
					for (var j = 0; j < ret.length; j++) {
						var a = ret[j];
						res.a.push({
								"name": a.formatted_address,
								"lat": a.geometry.location.lat(),
								"lon": a.geometry.location.lng(),
								"conf_level": a.conf_level,
								"dist": geo_distance(ll0, a.geometry.location),
								"max_conf_level": a.conf_level == max_conf_level
						});
					}
					func(res);
				}
				else
					err_func(status);
			});
		}
		else {
			// straight geocoding
			new google.maps.Geocoder().geocode({
				"address": s
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var addr_type = results[0].types[0];
					var res = {
							"type": (addr_type == "street_address" ? "address" : addr_type),
							"a": []
					};
					for (var j = 0; j < results.length; j++) {
						var a = results[j];
						res.a.push({
							"name": a.formatted_address,
							"lat": a.geometry.location.lat(),
							"lon": a.geometry.location.lng(),
							"conf_level": (results.length <= 1 ? 100 : 50),
							"max_conf_level": true
						});
					}
					func(res);
				}
				else
					err_func(status);
			});
		}
	}
	
	function angle180(ll0, a1, a2) {
		var b2 = geo_bearing(ll0, a2.geometry.location),
		b1 = geo_bearing(ll0, a1.geometry.location),
		delta = b2 - b1;
		return Math.abs(delta) > 180 ? delta > 0 ? delta - 360 : delta + 360 : delta;
	}
	function angle360(ll0, a1, a2) {
		var angle = angle180(ll0, a1, a2);
		return angle < 0 ? angle + 360 : angle;
	}
	function compare_(d1, d2) {
		return d1 == d2 ? 0 : d1 > d2 ? 1 : -1;
	}
	function sort_by_distance(list, ll0) {
		return list.sort(function(a1, a2) {
			return compare_(
					geo_distance(ll0, a1.geometry.location),
					geo_distance(ll0, a2.geometry.location));
		});
	}
	function getRing(list, ll0) {
		var min_dist = geo_distance(ll0,
				sort_by_distance(list.slice(0), ll0)[0].geometry.location); 
		var res = [];
		for (var j = 0; j < list.length; j++) {
			var a = list[j];
			var dist = geo_distance(ll0, a.geometry.location);
			if (dist <= 0 || dist - min_dist < min_dist / 2)
				res.push(a);
		}
		return res;
	}
	function sortAngle(list, a, ll0) {
		list.sort(function(a1, a2) {
			return compare_(angle360(ll0, a, a1), angle360(ll0, a, a2));
		});
	}
	function handleGroup(list, conf_level, ll0) {
		sort_by_distance(list, ll0);
		list[0].conf_level = conf_level;
		for (var j = 1; j < list.length; j++)
			list[j].conf_level = conf_level - 1;
	}
	function rankReverseGeocodingResult(list, ll0, conf_level)
	{
		if (list.length == 0)
			return;
		var ring = getRing(list, ll0);
		for (var j = 0; j < ring.length; j++)
			list.remove(ring[j]);
		if (ring.length == 1)
			ring[0].conf_level = conf_level;
		else
		{
			conf_level -= 5;
			sortAngle(ring, ring[0], ll0);
			var ANGLE = 35; // degrees
			var i;
			for (i = 1; i < ring.length; i++)
				if (Math.abs(angle180(ll0, ring[i], ring[i - 1])) > ANGLE)
					break;
			if (i < ring.length)
			{
				sortAngle(ring, ring[i], ll0);
				var group = [ ring[0] ];
				for (i = 1; i < ring.length; i++)
					if (Math.abs(angle180(ll0, ring[i], ring[i - 1])) > ANGLE)
					{
						// handle group
						handleGroup(group, conf_level, ll0);
						// start new group
						group = [ ring[i] ];
					}
					else
						group.push(ring[i]);
				handleGroup(group, conf_level, ll0);
			}
			else
				handleGroup(ring, conf_level, ll0);
		}
		rankReverseGeocodingResult(list, ll0, conf_level - 5);
	}

	this.findAddress = findAddress;
}