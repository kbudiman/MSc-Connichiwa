Connichiwa.onLoad (function () {

  var data, dataPrompt, console, person;

  // Test Case 1 & 2: BUTTON CLICK, SEND TEXT
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

  Connichiwa.onMessage("button2Respond", function (message) {

    //alert('enter button2Respond' + message.button2msg);

    $('#consoleTest').append(message.button2msg);


  });

});