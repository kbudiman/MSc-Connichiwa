/**
 * Created by Kevin on 2016-06-24.
 */
Connichiwa.onLoad(function () {

  var desiredWidth, dataPic, imgUrlVal;

  $(document).ready(function () {
    $("#takePictureField").on("change",gotPic);
    //$("#yourimage").load(getSwatches);
    desiredWidth = window.innerWidth;

    if(!("url" in window) && ("URL" in window)) {
      window.URL = window.webkitURL;
    }
  });

  /*function getSwatches(){
    var colorArr = createPalette($("#yourimage"), 5);
    for (var i = 0; i < Math.min(5, colorArr.length); i++) {
      $("#swatch"+i).css("background-color","rgb("+colorArr[i][0]+","+colorArr[i][1]+","+colorArr[i][2]+")");
      console.log($("#swatch"+i).css("background-color"));
    }
  }*/


  //Credit: https://www.youtube.com/watch?v=EPYnGFEcis4&feature=youtube_gdata_player
  function gotPic(event) {
    if(event.target.files.length == 1 &&
      event.target.files[0].type.indexOf("image/") == 0) {
      $("#yourimage").attr("src",URL.createObjectURL(event.target.files[0]));
    }
  }

  function gotPic(event) {
    if(event.target.files.length == 1 &&  event.target.files[0].type.indexOf("image/") == 0) {

      imgUrlVal = URL.createObjectURL (event.target.files[0]);

      // Convert img URL to Base 64
      convertImgToBase64 (imgUrlVal, function (base64Img) {
        console.log ('IMAGE:', base64Img);
        $ ("#yourimage").attr ("src", base64Img);
        dataPic = {imgUrlKey: base64Img};
      });
    }
  }

  function convertImgToBase64(url, callback, outputFormat){
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
      var canvas = document.createElement('CANVAS');
      var ctx = canvas.getContext('2d');
      canvas.height = this.height;
      canvas.width = this.width;
      ctx.drawImage(this,0,0,200,200);
      var dataURL = canvas.toDataURL(outputFormat || 'image/png');
      callback(dataURL);
      canvas = null;
    };
    img.src = url;
  }

  $('#yourimage').click(function () {

    Connichiwa.send("master", "imgTransfer", dataPic);

  });
});

