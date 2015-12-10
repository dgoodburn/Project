
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
    GLOBALS.chartsOrder = [false, false, false, false, false, false, false, false];
}


function poz(z) {
    var y, x, w;
    var Z_MAX = 6;

    if (z == 0.0) {
        x = 0.0;
    } else {
        y = 0.5 * Math.abs(z);
        if (y > (Z_MAX * 0.5)) {
            x = 1.0;
        } else if (y < 1.0) {
            w = y * y;
            x = ((((((((0.000124818987 * w
                     - 0.001075204047) * w + 0.005198775019) * w
                     - 0.019198292004) * w + 0.059054035642) * w
                     - 0.151968751364) * w + 0.319152932694) * w
                     - 0.531923007300) * w + 0.797884560593) * y * 2.0;
        } else {
            y -= 2.0;
            x = (((((((((((((-0.000045255659 * y
                           + 0.000152529290) * y - 0.000019538132) * y
                           - 0.000676904986) * y + 0.001390604284) * y
                           - 0.000794620820) * y - 0.002034254874) * y
                           + 0.006549791214) * y - 0.010557625006) * y
                           + 0.011630447319) * y - 0.009279453341) * y
                           + 0.005353579108) * y - 0.002141268741) * y
                           + 0.000535310849) * y + 0.999936657524;
        }
    }
    return z > 0.0 ? ((x + 1.0) * 0.5) : ((1.0 - x) * 0.5);
}

function critz(p) {
    var Z_MAX = 6;

    var Z_EPSILON = 0.000001;     /* Accuracy of z approximation */
    var minz = -Z_MAX;
    var maxz = Z_MAX;
    var zval = 0.0;
    var pval;

    if (p < 0.0 || p > 1.0) {
        return -1;
    }

    while ((maxz - minz) > Z_EPSILON) {
        pval = poz(zval);
        if (pval > p) {
            maxz = zval;
        } else {
            minz = zval;
        }
        zval = (maxz + minz) * 0.5;
    }
    return(zval);
}

/*  TRIMFLOAT  --  Trim floating point number to a given
                   number of digits after the decimal point.  */

function trimfloat(n, digits)
{
    var dp, nn, i;

    n += "";
    dp = n.indexOf(".");
    if (dp != -1) {
        nn = n.substring(0, dp + 1);
        dp++;
        for (i = 0; i < digits; i++) {
            if (dp < n.length) {
                nn += n.charAt(dp);
                dp++;
            } else {
                break;
            }
        }

        /* Now we want to round the number.  If we're not at
           the end of number and the next character is a digit
           >= 5 add 10^-digits to the value so far. */

        if (dp < n.length && n.charAt(dp) >= '5' &&
                             n.charAt(dp) <= '9') {
            var rd = 0.1, rdi;

            for (rdi = 1; rdi < digits; rdi++) {
                rd *= 0.1;
            }
            rd += parseFloat(nn);
            rd += "";
            nn = rd.substring(0, nn.length);
            nn += "";
        }

        //  Ditch trailing zeroes in decimal part

        while (nn.length > 0 && nn.charAt(nn.length - 1) == '0') {
            nn = nn.substring(0, nn.length - 1);
        }

        //  Skip excess decimal places before exponent

        while (dp < n.length && n.charAt(dp) >= '0' &&
                                n.charAt(dp) <= '9') {
            dp++;
        }

        //  Append exponent, if any

        if (dp < n.length) {
            nn += n.substring(dp, n.length);
        }
        n = nn;
    }
    return n;
}

function calc_q(prob) {
    var ROUND_FLOAT = 6;
    if (prob < 0 ||
        prob > 1) {
        alert("Probability (Q) must be between 0 and 1.");
        return 0
    } else {
        return trimfloat(critz(1-(1-prob)/2), ROUND_FLOAT);
    }
}