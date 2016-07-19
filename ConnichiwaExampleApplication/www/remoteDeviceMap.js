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
var localPlaceName;
var markerLatLng;
var lat, lng;
var savedMarkers = {};
var savedRemoteMarkers = {};
var infoWindows = {}
var placeNames = {};
var timestamp;
var command;

function initMap() {

  $.getScript('infobox.js', function(data, status, jxhr){
    console.log('infobox JS loaded. Status: ', status);
  });


  // Initialize the GoogleMap
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.51825, lng: -0.119648},
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

  var markers = []; // Markers array for search results (temporary)
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

      localPlaceName = localMarker.title;

      // Click event for each marker (to trigger small dashboard)
      /*marker.addListener('click', function (e) {
        $('#floating-panel').show();
        markerLatLng = e.latLng;
      });*/

      markers.push(localMarker);
      markers.forEach(function(marker) {
        marker.addListener('click', function (e) {
          $('#floating-panel').show();
          $('#btn_share').show();
          $('#btn_annotate').hide();
          $('#btn_delete').hide();

          markerLatLng = e.latLng;
          lat = e.latLng.lat(); // lat of clicked point;
          lng = e.latLng.lng(); // lng of clicked point;
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




// Broadcast marker's lat and lng to other connected devices
Connichiwa.onMessage('broadcastLatLng', function (message) {
  lat = message.myLat;
  lng = message.myLng;
});

Connichiwa.onMessage('shareMarker', function (message) {
  lat = message.remoteLat;
  lng = message.remoteLng;
  localPlaceName = message.remoteName;
  placeMarkerAndPanTo(message.remotePosition, map, lat, lng, localPlaceName);
  createInfoWindow(message.remotePosition, map, lat, lng, localPlaceName);

});

Connichiwa.onMessage('anotateMarker', function (message) {
  lat = message.remoteMarkerLat;
  lng = message.remoteMarkerLng;

  var markerId = getMarkerUniqueId(lat, lng);
  infoWindows[markerId].setContent(message.remotePrompt);

  //promptHoursAndOrder(message.remoteMarkerLat, message.remoteMarkerLng);
});

Connichiwa.onMessage('deleteMarker', function (message) {
  //removeMarker(message.remoteMarker, message.remoteMarkerId);
  delMarkerLatLng(message.remoteMarkerLat, message.remoteMarkerLng);

  var delMarkerId = getMarkerUniqueId(message.remoteMarkerLat, message.remoteMarkerLng);
  var delMarker = savedRemoteMarkers[delMarkerId];


  delete savedRemoteMarkers[delMarkerId];
});


/* Buttons' Functions */
function shareMarker() {
  placeMarkerAndPanTo (markerLatLng, map, lat, lng, localPlaceName);
  createInfoWindow(markerLatLng, map, lat, lng, localPlaceName);
  Connichiwa.broadcast ('shareMarker', {remotePosition: markerLatLng, remoteLat: lat, remoteLng: lng, remoteName: localPlaceName});
  localMarker.setMap(null);
  $('#floating-panel').hide();
}

function annotateMarker() {
  //createInfoWindow(map, lat, lng);
  promptHoursAndOrder(lat, lng);
  $('#floating-panel').hide();
}

function deleteMarker() {
  delMarkerLatLng(lat, lng);
  Connichiwa.broadcast ('deleteMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng});
  $('#floating-panel').hide();
}

function promptHoursAndOrder(lat, lng) {
  var markerId = getMarkerUniqueId(lat, lng);
  var contentString;
  var order;

  order = prompt('Please enter the Visit Order and Duration (in hours) - e.g. 1, 0.5');
  contentString = placeNames[markerId] + ' ' + order;

  if(!order) {
    //alert('order is null');
    //order = '';
  }
  else {
    infoWindows[markerId].setContent(contentString);
    Connichiwa.broadcast ('anotateMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng, remotePrompt: contentString});
  }

}

function createInfoWindow(latLng, map, lat, lng, placeName) {
  var markerId = getMarkerUniqueId(lat, lng);
  var marker = savedRemoteMarkers[markerId];
  var contentString = placeName;

  //alert('infoWindow' + latLng);

  if(!infoWindows[markerId]) {
    var myOptions = {
      content: contentString
      ,boxStyle: {
        border: "1px solid black"
        ,textAlign: "center"
        ,fontSize: "8pt"
        //,width: "75px"
        ,background: "yellow"
        ,opacity: 0.75
      }
      ,disableAutoPan: true
      ,pixelOffset: new google.maps.Size(-10, 0)
      ,closeBoxURL: ""
      ,isHidden: false
      ,pane: "floatPane"
      ,enableEventPropagation: false
      ,position: 'absolute'
    };

    var ibLabel = new InfoBox(myOptions);
    //ibLabel.open(map);

    /*var infowindow = new google.maps.InfoWindow({
      content: contentString
    });*/

    infoWindows[markerId] = ibLabel;

    marker.addListener('click', function() {
      ibLabel.open(map, marker);
      //ibLabel.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
    });

    ibLabel.open(map, marker);
  }

  /*marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  infowindow.open(map, marker);*/

}

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


function placeMarkerAndPanTo (latLng, map, lat, lng, placeName) {
  var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
  var markerId = getMarkerUniqueId(lat,lng);

  if(!savedMarkers[markerId]) {
    var marker = new google.maps.Marker ({
      position: latLng,
      map: map,
      icon: image,
      id: 'marker_' + markerId,
    });


    bindMarkerEvents(marker, map, lat, lng);


    /*marker.addListener('click', function (e) {
      $('#floating-panel').show();
      markerLatLng = e.latLng;

      //lng = e.latLng.lng(); // lng of clicked point;
      //lat = e.latLng.lat(); // lat of clicked point;

    });*/

    placeNames[markerId] = placeName;
    savedMarkers[markerId] = marker;
    savedRemoteMarkers[markerId] = marker;
  }



  //savedMarkers.push(marker);
  //map.panTo(latLng);
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
  //removeMarker(delMarker, delMarkerId);

  delMarker.setMap(null);
  delete savedMarkers[delMarkerId];

  //Delete infoBox
  infoWindows[delMarkerId].close();
  delete infoWindows[delMarkerId];
}

//To Be DELETED
function removeMarker(marker, markerId) {
  marker.setMap(null); // set markers setMap to null to remove it from map
  delete savedMarkers[markerId]; // delete marker instance from markers object
}


/**
 * Binds right click event to given marker and invokes a callback function that will remove the marker from map.
 * @param {!google.maps.Marker} marker A google.maps.Marker instance that the handler will binded.
 */

var bindMarkerEvents = function(marker, map, lat, lng) {
  google.maps.event.addListener(marker, "click", function (point) {

    var activeLat, activeLng;
    // Call up the markers
    //createInfoWindow(map, lat, lng);

    $('#floating-panel').show();
    $('#btn_annotate').show();
    $('#btn_delete').show();
    $('#btn_share').hide();


    activeLat = point.latLng.lat();
    activeLng = point.latLng.lng();


    this.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    //var markerId = getMarkerUniqueId(point.latLng.lat(), point.latLng.lng()); // get marker id by using clicked point's coordinate
    //Connichiwa.broadcast('broadcastLatLng', {myLat: lat, myLng: lng});
    Connichiwa.broadcast('broadcastLatLng', {myLat: activeLat, myLng: activeLng}, true);
    //var marker = savedMarkers[markerId]; // find marker
    //removeMarker(marker, markerId); // remove it
  });

};

$(function() {
  var $log = $("#log");

  function updateLog(x, y) {
    //$log.html('X: '+ x +'; Y: '+ y);
    Connichiwa.broadcast('broadcastTouch', {xCoor: x, yCoor: y});
  }

  document.addEventListener('touchstart', function(e) {
    updateLog(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  }, false);

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    updateLog(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
  }, false);

  document.addEventListener('gestureend', function(e) {
    if (e.scale < 1.0) {
      // User moved fingers closer together
      Connichiwa.broadcast('broadcastZoom', {zoom: 'Zoom In'});
    } else if (e.scale > 1.0) {
      // User moved fingers further apart
      Connichiwa.broadcast('broadcastZoom', {zoom: 'Zoom Out'});
    }
  }, false);
});



function closePanel () {
  $('#floating-panel').hide();
}
