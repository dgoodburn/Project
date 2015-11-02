/**
 * Created by dangoodburn on 10/3/15.
 */

//////////////////////////////////////////////////////////////////
////////////////       NET WORTH CHART      //////////////////////
//////////////////////////////////////////////////////////////////


function initializeBalanceChart(balanceData, currentBalanceData, chartOrder) {

    var balances = new chart(
        div = 'balancesDiv',
        data = balanceData,
        divcol = 6,
        firstTitle = 'Net Worth',
        secondTitle = new Date().toDateString().slice(4),
        sumcol = false,
        valStartCol = 3,
        categoryEndCol = 2,
        chartHeight = '100%',
        tooltip = true
    );

    balances.hrefHTML = "#/balances/";
    balances.onclickHTML = "loadBalancesPage()";
    balances.linkHTML = "View Balance Details";

    balances.chartWrapper.setChartType('AreaChart');
    balances.chartWrapper.setContainerId(balances.chartdiv);

    balances.topViewBuffer = 0;
    balances.bottomViewBuffer = 0;

    balances.setMultipleOptions([
        ['lineWidth', 0.05],
        ['areaOpacity', 0.2],
        ['tooltip.trigger', 'none'],
        ['hAxis.gridlines.count', 0],
        ['vAxis.gridlines.count', 0],
        ['chartArea.top', 0],
        ['chartArea.left', 0],
        ['chartArea.width', '100%'],
        ['chartArea.height', '100%'],
        ['vAxis.baselineColor', '#E1F5FE'],
        ['backgroundColor.fill', 'transparent'],
        ['focusTarget', 'datum'],
        ['crosshair.opacity', 0.3],
        ['crosshair.trigger', 'both']

    ]);

    balances.info = '\
        <div class="mdl-card__title mdl-card--expand">\
            <h2 class="mdl-card__title-text" id=todayBalance></h2>\
        </div>\
        <div class="mdl-card__supporting-text">\
            <div>ONE MONTH AGO:</div>\
            <span id=oldBalance></span>\
            </br>\
            </br>\
            <div>CHANGE:</div>\
            <span id=change></span>\
        </div>\
        ';

    balances.appendChartDiv(chartOrder);

    balances.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);
        GLOBALS.formatdate.format(this.dataView, 0);
        this.chartWrapper.draw();
        currentBalance.redraw();

    };

    currentBalance = new chart(
        div = 'currentBalanceDiv',
        data = currentBalanceData,
        divcol = 6
    );

    currentBalance.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.dataView = this.formatDateAndAmount(this.dataView);

        var todayBalance = this.dataView.getValue(1, 1);
        var oldBalance = this.dataView.getValue(0, 1);

        formatMoneyColor('#todayBalance', todayBalance);
        formatMoneyColor('#oldBalance', oldBalance);
        formatMoneyColor('#change', todayBalance - oldBalance);

    };

    google.visualization.events.removeAllListeners(currentBalance.chartWrapper);
    google.visualization.events.removeAllListeners(balances.chartWrapper);
    balances.tooltip ? balances.tooltipListener() : void(0);

    currentBalance.dataTable = currentBalance.initialDraw(currentBalance.data);
    balances.dataTable = balances.initialDraw(balances.data);
    balances.redraw();

}



//////////////////////////////////////////////////////////////////
////////////////       BUDGET CHART       ////////////////////////
//////////////////////////////////////////////////////////////////

function initializeBudgetChart(overallbudgetData, chartOrder) {

    var budgetChart = new chart(
        div = 'budgetChartDiv',
        data = overallbudgetData,
        divcol = 6,
        firstTitle = 'Budget',
        secondTitle = 'Month to Date',
        sumcol = false,
        valStartCol = 3,
        categoryEndCol = 2,
        chartHeight = 100,
        tooltip = false
    );

    budgetChart.hrefHTML = "#/budget/";
    budgetChart.onclickHTML = "loadBudgetPage()";
    budgetChart.linkHTML = "View Budget Details";

    budgetChart.chartWrapper.setChartType('PieChart');
    budgetChart.chartWrapper.setContainerId(budgetChart.chartdiv);

    budgetChart.chartWrapper.setOptions();  // clears options
    budgetChart.setMultipleOptions([
        ['pieHole', 0.6],
        ['colors', ['#EF9A9A', '#81C784', '#81C784', '#C8E6C9', '#E8F5E9']],
        ['legend.position', 'none'],
        ['pieSliceText', 'none'],
        ['pieSliceBorderColor', 'white'],
        ['tooltip.trigger', 'none'],
        ['titleTextStyle.fontName', 'Roboto'],
        ['titleTextStyle.fontSize', '14'],
        ['chartArea.top', 15],
        ['chartArea.width', 218],
        ['chartArea.height', 218],
        ['backgroundColor.fill', 'transparent']
    ]);

    budgetChart.title = '\
            <span id=SPENT>SPENT: </span><span id=SPENTV></span>\
            <br />\
            <span id=BUDGET>BUDGET: </span><span id=BUDGETV></span>';

    budgetChart.info = '\
            <h2 id="title"></h2>\
            <div class="mdl-card__supporting-text mdl-card--expand" id=titletext></div>';

    budgetChart.appendChartDiv(chartOrder);

    budgetChart.dataTable = budgetChart.initialDraw(budgetChart.data);
    $('#title').html(budgetChart.title);

    budgetChart.redraw = function () {

        console.log(this.dataTable);
        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataOwnerJoin = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataOwnerJoin = this.currencyChange(this.dataOwnerJoin);
        console.log(this.dataOwnerJoin);
        this.dataView = this.drawBudget(this.dataOwnerJoin);
        this.dataView = this.formatDateAndAmount(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);

        formatMoneyColor('#SPENTV', budgetChart.dataOwnerJoin.getValue(0, 2));
        formatMoneyColor('#BUDGETV', budgetChart.dataOwnerJoin.getValue(0, 1));

        $('#chartbudgetChartDiv').fadeTo('fast', 0, function () {
            budgetChart.chartWrapper.draw();
        });
        $('#chartbudgetChartDiv').fadeTo('slow', 1);

    };

    google.visualization.events.removeAllListeners(budgetChart.chartWrapper);
    budgetChart.tooltip ? budgetChart.tooltipListener() : void(0);

    budgetChart.redraw();
}



//////////////////////////////////////////////////////////////////
////////////////       SPENDING CHART       ////////////////////////
//////////////////////////////////////////////////////////////////




function initializeSpendingChart(spendingdata, chartOrder) {

    var spendingChart = new chart(
        div = 'monthlySpendDiv',
        data = spendingdata,
        divcol = 6,
        firstTitle = 'Spending',
        secondTitle = 'Month Year',
        sumcol = false,
        valStartCol = 3,
        categoryEndCol = 2,
        chartHeight = 100,
        tooltip = false
    );

    spendingChart.hrefHTML = "#/spending/";
    spendingChart.onclickHTML = "loadSpendingPage()";
    spendingChart.linkHTML = "View Spending Details";

    spendingChart.chartWrapper.setChartType('ColumnChart');
    spendingChart.chartWrapper.setContainerId(spendingChart.chartdiv);

    spendingChart.setMultipleOptions([
        ['vAxis.minValue', 0],
        ['vAxis.minValue', 0],
        ['dataOpacity', 1],
        ['colors', ['#81C784', '#E8F5E9', '#EF9A9A']],
        ['tooltip.trigger', 'none'],
        ['hAxis.gridlines.count', 0],
        ['vAxis.gridlines.count', 0],
        ['chartArea.left', 100],
        ['chartArea.top', 20],
        ['chartArea.width', '100%'],
        ['chartArea.height', '100%'],
        ['backgroundColor.fill', 'transparent'],
        ['vAxis.baselineColor', '#E0E0E0']
    ]);

    spendingChart.info = '\
        <div class="mdl-card__title mdl-card--expand">\
            <h2 class="mdl-card__title-text" id=selectedmonthspend></h2>\
        </div>\
        <div class="mdl-card__supporting-text">\
            <div>GOAL:</div>\
            <span id=goalSpend></span>\
            </br>\
            </br>\
            <div>REMAINING:</div>\
            <span id=remaining></span>\
        </div>';

    spendingChart.appendChartDiv(chartOrder);

    spendingChart.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable, "Combined");
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);
        GLOBALS.formatdate.format(this.dataView, 0);
        this.chartWrapper.draw();
        initialChange();

    };

    google.visualization.events.removeAllListeners(spendingChart.chartWrapper);
    var runOnce = google.visualization.events.addListener(spendingChart.chartWrapper, 'ready', function () {
        // remove the listener so that it doesn't stack up multiple events
        google.visualization.events.removeListener(runOnce);

        google.visualization.events.addListener(spendingChart.chartWrapper.getChart(), 'onmouseover', changeNumbers);

    });

    spendingChart.tooltip ? spendingChart.tooltipListener() : void(0);

    spendingChart.dataTable = spendingChart.initialDraw(spendingChart.data);
    spendingChart.redraw();


    function changeNumbers(e) {
        changeNumbers2(e.row);
    }

    function initialChange() {
        changeNumbers2(spendingChart.dataView.getNumberOfRows() - 1);
    }

    function changeNumbers2(e) {

        try {
            var spend = spendingChart.dataView.getValue(e, 1);
            var goal = spendingChart.dataView.getValue(e, 2);
            var overspend = spendingChart.dataView.getValue(e, 3);
            var label = spendingChart.dataView.getFormattedValue(e, 0)
        }
        catch (err) {
            var spend = 0;
            var goal = 0;
            var overspend = 0;
        }

        formatMoneyColor('#selectedmonthspend', spend + overspend);
        formatMoneyColor('#goalSpend', spend + goal);
        formatMoneyColor('#remaining', goal - overspend);

        $('#cardmonthlySpendDiv .secondTitle').text(label);

    };
}



//////////////////////////////////////////////////////////////////
////////////////       STOCKS CHART       ////////////////////////
//////////////////////////////////////////////////////////////////



function initializeStockChart(stockSumData, stockPriceData, originalStockPrice, chartOrder) {

    var summaryStockChart = new chart(
        div = 'sumStockTableDiv',
        data = stockSumData,
        divcol = 6,
        firstTitle = '',
        secondTitle = '',
        sumcol = false
        //valStartCol = 4
    );

    var stockChart = new chart(
        div = 'stockPricesDiv2',
        data = stockPriceData,
        divcol = 6,
        firstTitle = 'Stocks',
        secondTitle = 'Performance',
        sumcol = false,
        valStartCol = 3,
        categoryEndCol = 2,
        chartHeight = 100,
        tooltip = true
    );

    stockChart.tooltipinfo = new google.visualization.DataTable(originalStockPrice);

    stockChart.hrefHTML = "#/stocks/";
    stockChart.onclickHTML = "loadStocksPage()";
    stockChart.linkHTML = "View Stocks Details";

    stockChart.chartWrapper.setChartType('LineChart');
    stockChart.chartWrapper.setContainerId(stockChart.chartdiv);

    stockChart.topViewBuffer = 5;
    stockChart.bottomViewBuffer = 3;

    stockChart.setMultipleOptions([
        ['interpolateNulls', false],
        ['hAxis.gridlines.count', 0],
        ['vAxis.gridlines.count', 0],
        ['chartArea.left', 0],
        ['chartArea.top', 0],
        ['chartArea.width', '100%'],
        ['chartArea.height', '100%'],
        ['vAxis.baselineColor', '#FAFAFA'],
        ['lineWidth', .5],
        ['backgroundColor.fill', 'transparent'],
        ['tooltip.trigger', 'none'],
        ['crosshair.trigger', 'both'],
        ['focusTarget', 'datum'],
        ['crosshair.opacity', 0.3],
        ['vAxis.viewWindowMode', 'explicit']
    ]);

    stockChart.info = '\
        <div class="mdl-card__supporting-text mdl-card--expand" id=titletext>\
            TODAY\'S GAIN/LOSS:\
          </span></div>\
          <div class="mdl-card__title" style="padding-top: 0">\
            <h2 class="mdl-card__title-text" id=todayStocks></h2>\
          </div>\
          <div class="mdl-card__supporting-text" id=titletext>\
            OVERALL GAIN/LOSS:\
          </span></div>\
          <div class="mdl-card__title" style="padding-top: 0">\
            <h2 class="mdl-card__title-text" id=totalStocks></h2>\
          </div>';

    stockChart.appendChartDiv(chartOrder);

    summaryStockChart.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);
        GLOBALS.formatdate.format(this.dataView, 0);

        try {
            todayStocks = summaryStockChart.dataView.getValue(0, 1);
            totalStocks = summaryStockChart.dataView.getValue(0, 2);
        }
        catch (err) {
            todayStocks = 0;
            totalStocks = 0;
        }
        formatMoneyColor('#todayStocks', todayStocks);
        formatMoneyColor('#totalStocks', totalStocks);

    };

    stockChart.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = this.currencyChange(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);
        for (var i = 1; i < this.dataView.getNumberOfColumns(); i++) {
            this.removeZeroColumn(this.dataView, i);
        }
        GLOBALS.formatinddate.format(this.dataView, 0);
        this.setMinMaxValues(this.getViewRange(this.dataView));

        for (var i = 1; i < this.dataView.getNumberOfColumns(); i++) {
            GLOBALS.format4decimals.format(this.dataView, i);
        }

        for (var i = this.dataView.getNumberOfColumns() - 1; i > 0; i--) {
            this.removeZeroColumn(this.dataView, i);
        }

        this.chartWrapper.draw();
        summaryStockChart.redraw();

    };


    google.visualization.events.removeAllListeners(summaryStockChart.chartWrapper);
    google.visualization.events.removeAllListeners(stockChart.chartWrapper);
    stockChart.tooltip ? stockChart.tooltipListener() : void(0);

    summaryStockChart.dataTable = summaryStockChart.initialDraw(summaryStockChart.data);
    stockChart.dataTable = stockChart.initialDraw(stockChart.data);
    stockChart.redraw();
}


//////////////////////////////////////////////////////////////////
////////////////       STOCKS CHART 2      ////////////////////////
//////////////////////////////////////////////////////////////////


function initializeStocksChart(stocksData) {

    var stocks = new chart(
        div = 'stocksDiv',
        data = stocksData,
        divcol = 6,
        firstTitle = 'Stock Gain/Loss',
        secondTitle = 'Cumulative Investments Over Time',
        sumcol = true
    );

    stocks.chartWrapper.setChartType('ComboChart');
    stocks.chartWrapper.setOption('seriesType', 'area');
    stocks.chartWrapper.setOption('lineWidth', 0);
    stocks.chartWrapper.setOption('areaOpacity', 0.5);
    stocks.chartWrapper.setOption('series.10.type', 'line');
    stocks.controlWrapper.setOption('ui.chartOptions.seriesType', 'area');
    stocks.controlWrapper.setOption('ui.chartOptions.series.5.type', 'line');
    stocks.controlWrapper.setState({range: {start: new Date(2015, 5, 1)}});

    GLOBALS.grid.append(stocks.htmldiv);
    stocks.dataTable = stocks.initialDraw(stocks.data);
    stocks.redraw();

}


function initializeStockTable(stockTableData) {

    stockTable = new chart(
        div = 'stockTableDiv',
        data = stockTableData,
        divcol = 6,
        firstTitle = 'Stock Summary',
        secondTitle = 'Performance',
        sumcol = false,
        valStartCol = 4
    );

    GLOBALS.grid.append('<div class="demo-graphs mdl-cell mdl-cell--12-col" style="padding:0px 0px"><div id="stockTableDiv" style="width:100%; "></div></div>');

    var stockTable2 = new table.MyTable(document.getElementById('stockTableDiv'));

    stockTable.redraw = function () {

        stockTable.dataOwnerJoin = stockTable.dataJoin(stockTable.dataTable);
        stockTable.dataView = stockTable.dataOwnerGroup(stockTable.dataOwnerJoin);
        stockTable.dataView.removeColumns(0, 2);
        GLOBALS.format4decimals.format(stockTable.dataView, 1);
        GLOBALS.formatdecimals.format(stockTable.dataView, 2);
        GLOBALS.formatdecimals.format(stockTable.dataView, 3);
        GLOBALS.formatdecimals.format(stockTable.dataView, 4);
        stockTable2.draw(stockTable.dataView, {showLineNumber: true});

    };

    stockTable.dataTable = stockTable.initialDraw(stockTable.data);
    stockTable.redraw()

}


function initializeIndBudgetChart(budgetData) {

    indBudgetChart = new chart(
        div = 'indBudgetChartDiv',
        data = budgetData,
        divcol = 6,
        firstTitle = 'Budget',
        secondTitle = 'Month to Date',
        sumcol = false,
        valStartCol = 4
    );

    indBudgetChart.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView.removeColumns(0,2);
        this.dataView = this.drawIndBudget(this.dataView);
        this.chartWrapper.setDataTable(this.dataView);
        this.chartWrapper.draw();

    };

    indBudgetChart.chartWrapper.setChartType('BarChart');
    indBudgetChart.chartWrapper.setOption('isStacked', 'percent');
    indBudgetChart.chartWrapper.setOption('chartArea.left', 150);
    indBudgetChart.chartWrapper.setOption('chartArea.width', '70%');
    indBudgetChart.chartWrapper.setOption('chartArea.height', '95%');
    indBudgetChart.chartWrapper.setOption('colors', ['#EF5350', GLOBALS.chartcolours[3], GLOBALS.chartcolours[3], '#C8E6C9', '#E8F5E9']);
    indBudgetChart.chartWrapper.setOption('hAxis.gridlines.count', 0);
    indBudgetChart.chartWrapper.setOption('hAxis.viewWindow.min', 0);

    GLOBALS.grid.append(indBudgetChart.htmlChartdiv);

    indBudgetChart.dataTable = indBudgetChart.initialDraw(indBudgetChart.data);
    indBudgetChart.redraw();

}



function initializeNIFXChart(NIFXdata) {

    NIFX = new chart(
        div = 'NIFXDiv',
        data = NIFXdata,
        divcol = 6,
        firstTitle = 'NIFX',
        secondTitle = 'Month to Date',
        sumcol = false,
        valStartCol = 2
    );


    NIFX.redraw = function () {

        this.dataOwnerJoin = this.dataJoin(this.dataTable);
        this.dataView = this.dataOwnerGroup(this.dataOwnerJoin);
        this.dataView = manipulateNIFXData(this.dataView);
        this.dashboard.draw(this.dataView);

    };

    NIFX.setMultipleOptions([
        ['vAxes.0.viewWindow.max', 10000],
        ['vAxes.0.viewWindow.min', 0],
        ['vAxes.1.viewWindow.max', 10000],
        ['vAxes.1.viewWindow.min', 0],
        ['vAxes.1.gridlines.count', 0],
        ['series.3.type', 'area'],
        ['series.3.targetAxisIndex', 1],
        ['series.4.type', 'area'],
        ['series.4.targetAxisIndex', 1],
        ['series.5.type', 'area'],
        ['series.5.targetAxisIndex', 1]
    ]);

    GLOBALS.grid.append(NIFX.htmldiv);

    NIFX.dataTable = NIFX.initialDraw(NIFX.data);
    NIFX.redraw();

    google.visualization.events.addListener(NIFX.controlWrapper, 'statechange', function (e) {
        if (e.inProgress == false) {
            NIFX.redraw();
        }
    });

}


function manipulateNIFXData(dataView) {

    // amounts are all imported as USD. Converts all to CAD if button is selected
    ($('#CurrencyButton').text() === "CAD") ? dataView.removeColumns(1, 3) : dataView.removeColumns(4, 3);

    dataView.addColumn('number', 'Total FX Gain/Loss');
    dataView.addColumn('number', 'Total Investments');
    dataView.addColumn('number', 'Total Income');

    var choose = NIFX.controlWrapper.getState().range.start;

    for (i = 1; i < dataView.getNumberOfRows(); i++) {

        if (dataView.getValue(i, 0) < choose) {

            for (j = 1; j < 4; j++) {
                dataView.setValue(i, j + 3, 0);
            }
        } else {

            for (j = 1; j < 4; j++) {

                var currow = dataView.getValue(i, j);
                var prevrow = dataView.getValue(i - 1, j + 3);
                dataView.setValue(i, j + 3, currow + prevrow);
            }
        }
    }

    var view = new google.visualization.DataView(dataView);
    var filteredRows = dataView.getFilteredRows([{column: 0, minValue: choose, maxValue: null}]);

    view.setRows(filteredRows);

    var rowMin = rowMax = minx = maxx = [];

    for (var i = 1; i < view.getNumberOfRows(); i++) {
        var minInRow = maxInRow = 0;
        for (var j = 1; j <= 3; j++) {
            minInRow += Math.min(0, view.getValue(i, j));
            maxInRow += Math.max(0, view.getValue(i, j));
        }
        rowMin.push(minInRow);
        rowMax.push(maxInRow);
    }

    var minimum1 = getMinOfArray(rowMin);
    var maximum1 = getMaxOfArray(rowMax);

    for (i = Math.ceil(view.getNumberOfColumns() / 2); i < view.getNumberOfColumns(); i++) {
        rowMin[i] = view.getColumnRange(i);
        minx.push(rowMin[i].min);
        maxx.push(rowMin[i].max);
    }
    var minimum2 = getMinOfArray(minx);
    var maximum2 = getMaxOfArray(maxx);

    var e = (maximum1 / (maximum1 - minimum1));
    minimum2 = -(maximum2 / e) * (1 - e);

    NIFX.setMultipleOptions([
        ['vAxes.0.viewWindow.min', minimum1],
        ['vAxes.0.viewWindow.max', maximum1],
        ['vAxes.1.viewWindow.min', minimum2],
        ['vAxes.1.viewWindow.max', maximum2]
    ]);

    dataView = NIFX.formatDateAndAmount(dataView);

    return dataView;
}




function initializeMonthlySpend(spendingdata) {

    monthlySpend = new chart(
        div = 'monthlySpendDiv',
        data = spendingdata,
        divcol = 6,
        firstTitle = 'Spending',
        secondTitle = 'Monthly Expenses'
    );

    monthlySpend.chartWrapper.setOption('vAxis.minValue', 0);
    monthlySpend.chartWrapper.setOption('vAxis.minValue', 0);
    monthlySpend.chartWrapper.setOption('dataOpacity', 0.8);
    monthlySpend.chartWrapper.setOption('colors', [GLOBALS.chartcolours[3]]);
    monthlySpend.controlWrapper.setOption('ui.chartOptions.colors', [GLOBALS.chartcolours[3]]);

    GLOBALS.grid.append(monthlySpend.htmldiv);
    monthlySpend.dataTable = monthlySpend.initialDraw(monthlySpend.data);
    monthlySpend.redraw();

}


function initializeNetIncomeChart(netincomedata) {

    NI = new chart(
        div = 'netIncomeDiv',
        data = netincomedata,
        divcol = 6,
        firstTitle = 'Net Income',
        secondTitle = 'By Month'
    );

    NI.chartWrapper.setOption('dataOpacity', 0.8);
    NI.chartWrapper.setOption('colors', [GLOBALS.chartcolours[3]]);
    NI.controlWrapper.setOption('ui.chartOptions.colors', [GLOBALS.chartcolours[3]]);

    GLOBALS.grid.append(NI.htmldiv);
    NI.dataTable = NI.initialDraw(NI.data);
    NI.redraw();

}


function indtranstable(x, y) {

    var buttonDiv = '\
        <div class="demo-graphs mdl-cell mdl-cell--4-col" id="buttons"\
             style="margin-bottom: 0; margin-top: 0; padding-top: 16px; padding-bottom:0; padding-left:16px">\
            <div id="alignbuttons" style="display: table-row;">\
                <button id="FirstPageButton"\
                        class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored"\
                        style="display: inline-block; background-color: #546E7A; color: rgba(255, 255, 255, 0.56)">\
                    <i class="material-icons" style="display: table-cell;">arrow_back</i>\
                </button>\
                <div class="mdl-tooltip" for="FirstPageButton" style="background-color: #77b55a">\
                    First Page\
                </div>\
                <button id="PageDownButton"\
                        class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored"\
                        style="display: inline-block; background-color: #546E7A; color: rgba(255, 255, 255, 0.56)">\
                    <i class="material-icons" style="display: table-cell;">remove</i>\
                </button>\
                <div class="mdl-tooltip" for="PageDownButton" style="background-color: #77b55a">\
                    Previous Page\
                </div>\
                <button id="PageUpButton"\
                        class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored"\
                        value=1\
                        style="display: inline-block; background-color: #546E7A; color: rgba(255, 255, 255, 0.56)">\
                    <i class="material-icons" style="display: table-cell;">add</i>\
                </button>\
                <div class="mdl-tooltip" for="PageUpButton"\
                     style="z-index: 1000; left: 260px; margin-left: -50px; top: 114px; background-color: rgb(119, 181, 90);"\
                     data-upgraded=",MaterialTooltip">\
                    Next Page\
                </div>\
                </div>\
        </div>\
        <div class="demo-graphs mdl-cell mdl-cell--12-col" style="padding:0px 0px; margin-top: 16px" id="table_div">\
        </div>';

    var transactionDiv = '\
        <div id="transactions_table_div" style="width:100%; height:100%;"></div>';

    $('#buttons').length > 0 ? void(0) : GLOBALS.grid.append(buttonDiv);
    if ($('#table_div').length > 0) {
        $('#table_div').empty();
        $('#table_div').append(transactionDiv);
    } else {
        $('#table_div').append(transactionDiv);
    }

    var transdata = new google.visualization.DataTable();

    transdata.addColumn('date', 'Date');
    for (i = 1; i < y.length; i++) {

        var datatype = typeof(x[0][i]) === 'number' ? 'number' : 'string';
        transdata.addColumn(datatype, y[i]);
    }
    var a = [];
    for (i = 0; i < x.length; i++) {

        var b = [];
        b.push(new Date(x[i][0]));
        for (j = 1; j < x[i].length; j++) {
            b.push(x[i][j]);
        }
        a.push(b);
    }

    transdata.addRows(a);
    for (i = 0; i < transdata.getNumberOfColumns(); i++) {
        if (transdata.getColumnType(i) === 'number') {
            GLOBALS.formatdecimals.format(transdata, i);
        }
    }

    var view = new google.visualization.DataView(transdata);
    view.hideColumns([6, 7, 8]); // hides account type, currency and FX rate

    var visind = new table.MyTable(document.getElementById('transactions_table_div'));

    visind.draw(view, {showLineNumber: true});


}