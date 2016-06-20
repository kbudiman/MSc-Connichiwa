Connichiwa.onLoad(function() {

  var data = {buttonMsg: " clicked!"};
  var dataPrompt;
  var console = $('#console');

  //alert('client');

    $('#button1').click(function(e){
      //alert('click');

      var person = prompt("Please enter your name", "Harry Potter");
      if (person != null) {
        dataPrompt = {promptMsg: person};
      }
      Connichiwa.broadcast("buttonClicked", data);
      Connichiwa.broadcast("promptInput", dataPrompt);
      //Connichiwa.send("master", "buttonClicked", buttonMsg);

      var msg = $('<div>');
      msg.html('buttonclicked');
      console.append(msg);
    });




});