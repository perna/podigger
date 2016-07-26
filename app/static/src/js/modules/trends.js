var APP = APP || {};

APP.Trends = (function($){

    function init() {
        getTodayMostSearchedTerms(0, 'chart_today', 'blue');
        getTodayMostSearchedTerms(7, 'chart_seven_days', 'green');
        getTodayMostSearchedTerms(15, 'chart_fifteen_days', 'orange');
        getTodayMostSearchedTerms(30, 'chart_thirty_days', 'red');
    }


    function getDeltaDays(days) {

        var date = new Date(),
            last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000)),
            day = (last.getDate() < 10)? '0'+ last.getDate():last.getDate(),
            month = ((last.getMonth()+1) < 10)? '0'+(last.getMonth()+1):last.getMonth()+1,
            year = last.getFullYear(),
            pastDate = year+'-'+month+'-'+day;
            return pastDate;
    }

    function getTodayMostSearchedTerms(days, context, color) {

        var url = '/api/terms/'+getDeltaDays(days);

        $.get(url)
            .success(function(data){

                var dataSize = data.length - 1;
                var dataLabel = [];
                var dataTimes = [];

                for(var i = 0; i < dataSize; i++) {
                    dataLabel.push(data[i].name);
                    dataTimes.push(data[i].times);
                }

                var result = {labels: dataLabel, dataset: dataTimes};
                createChartBar(context, result, color);
        });
    }


        function createChartBar(context, data, color) {
            var ctx = document.getElementById(context).getContext('2d');
            var colorBGTable = [];
            var colorBRDTable = [];

            colorBGTable.blue   = 'rgba(0, 45, 139, 0.7)';
            colorBGTable.orange = 'rgba(255, 138, 21, 0.7)';
            colorBGTable.green  = 'rgba(53, 177, 21, 0.7)';
            colorBGTable.red    = 'rgba(214, 0, 21, 0.7)';

            colorBRDTable.blue   = 'rgba(0, 45, 139, 1)';
            colorBRDTable.orange = 'rgba(255, 138, 21, 1)';
            colorBRDTable.green  = 'rgba(53, 177, 21, 1)';
            colorBRDTable.red    = 'rgba(214, 0, 21, 1)';


            var data_source = {
                    labels: data.labels,
                    datasets: [
                        {
                            label: "Nº de buscas",
                            backgroundColor: colorBGTable[color],
                            borderColor: colorBRDTable[color],
                            borderWidth: 1,
                            data: data.dataset
                        }
                    ]
                };

            new Chart(ctx,{
                type: 'bar',
                data:data_source
            });
        }


        return {init:init};


})(jQuery);