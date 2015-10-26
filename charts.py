__author__ = 'emmaachberger'

import pandas as pd
import numpy as np
from sqlalchemy import create_engine

from helperfunctions import returnTable, droplevel
import sqlqueries

engine = create_engine('sqlite:///money.db')
#owners = ['Emma','Dan','Joint']

def spendingdata():

    a = sqlqueries.sqlmonthlyexpenses()
    multiplier = "* - 1"
    string = "WHERE categories.Spending"

    df = pd.read_sql(a %(multiplier, string), engine, parse_dates='Date')

    return returnTable(df)

#print spendingdata()
def netincomedata():

    a = sqlqueries.sqlmonthlyexpenses()
    string = ""
    multiplier = ""

    df = pd.read_sql(a %(string, multiplier), engine, parse_dates='Date')

    return returnTable(df)


def balanceData():

    a = sqlqueries.sqlmonthlybalances() ### bankaccounts, balances

    df = pd.read_sql(a, engine, parse_dates='transdate')

    df = pd.pivot_table(df, index=['transdate','owner', 'FXRate'],values=["balance"],columns=['AccountName'],fill_value=0).reset_index()
    ### takes daily balance data and returns dataframe with each account as separate column

    droplevel(df) # adjusts column names that occurred from pivoting
    return returnTable(df)


def currentbalancedata():

    a = sqlqueries.sqlcurrentbalance()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    return returnTable(df)


def stockData():

    a = sqlqueries.sqlstockgain()

    df = pd.read_sql(a, engine, parse_dates='transdate')

    df['Gain/Loss'] = np.cumsum(df.groupby(['owner', 'description'])['Gain/Loss'])
    df = pd.pivot_table(df, index=['transdate','owner', 'FXRate'],values=["Gain/Loss"],columns=['description']).reset_index()

    owners = getowners().values.tolist()

    for owner in owners:
        df[df.owner==owner[0]] = df[df.owner==owner[0]].sort(['transdate']).fillna(method='pad')

    df = df.fillna(0)

    droplevel(df)

    return returnTable(df)


def stockPricesData():

    a = sqlqueries.sqlstocksprices()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    df = pd.pivot_table(df, index=['transdate','owner', 'FXRate'],values=["Price"],columns=['symbol']).reset_index()

    owners = getowners().values.tolist()

    for owner in owners:
        df[df.owner==owner[0]] = df[df.owner==owner[0]].sort(['transdate']).fillna(method='pad')

    df = df.fillna(0)

    droplevel(df)

    return returnTable(df)


def budgetData():

    a = sqlqueries.sqlbudget()

    df = pd.read_sql(a, engine)

    return returnTable(df)


def overallbudgetData():

    a = sqlqueries.sqloverallbudget()

    df = pd.read_sql(a, engine, parse_dates='transdate')

    return returnTable(df)


def NIFXdata():
    ### returns net income data with fx

    df = pd.read_sql_table('googlechartsmonthlynetincome', engine, parse_dates='Date')

    return returnTable(df)


def indtransactions(a, page, limit):

    if a == "Combined":
        b = ""
    else: b = 'and bankaccounts.owner = "%s"' %a

    a = sqlqueries.sqlindtransactions()
    df = pd.read_sql(a %(b, limit, (page-1)*limit), engine, parse_dates='transdate')

    return df.values.tolist(), df.columns.tolist()


def stocktabledata():

    a = sqlqueries.sqlStockTable()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    return returnTable(df)


def accruals():

    a = sqlqueries.accruals()
    df = pd.read_sql(a, engine, parse_dates='transdate')
    return returnTable(df)





def sumstockdata():

    a = sqlqueries.sqlSumStockTable()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    return returnTable(df)

def sumstockPricesData():

    a = sqlqueries.sqlSumStockData()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    df = pd.pivot_table(df, index=['transdate','owner', 'FXRate'],values=["Price"],columns=['symbol']).reset_index()

    droplevel(df)

    df4 = df
    df4 = df4.iloc[:2,3:]
    df4 = pd.DataFrame(df4.sum())
    df3 = df.iloc[:,3:]
    initial = df3.ix[0:1]
    initial = initial.sum()
    df2 = df3.divide(initial / 100)
    df.iloc[:,3:] = df2
    df4 = df4.reset_index()
    df4.columns = ['Stock','Price']
    df = df.fillna(0)

    return returnTable(df), returnTable(df4)



def sumstockPricesOriginalData():

    a = sqlqueries.sqlSumStockData()
    df = pd.read_sql(a, engine, parse_dates='transdate')

    df = pd.pivot_table(df, index=['transdate','owner', 'FXRate'],values=["Price"],columns=['symbol']).reset_index()

    df = df.fillna(0)

    droplevel(df)

    return returnTable(df)


def sumspendingdata():

    a = sqlqueries.sqlSumSpendTable()

    df = pd.read_sql(a, engine, parse_dates='transdate')

    return returnTable(df)


def getowners(): ### return list of owners

    a = sqlqueries.sqlowners()

    df = pd.read_sql(a, engine)

    return df


def owners():
    return returnTable(getowners())

def owners2(): ### return list of owners

    import sqlite3
    conn = sqlite3.connect('money.db')

    a = sqlqueries.sqlowners()

    c = conn.cursor()
    c.execute(a)
    owners = c.fetchall()
    conn.close()
    return owners

