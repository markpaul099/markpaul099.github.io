var backgroundImage = document.getElementById("background-image");
var h1 = document.querySelector("#main-content h1");

document.getElementById("button1").addEventListener("mouseover", function() {
  fadeOutImage();
  setTimeout(function() {
    setBackgroundImage("url('images/RIJ_waifu2x_4x_jpg.jpg')");
    fadeInImage();
    h1.style.color = "black";
    h1.style.textShadow = "2px 2px 2px white"; // Add white text shadow
  }, 500);
});

document.getElementById("button1").addEventListener("mouseout", function() {
  fadeOutImage();
  h1.style.color = "white";
  h1.style.textShadow = "none"; // Remove text shadow
});

document.getElementById("button2").addEventListener("mouseover", function() {
  fadeOutImage();
  setTimeout(function() {
    setBackgroundImage("url('images/TOF_waifu2x_4x_jpg.jpg')");
    fadeInImage();
    h1.style.color = "black";
    h1.style.textShadow = "2px 2px 2px white"; // Add white text shadow
  }, 500);
});

document.getElementById("button2").addEventListener("mouseout", function() {
  fadeOutImage();
  h1.style.color = "white";
  h1.style.textShadow = "none"; // Remove text shadow
});

function setBackgroundImage(imageUrl) {
  backgroundImage.style.backgroundImage = imageUrl;
}

function fadeInImage() {
  backgroundImage.style.opacity = "1";
}

function fadeOutImage() {
  backgroundImage.style.opacity = "0";
}
