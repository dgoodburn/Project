__author__ = 'emmaachberger'

import datetime

import pandas as pd
from pandas.io import sql
from sqlalchemy import create_engine
import sqlalchemy

import sqlqueries

import time
import instance
database = instance.getDatabase()
engine = create_engine(database)

def getStockPrices(): ### returns dataframe of stockprice history

    df = pd.DataFrame() # creates empty dataframe

    x = stocknames()
    # list all stocks owned as they would be entered into API
    # need to update to read from database automatically and generate list

    dffix = False

    for i in range(len(x)):
        try:
            if x[i][0] != 'MoneyMarket':
                df2 = pd.read_csv("http://real-chart.finance.yahoo.com/table.csv?s=%s&d=12&e=31&f=2016&g=d&a=1&b=1&c=2014&ignore=.csv" % x[i][0], parse_dates = ['Date'])[['Date','Close']]
                df2['Symbol'] = x[i][0]
                if i == 0:
                    df = df2
                else:
                    df = df.append(df2, ignore_index=True)
        except:
            print x[i][0] + ' caused an error.'
            if not dffix:
                dffix = addoldsymbol(x[i][0])
            else:
                dffix = dffix.append(addoldsymbol(x[i][0]), ignore_index=True)

    # iterate through called stock price list. append list of stock prices to list

    df.rename(columns={'Close': 'Price'}, inplace=True)     # rename column to match database
    df = df[['Date','Symbol','Price']]
    df = df.append(dffix, ignore_index=True)

    df.columns = ['transdate','symbol','price']

    # append MoneyMarket at price=1 for all dates since not an actual stockticker

    start_date = datetime.date(2013,1,1)
    index = pd.date_range(start=start_date, end=datetime.datetime.today(), freq='d')
    df2 = pd.DataFrame(columns=['transdate'],data=index)

    df2['symbol'] = 'MoneyMarket'
    df2['price'] = 1
    df2 = df2[['transdate','symbol','price']]
    df = df.append(df2)

    df.to_sql('stocksprices', engine, if_exists = 'replace', dtype={'symbol': sqlalchemy.types.VARCHAR(length=20), 'transdate': sqlalchemy.types.DATETIME()})
    sql.execute("CREATE INDEX Stocksprices_transdate_index ON money.stocksprices (transdate);", engine)
    sql.execute("CREATE INDEX Stocksprices_symbol_index ON money.stocksprices (symbol);", engine)


def addoldsymbol(symbol):

    df = pd.read_csv("Common/StockPrices.csv")
    df = df[df['Symbol'] == symbol]
    df = df[["Date", "Symbol", "Price"]]
    return df


def stocknames():  ### returns list of all stock symbols that have been transacted

    a = """
    select DISTINCT stocktransactions.symbol
      from stocktransactions
    """

    df = pd.read_sql(a, engine)

    return df.values.tolist()



def stockbalances(): ### joins stock transactions/balances with prices and loads to database

    a = """
    SELECT DISTINCT
      date(datestable.transdate) as transdate,
      stocktransactions.symbol,
      stocktransactions.accountname,
      sum(stocktransactions.numshares) as numshares,
      stocksprices.price as price
    FROM datestable, stocktransactions
      left join stocksprices on date(stocksprices.transdate) = date(datestable.transdate) and stocksprices.symbol = stocktransactions.symbol
    WHERE datestable.transdate <= current_date AND datestable.transdate >= date("2013-01-01") AND
          datestable.transdate >= stocktransactions.transdate
    GROUP BY datestable.transdate, stocktransactions.symbol, stocktransactions.accountname, stocksprices.price
    order by datestable.transdate desc
    """

    a = """
    SELECT DISTINCT
      datestable.transdate as transdate,
      stocktransactions.symbol,
      stocktransactions.accountname,
      sum(stocktransactions.numshares) as numshares,
      stocksprices.price as price
    FROM datestable CROSS JOIN stocktransactions
      left join stocksprices on stocksprices.transdate = datestable.transdate and stocksprices.symbol = stocktransactions.symbol
    WHERE datestable.transdate <= current_date AND datestable.transdate >= date("2013-01-01") AND
          datestable.transdate >= stocktransactions.transdate
    GROUP BY datestable.transdate, stocktransactions.symbol, stocktransactions.accountname, stocksprices.price
    """

    df = pd.read_sql_query(a, engine, parse_dates='transdate')

    df = df.sort(columns=['symbol','transdate']).fillna(method='pad')

    df['prevprice'] = df['price'].shift(+1)      # adds columns showing previous day price

    df.loc[df.groupby('symbol',as_index=False).head(1).index,'prevprice'] = df.price

    df['netchange'] = df.numshares * (df.price - df.prevprice)
    df['balance'] = df.numshares * df.price

    df.to_sql('stockprices', engine, if_exists = 'replace')


def stockincome():
### returns dataframe of all stock gains/losses to append to transaction dataframe

    start = time.time()
    stockbalances()

    a = sqlqueries.sqlstockincome()

    df = pd.read_sql(a, engine, parse_dates='transdate')


    return df

