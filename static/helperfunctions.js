
/// object that converts google.datatable into HTML table with MDL formats

var table = {};

table.MyTable = function (container) {
    this.containerElement = container;
};

table.MyTable.prototype.draw = function (data, options) {

    // Create an HTML table
    var showLineNumber = options.showLineNumber;

    var html = [];
    html.push('<table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp"><thead><tr>');

    for (var col = 0; col < data.getNumberOfColumns(); col++) {

        columnheader = data.getColumnType(col) === 'number' ? '<th class="mdl-data-table__cell--numeric">' : '<th class="mdl-data-table__cell--non-numeric">';
        html.push(columnheader + this.escapeHtml(data.getColumnLabel(col)) + '</th>');
    }

    html.push('</tr></thead>');

    for (var row = 0; row < data.getNumberOfRows(); row++) {
        html.push('<tr>');

        for (var col = 0; col < data.getNumberOfColumns(); col++) {
            html.push(data.getColumnType(col) == 'number' ? '<td contenteditable="true" style="text-align:right">' : '<td contenteditable="true" style="text-align:left">');
            html.push(this.escapeHtml(data.getFormattedValue(row, col)));
            html.push('</td>');
        }
        html.push('</tr>');
    }
    html.push('</table>');
    for (var i = 0; i <= 4; i++) {
        html.push('</br>');
    }


    this.containerElement.innerHTML = html.join('');
};

// function to escape HTML special characters
table.MyTable.prototype.escapeHtml = function (text) {
    if (text == null)
        return '';
    return text.replace(/&/g, '&').replace(/</g, '<')
        .replace(/>/g, '>').replace(/"/g, '"');
};




function JointButtonClick() {
// cycles through owners for jointbutton label and then redraws charts

    var label1 = $('#JointButton').text();

    if (label1 === "Combined") {
        //try { $('#JointButton').text(GLOBALS.owner.getValue(0,0)); }
        //catch (err) { $('#JointButton').text(GLOBALS.owner.getValue(0,0)); }
        $('#JointButton').text(GLOBALS.owner.getValue(0,0));
    } else {
        var row = GLOBALS.owner.getFilteredRows([{column: 0, value: label1 }]);

        if (row[0] === GLOBALS.owner.getNumberOfRows()-1) {
            $('#JointButton').text("Combined");
        }
        else {
            $('#JointButton').text(GLOBALS.owner.getValue(row[0] + 1, 0));
        }
    }

    redrawCharts();

}


function CurrencyButtonClick() {
    // changes currency button on click

    $('#CurrencyButton').html() === "CAD" ? $('#CurrencyButton').html("USD") : $('#CurrencyButton').html("CAD");

    redrawCharts();

}


function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}

function redrawCharts() {
    GLOBALS.charts.forEach(function(value) { $("#"+value[0].chartdiv).length > 0 ? value[0].redraw() : void(0); })
}


function joint(joint) {
    if ($('#JointButton').text() === "Combined") {
        return "Combined";
    } else {
        return joint;
    }
}


function escapeHtml(div) {
    if (div == null)
        return '';
    return div.replace(/&/g, '&').replace(/</g, '<')
        .replace(/>/g, '>').replace(/"/g, '"');
};


Number.prototype.formatMoney = function(c, d, t){
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "($" : "$",
        l = n < 0 ? ")" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;

       return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + l;
     };


function formatMoneyColor(div, number) {

    numberFormatted = number.formatMoney();
    $(div).text(numberFormatted);
    number >= 0 ? $(div).css("color", "#4CAF50") : $(div).css("color", "#EF5350");

}


function clearPage(){
    GLOBALS.grid.empty(); /// clears all charts on current page
    GLOBALS.charts.forEach(function(value) { $("#"+value[0].chartdiv).length > 0 ? value[0].redraw() : void(0); })
    GLOBALS.charts = [];
}


