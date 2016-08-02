var map;
var deviceIndex;
var lat,lng, latLng, placeName;
var savedMarkers = {};
var infoWindows = {};
var annotations = {};
var deviceCounter = 0;
var tripPath;
var tripPlanCoordinates = [];

//All Connichiwa-related stuff should always be done in Connichiwa.onLoad()
Connichiwa.onLoad (function () {
  //Get our master template and insert it into the body
  CWTemplates.load ("template_master.html");
  CWTemplates.insert ("master", {target: "body"});

  var devices = []; // Array to store connected devices
  var button2data, imgData;
  var currentDuration = 0;


  
  //Set the initial template data
  setDetectedDevices (0);
  setConnectedDevices (0);
  var ips = Connichiwa.getIPs ();
  if (ips.length > 0) {
    CWTemplates.set ("local_url", ips[0] + ":" + Connichiwa.getPort ());
  }


  //Let's connect any nearby device automatically
  //Connichiwa.autoConnect = true;
  if (Connichiwa.isMaster ()) {

    Connichiwa.autoLoadScripts = ["/main.js"];
    Connichiwa.autoConnect = true;


    Connichiwa.on ("deviceConnected", function (device) {



      //Increase connected devices
      var connectedDevices = CWTemplates.get ('devices_connected_count');
      setConnectedDevices (connectedDevices + 1);

      devices.push(device);

      devices[deviceCounter].insert ("Device" + deviceCounter + ": "+ "<b>I am connected!</b>");
      log(devices[deviceCounter].getIdentifier(), "Connected", "None");

      deviceCounter += 1;

      device.loadCSS ("styles.css");
      device.loadCSS("maps.css");

      device.loadScript("remoteDeviceMap.js");

      device.loadTemplates ("template_remote.html");


      //Load custom GoogleMaps .JS
      //device.loadScript ("maps.js");

      //device.loadScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBpDWib2HUkcAdUgBE3SGnCXHaQsw-aX8w&libraries=places&callback=initMap");

      //Load CSS and insert the remote template into the new device. The remote
      //template shows the devices current distance (also see "deviceDistanceChanged")
      //
      //The third parameter to .insertTemplate() is the name of the data store the
      //template uses. Each remote template gets its own data (since each displays
      //its individual distance). As you will see in updateRemoteDistance(), we
      //use this name to determine which devices UI is updated


      $('#consoleDevices').empty();
      $('#consoleDevices').append("\n" + CWDeviceManager.getConnectedDevices());


      device.insertTemplate ("remote", {
        target: "body",
        dataSource: device.getIdentifier ()
      });


      //device.loadScript ("/connichiwaJStest.js");
      //device.loadScript ("/camera.js");


      //button2data = {button2msg: 'clicked2!'};
      //Connichiwa.broadcast("button2Respond", button2data);



      $('#canImg').click(function(e) {
        $('#canImg').hide();
        //devices[0].insert("<script>$('#gbImg').show();</script>");
        imgData = {imgClicked: true};
        devices[0].send("imgRespond", imgData);
      });


      $('#button2').click(function (e) {
        $('#console').append('button2 clicked');
        devices[0].insert("and text has been inserted");

        button2data = {button2msg : 'clicked2!'};
        //alert(devices[0].toString());
        devices[0].send('button2Respond', button2data);

        //Connichiwa.broadcast("button2Respond", button2data);
      });
      updateRemoteDistance (device);

    });
  }


  // DEVICE DETECTION
  Connichiwa.on ("deviceDetected", function () {
    //Increase nearby devices
    var detectedDevices = CWTemplates.get ('devices_nearby_count');
    setDetectedDevices (detectedDevices + 1);
  });

  Connichiwa.on ("deviceLost", function () {
    //Decrease nearby devices
    var detectedDevices = CWTemplates.get ('devices_nearby_count');
    setDetectedDevices (detectedDevices - 1);
  });

  Connichiwa.on("deviceDisconnected", function (device) {
    //Decrease connected devices
    //deviceCounter -= 1;

    log(device.getIdentifier(), "Disconnected", "None");

    var connectedDevices = CWTemplates.get ('devices_connected_count');
    setConnectedDevices (connectedDevices - 1);

    $('#consoleDevices').empty();
    $('#consoleDevices').append(" " + CWDeviceManager.getConnectedDevices());
  });

  //Live-update the distance on remote distance as soon as they change
  Connichiwa.on ("deviceDistanceChanged", function (device) {
    updateRemoteDistance (device);
  });

  /*
   Connichiwa.respond("promptInput", "promptRespond", function(message) {
   alert("Received reply from " + message.respondMsg);
   });*/




  /*onMessage functions for Tests 1-5*/
  // TEST 1 - OnMessage for Button Click
  Connichiwa.onMessage ("buttonClicked", function (message) {
    var console = $ ('#console');
    var msg = $ ('<div>');

    msg.html (JSON.stringify(message));
    console.append (msg);
    //alert ("I have been: " + message.buttonMsg);

    // Test for send method (from remote to master device)
    Connichiwa.send("master", "buttonResponse", {msg: 'clicked.'});
  });

  // On message respond for remote-to-master test
  Connichiwa.onMessage("buttonResponse", function (message) {
    var console = $ ('#consoleResponse');
    console.empty();
    console.append("Button has been " + message.msg);
  });

  // TEST 2 - Text prompt input
  Connichiwa.onMessage("promptInput", function(message) {
    var msg = $('<div>');
    var console = $('#console');

    console.empty();
    console.append("Hi there, " + message.promptMsg);
  });

  // TEST 3 - Boolean passed when flags image are clicked
  Connichiwa.onMessage("imgClicked", function(message) {
    if(message.isClicked) {
      $('#canImg').show();
    }
  });

  // TEST 4 - Create new canvas for transferred picture
  Connichiwa.onMessage("imgTransfer", function(message) {

    var console = $ ('#console');
    console.append(message.imgUrlKey);

    var camImg = document.createElement("IMG");
    var camDiv = document.getElementById("consoleCameraImg");

    camImg.src = message.imgUrlKey;
    camImg.setAttribute('id', 'camImg');
    camImg.style.width = '100%';
    camImg.style.height = 'auto';
    camDiv.appendChild(camImg);

  });


  function setDetectedDevices (value) {
    //Set the template data to reflect the new nearby device count
    //CWTemplates will automatically make the UI reflect the new data
    CWTemplates.set ('devices_nearby_count', value);
    CWTemplates.set ('devices_nearby_text_devices', pluralize ("device", value));
  }

  function setConnectedDevices (value) {
    //Set the template data to reflect the new connected device count
    //CWTemplates will automatically make the UI reflect the new data
    CWTemplates.set ('devices_connected_count', value);
    CWTemplates.set ('devices_connected_text_devices', pluralize ("device", value));
  }

  function updateRemoteDistance (device) {
    //Update the template data to reflect the new distance
    //Since each device shows a different distance, we set the distance on
    //that device's data store only (by using the devices identifier as the
    //data store's name). This way, only this devices UI is affected.
    if (device.getDistance () >= 0) {
      CWTemplates.set (device.getIdentifier (), "distance", device.getDistance ());
    } else { //distance cannot be determined
      CWTemplates.set (device.getIdentifier (), "distance", "unknown");
    }
  }

  // OnMessage for GoogleMaps
  // Broadcast marker's lat and lng to other connected devices
  Connichiwa.onMessage('shareMarker', function (message) {
    var lat = message.remoteLat;
    var lng = message.remoteLng;
    var latLng = message.remotePosition;
    var placeName = message.remoteName;

    var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
    var markerId = getMarkerUniqueId(lat,lng);

    if(!savedMarkers[markerId]) {
      var marker = new google.maps.Marker ({
        position: latLng,
        map: map,
        icon: image,
        id: 'marker_' + markerId
      });

      savedMarkers[markerId] = marker;

      createInfoWindow(map, lat, lng, placeName);
    }

    log(message._source, 'Share', placeName);
  });


  Connichiwa.onMessage('anotateMarker', function (message) {
    var lat = message.remoteMarkerLat;
    var lng = message.remoteMarkerLng;


    var markerId = getMarkerUniqueId(lat, lng);
    //infoWindows[markerId].setContent(message.remotePrompt);

    var marker = savedMarkers[markerId];

    //promptHoursAndOrder(message.remoteMarkerLat, message.remoteMarkerLng);
    createAnnotateInfoWindow(markerId, marker, message.remoteVisitDur, message.remoteVisitOrder);
    setDurationProgressBar(message.remoteVisitDur, 'add');
    setPath(lat, lng);

    log(message._source, 'Annotate', message.remotePrompt);

  });

  Connichiwa.onMessage('updateAnnotate', function (message) {
    var lat = message.remoteMarkerLat;
    var lng = message.remoteMarkerLng;


    var markerId = getMarkerUniqueId(lat, lng);
    //infoWindows[markerId].setContent(message.remotePrompt);

    //var oldDur = annotations[markerId].order;

    annotations[markerId].order.setContent('#' + message.newOrder);
    annotations[markerId].dur.setContent(message.newDur + 'hr');


    setDurationProgressBar(message.oldDur, 'subtract');
    setDurationProgressBar(message.newDur, 'add');

    setPath(lat, lng);

    log(message._source, 'Update Annotate', ', Visit Order: ' + message.newOrder + ', Visit Duration: ' + message.newDur);

  });

  Connichiwa.onMessage('deleteMarker', function (message) {
    //removeMarker(message.remoteMarker, message.remoteMarkerId);
    var delMarkerId = getMarkerUniqueId(message.remoteMarkerLat, message.remoteMarkerLng);
    var delMarker = savedMarkers[delMarkerId];


    delMarker.setMap(null);
    delete savedMarkers[delMarkerId];

    //Delete infoBox
    infoWindows[delMarkerId].close();
    delete infoWindows[delMarkerId];

    if(annotations[delMarkerId]) {
      //Delete annotation infoBox
      var ibOrder = annotations[delMarkerId].order;
      var ibDur = annotations[delMarkerId].dur;

      var delIbDur;
      var delIbOrder;
      delIbDur = ibDur.getContent().replace('hr','');
      delIbOrder = parseInt(ibOrder.getContent().replace('#','')) - 1;

      ibOrder.close();
      ibDur.close();

      // Update the prograss bar after delete
      setDurationProgressBar(delIbDur, 'subtract');

      //debugger;

      //tripPlanCoordinates[delIbOrder].lat = null;
     // tripPlanCoordinates[delIbOrder].lng = null;
      tripPlanCoordinates = tripPlanCoordinates.filter(function( obj ) {
        return (obj.lat !== message.remoteMarkerLat && obj.lng !== message.remoteMarkerLng);
      });

      delete annotations[delMarkerId];

      tripPath.setPath(tripPlanCoordinates);

      tripPath.setMap(map);

    }

    log(message._source, 'Delete', message.remoteName);
  });

  function setPath(remoteLat, remoteLng) {
    //debugger;
    var markerId = getMarkerUniqueId(remoteLat, remoteLng);
    var order = annotations[markerId].order;
    order = parseInt(order.getContent().replace('#','')) - 1;

    //tripPlanCoordinates[order] = {lat: remoteLat, lng: remoteLng};
    tripPlanCoordinates.push({lat: remoteLat, lng: remoteLng, tripOrder: order});

    // sort by value
    tripPlanCoordinates.sort(function (a, b) {
      if (a.tripOrder > b.tripOrder) {
        return 1;
      }
      if (a.tripOrder < b.tripOrder) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });


    tripPath.setOptions({
      path: tripPlanCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      zIndex: 5
    });

    
    tripPath.setMap(map);
  }

  function setDurationProgressBar(visitDuration, command) {
    const totalHours = 7;
    var percentDuration;
    var statusDuration;


    if(command == 'add') {
      currentDuration += parseFloat(visitDuration);
    }
    else if(command == 'subtract') {
      currentDuration -= parseFloat(visitDuration);
    }



    if(currentDuration <= 7) {

      percentDuration = round((currentDuration / totalHours) * 100, 1);


      var strCurDuration = currentDuration.toString();
      statusDuration = strCurDuration.slice(0, 3) + ' out of 7 hrs';

      if ( document.getElementById("my-progress-bar").className.match(/(?:^|\s)progress-bar-danger(?!\S)/) ) {

        document.getElementById("my-progress-bar").className =
          document.getElementById("my-progress-bar").className.replace
          ( /(?:^|\s)progress-bar-danger(?!\S)/g , '' )
        ;
      }

      $("#my-progress-bar").css("width", percentDuration + "%");
      //$("#my-progress-bar").css("color", "#C0C0C0");
      $("#my-progress-bar").attr("aria-valuenow", percentDuration + "%");
      $("#my-progress-bar").html(statusDuration.bold());
    }

    else {
      //currentDuration = 7;

      //percentDuration = round((currentDuration / totalHours) * 100, 1);

      $("#my-progress-bar").css("width", "100%");
      $("#my-progress-bar").attr("aria-valuenow", "100%");
      //alert('Your trip runs longer than 7 hours');
      statusDuration = 'More than 7 hours by ' + (currentDuration - 7) + ' hours';
      $("#my-progress-bar").html(statusDuration.bold());
      //$("div.progress-bar-success").toggleClass("progress-bar-danger");

      document.getElementById("my-progress-bar").className += " progress-bar-danger";

    }




  }

  function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  function createAnnotateInfoWindow(markerId, marker, visitDuration, visitOrder) {
    if(infoWindows[markerId] && !annotations[markerId]) {
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


      marker.addListener('click', function() {
        myIbOrder.open(map, marker);
        myIbDur.open(map, marker);
        //ibLabel.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
      });

      myIbOrder.open(map, marker);
      myIbDur.open(map, marker);
    }
    /*else if(infoWindows[markerId] && annotations[markerId]) {

      var myIbOrder = annotations[markerId].order;
      var myIbDur = annotations[markerId].dur;

      myIbOrder.setContent('#' + visitOrder);
      myIbDur.setContent(visitDuration + 'hr');

    }*/
  }


  // Log the X, Y touch coordinates
  Connichiwa.onMessage('broadcastTouch', function (message) {

    //$('#consoleTest').append(timeStamp() + ', Device ' + getDeviceIndex(message._source) + ', X: ,' + message.xCoor + ' Y: ,' + message.yCoor + "<br/>");
    logCoor(message._source, message.xCoor, message.yCoor);
  });

  // Log the Zoom In or Out events
  Connichiwa.onMessage('broadcastZoom', function (message) {

    log(message._source, message.zoom, 'none');

  });

  Connichiwa.onMessage('searchedInput', function(message) {
    log(message._source, 'Searched Input', message.searchedPlace);
  });

  Connichiwa.onMessage('clickUnsavedMarker', function(message) {
    log(message._source, 'Clicked (Unsaved) Marker', message.unsavedPlace);
  });

  var getMarkerUniqueId= function(lat, lng) {
    return lat + '_' + lng;
  };

  function logCoor(deviceId, x, y) {

    var d = new Date();
    var data = {
      line: d.toLocaleString()+ ', Device ' + getDeviceIndex(deviceId) + ', Command: Touch' + ', X: ' + x + ', Y: ' + y //content will be appended to the file

    };
    $.ajax({
      type: "POST",
      url: "http://192.168.1.102:3002/log",
      data: data,
      success: function(result) {
        console.log('success', result);
      },
      error: function(err) {
        console.log('error', err);
      }
    });
  }

  function log(deviceId, command, location){

    //var console = $('#consoleTest');
    var deviceIndex;
    //var msg = $('<div>');



    var d = new Date();
    var data = {
      line: d.toLocaleString()+ ', Device ' + getDeviceIndex(deviceId) + ', Command: ' + command + ', Location: ' + location //content will be appended to the file

    };
    $.ajax({
      type: "POST",
      url: "http://192.168.1.102:3002/log",
      data: data,
      success: function(result) {
        console.log('success', result);
      },
      error: function(err) {
        console.log('error', err);
      }
    });

    //msg.html (JSON.stringify(data));
    //console.append('Time (ms): ' + timestamp + ', Device ' + getDeviceIndex(deviceId) + ', Command: ' + command + "<br/>");
  }

  function getDeviceIndex(deviceId) {

    var deviceIdentifier;
    for(var i = 0; i < devices.length; i++) {

      deviceIdentifier = devices[i].getIdentifier();

      if(deviceIdentifier == deviceId) {
        return i;
      }

    }


  }
    /**
     * Return a timestamp with the format "m/d/yy h:MM:ss TT"
     * @type {Date}
     */

  function timeStamp() {

    var now = new Date();

    // Create an array with the current hour, minute and second
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

    // Determine AM or PM suffix based on the hour
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";

    // Convert hour from military time
    //time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
      if ( time[i] < 10 ) {
        time[i] = "0" + time[i];
      }
    }

    // Return the formatted string
    return time.join(":");
  }


  function createInfoWindow(map, lat, lng, placeName) {
    var markerId = getMarkerUniqueId(lat, lng);
    var marker = savedMarkers[markerId];
    var contentString = placeName;


    /*var infowindow = new google.maps.InfoWindow({
     content: contentString
     });*/

    if(!infoWindows[markerId]) {
      var myOptions = {
        content: contentString
        , boxStyle: {
          border: "1px solid black"
          , textAlign: "center"
          , fontSize: "8pt"
          //,width: "75px"
          , background: "yellow"
          , opacity: 0.75
          , maxWidth: "75px"
        }
        , disableAutoPan: true
        , pixelOffset: new google.maps.Size (-10, 0)
        , closeBoxURL: ""
        , isHidden: false
        , pane: "floatPane"
        , enableEventPropagation: true

      };

      var ibLabel = new InfoBox(myOptions);

      infoWindows[markerId] = ibLabel;

      marker.addListener('click', function() {
        ibLabel.open(map, marker);
        ibLabel.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
      });

      ibLabel.open(map, marker);
    }

    /*infoWindows[markerId] = infowindow;

     marker.addListener('click', function() {
     infowindow.open(map, marker);
     });

     infowindow.open(map, marker);*/
  }

});

function initMap () {

  $.getScript('infobox.js', function(data, status, jxhr){
    console.log('infobox JS loaded. Status: ', status);
  });

  map = new google.maps.Map (document.getElementById ('map'), {
    zoom: 14,
    draggable: false,
    scrollwheel: false,
    center: {lat: 51.51402819, lng: -0.10990552},
    panControl: false,
    maxZoom: 14,
    minZoom: 14
  });

  tripPath = new google.maps.Polyline({
    path: [],
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    zIndex: 5

  });
}


function pluralize (word, number) {
  if (number === 1) return word;
  return word + "s";
}