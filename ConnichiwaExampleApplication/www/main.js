var map;
var lat,lng, latLng, placeName;
var savedMarkers = {};
var infoWindows ={};

//All Connichiwa-related stuff should always be done in Connichiwa.onLoad()
Connichiwa.onLoad (function () {
  //Get our master template and insert it into the body
  CWTemplates.load ("template_master.html");
  CWTemplates.insert ("master", {target: "body"});

  var devices = []; // Array to store connected devices
  var deviceCounter;
  var button2data, imgData;


  
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

    deviceCounter = 0;

    Connichiwa.on ("deviceConnected", function (device) {

      //Increase connected devices
      var connectedDevices = CWTemplates.get ('devices_connected_count');
      setConnectedDevices (connectedDevices + 1);

      devices.push(device);

      devices[deviceCounter].insert ("Device" + connectedDevices + ": "+ "<b>I am connected!</b>");



      //Load custom GoogleMaps .JS
      //device.loadScript ("maps.js");
      device.loadScript("remoteDeviceMap.js");
      device.loadCSS("maps.css");
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



      device.loadCSS ("styles.css");
      device.loadTemplates ("template_remote.html");

      device.insertTemplate ("remote", {
        target: "body",
        dataSource: device.getIdentifier ()
      });



      //device.loadScript ("/connichiwaJStest.js");
      //device.loadScript ("/camera.js");


      deviceCounter += 1;

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

  Connichiwa.on("deviceDisconnected", function () {
    //Decrease connected devices
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

  function log(data){
    var console = $('#console');
    var msg = $('<div>');

    msg.html (JSON.stringify(data));
    console.append(msg);
  }

});

function initMap () {
  map = new google.maps.Map (document.getElementById ('map'), {
    zoom: 13,
    draggable: false,
    scrollwheel: false,
    center: {lat: 51.51825, lng: -0.119648},
    panControl: false,
    maxZoom: 13,
    minZoom: 13
  });
}


// OnMessage for GoogleMaps
// Broadcast marker's lat and lng to other connected devices
Connichiwa.onMessage('shareMarker', function (message) {
  lat = message.remoteLat;
  lng = message.remoteLng;
  latLng = message.remotePosition;
  placeName = message.remoteName;

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
  var delMarkerId = getMarkerUniqueId(message.remoteMarkerLat, message.remoteMarkerLng);
  var delMarker = savedMarkers[delMarkerId];


  delMarker.setMap(null);
  delete savedMarkers[delMarkerId];

  //Delete infoBox
  infoWindows[delMarkerId].close();
  delete infoWindows[delMarkerId];
});

var getMarkerUniqueId= function(lat, lng) {
  return lat + '_' + lng;
};

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



function pluralize (word, number) {
  if (number === 1) return word;
  return word + "s";
}