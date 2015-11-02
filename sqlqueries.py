__author__ = 'emmaachberger'


def sqlstockincome():
    return '''

    SELECT *
    FROM (
      SELECT
        "index"         AS id,
        date(transdate) AS transdate,
        symbol          AS description,
        netchange       AS amount,
        "gain/loss"     AS category,
        accountname
      FROM stockprices
      WHERE netchange != 0

      UNION ALL
      SELECT
        stocktransactions.id,
        date(stocktransactions.transdate),
        stocktransactions.symbol AS description,
        stocktransactions.numshares * stocktransactions.pricepershare,
        stocktransactions.transactiontype,
        stocktransactions.accountname
      FROM stocktransactions)
    ORDER BY transdate
    '''


def sqlallexp():
    return '''

    SELECT
      transactions.transdate,
      transactions.description,
      transactions.amount AS "NativeAmount",
      transactions.category,
      bankaccounts.AccountName,
      bankaccounts.AccountType,
      bankaccounts.Currency,
      bankaccounts.Owner,
      fxrates.Rate
    FROM transactions
      INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
      INNER JOIN fxrates ON transactions.transdate = fxrates.FXDate
    '''


def accruals():
    return '''

    SELECT transactions.*
    FROM transactions
      INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
    WHERE bankaccounts.AccountType = "Other"
    '''

def sqlmonthlyexpenses():
    return '''

    SELECT
      T1.Date,
      T1.Owner,
      FX2.Rate,
      T1.Spend
    FROM
      (SELECT
         date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS Date,
         bankaccounts.Owner,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2) %s                                              AS "Spend"

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
         INNER JOIN categories ON categories.Category = transactions.category
       %s
       GROUP BY Date, bankaccounts.Owner) AS T1
      INNER JOIN fxrates AS FX2 ON T1.Date = date(FX2.FXDate)
    ORDER BY T1.Date
    '''


def sqltotalbalances():
    return '''

    SELECT
      bankaccounts.AccountName,
      bankaccounts.MintAccountName,
      bankaccounts.Owner,
      bankaccounts.Currency,
      sum(transactions.amount) As amount,
      datestable.transdate,
      fxrates.Rate

    FROM bankaccounts
      JOIN datestable
        JOIN fxrates on fxrates.FXDate = datestable.transdate
      LEFT JOIN transactions
    on transactions.transdate = datestable.transdate AND transactions.accountname = bankaccounts.MintAccountName
    GROUP BY bankaccounts.AccountName, bankaccounts.MintAccountName, bankaccounts.Owner, bankaccounts.Currency,
      datestable.transdate, fxrates.Rate
    ORDER BY bankaccounts.MintAccountName, datestable.transdate;
    '''


def sqlmonthlybalances():
    return '''

    SELECT
      bankaccounts.AccountType as AccountName,
      date(balances.transdate) as transdate,
      balances.owner as owner,
      sum(balances.USDAmount) as balance,
      balances.Rate as FXRate
    FROM balances
      JOIN bankaccounts ON balances.MintAccountName = bankaccounts.MintAccountName
    WHERE date(balances.transdate) = date(balances.transdate, 'start of month', '+1 month', '-1 day') OR
        date(balances.transdate) = date(current_date,'localtime')
    GROUP BY balances.owner, bankaccounts.AccountType, date(balances.transdate), balances.Rate
    '''

def sqlcurrentbalance():
    return '''

    SELECT
      balances.transdate      AS transdate,
      balances.owner          AS owner,
      balances.Rate           AS FXRate,
      sum(balances.USDAmount) AS balance
    FROM balances
    WHERE date(balances.transdate) = date(current_date,'localtime') OR date(balances.transdate) = date(current_date, 'localtime', '-1 month')
    GROUP BY balances.transdate, balances.owner, balances.Rate
    ORDER BY balances.transdate
      DESC
    '''

def accounttypeowner():
    return '''

    SELECT DISTINCT
      bankaccounts.AccountType,
      bankaccounts.Owner
    FROM bankaccounts
    '''

def sqlindtransactions():
    return '''

    SELECT
      transactions.transdate,
      bankaccounts.Owner,
      bankaccounts.AccountName As "Account",
      transactions.description AS "Description",
      transactions.amount AS "Amount",
      transactions.category AS "Category",
      bankaccounts.AccountType As "Account Type",
      bankaccounts.Currency,
      fxrates.Rate as "FX Rate"
    FROM transactions
      INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
      INNER JOIN fxrates ON transactions.transdate = fxrates.FXDate
    where "Account Type" != "Investment" %s
    ORDER BY transactions.transdate
      DESC
    LIMIT %s offset %s
    '''

def sqlbudget():
    return '''

    Select
      T2.Date1 as transdate,
      T2.Owner1 as Owner,
      fxrates.Rate as FXRate,
      T2.Category1 as Category,
      T2.Budget1 as Budget,
      ifnull(T2.amount2,0) as Actual
    from
      (SELECT DISTINCT
      date(datestable.transdate, 'start of month', '+1 month', '-1 day') AS Date1,
      budget.owner                                                       AS Owner1,
      budget.categoryname                                                AS Category1,
      budget.amount                                                      AS Budget1,
      T1.amount2
    FROM datestable
      INNER JOIN budget

      LEFT JOIN (
            SELECT
             date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS Date2,
             bankaccounts.Owner                                                   AS Owner2,
             transactions.category                                                AS Category2,
             sum(transactions.amount) * -1                                        AS amount2
           FROM
             transactions
             INNER JOIN bankaccounts ON bankaccounts.MintAccountName = transactions.accountname
           WHERE Date2 = date('2015-11-30')
           GROUP BY transactions.category, bankaccounts.Owner, Date2) AS T1
        ON T1.Date2 = Date1 AND Owner1 = T1.Owner2 AND Category1 = T1.Category2
    WHERE Date1 = date('2015-11-30')) as T2
    inner join fxrates on date(fxrates.FXDate) = T2.Date1;
    '''

def sqloverallbudget():
    return '''

    SELECT
      T2.Date1              AS transdate,
      T2.Owner1             AS Owner,
      fxrates.Rate          AS FXRate,
      sum(T2.Budget1)            AS Budget,
      sum(ifnull(T2.amount2, 0)) AS Actual
    FROM
      (SELECT DISTINCT
         date(datestable.transdate, 'start of month', '+1 month', '-1 day') AS Date1,
         budget.owner                                                       AS Owner1,
         budget.categoryname                                                AS Category1,
         budget.amount                                                      AS Budget1,
         T1.amount2
       FROM datestable
         INNER JOIN budget

         LEFT JOIN (
                     SELECT
                       date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS Date2,
                       bankaccounts.Owner                                                   AS Owner2,
                       transactions.category                                                AS Category2,
                       sum(transactions.amount) * -1                                        AS amount2
                     FROM
                       transactions
                       INNER JOIN bankaccounts ON bankaccounts.MintAccountName = transactions.accountname
                     WHERE Date2 = date('2015-11-31')
                     GROUP BY transactions.category, bankaccounts.Owner, Date2) AS T1
           ON T1.Date2 = Date1 AND Owner1 = T1.Owner2 AND Category1 = T1.Category2
       WHERE Date1 = date('2015-11-31')) AS T2
      INNER JOIN fxrates ON date(fxrates.FXDate) = T2.Date1
    GROUP BY T2.Date1, T2.Owner1, fxrates.Rate
    '''


def sqlstockgain():
    return '''

    SELECT
      transactions.transdate,
      bankaccounts.Owner as owner,
      fxrates.Rate as FXRate,
      transactions.description,
      round((CASE WHEN bankaccounts.Currency = "USD"
        THEN transactions.amount
                ELSE transactions.amount / fxrates.Rate
                END), 2) AS "Gain/Loss"
    FROM transactions
      INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
      INNER JOIN fxrates ON fxrates.FXDate = transactions.transdate
    WHERE transactions.category = 'gain/loss'
    '''

def sqlstocksprices():
    return '''

    SELECT
      stockprices.transdate,
      bankaccounts.Owner AS owner,
      fxrates.Rate       AS FXRate,
      stockprices.symbol,
      round((CASE WHEN bankaccounts.Currency = "USD"
        THEN stockprices.price
             ELSE stockprices.price / fxrates.Rate
             END), 2)    AS "Price"
    FROM stockprices
      INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
      INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
    WHERE symbol != 'MoneyMarket'
    ORDER BY stockprices.transdate
    '''


def FXquery():
    return '''

    SELECT
      T2.transdate,
      T2.Owner,
      T2.Currency,
      T3."Native Amount",
      T3."USD Amount",
      T3."CAD Amount",
      T2.Rate
    FROM
      (SELECT DISTINCT
         date(datestable.transdate) AS transdate,
         bankaccounts.Owner         AS Owner,
         bankaccounts.Currency      AS Currency,
         fxrates.Rate               AS Rate
       FROM datestable, bankaccounts
         INNER JOIN fxrates ON datestable.transdate = fxrates.FXDate
       WHERE (date(datestable.transdate) = date(datestable.transdate, 'start of month', '+1 month', '-1 day') OR
              date(datestable.transdate) = current_date) AND date(datestable.transdate) <= current_date) AS T2
      LEFT JOIN
      (SELECT
         date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS Date,
         bankaccounts.Owner,
         bankaccounts.Currency,
         round(sum(transactions.amount), 2)                                   AS "Native Amount",
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2)                                                   AS "USD Amount",
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount * FX1.Rate
                   ELSE transactions.amount
                   END), 2)                                                   AS "CAD Amount"

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
         LEFT JOIN categories ON transactions.category = categories.Category
       GROUP BY date(transactions.transdate, 'start of month', '+1 month', '-1 day'), bankaccounts.Owner, bankaccounts.Currency) AS T3

        ON T2.transdate = T3.Date AND T2.Currency = T3.Currency AND T2.Owner = T3.Owner
        order by T2.transdate;
    '''


def spendingQuery():
    return '''

    SELECT
      T1.Date,
      T1.Owner,
      T1.Category1 as Category,
      T1."USD Amount",
      T1."CAD Amount"
    FROM
      (SELECT
         date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS Date,
         bankaccounts.Owner,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2)                                                   AS "USD Amount",
        round(sum(CASE WHEN bankaccounts.Currency = "CAD"
           THEN transactions.amount
                   ELSE transactions.amount * FX1.Rate
                   END), 2)                                                   AS "CAD Amount",

         CASE WHEN transactions.category = "gain/loss"
           THEN
             "Investment"
         WHEN transactions.category = "Dividends & Cap Gains"
           THEN
             "Investment"
         WHEN transactions.category = "Fee"
           THEN
             "Investment"
         ELSE
           "Spending"
         END                                                                  AS Category1

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
       GROUP BY date(transactions.transdate, 'start of month', '+1 month', '-1 day'), bankaccounts.Owner, Category1) AS T1
      INNER JOIN fxrates AS FX2 ON date(FX2.FXDate) = date(T1.Date)

    '''


def sqlStockTable():
    return '''

    SELECT
      T2.transdate,
      T2.owner,
      T1.FXRate,
      t1.symbol AS Symbol,
      T2.shares,
      T2."Last Price",
      T2."Change",
      T2."Day's Gain",
      T1."Total Gain/Loss"
    FROM
      (SELECT
         max(transactions.transdate),
         bankaccounts.Owner       AS owner,
         (fxrates.Rate)           AS FXRate,
         transactions.description AS symbol,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / fxrates.Rate
                   END), 2)       AS "Total Gain/Loss"
       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates ON fxrates.FXDate = transactions.transdate
       WHERE transactions.category = 'gain/loss' AND date(transactions.transdate) <= date('2015-09-14')
       GROUP BY bankaccounts.Owner, transactions.description
       ORDER BY transactions.transdate
         DESC) AS T1
      INNER JOIN
      (SELECT
         stockprices.transdate,
         bankaccounts.Owner              AS owner,
         fxrates.Rate                    AS FXRate,
         stockprices.symbol,
         round(stockprices.numshares, 4) AS Shares,
         round((CASE WHEN bankaccounts.Currency = "USD"
           THEN stockprices.price
                ELSE stockprices.price / fxrates.Rate
                END), 2)                 AS "Last Price",
         round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice)
                ELSE (stockprices.price - stockprices.prevprice) / fxrates.Rate
                END), 2)                 AS "Change",
         round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice) * stockprices.numshares
                ELSE (stockprices.price - stockprices.prevprice) * stockprices.numshares / fxrates.Rate
                END), 2)                 AS "Day's Gain"
       FROM stockprices
         INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
         INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
       WHERE symbol != 'MoneyMarket'
       GROUP BY bankaccounts.Owner, stockprices.symbol
       ORDER BY stockprices.transdate
         DESC) AS T2
        ON T1.symbol = T2.symbol AND T1.owner = T2.owner
    '''

def sqlSumStockTable():
    return '''

    SELECT
      T2.transdate,
      T2.owner,
      T1.FXRate,
      T2."Day's Gain",
      T1."Total Gain/Loss"
    FROM
      (SELECT
         max(transactions.transdate),
         bankaccounts.Owner       AS owner,
         (fxrates.Rate)           AS FXRate,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / fxrates.Rate
                   END), 2)       AS "Total Gain/Loss"
       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates ON fxrates.FXDate = transactions.transdate
       WHERE transactions.category = 'gain/loss' AND date(transactions.transdate) <= date('2015-09-14')
       GROUP BY bankaccounts.Owner
       ORDER BY transactions.transdate
         DESC) AS T1
      INNER JOIN
      (SELECT
         stockprices.transdate,
         bankaccounts.Owner              AS owner,
         fxrates.Rate                    AS FXRate,
         stockprices.symbol,
         round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice) * stockprices.numshares
                ELSE (stockprices.price - stockprices.prevprice) * stockprices.numshares / fxrates.Rate
                END), 2)                 AS "Day's Gain"
       FROM stockprices
         INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
         INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
       WHERE symbol != 'MoneyMarket'
       GROUP BY bankaccounts.Owner
       ORDER BY stockprices.transdate
         DESC) AS T2
        ON T1.owner = T2.owner
    '''



def sqlSumStockData():
    return '''

    SELECT
      stockprices.transdate,
      bankaccounts.Owner AS owner,
      fxrates.Rate       AS FXRate,
      stockprices.symbol,
      round((CASE WHEN bankaccounts.Currency = "USD"
        THEN stockprices.price
             ELSE stockprices.price / fxrates.Rate
             END), 2)    AS "Price"
    FROM stockprices
      INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
      INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
    WHERE symbol != 'MoneyMarket' and date(stockprices.transdate) >= date(current_date,'-3 month')
    ORDER BY stockprices.transdate
    '''


def sqlSumStockOriginalData():
    return '''

    SELECT
      stockprices.transdate,
      bankaccounts.Owner AS owner,
      fxrates.Rate       AS FXRate,
      stockprices.symbol,
      round((CASE WHEN bankaccounts.Currency = "USD"
        THEN stockprices.price
             ELSE stockprices.price / fxrates.Rate
             END), 2)    AS "Price"
    FROM stockprices
      INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
      INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
    WHERE symbol != 'MoneyMarket' and date(stockprices.transdate) >= date(current_date,'-3 month')
    ORDER BY stockprices.transdate
    '''


def sqlSumSpendTable():
    return '''

    SELECT
      T1.monthdate AS transdate,
      T1.Owner,
      FX2.Rate,
      min(T1.Spend, 5750),
      max(5750 - T1.Spend, 0) as Budget,
      max(0, T1.Spend - 5750) as Remaining

    FROM
      (SELECT
         date(transactions.transdate, 'start of month', '+1 month', '-1 day') AS monthdate,
         bankaccounts.Owner,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2) * -1                                              AS "Spend"

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
         INNER JOIN categories ON categories.Category = transactions.category
       WHERE monthdate >= date(current_date, '-6 month') AND categories.Spending
       GROUP BY monthdate, bankaccounts.Owner) AS T1
      INNER JOIN fxrates AS FX2 ON monthdate = date(FX2.FXDate)
    '''
    # AND bankaccounts.JointColumn = "Joint"

def sqlowners():
    return '''

    select distinct bankaccounts.Owner
      from bankaccounts
    '''