/**
 * Created by Kevin on 2016-07-05.
 */
Connichiwa.onLoad (function () {

  Connichiwa.broadcast ('remoteLatLng', remotePosition);

  Connichiwa.onMessage('remoteLatLng', function (message) {
    placeMarkerAndPanTo(message.position, map);
  });

});