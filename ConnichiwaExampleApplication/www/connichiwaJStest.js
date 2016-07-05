Connichiwa.onLoad (function () {

  var data, dataPrompt, console, person;

  // TEST 1 & 2: BUTTON CLICK, SEND TEXT
  $ ('#button1').click (function (e) {

    data = {buttonMsg: "clicked"};
    console = $('#console');
    person = prompt ("Please enter your name", "Harry Potter");

    if (person != null) {
      dataPrompt = {promptMsg: person};
      console.append('Message entered')
    }

    //Broadcast button click
    Connichiwa.broadcast ("buttonClicked", data);

    //Broadcast text input from prompt
    Connichiwa.broadcast ("promptInput", dataPrompt);

    Connichiwa.broadcast("buttonRemoteClicked", {clicked: 'remoteButton is clicked'});

    /*var msg = $('<div>');
    msg.html('buttonclicked');
    console.append (msg);*/
  });



  // Test Case 3: BOOLEAN IMAGE
  $('#gbImg').click(function(e) {
    data = {isClicked: true};

    Connichiwa.send("master", "imgClicked", data);

    $('#gbImg').hide();
  });

  Connichiwa.onMessage("imgRespond", function (message) {

    if(message.imgClicked) {
      $('#gbImg').show();
    }
  });

  // TEST 5 - Send method from master-to-remote
  Connichiwa.onMessage("button2Respond", function (message) {
    //alert('enter button2Respond' + message.button2msg);
    $('#consoleTest').append(message.button2msg);
  });

  Connichiwa.onMessage("buttonRemoteClicked", function(message) {
    $('#consoleTest').append(message.clicked);
  });
  

});