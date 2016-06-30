$(document).ready(function(){
    var $linksMenu = $('.navbar-nav').find('a');

    $linksMenu.on('click, touchstart', function(){
        $('.navbar-toggle').trigger('click');
    });
});
