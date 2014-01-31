package test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Arrays;
import java.util.HashSet;
import javax.servlet.http.*;

import livedirections.Geo;
import livedirections.json.api.Json;

@SuppressWarnings("serial")
public class TestGeocodeServlet extends HttpServlet {
	
	private static final String googleGeocodeUrl =
		"http://maps.googleapis.com/maps/api/geocode/json?sensor=false&";
	
	private static String callGeocode(String query) throws MalformedURLException, IOException {
		HttpURLConnection connection = null;
		InputStream responseStream = null;
		StringBuilder res = new StringBuilder();
		try {
			connection = (HttpURLConnection)new URL(googleGeocodeUrl + query).openConnection();
			connection.setRequestMethod("GET");
			connection.connect();
			responseStream = connection.getInputStream();
			Reader reader = new BufferedReader(new InputStreamReader(responseStream));
			char[] cbuf = new char[8192];
			int chars = 0;
			while ((chars = reader.read(cbuf, 0, 8192)) > -1)
				res.append(cbuf, 0, chars);
		} finally {
			connection.disconnect();
		}
		return res.toString();
	}
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setHeader("Cache-Control", "no-cache, no-store");
		resp.setHeader("Pragma", "no-cache");
		resp.setContentType("text/plain");
		String res = null;
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
								"max_conf_level", 100))).toString();
			}
			else if (coords.length == 2 &&
					(lat0 = tryParseDouble(coords[0])).success &&
					(lng0 = tryParseDouble(coords[1])).success) {
				// reverse geocoding
	            final Geo.LatLng ll0 = new Geo.LatLng(lat0.result, lng0.result);
//	            Geocode.Viewport bounds = new Geocode.Viewport(
//	            		Geo.ll_to(ll0, 225d, 100d * Math.sqrt(2d)),
//	            		Geo.ll_to(ll0, 45d, 100d * Math.sqrt(2d)));
	            res = callGeocode("latlng=" + ll0/* +
	            		"&bounds=" + URLEncoder.encode(bounds.toString(), "UTF-8")*/);
			}
			else {
				// straight geocoding
				res = callGeocode("address=" +
	            		URLEncoder.encode(req.getParameter("find"), "UTF-8"));
			}
		}
		resp.getWriter().print(res);
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
