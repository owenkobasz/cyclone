function decodePolyline(encoded, precision = 5) {
  // Generic polyline decoder with configurable precision
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({ lat: lat / factor, lon: lng / factor });
  }

  return points;
}

function decodeGraphHopperPolyline(encoded) {
  // Google polyline algorithm used by GraphHopper (5 digit precision)
  return decodePolyline(encoded, 5);
}

function decodeValhallaPolyline(encoded) {
  // Valhalla polyline algorithm  (6 digit precision)
  return decodePolyline(encoded, 6);
}

module.exports = {
  decodePolyline,
  decodeGraphHopperPolyline,
  decodeValhallaPolyline
};
