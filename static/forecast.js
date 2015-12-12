function initializeGoalChart(goaldata, chartOrder) {

    var goal = new chart(
        div = 'goalDiv',
        data = goaldata,
        divcol = 12,
        firstTitle = 'Net Worth',
        secondTitle = '',
        sumcol = false,
        valStartCol = 3,
        categoryEndCol = 2,
        chartHeight = '600px',
        tooltip = true
    );

    initializeInputs();

    setControlOptions();

    setChartOptions();

    appendHTML();

    fadeDivs(0, 0);

    initiateDateButtons();

    goal.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);

        this.dataView = addForecasts(this.dataView);

        for (var i=1; i<5; i++) {
            GLOBALS.formatamount.format(this.dataView, i);
        }

        this.dashboard.draw(this.dataView);

    };


    google.visualization.events.removeAllListeners(goal.chartWrapper);

    goal.dataTable = goal.initialDraw(goal.data);
    goal.redraw();

    setTimeout(function () {
        fadeDivs('slow', 1);
    }, 1000);



    function addForecasts(dataView) {

        goal.retirementDate = new Date();
        goal.retirementGoal = calculatePV(goal.inputs.monthlyRetirementExpenses.value, goal.inputs.rateOfReturn.value / 12, (goal.inputs.ageOfDeath.value - goal.inputs.ageOfRetirement.value) * 12);
        goal.retirementDate = goal.retirementDate.setFullYear(goal.inputs.ageOfRetirement.value - goal.inputs.currentAge.value + 2015);

        var lastRow, lastDate, monthyear, lastActual, lastGoal;

        dataView.addColumn({type: 'string', role: 'annotation'});
        dataView.setValue(dataView.getNumberOfRows() - 1, 3, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        // is this really the best way?

        dataView = addNextYearDates(dataView);



        dataView = addFutureDates(dataView);
        dataView = addRetirementDates(dataView);
        dataView = addIntervals(dataView);
        return dataView;

        function setVariables() {

            lastRow = dataView.getNumberOfRows() - 1;
            lastDate = dataView.getValue(lastRow, 0);

            monthyear = [lastDate.getMonth() + 1, lastDate.getYear() + 1900];

            lastActual = dataView.getValue(lastRow, 1);
            lastGoal = dataView.getValue(lastRow, 2);

        }


        function addFutureValues(run, iter) {

            setVariables();

            var a = [];
            for (var i = 0; i < iter; i++) {

                monthyear = incrementMonthEnd(monthyear);

                switch(run) {
                    case 0:
                        lastActual += goal.inputs2.next12Save[i];
                        lastGoal += goal.inputs2.next12Goal[i];
                        break;
                    case 1:
                        lastActual = lastActual * Math.pow(1 + goal.inputs.rateOfReturn.value, 1 / 12) + goal.inputs.futureMonthlySave.value;
                        lastGoal = lastGoal * (1 + goal.inputs.rateOfReturn.value / 12) + goal.futureMonthlyGoal;
                        break;
                    case 2:
                        lastActual = lastActual * Math.pow(1 + goal.inputs.rateOfReturn.value, 1 / 12) - goal.inputs.monthlyRetirementExpenses.value;
                        lastGoal = lastGoal * (1 + goal.inputs.rateOfReturn.value / 12) - goal.inputs.monthlyRetirementExpenses.value;
                        break;
                    default:
                        void(0);
                }

                a.push([new Date(monthyear[1], monthyear[0], 0), lastActual, lastGoal, null]);

            }
            dataView.addRows(a);
            return dataView
        }


        function addNextYearDates(dataView) {

            var numberOfDates = 12;

            dataView = addFutureValues(0, numberOfDates);

            return dataView
        }

        function addFutureDates(dataView) {

            goal.futureMonthlyGoal = getMonthlyGoalAmount(dataView);

            var numberOfDates = (goal.inputs.ageOfRetirement.value - goal.inputs.currentAge.value - 1) * 12 - 1;

            dataView = addFutureValues(1, numberOfDates);

            return dataView

        }

        function addRetirementDates(dataView) {

            var numberOfDates = (goal.inputs.ageOfDeath.value - goal.inputs.ageOfRetirement.value) * 12 - 1;

            dataView = addFutureValues(2, numberOfDates);

            return dataView

        }

        function getMonthlyGoalAmount(dataView) {

            var lastRow = dataView.getNumberOfRows() - 1;
            var lastGoal = dataView.getValue(lastRow, 2);

            var numberOfDates = (goal.inputs.ageOfRetirement.value - goal.inputs.currentAge.value - 1) * 12;

            var payment = calculatePayment(lastGoal, goal.retirementGoal, goal.inputs.rateOfReturn.value / 12, numberOfDates);

            return payment
        }

        function calculatePayment(PV, FV, rate, nper) {

            return (-PV * Math.pow(1 + rate, nper) * rate + (FV * rate)) / (Math.pow(1 + rate, nper) - 1)
        }

        function calculatePV(PMT, rate, nper) {

            return ( PMT * (Math.pow(1 + rate, nper) - 1) / ( rate * Math.pow(1 + rate, nper)))
        }


        function addIntervals(dataView) {

            dataView.insertColumn(2, {id: 'i0', type: 'number', role: 'interval'});
            dataView.insertColumn(2, {id: 'i1', type: 'number', role: 'interval'});

            var min = 0;
            var max = 0;

            var continuousExpectedReturn = Math.log(1 + goal.inputs.rateOfReturn.value) - Math.pow(goal.inputs.stdev.value * goal.inputs.rateOfReturn.value, 2) / 2;
            var continuousStandardDeviation = Math.sqrt(Math.log(Math.pow(goal.inputs.stdev.value * goal.inputs.rateOfReturn.value, 2) / Math.pow(1 + goal.inputs.rateOfReturn.value, 2) + 1));
            var ZScore = calc_q(goal.inputs.certainty.value);

            var currentDate = new Date();
            var numberOfDatesToCurrent = ( currentDate.getFullYear() - 2006 + 1 ) * 12 + currentDate.getMonth() - 4;
            var numberofrows = dataView.getNumberOfRows() - numberOfDatesToCurrent;

            var a = continuousStandardDeviation * ZScore;

            var baseValue = dataView.getValue(numberOfDatesToCurrent, 1);

            for (var i = 0; i <= numberOfDatesToCurrent; i++) {
                dataView.setValue(i, 2, dataView.getValue(i, 1));
                dataView.setValue(i, 3, dataView.getValue(i, 1));
            }

            var datesToRetirement = numberOfDatesToCurrent + (goal.inputs.ageOfRetirement.value - goal.inputs.currentAge.value - 1) * 12 - 1;

            for (var i = numberOfDatesToCurrent + 1; i < datesToRetirement; i++) {

                var j = i - numberOfDatesToCurrent;
                var b = a / Math.pow((j) / 12, 0.5);

                var saveAmount = goal.inputs.futureMonthlySave.value;

                var maxFunction = Math.pow(Math.exp(continuousExpectedReturn + b), j / 12);
                var minFunction = Math.pow(Math.exp(continuousExpectedReturn - b), j / 12);

                max += maxFunction * saveAmount;
                min += minFunction * saveAmount;

                dataView.setValue(i, 2, max + maxFunction * baseValue);
                dataView.setValue(i, 3, min + minFunction * baseValue);

            }

            var k = 0;
            var max2 = 0;
            var min2 = 0;

            var saveAmount = goal.inputs.futureMonthlySave.value;

            for (var i = datesToRetirement; i < dataView.getNumberOfRows(); i++) {

                k++;
                var l = a / Math.pow((k) / 12, 0.5);
                var maxFunction2 = Math.pow(Math.exp(continuousExpectedReturn + l), k / 12);
                var minFunction2 = Math.pow(Math.exp(continuousExpectedReturn - l), k / 12);

                max2 += maxFunction2 * (saveAmount + goal.inputs.monthlyRetirementExpenses.value);
                min2 += minFunction2 * (saveAmount + goal.inputs.monthlyRetirementExpenses.value);

                var j = i - numberOfDatesToCurrent;
                var b = a / Math.pow((j) / 12, 0.5);

                var maxFunction = Math.pow(Math.exp(continuousExpectedReturn + b), j / 12);
                var minFunction = Math.pow(Math.exp(continuousExpectedReturn - b), j / 12);

                max += maxFunction * saveAmount;
                min += minFunction * saveAmount;

                dataView.setValue(i, 2, max + maxFunction * baseValue - max2);
                dataView.setValue(i, 3, min + minFunction * baseValue - min2);

            }

            return dataView
        }
    }


    function createHTMLInputDiv(name, cols) {

        return '\
            <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--' + cols + '-col textInput">\
                <div class="firstTitle">' + goal.firstTitle + '</div>\
                </br>\
                <div id=allInputs>' + createHTMLList(name) + '\
                </div>\
            </div>';
    }


    function createHTMLList(list) {

        var b = '<form action="#">';
        for (var i in list) {
            b = b.concat('<div class=inputHeader>' + list[i].name + '</div>\
              <div class="mdl-textfield mdl-js-textfield">\
                <input class="mdl-textfield__input" type="text" pattern="-?[0-9]*(\.[0-9]+)?" id="' + list[i].name + '">\
                <label class="mdl-textfield__label" style="font-size:12px" for="' + list[i].name + '">' + list[i].value + '</label>\
                <span class="mdl-textfield__error"></span>\
              </div>\
            ')
        }
        return b.concat('</form>')

    }


    function boundClickHandler(e) {

        for (var name in goal.inputs) {
            if (e.target.id === goal.inputs[name].name) {
                goal.inputs[name].value = Number(e.target.value)
            }

        }
        goal.redraw();
    }


    function savingsboundClickHandler(e) {

        goalexpected = Number(String(e.target.id).slice(0, 2));
        newamountid = Number(String(e.target.id).slice(-2));

        if (goalexpected === 0) {
            goal.inputs2.next12Goal[newamountid] = Number(e.target.value)
        } else if (goalexpected === 1) {
            goal.inputs2.next12Save[newamountid] = Number(e.target.value)
        } else {
            console.log("invalid entry")
        }
        goal.redraw();
    }


    function createTable(headers, data) {

        rowHeaders = ["Goal", "Expected"];
        var html = [];
        html.push('<form action="#" id=form2><table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp" id=savings style="margin:16px;"><thead><tr>');
        html.push('<th class="mdl-data-table__cell--non-numeric"></th>');

        for (var col = 0; col < data[0].length; col++) {

            columnheader = '<th class="mdl-data-table__cell--numeric" style="text-align:left">';
            html.push(columnheader + escapeHtml(String(headers[col])) + '</th>');
        }

        html.push('</tr></thead>');

        for (var row = 0; row < data.length; row++) {
            html.push('<tr>');
            html.push('<td contenteditable="true" style="text-align:left">');
            html.push(escapeHtml(rowHeaders[row]));
            html.push('</td>');

            for (var col = 0; col < data[0].length; col++) {
                html.push('<td contenteditable="false" style="text-align:right">');
                html.push('\
                    <div class="mdl-textfield mdl-js-textfield goalinput2">\
                        <input class="mdl-textfield__input goalinput" type="text" pattern="-?[0-9]*(\.[0-9]+)?" id="' + String(row) + "  .  " + String(col) + '">\
                        <label class="mdl-textfield__label goallabel" style="font-size:12px; top:0;" for="' + String(row) + "  .  " + String(col) + '">' + data[row][col] + '</label>\
                        <span class="mdl-textfield__error"></span>\
                    </div>');
                html.push('</td>');
            }
            html.push('</tr>');
        }
        html.push('</table></form>');


        return html.join('');

    }


    function escapeHtml(text) {
        if (text == null)
            return '';
        return text.replace(/&/g, '&').replace(/</g, '<')
            .replace(/>/g, '>').replace(/"/g, '"');
    }


    function initializeInputs() {

        goal.inputs = {};
        goal.inputs2 = {};

        goal.inputs.rateOfReturn = {"name": "Rate of Return", "value": 0.05};
        goal.inputs.futureMonthlySave = {"name": "Future Monthly Savings", "value": 2000};
        goal.inputs.monthlyRetirementExpenses = {"name": "Monthly Expenses in Retirement", "value": 12000};

        goal.inputs.currentAge = {"name": "Current Age", "value": 30};
        goal.inputs.ageOfRetirement = {"name": "Age of Retirement", "value": 65};
        goal.inputs.ageOfDeath = {"name": "Age of Death", "value": 95};

        goal.inputs.certainty = {"name": "Certainty", "value": 0.95};
        goal.inputs.stdev = {"name": "Standard Deviation", "value": 0.20};

        goal.inputs2.next12Goal = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000];
        goal.inputs2.next12Save = [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500];

        // to incorporate in the future
        // goal.inputs.rateOfInlation = { "name" : "Inflation Rate", "value" : 0.02 };
        // goal.inputs.taxRate = { "name" : "Tax Rate", "value" :.25 };

        goal.buttons = ['CURRENT','RETIREMENT'];

    }


    function setControlOptions() {

        goal.controlWrapper.setState({range: {start: new Date(2006, 1, 31)}});
        goal.controlWrapper.setState({range: {end: new Date(2017, 12, 31)}});
        goal.controlWrapper.setOption('ui.chartOptions.chartArea.width', '96%');
        goal.controlWrapper.setOption('ui.chartOptions.chartArea.left', '2%');
        goal.controlWrapper.setOption('ui.chartOptions.series.1.type', 'line');
        goal.controlWrapper.setOption('ui.chartOptions.series.1.targetAxisIndex', 0);
        goal.controlWrapper.setOption('ui.chartOptions.series.1.lineWidth', 1);
        goal.controlWrapper.setOption('ui.chartOptions.series.0.lineWidth', 2);
        goal.controlWrapper.setOption('ui.chartOptions.colors', [GLOBALS.chartcolours[0], 'red', GLOBALS.chartcolours[3]]);
        goal.controlWrapper.setOption('ui.chartOptions.areaOpacity', 0.3);
        goal.controlWrapper.setOption('ui.chartType', 'ComboChart');
        goal.controlWrapper.setOption('ui.chartOptions.seriesType', 'line');
        goal.controlWrapper.setOption('ui.chartOptions.intervals.color', '#99cbe2');

    }


    function setChartOptions() {

        //goal.chartWrapper.setChartType('AreaChart');
        goal.chartWrapper.setChartType('LineChart');
        goal.chartWrapper.setContainerId(goal.chartdiv);

        goal.setMultipleOptions([
            ['lineWidth', 2],
            ['areaOpacity', 1],
            //['tooltip.trigger', 'none'],
            ['hAxis.gridlines.count', 8],
            ['hAxis.gridlines.color', 'transparent'],
            ['vAxis.gridlines.count', 5],
            ['vAxis.gridlines.color', 'transparent'],
            ['chartArea.top', 8],
            ['chartArea.left', 8],
            ['chartArea.width', '98%'],
            ['chartArea.height', '85%'],
            ['vAxis.baselineColor', '#E1F5FE'],
            ['backgroundColor.fill', 'transparent'],
            ['focusTarget', 'datum'],
            ['crosshair.opacity', 0.3],
            ['crosshair.trigger', 'both'],
            ['colors', [GLOBALS.chartcolours[0], 'red', GLOBALS.chartcolours[3]]],
            ['series.1.type', 'line'],
            ['series.1.targetAxisIndex', 0],
            ['series.1.lineWidth', 1],
            ['vAxis.textPosition', 'in'],
            ['legend.position', 'in'],
            ['intervals.style', 'area'],
            ['intervals.color', '#027fb7']

        ]);
    }


    function returnHTMLDiv() {
        return '\
        <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--' + goal.divcol + '-col ' + goal.cardDiv + '">\
            <div id="' + goal.dashboarddiv + '">\
                <div id="' + goal.chartdiv + '" style="height: 100%;"></div>\
            </div>\
        </div>\
        <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--12-col" id=wrapper2 style="display:inline-block; height: 64px;">\
            ' + button(goal.buttons[0], 'left') + '\
            <div class="demo-graphs mdl-cell mdl-cell--7-col ' + goal.controldiv + '" id="' + goal.controldiv + '" style="display:inline-block;margin:0 8px 0 8px;padding:0 0 0 0;width:calc(100% - 160px); "></div>\
            ' + button(goal.buttons[1], 'right') + '\
        </div>'
    }


    function appendHTML() {

        var headers = returnMonthEndDates(new Date(), 12);

        for (var i = 0; i < headers.length; i++) {
            headers[i] = String(headers[i].toDateString().slice(3)).slice(1, 4) + " " + String(headers[i].toDateString().slice(3)).slice(-2)
        }

        var htmladdition = "";

        htmladdition += createHTMLInputDiv(goal.inputs, 2);
        htmladdition += '<div id=wrapper>';
        htmladdition += returnHTMLDiv();
        htmladdition += createTable(headers, [goal.inputs2.next12Goal, goal.inputs2.next12Save]);
        htmladdition += '</div>';

        GLOBALS.grid.append(htmladdition);

        componentHandler.upgradeDom();

        var $textInput = $(".textInput");
        $textInput.css('display', 'flex');
        $textInput.css('flex-direction', 'column');

        var $Rate = $("#Rate");
        $Rate.css('display', 'flex');
        $Rate.css('flex-direction', 'column');

        var inputLength = Object.keys(goal.inputs).length;
        var height = $textInput.height() - $('.inputHeader').height() * inputLength;

        $(".mdl-textfield.mdl-js-textfield.is-upgraded").css('padding-top', 0);
        $(".mdl-textfield__label").css('top', '6px');
        $('.goallabel').css('top', 0);

        $form = $("form");
        $form.css('flex', height / inputLength - 4);
        $form.change(boundClickHandler);

        $('#form2').change(savingsboundClickHandler);

        $controlgoalDiv = $('.controlgoalDiv');
        $wrapper2 = $('#wrapper2');
        $savings = $('#savings');
        $savings.css('width', $wrapper2.width() + Number($wrapper2.css('padding-left').slice(0, -2)) + Number($wrapper2.css('padding-right').slice(0, -2)));
        $savings.css('margin', '16px');
    }


    function fadeDivs(speed, opacity) {
        $('#controlgoalDiv').fadeTo(speed, opacity);
        $('#goalDiv').fadeTo(speed, opacity);
    }


    function initiateDateButtons() {

        $('.daterangebuttons').bind('click', function (e) {

            if ( e.currentTarget.innerText === goal.buttons[0] ) {
                goal.controlWrapper.setState({range: {start: new Date(2006, 1, 31)}});
                goal.controlWrapper.setState({range: {end: new Date(2017, 12, 31)}});
            } else if ( e.currentTarget.innerText === goal.buttons[1] ) {
                goal.controlWrapper.setState({range: {start: new Date(2006, 1, 31)}});
                goal.controlWrapper.setState({range: {end: new Date(2090, 12, 31)}});
            } else { void(0); }
            goal.dashboard.draw(goal.dataView);
        });
    }


    function button(name, float) {
        return '\
        <div class="demo-graphs mdl-cell mdl-cell--2-col button" style="float:' + float + ';">\
            <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent daterangebuttons">\
              ' + name + '\
            </button>\
        </div>'
    }


    function returnMonthEndDates(startDate, num) {
        var headers = [];
        var monthyear = [startDate.getMonth(), startDate.getYear() + 1900];

        for (var i=0; i<num; i++) {

            monthyear = incrementMonthEnd(monthyear);

            headers.push(new Date(monthyear[1], monthyear[0], 0))

        }
        return headers
    }


    function incrementMonthEnd(monthyear) {

        month = monthyear[0];
        year = monthyear[1];

        if (month === 12) {
            month = 1;
            year++;
        } else {
            month++;
        }

        return [month, year]

    }


}