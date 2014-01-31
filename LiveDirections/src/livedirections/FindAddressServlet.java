package livedirections;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

import javax.servlet.http.*;
import javax.xml.bind.JAXBException;

import livedirections.json.api.Json;
import livedirections.json.api.JsonServiceClient;

@SuppressWarnings("serial")
public class FindAddressServlet extends HttpServlet {
	
	private static final String googleGeocodeUrl =
		"http://maps.googleapis.com/maps/api/geocode/json?sensor=false&";
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setHeader("Cache-Control", "no-cache, no-store");
		resp.setHeader("Pragma", "no-cache");
		resp.setContentType("text/plain");
		Json res = null;
		if (req.getParameter("find") != null) {
			String[] coords = req.getParameter("find").split("[,;:&\\*#'\"]");
			ParseDouble lat0, lng0;
			if (coords.length == 2 &&
					coords[0].startsWith("(") && coords[1].endsWith(")") &&
					(lat0 = tryParseDouble(trimStart(coords[0], '('))).success &&
					(lng0 = tryParseDouble(trimEnd(coords[1], ')'))).success) {
				// no geocoding when coords are in parentheses
				res = new Json.Obj(
						"type", "latlon",
						"a", new Json.Arr(new Json.Obj(
								"name", "(" + lat0 + "," + lng0 + ")",
								"lat", lat0.result,
								"lon", lng0.result,
								"conf_level", 100,
								"max_conf_level", 100)));
			}
			else if (coords.length == 2 &&
					(lat0 = tryParseDouble(coords[0])).success &&
					(lng0 = tryParseDouble(coords[1])).success) {
				// reverse geocoding
	            final Geo.LatLng ll0 = new Geo.LatLng(lat0.result, lng0.result);
//	            Geocode.Viewport bounds = new Geocode.Viewport(
//	            		Geo.ll_to(ll0, 225d, 100d * Math.sqrt(2d)),
//	            		Geo.ll_to(ll0, 45d, 100d * Math.sqrt(2d)));
	            final Geocode.Result json = googleGeocode("latlng=" + ll0/* +
	            		"&bounds=" + URLEncoder.encode(bounds.toString(), "UTF-8")*/);
	            final List<Geocode.Address> ret = new ArrayList<Geocode.Address>(
	            		json.results.size() > 0 ? json.results : Arrays.asList(
	            				new Geocode.Address() {{
	            					formatted_address = "" + ll0.lat + "," + ll0.lng;
	            					geometry = new Geocode.Geometry() {{
	            						location = ll0;
	            					}};
	            				}}));
				rankReverseGeocodingResult(new ArrayList<Geocode.Address>(ret), ll0, 100);
				final int max_conf_level = Collections.max(ret, new Comparator<Geocode.Address>() {
					public int compare(Geocode.Address a1, Geocode.Address a2) {
						return a1.conf_level - a2.conf_level;
					}
				}).conf_level;
				Collections.sort(ret, new Comparator<Geocode.Address>() {
					public int compare(Geocode.Address a1, Geocode.Address a2) {
						return compare_(a1.distance(ll0), a2.distance(ll0));
					}
				});
				res = new Json.Obj(
						"type", "reverse",
						"lat", ll0.lat,
						"lng", ll0.lng,
						"a", new Json.Arr() {{
							for (Geocode.Address a : ret)
								add(new Json.Obj(
										"name", a.formatted_address,
										"lat", a.geometry.location.lat,
										"lon", a.geometry.location.lng,
										"conf_level", a.conf_level,
										"dist", a.distance(ll0),
										"max_conf_level", a.conf_level == max_conf_level));
						}});
			}
			else {
				// straight geocoding
	            final Geocode.Result json = googleGeocode("address=" +
	            		URLEncoder.encode(req.getParameter("find"), "UTF-8"));
	            if (json.status == Geocode.StatusCode.OK) {
	            	Geocode.AddressType addr_type = json.results.get(0).types.get(0);
	            	res = new Json.Obj("type", addr_type == Geocode.AddressType.street_address ? "address" : addr_type.toString(),
							"a", new Json.Arr() {{
								for (Geocode.Address a : json.results)
									add(new Json.Obj(
											"name", a.formatted_address,
											"lat", a.geometry.location.lat,
											"lon", a.geometry.location.lng,
											"conf_level", json.results.size() <= 1 ? 100 : 50,
											"max_conf_level", true));
							}});
				}
			}
		}
		resp.getWriter().print(res);
	}

	public Geocode.Result googleGeocode(String query) throws MalformedURLException,
			IOException, ProtocolException {
		try {
			 return JsonServiceClient.get(Geocode.Result.class,
					 googleGeocodeUrl + query);
		} catch (JAXBException e) {
			e.printStackTrace();
			final StringWriter err = new StringWriter();
			e.printStackTrace(new PrintWriter(err));
			return new Geocode.Result() {{
				status = Geocode.StatusCode.INVALID_RESULT;
				error = err.toString();
			}};
		}
	}

	private static double angle180(Geo.LatLng ll0, Geocode.Address a1, Geocode.Address a2) {
		double b2 = Geo.bearing(ll0, a2.geometry.location),
		b1 = Geo.bearing(ll0, a1.geometry.location),
		delta = b2 - b1;
		return Math.abs(delta) > 180d ? delta > 0d ? delta - 360d : delta + 360d : delta;
	}
	private static double angle360(Geo.LatLng ll0, Geocode.Address a1, Geocode.Address a2) {
		double a = angle180(ll0, a1, a2);
		return a < 0d ? a + 360d : a;
	}
	public static int compare_(double d1, double d2) {
		return d1 == d2 ? 0 : d1 > d2 ? 1 : -1;
	}
	private static List<Geocode.Address> getRing(List<Geocode.Address> list, final Geo.LatLng ll0) {
		double min_dist = Collections.min(list, new Comparator<Geocode.Address>() {
			public int compare(Geocode.Address a1, Geocode.Address a2) {
				return compare_(a1.distance(ll0), a2.distance(ll0));
			}
		}).distance(ll0);
		List<Geocode.Address> res = new ArrayList<Geocode.Address>();
		for (Geocode.Address a : list) {
			double dist = a.distance(ll0);
			if (dist <= 0d || dist - min_dist < min_dist / 2d)
				res.add(a);
		}
		return res;
	}
	private static void sortAngle(List<Geocode.Address> list, final Geocode.Address a, final Geo.LatLng ll0) {
		Collections.sort(list, new Comparator<Geocode.Address>() {
			public int compare(Geocode.Address a1, Geocode.Address a2) {
				return compare_(angle360(ll0, a, a1), angle360(ll0, a, a2));
			}
		});
	}
	private static void handleGroup(List<Geocode.Address> list, int conf_level, final Geo.LatLng ll0) {
		Collections.sort(list, new Comparator<Geocode.Address>() {
			public int compare(Geocode.Address a1, Geocode.Address a2) {
				return compare_(a1.distance(ll0), a2.distance(ll0));
			}
		});
		list.get(0).conf_level = conf_level;
		for (int j = 1; j < list.size(); j++)
			list.get(j).conf_level = conf_level - 1;
	}
	private static void rankReverseGeocodingResult(List<Geocode.Address> list, final Geo.LatLng ll0, int conf_level)
	{
		if (list.size() == 0)
			return;
		List<Geocode.Address> ring = getRing(list, ll0);
		for (Geocode.Address a : ring)
			list.remove(a);
		if (ring.size() == 1)
			ring.get(0).conf_level = conf_level;
		else
		{
			conf_level -= 5;
			sortAngle(ring, ring.get(0), ll0);
			final double ANGLE = 35; // degrees
			int i;
			for (i = 1; i < ring.size(); i++)
				if (Math.abs(angle180(ll0, ring.get(i), ring.get(i - 1))) > ANGLE)
					break;
			if (i < ring.size())
			{
				sortAngle(ring, ring.get(i), ll0);
				List<Geocode.Address> group = new ArrayList<Geocode.Address>(
						Arrays.asList(new Geocode.Address[] { ring.get(0) }));
				for (i = 1; i < ring.size(); i++)
					if (Math.abs(angle180(ll0, ring.get(i), ring.get(i - 1))) > ANGLE)
					{
						// handle group
						handleGroup(group, conf_level, ll0);
						// start new group
						group = new ArrayList<Geocode.Address>(
								Arrays.asList(new Geocode.Address[] { ring.get(i) }));
					}
					else
						group.add(ring.get(i));
				handleGroup(group, conf_level, ll0);
			}
			else
				handleGroup(ring, conf_level, ll0);
		}
		rankReverseGeocodingResult(list, ll0, conf_level - 5);
	}

	private class ParseDouble {
		public boolean success;
		public double result;
		public String toString() { return new Double(result).toString(); }
	}
	private ParseDouble tryParseDouble(String str) {
		ParseDouble res = new ParseDouble();
		try {
			res.result = Double.parseDouble(str);
			res.success = true;
		}
		catch (NumberFormatException ex) {}
		return res;
	}
	
	private static String trimStart(String str, Character... c) {
		HashSet<Character> set = new HashSet<Character>(Arrays.asList(c));
		while (set.contains(str.charAt(0)))
			str = str.substring(1);
		return str;
	}
	private static String trimEnd(String str, Character... c) {
		HashSet<Character> set = new HashSet<Character>(Arrays.asList(c));
		while (set.contains(str.charAt(str.length() - 1)))
			str = str.substring(0, str.length() - 1);
		return str;
	}
}
