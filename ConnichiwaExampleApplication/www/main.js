//All Connichiwa-related stuff should always be done in Connichiwa.onLoad()
Connichiwa.onLoad (function () {
  //Get our master template and insert it into the body
  CWTemplates.load ("template_master.html");
  CWTemplates.insert ("master", {target: "body"});

  var devices = [];
  var connectedDevices;
  var consolePrompt;
  var data;

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

      device.insert ("<b>I am connected!</b>");
      //Increase connected devices
      var connectedDevices = CWTemplates.get ('devices_connected_count');

      setConnectedDevices (connectedDevices + 1);

      $('#consoleDevices').empty();
      $('#consoleDevices').append("\n" + CWDeviceManager.getConnectedDevices());

      //Load CSS and insert the remote template into the new device. The remote
      //template shows the devices current distance (also see "deviceDistanceChanged")
      //
      //The third parameter to .insertTemplate() is the name of the data store the
      //template uses. Each remote template gets its own data (since each displays
      //its individual distance). As you will see in updateRemoteDistance(), we
      //use this name to determine which devices UI is updated
      device.loadCSS ("styles.css");
      device.loadTemplates ("template_remote.html");

      device.insertTemplate ("remote", {
        target: "body",
        dataSource: device.getIdentifier ()
      });

      //Load custom .JS
      device.loadScript ("/connichiwaJStest.js");

      
      
      $('#canImg').click(function(e) {

        $('#canImg').hide();
      });

      updateRemoteDistance (device);

      if(device.toString() != null) {
        //alert("Device found: " + device.toString());
      }

    });
  }
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

  Connichiwa.on ("deviceConnected", function (device) {
    //log("Device name: " + device.getName());
    //devices.push(device);
    //log("Devices: " + devices);

    //device.insert("Hi, I'm "+device.getName()+" and I am now part of your app!");
    //device.insert(device.getIdentifier(), "body", "<b>HTML here</b>");

    //When Canadian flag is clicked, hide it
  });


  /*
  Connichiwa.respond("promptInput", "promptRespond", function(message) {
    alert("Received reply from " + message.respondMsg);
  });*/


  Connichiwa.onMessage("promptInput", function(message) {
    var msg = $('<div>');
    var console = $('#console');

    console.empty();
    console.append("Hi there, " + message.promptMsg);
  });

  Connichiwa.onMessage ("buttonClicked", function (message) {
    var console = $ ('#console');
    var msg = $ ('<div>');

    msg.html (JSON.stringify(message));
    console.append (msg);
    //alert ("I have been: " + message.buttonMsg);

    Connichiwa.send("master", "kevinresponse2", {msg: 'clicked.'});
  });

  Connichiwa.onMessage("kevinresponse2", function (message) {

    //alert ("Received reply: " + message.msg);

    var console = $ ('#consoleResponse');
    console.empty();
    console.append("Button has been " + message.msg);
  });

  Connichiwa.onMessage("imgClicked", function(message) {
    if(message.isClicked) {
      $('#canImg').show();
    }
  });

  Connichiwa.onMessage("imgClicked2", function(message) {
    if(message.isClicked) {
      //$('#gbImg').show();
      alert('Hello');
    }
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

//Define onMessage function here..


function pluralize (word, number) {
  if (number === 1) return word;
  return word + "s";
}