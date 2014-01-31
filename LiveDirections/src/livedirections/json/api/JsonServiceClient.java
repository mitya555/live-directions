package livedirections.json.api;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.xml.bind.JAXBException;

import com.sun.jersey.api.json.JSONJAXBContext;
import com.sun.jersey.api.json.JSONUnmarshaller;

public class JsonServiceClient {
	
	private JsonServiceClient() {} // static class
	
	private static final Map<Class<?>, JSONJAXBContext> context =
		new HashMap<Class<?>, JSONJAXBContext>();
	
	public static <T> T get(Class<T> cls, String url) throws MalformedURLException, IOException, ProtocolException, JAXBException {
		HttpURLConnection connection = null;
		InputStream responseStream = null;
		T res = null;
		try {
			connection = (HttpURLConnection)new URL(url).openConnection();
			connection.setRequestMethod("GET");
			connection.connect();
			responseStream = connection.getInputStream();
			if (!context.containsKey(cls))
				context.put(cls, new JSONJAXBContext(cls));
			JSONUnmarshaller u = context.get(cls).createJSONUnmarshaller();
			res = u.unmarshalFromJSON(responseStream, cls);
		} finally {
			connection.disconnect();
		}
		return res;
	}
}
