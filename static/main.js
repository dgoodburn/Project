
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
    charts: []

};

$(document).ready(function() {

    $.getJSON($SCRIPT_ROOT + '/owners', {}, function (data) { initializeOwners(data.owners); });
    $('#JointButton').click(JointButtonClick);
    $('#CurrencyButton').click(CurrencyButtonClick);
    loadHomePage();

});

function initializeOwners(data){
    GLOBALS.owner = new google.visualization.DataTable(data);
}


function loadHomePage() {

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/balances', {}, function (data) { initializeBalanceChart(data.balanceData, data.currentBalanceData); });

    $.getJSON($SCRIPT_ROOT + '/overallbudget', {}, function (data) { initializeBudgetChart(data.overallbudgetData); });

    $.getJSON($SCRIPT_ROOT + '/currentspending', {}, function (data) { initializeSpendingChart(data.spendingdata); });

    $.getJSON($SCRIPT_ROOT + '/stocks', {}, function (data) { initializeStockChart(data.sumStockTableData, data.sumstocksPricesData[0], data.sumstocksPricesData[1]); });

    return false;
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

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/stocks', {}, function (data) { initializeStockChart(data.sumStockTableData, data.sumstocksPricesData[0], data.sumstocksPricesData[1]); });

    $.getJSON($SCRIPT_ROOT + '/stocksChart', {}, function (data) { initializeStocksChart(data.stockData); });

    $.getJSON($SCRIPT_ROOT + '/stockTable', {}, function (data) { initializeStockTable(data.stockTableData); });

    return false;

}




function loadBudgetPage() {

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/overallbudget', {}, function (data) { initializeBudgetChart(data.overallbudgetData); });

    $.getJSON($SCRIPT_ROOT + '/budget', {}, function (data) { initializeIndBudgetChart(data.budgetData); });

    return false;

}


function loadBalancesPage() {

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/balances', {}, function (data) { initializeBalanceChart(data.balanceData, data.currentBalanceData); });

    $.getJSON($SCRIPT_ROOT + '/NIFX', {}, function (data) { initializeNIFXChart(data.NIFXdata); });

    return false;

}

function loadSpendingPage() {

    clearPage();

    $.getJSON($SCRIPT_ROOT + '/spending', {}, function (data) { initializeMonthlySpend(data.spendingdata); });

    $.getJSON($SCRIPT_ROOT + '/netincome', {}, function (data) { initializeNetIncomeChart(data.netincomedata); });

    return false;

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



