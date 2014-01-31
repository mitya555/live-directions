/********************** SPCS to LL / LL to SPCS*****************************
The Following functions are used to project coordinates back and 
forth between Latitude/Longitude and Maryland State Plane 
Coordinates, NAD83 Meters.
This program can easily be made to work for any Lambert Conformal
Conic coordinate system by changing the values of the constants.
     
The formulae this program is based on are from "Map Projections, A
Working Manual" by John P. Snyder, U.S. Geological Survey
Professional Paper 1395, 1987, pages 295-298
***************************************************************************/


/*********************************************************************************** 
    
SPCStoLL(x,y,ret) 
Expected Input args:
x:    easting
y:    northing
ret:  saves lat and long as properties ret
 
***********************************************************************************/
function SPCStoLL(x, y, ret) {
	//Comment out the section for the datum you want to use
	//NAD 83
	var A = 6378137;                 //major radius of ellipsoid, map units
	var E = 0.08181919104281097; //0.0818879;               //eccentricity of ellipsoid
	//got from http://dgfi2.dgfi.badw-muenchen.de/geodis/REFS/grs80.html by squareroot of e square
	//NAD27
	//var A = 6378206;               //major radius of ellipsoid, map units
	//var E = 0.0822719;             //eccentricity of ellipsoid

	var AngRad = 0.01745329252;      //number of radians in a degree

	//the following parameters came from dc atlas metadata file
	var P1 = 38.30 * AngRad;         //Maryland latitude of first standard parallel
	var P2 = 39.45 * AngRad;         //Maryland latitude of second standard parallel
	var P0 = 37.666667 * AngRad;         //Maryland latitude of origin
	var M0 = -77 * AngRad;           //Maryland central meridian
	var X0 = 400000; 	  //Maryland False easting of central meridian, map units

	//the following parameters came from montona
	//var P1 = 45 * AngRad;          //Montona latitude of first standard parallel
	//var P2 = 49 * AngRad;          //Montona latitude of second standard parallel
	//var P0 = 44.25 * AngRad;       //Montona latitude of origin
	//var M0 = -109.5 * AngRad;      //Montona central meridian
	//var X0 = 600000;               //Montona False easting of central meridian, map units
	var Pi4 = 3.141592653582 / 4;    //Pi / 4

	var m1 = Math.cos(P1) / Math.sqrt(1 - ((Math.pow(E, 2)) * (Math.pow(Math.sin(P1), 2))));
	var m2 = Math.cos(P2) / Math.sqrt(1 - ((Math.pow(E, 2)) * (Math.pow(Math.sin(P2), 2))));
	var t1 = (Math.tan(Pi4 - (P1 / 2))) / (Math.pow(((1 - (E * (Math.sin(P1)))) / (1 + (E * (Math.sin(P1))))), (E / 2)));
	var t2 = (Math.tan(Pi4 - (P2 / 2))) / (Math.pow(((1 - (E * (Math.sin(P2)))) / (1 + (E * (Math.sin(P2))))), (E / 2)));
	var t0 = (Math.tan(Pi4 - (P0 / 2))) / (Math.pow(((1 - (E * (Math.sin(P0)))) / (1 + (E * (Math.sin(P0))))), (E / 2)));
	var n = Math.log(m1 / m2) / Math.log(t1 / t2);
	var F = m1 / (n * (Math.pow(t1, n)));
	var rho0 = A * F * Math.pow(t0, n);




	var Lat0;
	var Pi2;
	var t;
	var rho;
	var theta;
	var Lat1;
	var Lon;
	var ret;
	var AF;

	x = x - X0;
	Pi2 = Pi4 * 2;
	rho = Math.sqrt((Math.pow(x, 2)) + (Math.pow((rho0 - y), 2)));
	theta = Math.atan(x / (rho0 - y));




	t = Math.pow((rho / (A * F)), (1 / n));
	Lat0 = Pi2 - (2 * Math.atan(t));
	Lat1 = Pi2 - (2 * Math.atan(t * Math.pow(((1 - E * Math.sin(Lat0)) / (1 + E * Math.sin(Lat0))), (E / 2))));

	do {
		Lat0 = Lat1;
		Lat1 = Pi2 - (2 * Math.atan(t * Math.pow(((1 - E * Math.sin(Lat0)) / (1 + E * Math.sin(Lat0))), (E / 2))));
	}
	while ((Math.abs(Lat1 - Lat0)) >= 0.0000002);

	Lon = (theta / n) + M0;

	ret.lat = (Lat1 / AngRad) * 100000 / 100000;
	ret.lon = (Lon / AngRad) * 100000 / 100000;

	return ret;
}
// END SPCStoLL() function



/*********************************************************************************** 
    
LLtoSPCS(Lat,Lon,ret) 
Expected Input args:
Lat:  latitude
Lon,  longitude
ret:  saves x and y as properties ret
 
***********************************************************************************/
function LLtoSPCS(Lat, Lon, ret) {
	//Comment out the section for the datum you want to use
	//NAD 83
	var A = 6378137;                 //major radius of ellipsoid, map units
	var E = 0.08181919104281097; //0.0818879;               //eccentricity of ellipsoid
	//got from http://dgfi2.dgfi.badw-muenchen.de/geodis/REFS/grs80.html by squareroot of e square
	//NAD27
	//var A = 6378206;               //major radius of ellipsoid, map units
	//var E = 0.0822719;             //eccentricity of ellipsoid

	var AngRad = 0.01745329252;      //number of radians in a degree

	//the following parameters came from dc atlas metadata file
	var P1 = 38.30 * AngRad;         //Maryland latitude of first standard parallel
	var P2 = 39.45 * AngRad;         //Maryland latitude of second standard parallel
	var P0 = 37.666667 * AngRad;         //Maryland latitude of origin
	var M0 = -77 * AngRad;           //Maryland central meridian
	var X0 = 400000; 	  //Maryland False easting of central meridian, map units

	//the following parameters came from montona
	//var P1 = 45 * AngRad;          //Montona latitude of first standard parallel
	//var P2 = 49 * AngRad;          //Montona latitude of second standard parallel
	//var P0 = 44.25 * AngRad;       //Montona latitude of origin
	//var M0 = -109.5 * AngRad;      //Montona central meridian
	//var X0 = 600000;               //Montona False easting of central meridian, map units
	var Pi4 = 3.141592653582 / 4;    //Pi / 4

	var m1 = Math.cos(P1) / Math.sqrt(1 - ((Math.pow(E, 2)) * (Math.pow(Math.sin(P1), 2))));
	var m2 = Math.cos(P2) / Math.sqrt(1 - ((Math.pow(E, 2)) * (Math.pow(Math.sin(P2), 2))));
	var t1 = (Math.tan(Pi4 - (P1 / 2))) / (Math.pow(((1 - (E * (Math.sin(P1)))) / (1 + (E * (Math.sin(P1))))), (E / 2)));
	var t2 = (Math.tan(Pi4 - (P2 / 2))) / (Math.pow(((1 - (E * (Math.sin(P2)))) / (1 + (E * (Math.sin(P2))))), (E / 2)));
	var t0 = (Math.tan(Pi4 - (P0 / 2))) / (Math.pow(((1 - (E * (Math.sin(P0)))) / (1 + (E * (Math.sin(P0))))), (E / 2)));
	var n = Math.log(m1 / m2) / Math.log(t1 / t2);
	var F = m1 / (n * (Math.pow(t1, n)));
	var rho0 = A * F * Math.pow(t0, n);



	var t;
	var rho;
	var theta;

	Lat = Lat * AngRad;
	Lon = Lon * AngRad;

	if (Lon > 0) {
		Lon = 0 - Lon;
	}

	t = (Math.tan(Pi4 - (Lat / 2))) / (Math.pow(((1 - (E * (Math.sin(Lat)))) / (1 + (E * (Math.sin(Lat))))), (E / 2)));
	rho = A * F * (Math.pow(t, n));
	theta = n * (Lon - M0);
	ret.x = (rho * Math.sin(theta)) + X0;
	ret.y = rho0 - (rho * Math.cos(theta));
	return;
}
// END LLtoSPCS() function

