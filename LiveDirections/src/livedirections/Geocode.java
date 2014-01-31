package livedirections;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlEnum;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

public class Geocode {
	@XmlRootElement
	public static class Result {
		public StatusCode status; // contains the status of the request, and may contain debugging information to help you track down why Geocoding is not working. 
//		When the geocoder returns results, it places them within a (JSON) results array. Even if the geocoder returns no results (such as if the address doesn't exist) it still returns an empty results array.
		public List<Address> results = new ArrayList<Address>();
		@XmlTransient public String error;
	}
	@XmlEnum(String.class)
	public enum StatusCode {
//		The "status" field may contain the following values:
		OK, // indicates that no errors occurred; the address was successfully parsed and at least one geocode was returned. 
		ZERO_RESULTS, // indicates that the geocode was successful but returned no results. This may occur if the geocode was passed a non-existent address or a latlng in a remote location. 
		OVER_QUERY_LIMIT, // indicates that you are over your quota. 
		REQUEST_DENIED, // indicates that your request was denied, generally because of lack of a sensor parameter. 
		INVALID_REQUEST, // generally indicates that the query (address or latlng) is missing.
//		Non-Google status code
		INVALID_RESULT // internal code for invalid JSON result (JAXBExcepton)
	}
	@XmlEnum(String.class)
	public enum AddressType {
//		The following types are supported and returned by the HTTP Geocoder:
		street_address, // indicates a precise street address. 
		route, // indicates a named route (such as "US 101"). 
		intersection, // indicates a major intersection, usually of two major roads. 
		political, // indicates a political entity. Usually, this type indicates a polygon of some civil administration. 
		country, // indicates the national political entity, and is typically the highest order type returned by the Geocoder. 
		administrative_area_level_1, // indicates a first-order civil entity below the country level. Within the United States, these administrative levels are states. Not all nations exhibit these administrative levels. 
		administrative_area_level_2, // indicates a second-order civil entity below the country level. Within the United States, these administrative levels are counties. Not all nations exhibit these administrative levels. 
		administrative_area_level_3, // indicates a third-order civil entity below the country level. This type indicates a minor civil division. Not all nations exhibit these administrative levels. 
		colloquial_area, // indicates a commonly-used alternative name for the entity. 
		locality, // indicates an incorporated city or town political entity. 
		sublocality, // indicates an first-order civil entity below a locality 
		neighborhood, // indicates a named neighborhood 
		premise, // indicates a named location, usually a building or collection of buildings with a common name 
		subpremise, // indicates a first-order entity below a named location, usually a singular building within a collection of buildings with a common name 
		postal_code, // indicates a postal code as used to address postal mail within the country. 
		natural_feature, // indicates a prominent natural feature. 
		airport, // indicates an airport. 
		park, // indicates a named park. 
		point_of_interest, // indicates a named point of interest. Typically, these "POI"s are prominent local entities that don't easily fit in another category such as "Empire State Building" or "Statue of Liberty." 
//		In addition to the above, address components may exhibit the following types:
		post_box, // indicates a specific postal box. 
		street_number, // indicates the precise street number. 
		floor, // indicates the floor of a building address. 
		room // indicates the room of a building address. 
	}
	@XmlEnum(String.class)
	public enum LocationType { // stores additional data about the specified location. The following values are currently supported:
		ROOFTOP, // indicates that the returned result is a precise geocode for which we have location information accurate down to street address precision. 
		RANGE_INTERPOLATED, // indicates that the returned result reflects an approximation (usually on a road) interpolated between two precise points (such as intersections). Interpolated results are generally returned when rooftop geocodes are unavailable for a street address. 
		GEOMETRIC_CENTER, // indicates that the returned result is the geometric center of a result such as a polyline (for example, a street) or polygon (region). 
		APPROXIMATE // indicates that the returned result is approximate. 
	}
	public static class Address {
		public List<AddressType> types = new ArrayList<AddressType>();
		public String formatted_address;
		public List<AddressComponent> address_components = new ArrayList<AddressComponent>();
		public Geometry geometry;
		public boolean partial_match;
		@XmlTransient public int conf_level;
		
		public double distance(Geo.LatLng ll0) {
			return Geo.distance(ll0, geometry.location);
		}
	}
	public static class AddressComponent {
		public List<AddressType> types = new ArrayList<AddressType>();
		public String long_name; // is the full text description or name of the address component as returned by the Geocoder. 
		public String short_name; // is an abbreviated textual name for the address component, if available. For example, an address component for the state of Alaska may have a long_name of "Alaska" and a short_name of "AK" using the 2-letter postal abbreviation. 
	}
	public static class Geometry {
		public Geo.LatLng location; // contains the geocoded latitude,longitude value. For normal address lookups, this field is typically the most important. 
		public LocationType location_type;
		public Viewport viewport;
		public Viewport bounds;
	}
	public static class Viewport {
		public Geo.LatLng southwest;
		public Geo.LatLng northeast;
		public Viewport() {}
		public Viewport(Geo.LatLng southwest, Geo.LatLng northeast) { this.southwest  = southwest; this.northeast = northeast; }
		public String toString() { return southwest + "|" + northeast; }
	}
}
