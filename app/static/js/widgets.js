(function(){

    'use strict';

    $(document).ready(function(){

        $('.link-trends').on('click', function(){
            swal(
            'Trends',
            'Em breve você poderá acompanhar quais os termos mais procurados pelos usuários',
            'success'
            );
        });

         $('.link-api').on('click', function(){
            swal(
            'API para Desenvolvedores',
            'Aguarde, em breve você poderá acessar nossa API pública com dados gerados pelo Podigger',
            'success'
            );
        });
    });


})();