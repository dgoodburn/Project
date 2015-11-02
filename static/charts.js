/**
 * Created by dangoodburn on 10/3/15.
 */


var chart = function (div, data, divcol, firstTitle, secondTitle, sumcol, valStartCol, categoryEndCol, chartHeight, tooltip) {

    this.filterStartDate = new Date(2014, 1, 1);
    this.divcol = divcol;
    this.data = data;
    this.firstTitle = firstTitle;
    this.secondTitle = secondTitle;
    this.valStartCol = valStartCol;
    this.categoryEndCol = categoryEndCol;
    this.chartHeight = chartHeight;
    this.tooltip = tooltip;
    if (typeof this.tooltip === 'undefined') {
        this.tooltip = false;
    }
    if (typeof this.chartHeight === 'undefined') {
        this.chartHeight = '300px';
    }
    if (typeof this.valStartCol === 'undefined') {
        this.valStartCol = 3;
    }
    if (typeof this.categoryEndCol === 'undefined') {
        this.categoryEndCol = this.valStartCol - 1;
    }

    this.bottomViewBuffer = 0;
    this.topViewBuffer = 0;
    this.tooltipDiv = 'tooltip' + div;
    this.dashboarddiv = div;
    this.chartdiv = 'chart' + div;
    this.controldiv = 'control' + div;
    this.cardDiv = 'card' + div;

    this.chartWrapper = new google.visualization.ChartWrapper({

        chartType: 'ColumnChart',
        containerId: this.chartdiv,

        options: {
            'title': '',
            isStacked: 'true',
            legend: {position: 'none'},
            colors: GLOBALS.chartcolours,
            focusTarget: 'category',
            bar: {groupWidth: "75%"},
            chartArea: {left: 40, top: 10, width: '95%', height: '90%'},
            animation: {startup: true, easing: 'inAndOut', duration: 750},
            hAxis: {baselineColor: GLOBALS.greyfont, textStyle: {color: GLOBALS.greyfont}},
            vAxis: {textStyle: {color: GLOBALS.greyfont}, format: 'short', viewWindowMode: 'maximized'},
            titleTextStyle: {color: GLOBALS.greyfont, bold: 'false', fontSize: 16},
            tooltip: {isHtml: true}
        }

    });

    this.controlWrapper = new google.visualization.ControlWrapper({

        controlType: 'ChartRangeFilter',
        'containerId': this.controldiv,
        'state': {
            'range': {
                start: this.filterStartDate
            }
        },

        'options': {
            'filterColumnIndex': 0,
            'ui': {
                chartType: 'ComboChart',
                chartOptions: {
                    isStacked: true,
                    chartArea: {left: 40, width: '95%', height: '100%'},
                    seriesType: 'bars',
                    lineWidth: 0,
                    vAxes: {0: {viewWindowMode: 'maximized'}},
                    colors: GLOBALS.chartcolours
                }
            }
        }
    });


    this.dashboard = new google.visualization.Dashboard(this.dashboarddiv);
    this.dashboard.bind(this.controlWrapper, this.chartWrapper);


    this.populateDataTable = function (data) { return new google.visualization.DataTable(data); };


    this.dataJoin = function (dataTable, owner2) {
        if (typeof owner2 === 'undefined') { owner2 = $('#JointButton').text(); }

        this.cols = [0];
        for (var i = 2; i < dataTable.getNumberOfColumns(); i++) {
            this.cols.push(i);
        }

        var dataView = new google.visualization.DataView(dataTable);

        owner2 != "Combined" ? dataView.setRows(dataView.getFilteredRows([{column: 1, value: owner2}])) : void(0);

        return dataView
    };




    this.dataOwnerGroup = function (dataTable) {

        this.cols.splice(0, this.valStartCol - 1);

        var agg = [];
        for (i in this.cols) {
            agg.push({
                'column': this.cols[i],
                'aggregation': google.visualization.data.sum,
                'type': 'number'
            });
        }

        var cols2 = [0];
        for (var i = 2; i <= this.categoryEndCol; i++) {
            cols2.push(i);
        }

        var dataView = new google.visualization.data.group(dataTable, cols2, agg);

        return dataView;

    };


    this.currencyChange = function (dataTable) {

        if ($('#CurrencyButton').text() === "CAD") {
            // amounts are all imported as USD. Converts all to CAD if button is selected

            for (var i = 0; i < dataTable.getNumberOfRows(); i++) {
                var rate = dataTable.getValue(i, 1);
                for (var j = this.valStartCol - 1; j < dataTable.getNumberOfColumns(); j++) {
                    dataTable.setValue(i, j, dataTable.getValue(i, j) * rate);
                }
            }
        }

        dataTable.removeColumn(1);

        return dataTable;
    };



    this.formatDateAndAmount = function (dataTable) {

        GLOBALS.formatdate.format(dataTable, 0);
        for (var i = 1; i < dataTable.getNumberOfColumns(); i++) {
            GLOBALS.formatamount.format(dataTable, i);
        }

        return dataTable;
    };



    this.initialDraw = function (data) {
        return this.populateDataTable(data);

    };


    this.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.dataView = this.formatDateAndAmount(this.dataView);
        this.dashboard.draw(this.dataView);

    };


    // CHANGES MULTIPLE OPTIONS IN ONE CALL

    this.setMultipleOptions = function(options) {

        var b = this.chartWrapper;
        options.forEach(function (value) {
            b.setOption(value[0],value[1]);
        });
    };


    //this.divcol2 = 'balancetablediv';
    //this.htmldiv2 = '<div class="demo-graphs mdl-cell mdl-cell--4-col" style="padding:0px 0px"><div id="balancetablediv" style="width:100%;"></div></div>';


    this.drawBudget = function (dataTable) {

        var budget = dataTable.getValue(0, 1);
        var actual = dataTable.getValue(0, 2);

        var figures = actualAndBudget(actual, budget);

        var budgetdata = google.visualization.arrayToDataTable([
            ['Type', 'Amount'],
            ['Actual', figures.overspend],
            ['Actual', figures.actual1],
            ['Actual', figures.actual2],
            ['Budget', figures.budget1],
            ['Budget', figures.budget2]
        ]);

        return budgetdata;

    };



    this.drawIndBudget = function (dataTable) {

        var dataView = new google.visualization.DataTable();
        dataView.addColumn('string', 'Category');
        dataView.addColumn({
            type: 'string',
            role: 'tooltip',
            'p': {'html': true}
        });
        dataView.addColumn('number', 'Actual');
        dataView.addColumn('number', 'Actual');
        dataView.addColumn('number', 'Actual');
        dataView.addColumn('number', 'Budget');
        dataView.addColumn('number', 'Budget');

        for (var i = 0; i < dataTable.getNumberOfRows(); i++) {

            category = dataTable.getValue(i, 0);
            budget = Math.max(dataTable.getValue(i, 1), 0.0001);
            actual = dataTable.getValue(i, 2);

            var tooltip = '<div><span style="color: #757575">' + dataTable.getFormattedValue(i, 0) + '</span><br />Spent: ' + dataTable.getFormattedValue(i, 2) + '<br />Budget: ' + dataTable.getFormattedValue(i, 1) + '</div>';
            var figures = actualAndBudget(actual, budget);

            dataView.addRow([category, tooltip, figures.overspend, figures.actual1, figures.actual2, figures.budget1, figures.budget2])
        }

        return dataView;
    };

    function dayPercentage() { // returns the percentage of the month that is complete (ie. April 29 is 97% complete)

        var currentday = new Date();
        var day = currentday.getDate();
        var endofmonth = new Date(currentday.getYear(), currentday.getMonth() + 1, 0);
        var days = endofmonth.getDate();
        return day / days;

    }

    function actualAndBudget(actual, budget) { // returns the values to agree to budget charts

        var percentage = dayPercentage();
        var percent = percentage * budget;
        var lesserBudgetActual = actual > budget ? budget : actual;
        var overspend = Math.max(0, actual - budget);
        if (percent <= actual) {
            return {
                overspend: overspend,
                actual1: Math.max(0, percent - overspend),
                actual2: lesserBudgetActual - percent,
                budget1: 0,
                budget2: budget - lesserBudgetActual
            }
        } else {
            return {
                overspend: overspend,
                actual1: lesserBudgetActual,
                actual2: 0,
                budget1: percent - lesserBudgetActual,
                budget2: budget - percent
            }
        }
    }
    /*
    this.addSumColumn = function (dataTable) {

        dataTable.addColumn('number', 'Total');
        for (var i = 0; i < data[1].length; i++) {
            var c = 0.0;
            for (var j = this.valStartCol; j < data[1][i].length; j++) {
                c += data[1][i][j];
            }

            dataTable.setValue(i, j, c)

        }
        return dataTable
    };
    */

    this.createCardDivHTML = function () {
        return '\
            <div class="demo-graphs mdl-cell mdl-cell--' + this.divcol + '-col mdl-color--white mdl-shadow--2dp" style="padding:0px; border-radius: 2px;" id=' + this.cardDiv + '>\
            <div class="demo-graphs" id=test style="padding:0px; opacity:0;">\
                <div class="firstTitle" style="padding:16px 0 0 16px">' + this.firstTitle + '</div>\
                <div class="secondTitle" style="padding:0 0 0 16px">' + this.secondTitle + '</div>\
                ' + this.info + '\
                <div class="mdl-card__actions mdl-card--border">\
                    <span>\
                        <a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" href="' + this.hrefHTML +'" onclick="' + this.onclickHTML + '">\
                            ' + this.linkHTML + '\
                        </a>\
                    </span>\
                    ' + this.tooltipHTML() + '\
                </div>\
            </div>\
            <div id=' + this.chartdiv + '></div>\
        </div>';
    };


    this.htmldiv = '\
        <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--' + this.divcol + '-col">\
            <div class="firstTitle">' + this.firstTitle + '</div>\
            <div class="secondTitle">' + this.secondTitle + '</div>\
            <div id="' + this.dashboarddiv + '">\
                <div id="' + this.chartdiv + '" style="height: 80%;"></div>\
                <div id="' + this.controldiv + '" style="height: 25px;"></div>\
            </div>\
        </div>';


    this.htmlChartdiv = '\
        <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--' + this.divcol + '-col">\
            <div class="firstTitle">' + this.firstTitle + '</div>\
            <div class="secondTitle">' + this.secondTitle + '</div>\
            <style>div.google-visualization-tooltip { padding:16px 16px 0 16px; color: ' + GLOBALS.greyfont + '}</style>\
            <div id="' + this.chartdiv + '" style="height: ' + this.chartHeight + ';"></div>\
        </div>';


    this.tooltipHTML = function() {

        if (this.tooltip) {
            return '<span id="' + this.tooltipDiv + '" style="float: right;"></span>'
        } else {
            return ''
        }

    };


    this.tooltipListener = function() {

        var chart = this;
        google.visualization.events.removeAllListeners(chart.chartWrapper);
        var runOnce = google.visualization.events.addListener(chart.chartWrapper, 'ready', (function () { runTwice(chart) }));
            // remove the listener so that it doesn't stack up multiple events

        function runTwice(chart) {

            google.visualization.events.removeListener(runOnce);

            var div = $('#' + chart.tooltipDiv);
            google.visualization.events.addListener(chart.chartWrapper.getChart(), 'onmouseover', (function (e) { displayTooltip(e, div, chart) }));
            google.visualization.events.addListener(chart.chartWrapper.getChart(), 'onmouseout', (function () { removeTooltip(div) }));
        }

    };

    function removeTooltip(div) {

        div.stop();
        div.fadeTo('fast', 0);

    };

    function displayTooltip(e, div, chart) {

        div.stop();
        div.fadeTo('fast', 1);
        var total = 0;

        if (typeof chart.tooltipinfo != 'undefined') {
            var amount = (chart.dataView.getValue(e.row, e.column) * chart.tooltipinfo.getValue(e.column-1,1) / 100).toFixed(2);
            total = '';
        }
        else {
            var amount = chart.dataView.getValue(e.row, e.column).formatMoney();
            for (var i = 1; i < chart.dataView.getNumberOfColumns(); i++) {
                total += chart.dataView.getValue(e.row, i)
            }
            total = ': <span style="font-weight: bold; float: right">' + total.formatMoney() + '</span>';
        }

        var date = chart.dataView.getFormattedValue(e.row, 0);
        var account = chart.dataView.getColumnLabel(e.column);

        div.html('<div>' + date + total + '</br>' + account + ': <span style="font-weight: bold; float: right">' + amount + '</span></div>');
        div.css('border-color', GLOBALS.chartcolours[e.column]);

    };

    this.removeZeroColumn = function(dataTable, i) {

        var range = dataTable.getColumnRange(i);
        if (range.max === 0 & range.min === 0) {
            dataTable.removeColumn(i);
        }

    };

    this.getViewRange = function(dataView) {

        var columnRange = minValue = maxValue = [];

        for (var i = 1; i < dataView.getNumberOfColumns(); i++) {
            columnRange = dataView.getColumnRange(i);
            minValue.push(columnRange.min);
            maxValue.push(columnRange.max);
        }

        var minimumYValue = getMinOfArray(minValue);
        var maximumYValue = getMaxOfArray(maxValue);

        return [minimumYValue, maximumYValue]

    };

    this.setMinMaxValues = function(viewRange) {
        this.setMultipleOptions([
            ['vAxes.0.viewWindow.min', viewRange[0] - this.bottomViewBuffer],
            ['vAxes.0.viewWindow.max', viewRange[1] + this.topViewBuffer]
        ]);
    };

    this.appendChartDiv = function(chartOrder) {

        var elements = GLOBALS.chartsOrder.slice(0,chartOrder); // return elements in array before position of current chart
        var numberOfElements = elements.filter(function(x){return x}).length; // return count of True elements in slice
        if (numberOfElements === 0) {
            GLOBALS.grid.prepend(this.createCardDivHTML()); // if no others, set as first chart
        } else {
            $(GLOBALS.grid.children()[numberOfElements - 1]).after(this.createCardDivHTML());
        }
        GLOBALS.chartsOrder[chartOrder] = true;

    };


    GLOBALS.charts.push([this]);



};



