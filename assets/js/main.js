'use strict';

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  var mainMenu              = document.getElementsByClassName("summer-menu")[0],
      mobileMenuButton      = document.querySelectorAll(".summer-mobile-menu a")[0],
      mobileMenuCloseButton = document.getElementsByClassName("summer-mobile-close-btn")[0];

  if(mainMenu) {
    mobileMenuButton.addEventListener("click", function(e) {
      e.preventDefault();
      mainMenu.classList.add("opened");
    });
    mobileMenuCloseButton.addEventListener("click", function(e) {
      mainMenu.classList.remove("opened");
      e.preventDefault();
    });
  }

  var images = document.querySelectorAll("p > img");
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var parent = image.parentNode;

    if (parent.tagName === "P") {
      parent.classList.add("with-image");
    }
  }
});