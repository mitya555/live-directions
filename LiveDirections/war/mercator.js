
// http://www.heywhatsthat.com/techfaq.html
// convert x, y in number of tiles in mercator projection relative to the North Pole to lat, lng
var PI = 4 * Math.atan2(1, 1);
function degrees_to_radians(deg) { return deg * PI / 180; }
function radians_to_degrees(rad) { return rad * 180 / PI; }
// .5 ln( (1 + sin t) / (1 - sin t) )
function mercator(deg) {
	var s = Math.sin(degrees_to_radians(deg));
	return radians_to_degrees(.5 * Math.log((1 + s) / (1 - s)));
}
// arcsin((e^2x - 1)/(e^2x + 1))
function inverse_mercator(deg) {
	var e = Math.exp(2 * degrees_to_radians(deg));
	e = (e - 1) / (e + 1);
	return radians_to_degrees(Math.atan2(e, Math.sqrt(1 - e * e)));
}
function get_tile_latlng(x, y, zoom) {
	var d = Math.pow(2, zoom);
	var lon_extent = 360 / d;
	var merclat_extent = 360 / d;

	// (lat1, lon0) is upper left of tile
	var l = 180 - y * merclat_extent;
	var lat1 = inverse_mercator(l);
	var lon0 = x * lon_extent - 180;
	var lat0 = inverse_mercator(l - merclat_extent);
	var lon1 = lon0 + lon_extent;

	return { lat0: lat1, lng0: lon0, lat1: lat0, lng1: lon1 };
}
