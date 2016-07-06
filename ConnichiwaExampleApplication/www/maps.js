
var remotePosition;
var map;

function initMap () {
  map = new google.maps.Map (document.getElementById ('map'), {
    zoom: 4,
    center: {lat: -25.363882, lng: 131.044922}
  });

  map.addListener ('click', function (e) {
    placeMarkerAndPanTo (e.latLng, map);
    Connichiwa.broadcast ('remoteLatLng', {remotePosition: e.latLng});
  });
}

function placeMarkerAndPanTo (latLng, map) {
  var marker = new google.maps.Marker ({
    position: latLng,
    map: map
  });
  //map.panTo(latLng);
}


Connichiwa.onMessage('remoteLatLng', function (message) {
  placeMarkerAndPanTo(message.remotePosition, map);
});

