'use strict';

var summer = (function ($) {

    var indexPostClass = '.summer-index-post',
        mobileMenuButton = '.summer-mobile-menu a',
        mobileMenuCloseButton = '.summer-mobile-close-btn',
        mainMenu = '.summer-menu',
        bgCheckClass = '.bg-check',
        postBgImages = '.bg-img img',
        postCoverImg = '.summer-post-header .bg-img',

    mobileMenu = function () {
        if($(mainMenu).length) {
            $(mobileMenuButton).on('click', function(e){
                e.preventDefault();
                $(mainMenu).addClass('opened');
            });
            $(mobileMenuCloseButton).on('click', function(e){
                e.preventDefault();
                $(mainMenu).removeClass('opened');
            });
        }
    },

    // summer javascripts initialization
    init = function () {
        mobileMenu();
        $('p:has(> img)').addClass('with-image');
    };

    return {
        init: init
    };

})(jQuery);

(function () {
    summer.init();
})();