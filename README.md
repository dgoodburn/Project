# JOYNT

![Alt text](https://github.com/dgoodburn/Project/blob/master/Demo_Screenshot.png "Demo")

JOYNT is a Personal Finance Dashboard to give people visibility into accounts in multiple currencies. Its main goals are to:
- consolidate accounts/investments in all currencies;
- incorporate non-Bank data and historical data, including any accrual transactions;
- aggregate accounts for multiple people (couples and families);
- provide visibility into different sources of income: spending/investments/FX changes;
- provide budgeting and stock performance analysis


---

To install from terminal:

Use Python2, not Python3, since google-visualization-python only works with 2.

$ virtualenv Joynt # ("pip install virtualenv" if you don't already have it)  
$ source Joynt/bin/activate  
$ cd Joynt  
$ git clone https://github.com/dgoodburn/Project.git  
$ cd Project  
$ pip install -r requirements.txt  
$ python main.py  
$ python application.py  


http://localhost:5000/
