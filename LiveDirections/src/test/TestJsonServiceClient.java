package test;

import livedirections.Geocode;
import livedirections.json.api.JsonServiceClient;

public class TestJsonServiceClient {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
        try {
            Geocode.Result res = JsonServiceClient.get(Geocode.Result.class,
            		"http://maps.googleapis.com/maps/api/geocode/json?address=441+4th+st+NW&sensor=false");

            System.out.println(res.status);

        }
        catch(java.net.MalformedURLException mue) {
            mue.printStackTrace();
        }
        catch(java.io.IOException ioe) {
            ioe.printStackTrace();
        }
        catch(javax.xml.bind.JAXBException jaxbe) {
            jaxbe.printStackTrace();
        }
	}
}
