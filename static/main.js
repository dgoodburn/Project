
window.GLOBALS = {
    greyfont: '#9E9E9E',
    chartcolours: ['#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#607D8B'],
    chartcoloursfaded: ['#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784', '#AED581', '#DCE775', '#90A4AE'],
    chartcolourswhite: ['#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#CFD8DC'],
    formatdate: new google.visualization.DateFormat({pattern: 'MMM yyyy'}),
    formatinddate: new google.visualization.DateFormat({pattern: 'MMM dd, yyyy'}),
    formatamount: new google.visualization.NumberFormat({
        prefix: '$',
        negativeColor: 'red',
        fractionDigits: 0,
        negativeParens: true
    }),
    formatdecimals: new google.visualization.NumberFormat({
        prefix: '$',
        negativeColor: 'red',
        negativeParens: true
    }),
    format4decimals: new google.visualization.NumberFormat({
        fractionDigits: 4,
        negativeColor: 'red',
        negativeParens: true
    }),
    owner: [],
    grid: $('.mdl-grid'),
    cache: {},
    charts: [],
    chartsOrder: [false, false, false, false, false, false, false, false]

};

$(document).ready(function() {

    $.getJSON($SCRIPT_ROOT + '/owners', {}, function (data) { initializeOwners(data.owners); });
    $('#JointButton').click(JointButtonClick);
    $('#CurrencyButton').click(CurrencyButtonClick);
    loadHomePage();

});


function initializeOwners(data) {
    GLOBALS.owner = new google.visualization.DataTable(data);
}

function loadHomePage() {

    clearPage();

    return $.when(

        $.getJSON($SCRIPT_ROOT + '/stocks', {}, function (data) {
            var d = $.Deferred();
            initializeStockChart(data.sumStockTableData, data.sumstocksPricesData[0], data.sumstocksPricesData[1], 0);
            return d.promise();}),

        $.getJSON($SCRIPT_ROOT + '/balances', {}, function (data) {
            var d = $.Deferred();
            initializeBalanceChart(data.balanceData, data.currentBalanceData, 0);
            return d.promise();}),

        $.getJSON($SCRIPT_ROOT + '/overallbudget', {}, function (data) {
            var d = $.Deferred();
            console.log(data);
            initializeBudgetChart(data.overallbudgetData, 1);
            return d.promise();}),

        $.getJSON($SCRIPT_ROOT + '/currentspending', {}, function (data) {
            var d = $.Deferred();
            initializeSpendingChart(data.spendingdata, 2);
            return d.promise();})

    ).done(function() { console.log(1); $('.demo-graphs').css("opacity", 1); });

}



function loadTransactionsPage() {

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/transactions', {limit:10}, function (data) {

        indtranstable(data.x , data.y);

        initiateButtons();

        });

    return false;

}

function loadStocksPage() {

    StocksPage().done(function() {
        $('.demo-graphs').css("opacity", 1);
    });
}

function StocksPage() {

    clearPage();

    return $.when(

        $.getJSON($SCRIPT_ROOT + '/stocks', {}, function (data) { var d = $.Deferred(); initializeStockChart(data.sumStockTableData, data.sumstocksPricesData[0], data.sumstocksPricesData[1], 0); return d.promise(); }),

        $.getJSON($SCRIPT_ROOT + '/stocksChart', {}, function (data) { var d = $.Deferred(); initializeStocksChart(data.stockData, 1); return d.promise(); }),

        $.getJSON($SCRIPT_ROOT + '/stockTable', {}, function (data) { var d = $.Deferred(); initializeStockTable(data.stockTableData, 2); return d.promise(); })

    ).done(function() { return true });

}


function loadBudgetPage() {

    BudgetPage().done(function() {
        $('.demo-graphs').css("opacity", 1);
    });
}

function BudgetPage() {

    clearPage();

    return $.when(

        $.getJSON($SCRIPT_ROOT + '/overallbudget', {}, function (data) { var d = $.Deferred(); initializeBudgetChart(data.overallbudgetData, 0); return d.promise(); }),

        $.getJSON($SCRIPT_ROOT + '/budget', {}, function (data) { var d = $.Deferred(); initializeIndBudgetChart(data.budgetData, 1); return d.promise(); })

    ).done(function() { return true });

}

function loadBalancesPage() {

    BalancesPage().done(function() {
        $('.demo-graphs').css("opacity", 1);
    });
}

function BalancesPage() {

    clearPage();

    return $.when(

        $.getJSON($SCRIPT_ROOT + '/balances', {}, function (data) { var d = $.Deferred(); initializeBalanceChart(data.balanceData, data.currentBalanceData, 0);  return d.promise();}),

        $.getJSON($SCRIPT_ROOT + '/NIFX', {}, function (data) { var d = $.Deferred(); initializeNIFXChart(data.NIFXdata, 1);  return d.promise();})

    ).done(function() { return true });

}

function loadSpendingPage() {

    SpendingPage().done(function() {
        $('.demo-graphs').css("opacity", 1);
    });
}

function SpendingPage() {

    clearPage();

    return $.when(

        $.getJSON($SCRIPT_ROOT + '/spending', {}, function (data) { var d = $.Deferred(); initializeMonthlySpend(data.spendingdata, 0);  return d.promise();}),

        $.getJSON($SCRIPT_ROOT + '/netincome', {}, function (data) { var d = $.Deferred(); initializeNetIncomeChart(data.netincomedata, 1);  return d.promise();})

    ).done(function() { return true });

}


function initiateButtons() {

    $('#JointButton').bind('click', function () {
        if ($('#transactions_table_div').length > 0) {
            redraw();
        }
    });

    $('#PageUpButton').bind('click', function () {

        var a = $('#PageUpButton').val();
        $('#PageUpButton').val(Number(a) + 1);
        redraw();

    });

    $('#PageDownButton').bind('click', function () {

        var a = $('#PageUpButton').val();
        $('#PageUpButton').val(Number(a) - 1);
        redraw();

    });

    $('#FirstPageButton').bind('click', function () {

        $('#PageUpButton').val(Number(1));
        redraw();

    });
}

function redraw() {

    $.getJSON($SCRIPT_ROOT + '/transactionsajax', {

            a: $('#JointButton').html(),
            b: $('#PageUpButton').val(),
            limit: 10

        }, function (x) {
            indtranstable(x.x, x.y);
        });
        return false;


}



