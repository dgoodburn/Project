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
      FROM stocktransactions) AS T1
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
         LAST_DAY(transactions.transdate) AS Date,
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
       GROUP BY LAST_DAY(transactions.transdate), bankaccounts.Owner) AS T1
      INNER JOIN fxrates AS FX2 ON T1.Date = date(FX2.FXDate)
    ORDER BY T1.Date
    '''


def sqltotalbalances():
    return '''

    SELECT
      bankaccounts.AccountName,
      T1.accountname as MintAccountName,
      bankaccounts.Owner as Owner,
      bankaccounts.Currency as Currency,
      SUM(TR2.amount) as amount,
      datestable.transdate,
      fxrates.Rate
    FROM (
           SELECT
             TR1.accountname,
             MIN(TR1.transdate) AS Earliest
           FROM transactions TR1
           GROUP BY TR1.accountname) T1
      INNER JOIN datestable ON T1.Earliest <= datestable.transdate
      INNER JOIN bankaccounts ON bankaccounts.MintAccountName = T1.accountname
      INNER JOIN fxrates ON fxrates.FXDate = datestable.transdate
      LEFT JOIN transactions TR2 ON TR2.transdate = datestable.transdate AND TR2.accountname = T1.accountname
    GROUP BY bankaccounts.AccountName, T1.accountname, bankaccounts.Owner, bankaccounts.Currency, datestable.transdate,
      fxrates.Rate;
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
    WHERE date(balances.transdate) = LAST_DAY(balances.transdate) OR
        date(balances.transdate) = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
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
    WHERE balances.transdate = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) OR balances.transdate = date(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    GROUP BY balances.transdate, balances.owner, balances.Rate
    ORDER BY balances.transdate
    DESC
    '''


def sqlcurrentbalancebyaccount():
    return '''
    SELECT
      B1.transdate   AS transdate,
      B1.owner       AS owner,
      B1.Rate        AS FXRate,
      B1.AccountName AS AccountName,
      B2.USDAmount   AS balance,
      B1.USDAmount   AS priorbalance
    FROM balances B1
      INNER JOIN balances B2
        ON date(B1.transdate) = date(DATE_SUB(B2.transdate, INTERVAL 1 MONTH)) AND B1.AccountName = B2.AccountName
    WHERE date(B1.transdate) = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) OR date(B1.transdate) = date(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    ORDER BY B2.USDAmount DESC
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
    where bankaccounts.AccountType2 != "Investment" AND transactions.transdate <= CURRENT_DATE() %s
    ORDER BY transactions.transdate
      DESC
    LIMIT %s offset %s
    '''


def sqlbudget():
    return '''

    SELECT
      T2.Date1              AS transdate,
      T2.Owner1             AS Owner,
      fxrates.Rate          AS FXRate,
      T2.Category1          AS Category,
      T2.Budget1            AS Budget,
      ifnull(T2.amount2, 0) AS Actual
    FROM
      (SELECT DISTINCT
         LAST_DAY(datestable.transdate) AS Date1,
         budget.owner                   AS Owner1,
         budget.categoryname            AS Category1,
         budget.amount                  AS Budget1,
         T1.amount2
       FROM datestable
         INNER JOIN budget

         LEFT JOIN (
                     SELECT
                       LAST_DAY(transactions.transdate) AS Date2,
                       bankaccounts.Owner               AS Owner2,
                       transactions.category            AS Category2,
                       sum(transactions.amount) * -1    AS amount2
                     FROM
                       transactions
                       INNER JOIN bankaccounts ON bankaccounts.MintAccountName = transactions.accountname
                     WHERE LAST_DAY(transactions.transdate) = LAST_DAY(current_date)
                     GROUP BY transactions.category, bankaccounts.Owner, Date2) AS T1
           ON T1.Date2 = LAST_DAY(datestable.transdate) AND budget.owner = T1.Owner2 AND budget.categoryname = T1.Category2
       WHERE LAST_DAY(datestable.transdate) = last_day(current_date)) AS T2
      INNER JOIN fxrates ON date(fxrates.FXDate) = T2.Date1;
    '''


def sqloverallbudget():
    return '''

    SELECT
      T2.Date1                   AS transdate,
      T2.Owner1                  AS Owner,
      fxrates.Rate               AS FXRate,
      sum(T2.Budget1)            AS Budget,
      sum(ifnull(T2.amount2, 0)) AS Actual
    FROM
      (SELECT DISTINCT
         LAST_DAY(datestable.transdate) AS Date1,
         budget.owner                   AS Owner1,
         budget.categoryname            AS Category1,
         budget.amount                  AS Budget1,
         T1.amount2
       FROM datestable
         INNER JOIN budget

         LEFT JOIN (
                     SELECT
                       LAST_DAY(transactions.transdate) AS Date2,
                       bankaccounts.Owner               AS Owner2,
                       transactions.category            AS Category2,
                       sum(transactions.amount) * -1    AS amount2
                     FROM
                       transactions
                       INNER JOIN bankaccounts ON bankaccounts.MintAccountName = transactions.accountname
                     WHERE LAST_DAY(transactions.transdate) = LAST_DAY(current_date)
                     GROUP BY transactions.category, bankaccounts.Owner, LAST_DAY(transactions.transdate)) AS T1
           ON T1.Date2 = LAST_DAY(datestable.transdate) AND budget.owner = T1.Owner2 AND budget.categoryname = T1.Category2
       WHERE LAST_DAY(datestable.transdate) = LAST_DAY(current_date)) AS T2
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
      T3.NativeAmount AS "Native Amount",
      T3.USDAmount AS "USD Amount",
      T3.CADAmount AS "CAD Amount",
      T2.Rate
    FROM
      (SELECT DISTINCT
         (datestable.transdate) AS transdate,
         bankaccounts.Owner         AS Owner,
         bankaccounts.Currency      AS Currency,
         fxrates.Rate               AS Rate
       FROM datestable CROSS JOIN bankaccounts
         INNER JOIN fxrates ON datestable.transdate = fxrates.FXDate
       WHERE ((datestable.transdate) = LAST_DAY(datestable.transdate) OR
              (datestable.transdate) = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE))) AS T2
      LEFT JOIN
      (SELECT
         LAST_DAY(transactions.transdate) AS Date,
         bankaccounts.Owner,
         bankaccounts.Currency,
         round(sum(transactions.amount), 2)                                   AS NativeAmount,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2)                                                   AS USDAmount,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount * FX1.Rate
                   ELSE transactions.amount
                   END), 2)                                                   AS CADAmount

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
         LEFT JOIN categories ON transactions.category = categories.Category
       GROUP BY LAST_DAY(transactions.transdate), bankaccounts.Owner, bankaccounts.Currency) AS T3
        ON T2.transdate = T3.Date AND T2.Currency = T3.Currency AND T2.Owner = T3.Owner
        order by T2.transdate;
    '''


def spendingQuery():
    return '''

    SELECT
      T1.Date,
      T1.Owner,
      T1.Category1 as Category,
      T1.USDAmount as "USD Amount",
      T1.CADAmount AS "CAD Amount"
    FROM
      (SELECT
         LAST_DAY(transactions.transdate) AS Date,
         bankaccounts.Owner,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2)                                                   AS "USDAmount",
        round(sum(CASE WHEN bankaccounts.Currency = "CAD"
           THEN transactions.amount
                   ELSE transactions.amount * FX1.Rate
                   END), 2)                                                   AS "CADAmount",

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
       GROUP BY LAST_DAY(transactions.transdate), bankaccounts.Owner, Category1) AS T1
      INNER JOIN fxrates AS FX2 ON date(FX2.FXDate) = date(T1.Date)

    '''


def sqlStockTable():
    return '''

    SELECT
      T2.transdate,
      T2.owner,
      FX2.Rate,
      T1.symbol AS Symbol,
      T2.shares,
      T2.LastPrice As "Last Price",
      T2.Change,
      T2.DaysGain as "Day's Gain",
      T1.TotalGain as "Total Gain/Loss"
    FROM
      (SELECT
         max(transactions.transdate),
         bankaccounts.Owner       AS owner,
         transactions.description AS symbol,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX3.Rate
                   END), 2)       AS "TotalGain"
       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates FX3 ON FX3.FXDate = transactions.transdate
       WHERE transactions.category = 'gain/loss' AND date(transactions.transdate) <= CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
       GROUP BY bankaccounts.Owner, transactions.description) AS T1
      INNER JOIN
      (SELECT
         current_date as transdate,
         bankaccounts.Owner              AS owner,
         stockprices.symbol,
         sum(round(stockprices.numshares, 4)) AS Shares,
         sum(round((CASE WHEN bankaccounts.Currency = "USD"
           THEN stockprices.price
                ELSE stockprices.price / FX1.Rate
                END), 2)     )            AS "LastPrice",
         sum(round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice)
                ELSE (stockprices.price - stockprices.prevprice) / FX1.Rate
                END), 2))                 AS "Change",
         sum(round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice) * stockprices.numshares
                ELSE (stockprices.price - stockprices.prevprice) * stockprices.numshares / FX1.Rate
                END), 2))                 AS DaysGain
       FROM stockprices
         INNER JOIN fxrates FX1 ON (FX1.FXDate) = (stockprices.transdate)
         INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
       WHERE symbol != 'MoneyMarket' AND date(stockprices.transdate) = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
       GROUP BY bankaccounts.Owner, stockprices.symbol) AS T2
        ON T1.symbol = T2.symbol AND T1.owner = T2.owner
      INNER JOIN fxrates FX2 on T2.transdate = FX2.FXDate
    '''


def sqlSumStockTable2():
    return '''

    SELECT
      T1.transdate,
      T2.owner,
      FX2.Rate,
      T2.DaysGain  AS "Day's Gain",
      T1.TotalGain AS 'Total Gain/Loss'
    FROM
      (SELECT
         CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) as transdate,
         bankaccounts.Owner AS owner,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2) AS TotalGain
       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates FX1 ON FX1.FXDate = transactions.transdate
       WHERE transactions.category = 'gain/loss' AND date(transactions.transdate) <= CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
       GROUP BY bankaccounts.Owner) AS T1
      INNER JOIN
      (SELECT
         bankaccounts.Owner   AS owner,
         sum(round((CASE WHEN bankaccounts.Currency = "USD"
           THEN (stockprices.price - stockprices.prevprice) * stockprices.numshares
                    ELSE (stockprices.price - stockprices.prevprice) * stockprices.numshares / fxrates.Rate
                    END), 2)) AS DaysGain
       FROM stockprices
         INNER JOIN fxrates ON (fxrates.FXDate) = (stockprices.transdate)
         INNER JOIN bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
       WHERE symbol != 'MoneyMarket' AND stockprices.transdate = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
       GROUP BY bankaccounts.Owner) AS T2
        ON T1.owner = T2.owner
        INNER JOIN fxrates FX2 on t1.transdate = FX2.FXDate
    '''

def sqlSumStockTable():
    return '''
    SELECT
      S1.transdate,
      S1.owner,
      FX2.Rate,
      S1.DaysGain  AS 'Day''s Gain',
      S1.TotalGain AS 'Total Gain/Loss'
    FROM (
           SELECT
             T1.transdate,
             T2.owner,
             T2.DaysGain,
             T1.TotalGain
           FROM
             (SELECT
                CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) AS transdate,
                bankaccounts.Owner                                            AS owner,
                round(sum(CASE WHEN bankaccounts.Currency = "USD"
                  THEN transactions.amount
                          ELSE transactions.amount / FX1.Rate
                          END), 2)                                            AS TotalGain
              FROM money.transactions
                INNER JOIN money.bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
                INNER JOIN money.fxrates FX1 ON FX1.FXDate = transactions.transdate
              WHERE transactions.category = 'gain/loss' AND
                    date(transactions.transdate) <= CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
              GROUP BY bankaccounts.Owner) AS T1
             INNER JOIN
             (SELECT
                bankaccounts.Owner   AS owner,
                sum(round((CASE WHEN bankaccounts.Currency = "USD"
                  THEN (stockprices.price - stockprices.prevprice) * stockprices.numshares
                           ELSE (stockprices.price - stockprices.prevprice) * stockprices.numshares / fxrates.Rate
                           END), 2)) AS DaysGain
              FROM money.stockprices
                INNER JOIN money.fxrates ON (fxrates.FXDate) = (stockprices.transdate)
                INNER JOIN money.bankaccounts ON stockprices.accountname = bankaccounts.MintAccountName
              WHERE symbol != 'MoneyMarket' AND
                    stockprices.transdate = CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE)
              GROUP BY bankaccounts.Owner) AS T2
               ON T1.owner = T2.owner) AS S1
      INNER JOIN money.fxrates FX2 ON S1.transdate = FX2.FXDate;
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
    WHERE symbol != 'MoneyMarket' and date(stockprices.transdate) >= date(DATE_SUB(NOW(), INTERVAL 3 MONTH))
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
    WHERE symbol != 'MoneyMarket' and date(stockprices.transdate) >= date(DATE_SUB(NOW(), INTERVAL 3 MONTH))
    ORDER BY stockprices.transdate
    '''


def sqlSumSpendTable2():  ## removed because it is very slow but has FX rate
    return '''

    SELECT
      T1.monthdate                 AS transdate,
      FX2.Rate,
      "Joint" as Owner,
      LEAST(T1.Spend, 5700),
      GREATEST(5700 - T1.Spend, 0) AS Budget,
      GREATEST(0, T1.Spend - 5700) AS Remaining

    FROM
      (SELECT
         LAST_DAY(transactions.transdate) AS monthdate,
         round(sum(CASE WHEN bankaccounts.Currency = "USD"
           THEN transactions.amount
                   ELSE transactions.amount / FX1.Rate
                   END), 2) * -1          AS "Spend"

       FROM transactions
         INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
         INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
         INNER JOIN categories ON categories.Category = transactions.category
       WHERE transactions.transdate <= CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) AND LAST_DAY(transactions.transdate) >= date(DATE_SUB(NOW(), INTERVAL 18 MONTH)) AND categories.Spending
       GROUP BY LAST_DAY(transactions.transdate)) AS T1
      INNER JOIN fxrates AS FX2 ON monthdate = date(FX2.FXDate)
    '''
    # AND bankaccounts.JointColumn = "Joint"


def sqlSumSpendTable():
    return '''

    SELECT
      LAST_DAY(transactions.transdate)            AS transdate,
      1                                           AS Rate,
      "Joint"                                     AS Owner,
      LEAST(round(sum(CASE WHEN bankaccounts.Currency = "USD"
        THEN transactions.amount
                      ELSE transactions.amount / FX1.Rate
                      END), 2) * -1, 5700),
      GREATEST(5700 - round(sum(CASE WHEN bankaccounts.Currency = "USD"
        THEN transactions.amount
                                ELSE transactions.amount / FX1.Rate
                                END), 2) * -1, 0) AS Budget,
      GREATEST(0, round(sum(CASE WHEN bankaccounts.Currency = "USD"
        THEN transactions.amount
                            ELSE transactions.amount / FX1.Rate
                            END), 2) * -1 - 5700) AS Remaining
    FROM transactions
      INNER JOIN bankaccounts ON transactions.accountname = bankaccounts.MintAccountName
      INNER JOIN fxrates AS FX1 ON transactions.transdate = FX1.FXDate
      INNER JOIN categories ON categories.Category = transactions.category
    WHERE transactions.transdate <= CAST(CONVERT_TZ(current_date(), 'UTC', 'US/Pacific') AS DATE) AND
          LAST_DAY(transactions.transdate) >= date(DATE_SUB(NOW(), INTERVAL 18 MONTH)) AND categories.Spending
    GROUP BY LAST_DAY(transactions.transdate);
    '''
    # AND bankaccounts.JointColumn = "Joint"


def sqlowners():
    return '''

    select distinct bankaccounts.Owner
      from bankaccounts
    '''


def sqlGoalChart2():
    return '''

    SELECT
      "Actual" as AccountName,
      date(balances.transdate) as transdate,
      balances.owner as owner,
      sum(balances.USDAmount) as balance,
      balances.Rate as FXRate
    FROM balances
    WHERE date(balances.transdate) = LAST_DAY(balances.transdate)
    GROUP BY balances.owner, date(balances.transdate), balances.Rate
    UNION
    SELECT
      "Goal" as AccountName,
      date(goal.transdate),
      "Dan" as owner,
      (goal.amount) as balance,
      fxrates.Rate as FXRate
    FROM goal
      INNER JOIN fxrates ON date(goal.transdate) = date(fxrates.FXDate)
      where date(goal.transdate) <= current_date
    '''


def sqlGoalChart():
    return '''

    SELECT
      "Actual" AS AccountName,
      T2.transdate,
      "Joint"           AS owner,
      round(sum(CASE WHEN T4.Currency = "USD"
        THEN T1.amount
          ELSE T1.amount / T3.Rate
          END),0) AS balance,
      1                 AS FXRate
    FROM datestable T2
      INNER JOIN transactions T1 ON T2.transdate >= T1.transdate
      INNER JOIN fxrates T3 ON T1.transdate = T3.FXDate
      INNER JOIN bankaccounts T4 ON T1.accountname = T4.MintAccountName
    WHERE T1.category != "gain/loss" AND T2.transdate = LAST_DAY(T2.transdate) AND T2.transdate <= CURRENT_DATE
    GROUP BY T2.transdate
    UNION ALL
    SELECT
      "Goal"            AS AccountName,
      date(goal.transdate),
      "Joint"           AS owner,
      round(goal.nofxamount,0) AS balance,
      1                 AS FXRate
    FROM goal
    WHERE date(goal.transdate) <= current_date
    ;
    '''
