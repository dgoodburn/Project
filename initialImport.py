__author__ = 'emmaachberger'

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import sqlalchemy
import instance

import sqlqueries
import stockPricesImport
from mintTransactions import Mint
from helperfunctions import timermultifunc
import FXImport
from pandas.io import sql

import time


database = instance.getDatabase()
engine = create_engine(database)

demo = False  # turns on demo transactions
mintacct = not demo  # turns on mint account download
pd.options.mode.chained_assignment = None  # turns off warning for chained indexing



def initialStartup():

    timermultifunc([
        importDatesTable,
        importBankAccounts,
        budgetimport,
        categoryimport,
        importStockTransactions,
        stockPricesImport.getStockPrices,
        stockPricesImport.stockbalances,
        importBankTransactions,
        fximport,
        totalbalances,
        NIFX,
        importGoals
    ])


def importBankAccounts():

    if demo: ## only used to demo account to add dummy data. Is turned on above.
        df = pd.read_csv('DemoData/BankAccounts.csv')
    else:
        df = pd.read_csv('CSVs/BankAccounts.csv')

    df.to_sql('bankaccounts', engine, if_exists = 'replace', index=False, dtype={'AccountName': sqlalchemy.types.VARCHAR(length=30), 'MintAccountName': sqlalchemy.types.VARCHAR(length=30)})

    sql.execute("CREATE INDEX AccountName_index ON money.bankaccounts (AccountName);", engine)
    sql.execute("CREATE INDEX MintAccountName_index ON money.bankaccounts (MintAccountName);", engine)


def importStockTransactions():

    if demo: ## only used to demo account to add dummy data. Is turned on above.
        df = pd.read_csv('DemoData/StockTransactions.csv', parse_dates = ['transdate'])
    else:
        df = pd.read_csv('CSVs/StockTransactions.csv', parse_dates = ['transdate'])

    df.to_sql('stocktransactions', engine, if_exists = 'replace', index = False, dtype={'symbol': sqlalchemy.types.VARCHAR(length=20)})
    sql.execute("CREATE INDEX Stocktransaction_transdate_index ON money.stocktransactions (transdate);", engine)
    sql.execute("CREATE INDEX Stocktransaction_symbol_index ON money.stocktransactions (symbol);", engine)


def importBankTransactions():
    ### imports old transactions, Emma/Dan mint transactions, appends together and inserts into database
    start = time.time()
    if demo: ## only used to demo account to add dummy data. Is turned on above.
        df = pd.read_csv('DemoData/demotransactions.csv', parse_dates = ['transdate'])

    else:
        df = pd.read_csv('CSVs/oldtransactions.csv', parse_dates = ['transdate'])
        df_accrual = pd.read_csv('CSVs/accrual.csv', parse_dates = ['transdate'])
        df = df.append(df_accrual)

        new = time.time()
        start = new

        df = df.append(mintImport())

    new = time.time()
    start = new

    df = df.append(stockPricesImport.stockincome())

    new = time.time()
    start = new

    df = df.sort('transdate')

    df.to_sql('transactions', engine, if_exists = 'replace', index=False, dtype={'accountname': sqlalchemy.types.VARCHAR(length=30)})

    sql.execute("CREATE INDEX transactions_transdate_index ON money.transactions (transdate);", engine)
    sql.execute("CREATE INDEX transactions_accountname_index ON money.transactions (accountname);", engine)


"""
def mintImport(): # use if parallel processing has issues

    import instance

    mintAccounts = instance.mintaccounts()

    if mintacct:
        for key, accounts in mintAccounts.iteritems():
            try:
                mint = Mint(email = accounts[0], password = accounts[1])
                mint.initiate_account_refresh()
                df = mint.get_transactions()
                df.to_csv('CSVs/' + accounts[2])
                print accounts[0] + " accepted correctly."
            except:
                print accounts[0] + " was not accepted."
    else:
        print "Mint accounts intentionally not imported. Change 'mintacct' variable to 'True'."

    df = pd.DataFrame()
    columns = ['id','transdate','description','originaldescription','amount','debitcredit','category','accountname','labels','notes']

    for key, accounts in mintAccounts.iteritems():
        df2 = pd.read_csv('CSVs/' + accounts[2], parse_dates = ['Date'])
        df2.columns = columns
        if df.empty:
            df = df2
        else:
            df = df.append(df2)

    df.drop('id',axis=1,inplace=True)

    df.loc[df['debitcredit'] == 'debit', ['amount']] *= -1     # reverses sign for 'debit' transactions
    df.reset_index(level=0, inplace=True)
    df.columns = ['id','transdate','description','originaldescription','amount','debitcredit','category','accountname','labels','notes']
    df = df[['id','transdate','description','amount','category','accountname']]

    return df
"""

def getMintTransactions(accounts):

    try:
        mint = Mint(email = accounts[0], password = accounts[1])
        mint.initiate_account_refresh()
        df = mint.get_transactions()
        df.to_csv('CSVs/' + accounts[2])

        print accounts[0] + " accepted correctly."

        return df
    except:
        print accounts[0] + " was not accepted."
        return pd.DataFrame()


def mintImport():

    import instance
    from multiprocessing import Pool

    mintAccounts = instance.mintaccounts()

    if mintacct:

        pool = Pool()
        result_list = []

        def log_result(result):
            result_list.append(result)

        for key, accounts in mintAccounts.iteritems():
            pool.apply_async(getMintTransactions, args = [accounts], callback= log_result)

        pool.close()
        pool.join()

    else:
        print "Mint accounts intentionally not imported. Change 'mintacct' variable to 'True'."

    df = pd.DataFrame()
    columns = ['id','transdate','description','originaldescription','amount','debitcredit','category','accountname','labels','notes']

    for key, accounts in mintAccounts.iteritems():
        df2 = pd.read_csv('CSVs/' + accounts[2], parse_dates = ['Date'])
        df2.columns = columns
        if df.empty:
            df = df2
        else:
            df = df.append(df2)

    df.drop('id',axis=1,inplace=True)

    df.loc[df['debitcredit'] == 'debit', ['amount']] *= -1     # reverses sign for 'debit' transactions

    df.reset_index(level=0, inplace=True)
    df.columns = ['id','transdate','description','originaldescription','amount','debitcredit','category','accountname','labels','notes']
    df = df[['id','transdate','description','amount','category','accountname']]

    return df


def importDatesTable():
    ### creates table of dates for all dates from date specified until today + 400 days

    from helperfunctions import table_of_dates

    tableofdates = table_of_dates(2006,1,1,'D')
    tableofdates.reset_index(inplace=True)


    tableofdates.to_sql('datestable', engine, if_exists = 'replace', index=False, index_label='transdate')
    sql.execute("CREATE INDEX transdate_index ON money.datestable (transdate);", engine)



def fximport():

    if not demo:
        FXImport.fximport()
    df = pd.read_csv('Common/FX rates.csv', parse_dates = ['FXDate'])
    df.to_sql('fxrates', engine, if_exists = 'replace')
    sql.execute("CREATE INDEX FX_FXdate_index ON money.fxrates (FXDate);", engine)



def budgetimport():

    if demo: ## only used to demo account to add dummy data. Is turned on above.
        df = pd.read_csv('DemoData/budget.csv')
    else:
        df = pd.read_csv('CSVs/budget.csv')

    df.to_sql('budget', engine, if_exists = 'replace')


def categoryimport():

    df = pd.read_csv('Common/categories.csv')
    df.to_sql('categories', engine, if_exists = 'replace')


def totalbalances():
    ### inserts daily balance data for all accounts to database

    from datetime import datetime

    a = sqlqueries.sqltotalbalances() ### bankaccounts, transactions, dates, fxrates

    df = pd.read_sql(a, engine, parse_dates='transdate')

    df['amount'] = df['amount'].fillna(0)

    df['balance'] = np.cumsum(df.groupby(['AccountName'])['amount'])    # adds column of running total balances

    df = df[df['balance'] != 0 ]    # removes zero balances which should be balances before account started

    df = df.sort('transdate')

    df = df[df['transdate'] <= datetime.today()]    # removes any future dates

    #df['USDAmount'] = df.apply(lambda row: convert(row['balance'], row['Currency'], row['Rate']), axis=1)

    df['USDAmount'] = df.balance / df.Rate
    df.ix[df.Currency=='USD', 'USDAmount'] = df.ix[df.Currency=='USD', 'balance']

    df['CADAmount'] = df.USDAmount * df.Rate

    df.balance = df.balance.round(2)
    df.USDAmount = df.USDAmount.round(2)
    df.CADAmount = df.CADAmount.round(2)

    df.to_sql('balances', engine, if_exists = 'replace', index=False)

    sql.execute("CREATE INDEX balances_transdate_index ON money.balances (transdate);", engine)



def NIFX():

    FXquery = sqlqueries.FXquery()
    df = pd.read_sql(FXquery, engine, parse_dates='transdate')

    df = findFX(df)

    spendingQuery = sqlqueries.spendingQuery()
    df2 = pd.read_sql(spendingQuery, engine, parse_dates='Date')

    df = df.append(df2).sort('Date')

    df['USD Amount'] = np.round(df['USD Amount'],decimals=2)
    df['CAD Amount'] = np.round(df['CAD Amount'],decimals=2)
    df['Date'] = pd.DatetimeIndex(df['Date']) + pd.offsets.MonthEnd(0)

    df = pd.pivot_table(df, index=['Date','Owner'],values=["USD Amount","CAD Amount"],columns=['Category'],fill_value=0).reset_index()

    df.columns = df.columns.droplevel()
    df.columns = ['Date','Owner','USD FX Gain/Loss','USD Investments','USD Income','CAD FX Gain/Loss','CAD Investments','CAD Income']
    df.to_sql('googlechartsmonthlynetincome', engine, if_exists = 'replace', index=False)


def findFX(df):

    start = time.time()
    df[['nativebalance','USbalance','CAbalance']] = np.cumsum(df.groupby(['Owner','Currency'])[['Native Amount','USD Amount','CAD Amount']])
    ### total of (all transactions in native currency multiplied by transaction date rate)

    #df['USDbalance'] = df.apply(lambda row: convert(row['nativebalance'], row['Currency'], row['Rate']), axis=1)

    df['USDbalance'] = df.nativebalance / df.Rate
    df.ix[df.Currency=='USD', 'USDbalance'] = df.ix[df.Currency=='USD', 'nativebalance']

    df['CADbalance'] = df['USDbalance'] * df['Rate']
    ## total of all transactions in native currency converted at ending rate

    df['USFX'] = df.USDbalance - df.USbalance
    df['CADFX'] = df.CADbalance - df.CAbalance

    df = df[['transdate','Owner','Currency','USFX','CADFX']]

    df['transdate'] = pd.DatetimeIndex(df['transdate'])
    df['PrevDate'] = pd.DatetimeIndex(df['transdate']) + pd.offsets.MonthEnd(-1)

    df.iloc[0:4,3:5] = 0.0 ### change first three balances to zero. Needed for pad filling step below.

    df = df.sort(['Owner','Currency','transdate','PrevDate']).fillna(method='pad')
    df = pd.merge(df, df, how='left', left_on=['PrevDate','Owner','Currency'], right_on=['transdate','Owner','Currency'])

    df['FXUSD'] = df.USFX_x - df.USFX_y
    df['FXCAD'] = df.CADFX_x - df.CADFX_y
    df = df[['transdate_x','Owner','Currency','FXUSD','FXCAD']]
    df = df.sort(['Owner','Currency','transdate_x']).fillna(method='pad')

    df['Category'] = "FX Gain/Loss"
    df.columns = ['Date','Owner','Currency','USD Amount','CAD Amount','Category']
    df = df.groupby(['Date','Owner','Category'])['USD Amount','CAD Amount'].sum().reset_index()

    return df


def importGoals():

    df = pd.read_csv('CSVs/Goal.csv', parse_dates = ['transdate'])
    df.to_sql('goal', engine, if_exists = 'replace', index=False)
