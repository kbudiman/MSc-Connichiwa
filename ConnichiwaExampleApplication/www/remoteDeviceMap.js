/**
 * Created by Kevin on 2016-07-05.
 */

// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var markerId;
var map;
var localMarker;
var markerLatLng;
var lat, lng;
var savedMarkers = {};
var savedRemoteMarkers = {};

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.8688, lng: 151.2195},
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }


    markers.forEach(function(marker) {
      // Clear out the old markers.
      marker.setMap(null);
    });
    markers = [];


    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      var icon = {
        //url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      localMarker = new google.maps.Marker({
        map: map,
        // icon: icon,
        title: place.name,
        position: place.geometry.location
      });

      // Click event for each marker (to trigger small dashboard)
      /*marker.addListener('click', function (e) {
        $('#floating-panel').show();
        markerLatLng = e.latLng;
      });*/

      markers.push(localMarker);
      markers.forEach(function(marker) {
        marker.addListener('click', function (e) {
          $('#floating-panel').show();

          markerLatLng = e.latLng;
          lng = e.latLng.lng(); // lng of clicked point;
          lat = e.latLng.lat(); // lat of clicked point;
        });
      });

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });
}

Connichiwa.onMessage('shareMarker', function (message) {
  lat = message.remoteLat;
  lng = message.remoteLng;

  placeMarkerAndPanTo(message.remotePosition, map, lat, lng);
});



/**
 * Concatenates given lat and lng with an underscore and returns it.
 * This id will be used as a key of marker to cache the marker in markers object.
 * @param {!number} lat Latitude.
 * @param {!number} lng Longitude.
 * @return {string} Concatenated marker id.
 */
var getMarkerUniqueId= function(lat, lng) {
  return lat + '_' + lng;
};


function placeMarkerAndPanTo (latLng, map, lat, lng) {

  //alert('sharedMarkers: ' + lat + '_' + lng);
  var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
  var markerId = getMarkerUniqueId(lat,lng);
  var marker = new google.maps.Marker ({
    position: latLng,
    map: map,
    icon: image,
    id: 'marker_' + markerId
  });


  marker.addListener('click', function (e) {
    $('#floating-panel').show();
    markerLatLng = e.latLng;
  });

  savedMarkers[markerId] = marker;
  savedRemoteMarkers[markerId] = marker;

  //savedMarkers.push(marker);
  //map.panTo(latLng);
}

// Broadcast marker's lat and lng to other connected devices
function shareMarker() {
  placeMarkerAndPanTo (markerLatLng, map, lat, lng);
  Connichiwa.broadcast ('shareMarker', {remotePosition: markerLatLng, remoteLat: lat, remoteLng: lng});
  $('#floating-panel').hide();
}

function annotateMarker() {

}

/**
 * Removes given marker from map.
 * @param {!google.maps.Marker} marker A google.maps.Marker instance that will be removed.
 * @param {!string} markerId Id of marker.
 */
function delMarkerLatLng(lat, lng) {
  //alert('delMarkersLatLng: ' + lat + '_' + lng);
  var delMarkerId = getMarkerUniqueId(lat, lng);
  var delMarker = savedRemoteMarkers[delMarkerId];

  //alert(delMarker);
  removeMarker(delMarker, delMarkerId);
}

function removeMarker(marker, markerId) {
  marker.setMap(null); // set markers setMap to null to remove it from map
  delete savedMarkers[markerId]; // delete marker instance from markers object
}

function deleteMarker() {
  //alert('entering deleteMarker ' + lat +'_' + lng);
  delMarkerLatLng(lat, lng);
  Connichiwa.broadcast ('deleteMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng});
  $('#floating-panel').hide();
}

function closePanel () {
  $('#floating-panel').hide();
}

Connichiwa.onMessage('deleteMarker', function (message) {
  //removeMarker(message.remoteMarker, message.remoteMarkerId);
  delMarkerLatLng(message.remoteMarkerLat, message.remoteMarkerLng);
});