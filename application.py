from flask import Flask, jsonify, render_template, request
import charts
from sqlalchemy import create_engine
from initialImport import initialStartup
import instance

application = Flask(__name__)

database = instance.getDatabase()
engine = create_engine(database)

"""
@application.before_first_request
def create_database():
    initialStartup()
"""

@application.route('/')
def homepage():

    return render_template("index.html")

"""
@application.route('/owners/')
def ownerspage():

    import sqlite3
    conn = sqlite3.connect('money.db')

    c = conn.cursor()
    c.execute('select distinct bankaccounts.Owner from bankaccounts')
    owners = c.fetchall()
    conn.close()
    return jsonify(owners=owners)

"""
@application.route('/owners/')
def ownerspage():

    return jsonify(owners=charts.owners())


@application.route('/budget/')
def budgetpage():

    return jsonify(budgetData=charts.budgetData())


@application.route('/overallbudget/')
def overallbudgetpage():

    return jsonify(overallbudgetData=charts.overallbudgetData())


@application.route('/NIFX/')
def nifxpage():

    return jsonify(NIFXdata=charts.NIFXdata())

@application.route('/balancebyaccount/')
def balancebyaccount():

    return jsonify(balancedatabyaccount=charts.accountbalancesbyaccount())

@application.route('/balances/')
def balancespage():

    return jsonify(balanceData=charts.balanceData(), currentBalanceData=charts.currentbalancedata())


@application.route('/spending/')
def spendingpage():

    return jsonify(spendingdata=charts.spendingdata())


@application.route('/currentspending/')
def currentspendingpage():

    return jsonify(spendingdata=charts.sumspendingdata())


@application.route('/netincome/')
def netincomepage():

    return jsonify(netincomedata=charts.netincomedata())




@application.route('/stocks/')
def stockspage():

    return jsonify(sumStockTableData=charts.sumstockdata(), sumstocksPricesData=charts.sumstockPricesData())


@application.route('/stockPrices/')
def stockspricespage():

    return jsonify(stocksPricesData=charts.stockPricesData())


@application.route('/stocksChart/')
def stockschartpage():

    return jsonify(stockData=charts.stockData())


@application.route('/sumstockPrices/')
def sumstockspricespage():

    return jsonify(sumstocksPricesData=charts.sumstockPricesData())


@application.route('/stockTable/')
def stocktablepage():

    return jsonify(stockTableData=charts.stocktabledata())


@application.route('/sumStockTable/')
def sumstocktablepage():

    return jsonify(sumStockTableData=charts.sumstockdata())


@application.route('/transactions/')
def transactionspage():

    limit = request.args.get('limit', 0, type=int)
    x, y = charts.indtransactions("Combined", 1, limit)

    return jsonify(x=x, y=y)


@application.route('/transactionsajax/')
def transactionsajaxaage():

    a = request.args.get('a', 0, type=str)
    page = request.args.get('b', 0, type=int)
    limit = request.args.get('limit', 0, type=int)
    x, y = charts.indtransactions(a, page, limit)
    return jsonify(x=x, y=y)


@application.route('/goal/')
def goalpage():

    return jsonify(goalData=charts.goalData())


@application.route('/accrual/')
def accrualpage():

    print charts.accruals()
    print charts.stocktabledata()
    # return jsonify(1)
    return jsonify(accrualData = charts.accruals())
    #return jsonify(stockTableData=charts.stocktabledata())


if __name__ == '__main__':
    application.debug = True
    application.run(host='0.0.0.0', port=5000)
