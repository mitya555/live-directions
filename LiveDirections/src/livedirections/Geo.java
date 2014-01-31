package livedirections;

public class Geo {
	
	private static final double earth_radius = 6371000d; // in meters
	
	public static double distance(LatLng ll_from, LatLng ll_to) {
		double lat1 = toRad(ll_from.lat), lat2 = toRad(ll_to.lat),
		dLat = lat2 - lat1,
		dLon = toRad(ll_to.lng - ll_from.lng),
		a = Math.sin(dLat / 2d) * Math.sin(dLat / 2d) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2d) * Math.sin(dLon / 2d),
		c = 2d * Math.atan2(Math.sqrt(a), Math.sqrt(1d - a));
		return earth_radius * c;
	}
	
	public static double bearing(LatLng ll_from, LatLng ll_to) {
		double lat1 = toRad(ll_from.lat), lat2 = toRad(ll_to.lat),
		dLon = toRad(ll_to.lng - ll_from.lng),
		y = Math.sin(dLon) * Math.cos(lat2),
		x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon),
		brng = Math.atan2(y, x);
		return (toDeg(brng) + 360d) % 360d;
	}
	
	public static LatLng ll_to(LatLng ll_from, double bearing, double distance) {
		double lat1 = toRad(ll_from.lat), lon1 = toRad(ll_from.lng), brng = toRad(bearing),
			lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / earth_radius) + Math.cos(lat1) * Math.sin(distance / earth_radius) * Math.cos(brng)),
			lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / earth_radius) * Math.cos(lat1), Math.cos(distance / earth_radius) - Math.sin(lat1) * Math.sin(lat2));
		return new LatLng(toDeg(lat2), toDeg(lon2));
	}
	
	private static double toRad(double deg) {
		return deg * Math.PI / 180d;
	}
	
	private static double toDeg(double rad) {
		return rad * 180d / Math.PI;
	}
	
	public static class LatLng {
		public double lat;
		public double lng;
		public LatLng() {}
		public LatLng(double lat, double lng) { this.lat  = lat; this.lng = lng; }
		public String toString() { return lat + "," + lng; }
	}
}
