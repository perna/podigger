var APP = APP || {};

APP.Widgets = (function($){

     function init() {

        showApiAlert();
        

     }


     function showApiAlert() {
        $('.link-api').on('click', function(){
            swal(
            'API para Desenvolvedores',
            'Aguarde, em breve você poderá acessar nossa API pública com dados gerados pelo Podigger',
            'success'
            );
        });
     }

     return{init:init};




})(jQuery);