__author__ = 'emmaachberger'

import gviz_api

def table_of_dates(y, m, d, t):
### create dataframe of dates from inception until today. returns resulting dataframe

    import pandas as pd
    import datetime

    start_date = datetime.date(y,m,d)

    index = pd.date_range(start=start_date, end=datetime.datetime.today()+datetime.timedelta(days=400), freq=t)

    df = pd.DataFrame(index=index)
    df.reset_index(inplace=True)
    df.columns = ['transdate']
    return df



def convert(native, curr, fx):
### returns USD amount if USD and converts to CAD if otherwise

    if curr == "USD":
        return native
    else:
        return native / fx


def returnTable(df):
# returns list of table columns and data to be sent to google charts

    def getcolumntype(argument):
        switcher = {
            'datetime64[ns]': "Date",
            'object': "string",
            'float64': "number",
            'int64': "number"
        }
        return switcher.get(argument, "string")

    cols = []
    for i in (df.columns):
        cols.append((i, getcolumntype(str(df[i].dtype))))

    data = df.values.tolist()

    data_table = gviz_api.DataTable(cols)
    data_table.LoadData(data)

    return data_table.ToJSon()


def droplevel(df, col1='transdate', col2='owner', col3='fxrate'):
    # for pivoted dataframes. Will drop level of column titles and replace first 3 columns

    df.columns = df.columns.droplevel()
    names = df.columns.tolist()
    names[0:3] = [col1, col2, col3]
    df.columns = names
    return df



def cprof(func, *args, **kwargs):

    import cProfile
    import pstats

    def func_wrapper(*args, **kwargs):

        print 1

        cProfile.run(func.__name__, 'restats')
        p = pstats.Stats('restats')
        p.sort_stats('cumulative').print_stats(10)

    return func_wrapper


import time

timeiteration = 0


def timerfunc(func, *args):

    global timeiteration

    start = time.time()
    timeiteration += 1

    returnvalue = func(*args)

    print timeiteration, func.__name__, "%.5f" % (time.time() - start) + " sec"

    return returnvalue


def timermultifunc(func, *args):

    for i in func:
        timerfunc(i, *args)

