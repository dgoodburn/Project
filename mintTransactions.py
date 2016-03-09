__author__ = 'emmaachberger'

import json
import random
import time


from StringIO import StringIO

from datetime import datetime

import requests

from requests.adapters import HTTPAdapter
#from requests.packages.urllib3.poolmanager import PoolManager
from urllib3.poolmanager import PoolManager

try:
    import pandas as pd
except ImportError:
    pd = None


DATE_FIELDS = [
    'addAccountDate',
    'closeDate',
    'fiLastUpdated',
    'lastUpdated',
]


class MintHTTPSAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, **kwargs):
        self.poolmanager = PoolManager(num_pools=connections,
                                       maxsize=maxsize, **kwargs)


class Mint(requests.Session):
    json_headers = {'accept': 'application/json'}
    request_id = 42  # magic number? random number?
    token = None

    def __init__(self, email=None, password=None):
        requests.Session.__init__(self)
        self.mount('https://', MintHTTPSAdapter())
        if email and password:
            self.login_and_get_token(email, password)

    @classmethod
    def create(cls, email, password):  # {{{
        mint = Mint()
        mint.login_and_get_token(email, password)
        return mint

    @classmethod
    def get_rnd(cls):  # {{{
        return (str(int(time.mktime(datetime.now().timetuple())))
                + str(random.randrange(999)).zfill(3))

    @classmethod
    def parse_float(cls, string):  # {{{
        for bad_char in ['$', ',', '%']:
            string = string.replace(bad_char, '')

        try:
            return float(string)
        except ValueError:
            return None

    def login_and_get_token(self, email, password):  # {{{
        # 0: Check to see if we're already logged in.

        if self.token is not None:
            return

        # 1: Login.
        login_url = 'https://wwws.mint.com/login.event?task=L'
        if self.get(login_url).status_code != requests.codes.ok:
            raise Exception('Failed to load Mint login page')

        data = {'username': email}
        response = self.post('https://wwws.mint.com/getUserPod.xevent',
                             data=data, headers=self.json_headers).text

        data = {'username': email, 'password': password, 'task': 'L',
                'browser': 'firefox', 'browserVersion': '27', 'os': 'linux'}
        response = self.post('https://wwws.mint.com/loginUserSubmit.xevent',
                             data=data, headers=self.json_headers).text

        if 'token' not in response:
            raise Exception('Mint.com login failed[1]')

        response = json.loads(response)
        if not response['sUser']['token']:
            raise Exception('Mint.com login failed[2]')

        # 2: Grab token.
        self.token = response['sUser']['token']


    def get_transactions(self):
        if not pd:
            raise ImportError('transactions data requires pandas')

        result = self.get(
            'https://wwws.mint.com/transactionDownload.event',
            headers=self.headers
            )
        if result.status_code != 200:
            raise ValueError(result.status_code)
        if not result.headers['content-type'].startswith('text/csv'):
            raise ValueError('non csv content returned')

        s = StringIO(result.content)
        s.seek(0)
        df = pd.read_csv(s, parse_dates=['Date'])
        df.columns = [c.replace(' ', '_') for c in df.columns]
        #df.Category = (df.Category.str.replace('uncategorized', pd.np.nan))
        return df

    def initiate_account_refresh(self):
        # Submit refresh request.
        data = {
            'token': self.token
        }
        self.post('https://wwws.mint.com/refreshFILogins.xevent',
                  data=data, headers=self.json_headers)



def initiate_account_refresh(email, password):
    mint = Mint.create(email, password)
    return mint.initiate_account_refresh()





