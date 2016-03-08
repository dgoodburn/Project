from flask import Flask, jsonify, render_template, request
import charts
from sqlalchemy import create_engine
from initialImport import initialStartup
import instance

app = Flask(__name__)

database = instance.getDatabase()
engine = create_engine(database)

"""
@app.before_first_request
def create_database():
    initialStartup()
"""

@app.route('/')
def homepage():

    return render_template("index.html")

"""
@app.route('/owners/')
def ownerspage():

    import sqlite3
    conn = sqlite3.connect('money.db')

    c = conn.cursor()
    c.execute('select distinct bankaccounts.Owner from bankaccounts')
    owners = c.fetchall()
    conn.close()
    return jsonify(owners=owners)

"""
@app.route('/owners/')
def ownerspage():

    return jsonify(owners=charts.owners())


@app.route('/budget/')
def budgetpage():

    return jsonify(budgetData=charts.budgetData())


@app.route('/overallbudget/')
def overallbudgetpage():

    return jsonify(overallbudgetData=charts.overallbudgetData())


@app.route('/NIFX/')
def nifxpage():

    return jsonify(NIFXdata=charts.NIFXdata())

@app.route('/balancebyaccount/')
def balancebyaccount():

    return jsonify(balancedatabyaccount=charts.accountbalancesbyaccount())

@app.route('/balances/')
def balancespage():

    return jsonify(balanceData=charts.balanceData(), currentBalanceData=charts.currentbalancedata())


@app.route('/spending/')
def spendingpage():

    return jsonify(spendingdata=charts.spendingdata())


@app.route('/currentspending/')
def currentspendingpage():

    return jsonify(spendingdata=charts.sumspendingdata())


@app.route('/netincome/')
def netincomepage():

    return jsonify(netincomedata=charts.netincomedata())




@app.route('/stocks/')
def stockspage():

    return jsonify(sumStockTableData=charts.sumstockdata(), sumstocksPricesData=charts.sumstockPricesData())


@app.route('/stockPrices/')
def stockspricespage():

    return jsonify(stocksPricesData=charts.stockPricesData())


@app.route('/stocksChart/')
def stockschartpage():

    return jsonify(stockData=charts.stockData())


@app.route('/sumstockPrices/')
def sumstockspricespage():

    return jsonify(sumstocksPricesData=charts.sumstockPricesData())


@app.route('/stockTable/')
def stocktablepage():

    return jsonify(stockTableData=charts.stocktabledata())


@app.route('/sumStockTable/')
def sumstocktablepage():

    return jsonify(sumStockTableData=charts.sumstockdata())


@app.route('/transactions/')
def transactionspage():

    limit = request.args.get('limit', 0, type=int)
    x, y = charts.indtransactions("Combined", 1, limit)

    return jsonify(x=x, y=y)


@app.route('/transactionsajax/')
def transactionsajaxaage():

    a = request.args.get('a', 0, type=str)
    page = request.args.get('b', 0, type=int)
    limit = request.args.get('limit', 0, type=int)
    x, y = charts.indtransactions(a, page, limit)
    return jsonify(x=x, y=y)


@app.route('/goal/')
def goalpage():

    return jsonify(goalData=charts.goalData())


@app.route('/accrual/')
def accrualpage():

    print charts.accruals()
    print charts.stocktabledata()
    # return jsonify(1)
    return jsonify(accrualData = charts.accruals())
    #return jsonify(stockTableData=charts.stocktabledata())


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
