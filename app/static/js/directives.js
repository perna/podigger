/**
 * Sample code from
 * http://jsfiddle.net/ASjRP/20/
 */
angular('podigger')
    .directive('audioPlayer', function(){
        return function(scope, element, attrs){
                    element.bind("timeupdate", function(){
                        scope.timeElapsed = element[0].currentTime;
                        scope.$apply();
                    });
                };
    });