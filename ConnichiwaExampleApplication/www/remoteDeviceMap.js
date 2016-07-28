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
var infoWindows = {};
var annotations = {};
var durations = {};
var remoteAnnotations = {};
var placeNames = {};
var timestamp;
var command;


function initMap() {

  $.getScript('infobox.js', function(data, status, jxhr){
    console.log('infobox JS loaded. Status: ', status);
  });


  var minZoomLevel = 16;

  // Initialize the GoogleMap
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.524706, lng: -0.133569},
    zoom: minZoomLevel,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var noPoi = [
    {
      featureType: "poi",
      stylers: [
        { visibility: "off" }
      ]
    },
    {
      featureType: 'transit.station',
      stylers: [
        { visibility: 'off' }
      ]
    }
  ];

  map.setOptions({styles: noPoi});


  // Limit the zoom level
  google.maps.event.addListener(map, 'zoom_changed', function () {
    if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
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

    // LOGGING WHEN THEY CLICK ON PLACES ON SEARCH INPUT
    Connichiwa.broadcast('searchedInput', {searchedPlace: places[0].name});


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

          localPlaceName = localMarker.title;
          $('#floatingPlaceName').html('<b>' + localPlaceName + '</b>');
          $('#floating-panel').show();

          $('#btn_share').show();
          $('#btn_annotate').hide();
          $('#btn_delete').hide();

          markerLatLng = e.latLng;
          lat = e.latLng.lat(); // lat of clicked point;
          lng = e.latLng.lng(); // lng of clicked point;




          // LOGGING: When they click on a Unsaved Marker
          Connichiwa.broadcast('clickUnsavedMarker', {unsavedPlace: localPlaceName});
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
  var lat = message.myLat;
  var lng = message.myLng;
});

Connichiwa.onMessage('shareMarker', function (message) {
  var lat = message.remoteLat;
  var lng = message.remoteLng;
  var localPlaceName = message.remoteName;
  placeMarkerAndPanTo(message.remotePosition, map, lat, lng, localPlaceName);
  createInfoWindow(message.remotePosition, map, lat, lng, localPlaceName);

});

Connichiwa.onMessage('anotateMarker', function (message) {


  var lat = message.remoteMarkerLat;
  var lng = message.remoteMarkerLng;


  var markerId = getMarkerUniqueId(lat, lng);
  var marker = savedRemoteMarkers[markerId];

  createAnnotateInfoWindow(markerId, marker, message.remoteVisitDur, message.remoteVisitOrder);
});

Connichiwa.onMessage('deleteMarker', function (message) {
  //removeMarker(message.remoteMarker, message.remoteMarkerId);
  delMarkerLatLng(message.remoteMarkerLat, message.remoteMarkerLng);

  var delMarkerId = getMarkerUniqueId(message.remoteMarkerLat, message.remoteMarkerLng);
  var delMarker = savedRemoteMarkers[delMarkerId];


  delete savedRemoteMarkers[delMarkerId];
});

Connichiwa.onMessage('updateAnnotate', function (message) {
  var lat = message.remoteMarkerLat;
  var lng = message.remoteMarkerLng;


  var markerId = getMarkerUniqueId(lat, lng);
  //infoWindows[markerId].setContent(message.remotePrompt);

  //var oldDur = annotations[markerId].order;

  annotations[markerId].order.setContent('#' + message.newOrder);
  annotations[markerId].dur.setContent(message.newDur + 'hr');


});

function clearSearch() {
  var input = document.getElementById('pac-input');
  input.value = "";
}

/* Buttons' Functions */
function shareMarker() {
  placeMarkerAndPanTo (markerLatLng, map, lat, lng, localPlaceName);
  createInfoWindow(markerLatLng, map, lat, lng, localPlaceName);

  Connichiwa.broadcast ('shareMarker', {remotePosition: markerLatLng, remoteLat: lat, remoteLng: lng, remoteName: localPlaceName});
  localMarker.setMap(null);

  $('#floating-panel').hide();

  clearSearch();
}


function annotateMarker() {
  //createInfoWindow(map, lat, lng);

  //debugger;
  promptHoursAndOrder(lat, lng);

  /*$('#annotate-panel').show();

  $('#btn_annotateEnter').off('click').click(function (e) { //the button does not recognize the new lat nad lng
    var markerId = getMarkerUniqueId(lat, lng);
    var marker = savedRemoteMarkers[markerId];
    var contentString;
    var order;

    var visitOrder;
    var visitDuration;


    visitOrder = $('#visitorder').val();
    visitDuration = $('#visitduration').val();

    if(!visitOrder || !visitDuration) {
      alert('Please type the Visit Order and Duration.');
    }
    else {
      createAnnotateInfoWindow(markerId, marker, visitDuration, visitOrder);

      Connichiwa.broadcast ('anotateMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng, remotePrompt: contentString, remoteName: localPlaceName, remoteVisitOrder: visitOrder, remoteVisitDur: visitDuration});

      $('#annotate-panel').hide();
    }
  });

  $('#btn_annotateCancel').off('click').click(function(e) {
    $('#annotate-panel').hide();
  });*/
  $('#floating-panel').hide();
}

function deleteMarker() {
  delMarkerLatLng(lat, lng);
  Connichiwa.broadcast ('deleteMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng, remoteName: localPlaceName});
  $('#floating-panel').hide();
}

function promptHoursAndOrder(lat, lng) {

  //debugger;

  var markerId = getMarkerUniqueId(lat, lng);
  var marker = savedRemoteMarkers[markerId];
  /*order = prompt('Please enter the Visit Order and Duration (in hours) - e.g. 1, 0.5');
  contentString = placeNames[markerId] + ' ' + order;

  if(!order) {
    //alert('order is null');
    //order = '';
  }
  else {
    infoWindows[markerId].setContent(contentString);
    Connichiwa.broadcast ('anotateMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng, remotePrompt: contentString, remoteName: localPlaceName});
  }*/

  $('#annotatePlaceName').html('<b>' + placeNames[markerId] + '</b>');
  $('#annotate-panel').show();

  //Reset values
  document.getElementById('order').value= "0";
  document.getElementById('hours').value= "0";
  document.getElementById('minutes').value= "0";
  /*if(annotations[markerId].order != 0 && annotations[markerId].dur != 0) {
    document.getElementById('order').value= durations[markerId].order;
    document.getElementById('hours').value= durations[markerId].durHr;
    document.getElementById('minutes').value= durations[markerId].durMin;

    if(isNaN(durations[markerId].durMin)) {
      durations[markerId].durMin = "0";
    }
  }
  else {
    document.getElementById('order').value= "0";
    document.getElementById('hours').value= "0";
    document.getElementById('minutes').value= "0";
  }*/

  $('#btn_annotateEnter').off('click').click(function (e) { //the button does not recognize the new lat nad lng

    //debugger;

    var markerId = getMarkerUniqueId(lat, lng);
    var marker = savedRemoteMarkers[markerId];
    var contentString;
    var order;

    var hms;
    var hours;
    var min;
    var minReset;
    var visitOrder;
    var visitDuration;


    visitOrder = parseFloat($( "#order option:selected" ).text());

    /*minReset = $( "#minutes option:selected" ).text();

    if(isNaN(minReset)) {

      minReset = "0";
    }
    else {
      minReset = $( "#minutes option:selected" ).text();
    }*/


    //durations[markerId] = {order: $( "#order option:selected" ).text(),durHr: $( "#hours option:selected" ).text(), durMin: $( "#minutes option:selected" ).text()};

    hours = parseFloat($( "#hours option:selected" ).text());
    min = parseFloat($( "#minutes option:selected" ).text());


    visitDuration = hours + (min / 60);
    visitDuration = round(visitDuration,1);

    /*hms = document.getElementById("visitduration").value;


    hours = hms.split(':');

    visitDuration = (+hours[0]) + (+hours[1] / 60);*/

    visitDuration = round(visitDuration, 1);


    console.log('order: ' + visitOrder + ' duration:' + visitDuration);

    if(visitOrder == 0 || visitDuration == 0) {
      //alert('Please type the Visit Order and Duration.');
      $('#annotateErrorPanel').show();

    }
    else if(infoWindows[markerId] && !annotations[markerId]) {

      createAnnotateInfoWindow(markerId, marker, visitDuration, visitOrder);

      contentString = localPlaceName + ', Visit Order: ' + visitOrder + ', Duration: ' + visitDuration + 'hr'

      Connichiwa.broadcast ('anotateMarker', {remoteMarkerLat: lat, remoteMarkerLng: lng, remotePrompt: contentString, remoteName: localPlaceName, remoteVisitOrder: visitOrder, remoteVisitDur: visitDuration});

      $('#annotate-panel').hide();
    }
    else if(infoWindows[markerId] && annotations[markerId]) {

      var oldIbOrder = annotations[markerId].order;
      var oldIbDur = annotations[markerId].dur;

      oldIbDur = oldIbDur.getContent().replace('hr','');

      //console.log('old dur: ' + oldIbDur);

      annotations[markerId].order.setContent('#' + visitOrder);
      annotations[markerId].dur.setContent(visitDuration + 'hr');

      Connichiwa.broadcast('updateAnnotate', {remoteMarkerLat: lat, remoteMarkerLng: lng, oldDur: oldIbDur, newOrder: visitOrder, newDur: visitDuration});

      $('#annotate-panel').hide();
    }
  });

  $('#btn_annotateCancel').click(function(e) {
    $('#annotate-panel').hide();
  });

  $('#btn_annotateError').click(function(e){

    $('#annotateErrorPanel').hide();
    $('#annotate-panel').hide();
  });
}



function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

function createAnnotateInfoWindow(markerId, marker, visitDuration, visitOrder) {
  //if(infoWindows[markerId] && !annotations[markerId]) {
/*
  var boxOrder = document.createElement("div");
  //boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: yellow; padding: 5px;";
  boxOrder.innerHTML = '#' + visitOrder;

  var boxDur = document.createElement("div");
  //boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: yellow; padding: 5px;";
  boxDur.innerHTML = visitDuration + 'hr';
*/
    var myOrderOptions = {
      content: '#' + visitOrder
      ,boxStyle: {
        border: "1px solid white"
        ,textAlign: "center"
        ,fontSize: "8pt"
        ,width: "20px"
        ,background: "red"
        ,opacity: 0.75
        ,color: "white"
      }
      ,disableAutoPan: true
      ,pixelOffset: new google.maps.Size(7, -45)
      ,closeBoxURL: ""
      ,isHidden: false
      ,pane: "floatPane"
      ,enableEventPropagation: false
      ,position: 'absolute'
    };

    var myDurOptions = {
      content: visitDuration + 'hr'
      ,boxStyle: {
        border: "1px solid white"
        ,textAlign: "center"
        ,fontSize: "8pt"
        ,width: "30px"
        ,background: "blue"
        ,opacity: 0.75
        ,color: "white"
      }
      ,disableAutoPan: true
      ,pixelOffset: new google.maps.Size(7, -28)
      ,closeBoxURL: ""
      ,isHidden: false
      ,pane: "floatPane"
      ,enableEventPropagation: false
      ,position: 'absolute'
    };

    var ibOrder = new InfoBox(myOrderOptions);
    var ibDur = new InfoBox(myDurOptions);
    //ibLabel.open(map);

    /*var infowindow = new google.maps.InfoWindow({
     content: contentString
     });*/

    annotations[markerId] = {order: ibOrder, dur: ibDur};

    var myIbOrder = annotations[markerId].order;
    var myIbDur = annotations[markerId].dur;


    marker.addListener('click', function(point) {
      myIbOrder.close();
      myIbOrder.open(map, marker);
      myIbDur.open(map, marker);

      /*$('#floatingPlaceName').html('<b>' + localPlaceName + '</b>');
      $('#floating-panel').show();

      $('#btn_annotate').show();
      $('#btn_delete').show();
      $('#btn_share').hide();*/

      //ibLabel.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
    });

    /*google.maps.event.addDomListener(annotations[markerId].order.content_,'click',(function(e) {

      $('#floatingPlaceName').html('<b>' + localPlaceName + '</b>');
      $('#floating-panel').show();

      $('#btn_annotate').show();
      $('#btn_delete').show();
      $('#btn_share').hide();

    }));

    google.maps.event.addDomListener(annotations[markerId].dur.content_,'click',(function(e) {

      $('#floatingPlaceName').html('<b>' + localPlaceName + '</b>');
      $('#floating-panel').show();

      $('#btn_annotate').show();
      $('#btn_delete').show();
      $('#btn_share').hide();

    }));*/

    myIbOrder.open(map, marker);
    myIbDur.open(map, marker);
  //}

 // else if(infoWindows[markerId] && annotations[markerId]){


  //}
}

function createInfoWindow(latLng, map, lat, lng, placeName) {
  var markerId = getMarkerUniqueId(lat, lng);
  var marker = savedRemoteMarkers[markerId];
  var contentString = placeName;

  //alert('infoWindow' + latLng);

  if(!infoWindows[markerId]) {

    var boxText = document.createElement("div");
    //boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: yellow; padding: 5px;";
    boxText.innerHTML = contentString;

    var myOptions = {
      content: boxText
      ,boxStyle: {
        border: "1px solid black"
        ,textAlign: "center"
        ,fontSize: "8pt"
        //,width: "75px"
        ,background: "yellow"
        ,opacity: 0.75
        ,maxWidth: "75px"
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

    marker.addListener('click', function(point) {
      ibLabel.open(map, marker);

      //$('#floating-panel').show();
      //ibLabel.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    });

    google.maps.event.addDomListener(infoWindows[markerId].content_,'click',(function(e) {



      $('#floatingPlaceName').html('<b>' + placeNames[markerId] + '</b>');

      //debugger;
      //alert(infoWindows[markerId].getPosition());
      window.lat = infoWindows[markerId].getPosition().lat();
      window.lng = infoWindows[markerId].getPosition().lng();


      $('#floating-panel').show();

      $('#btn_annotate').show();
      $('#btn_delete').show();
      $('#btn_share').hide();


      }));



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

      lng = e.latLng.lng(); // lng of clicked point;
      lat = e.latLng.lat(); // lat of clicked point;

      console.log(lng + '-' + lat);

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
  if(infoWindows[delMarkerId]) {
    infoWindows[delMarkerId].close();
    delete infoWindows[delMarkerId];
  }

  if(annotations[delMarkerId]) {
    //Delete annotation infoBox
    var ibOrder = annotations[delMarkerId].order;
    var ibDur = annotations[delMarkerId].dur;
    ibOrder.close();
    ibDur.close();
    delete annotations[delMarkerId];
    delete durations[delMarkerId];
  }

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

    var markerId = getMarkerUniqueId(lat,lng);

    //var activeLat, activeLng;
    window.lat = point.latLng.lat();
    window.lng = point.latLng.lng();

    // Call up the markers
    //createInfoWindow(map, lat, lng);
    $('#floatingPlaceName').html('<b>' + placeNames[markerId] + '</b>');
    $('#floating-panel').show();

    $('#btn_annotate').show();
    $('#btn_delete').show();
    $('#btn_share').hide();




    //this.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
    marker.setZIndex(Date.now());

    //var markerId = getMarkerUniqueId(point.latLng.lat(), point.latLng.lng()); // get marker id by using clicked point's coordinate
    //Connichiwa.broadcast('broadcastLatLng', {myLat: lat, myLng: lng});

    //Connichiwa.broadcast('broadcastLatLng', {myLat: lat, myLng: lng}, true);

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
      Connichiwa.broadcast('broadcastZoom', {zoom: 'Zoom Out'});
    } else if (e.scale > 1.0) {
      // User moved fingers further apart
      Connichiwa.broadcast('broadcastZoom', {zoom: 'Zoom In'});
    }
  }, false);

  $('#clear-search').click(clearSearch());
});

function closePanel () {
  $('#floating-panel').hide();
}

// If user clicks outside of the panel, panel will be hidden
$(document).mouseup(function (e)
{
  var container = $("#floating-panel");

  if (!container.is(e.target) // if the target of the click isn't the container...
    && container.has(e.target).length === 0) // ... nor a descendant of the container
  {
    container.hide();
  }

  var container2 = $("#annotate-panel");

  if (!container2.is(e.target) // if the target of the click isn't the container...
    && container2.has(e.target).length === 0) // ... nor a descendant of the container
  {
    container2.hide();
  }
});
