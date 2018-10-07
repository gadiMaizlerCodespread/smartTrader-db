import mysql from 'mysql';
import logger from 'logger';
const SCHEMA_NAME = 'smartTrader';
import { exchangeIds } from './exchangeIds';
import { Notifications, NotificationsString }  from  './notifications';


// connection.query('show tables', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });

// connection.end();


class MysqlClient {
  constructor() {
    this.loggedInExchanges = {};
    this.loggedInExchangesStr = '';

    this.connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : '1234',
      database : SCHEMA_NAME
    });
    this.connection.connect();
  }

  writeNotificationEvent(notificationTypeId, event) {

    const exchangeOrderId = event.exchangeOrderId ? event.exchangeOrderId : '-1';
    const amount = event.amount ? event.amount : '0';
    const price = event.price ? event.price : '0';
    const ask = event.ask ? event.ask : '0';
    const bid = event.bid ? event.bid : '0';
    const balance1 = event.balance1 ? event.balance1 : '0';
    const balance2 = event.balance2 ? event.balance2 : '0';
    const errorCode = event.errorCode ? event.errorCode : '-1';
    const errorMessage =  event.errorMessage   ? '"' + event.errorMessage + '"' : '""';


    // requestId, exchangeOrderId, notificationTypeId, amount, price, exchangeId, ask, bid, balance1, balance2, errorCode, errorMessage, eventTimeStamp
    this.connection.query('insert into orderNotifications VALUE (\''
    + event.requestId +    '\',\''
    + exchangeOrderId +    '\','
    + notificationTypeId +   ','
    + amount + ','
    + price +        ','
    + exchangeIds[event.exchange] + ','
    + ask +     ','
    + bid +     ','
    + balance1 +     ','
    + balance2 +     ','
    + errorCode + ','
    + errorMessage + ',\''
    + event.eventTimeStamp +  '\');'

    , function (error, results, fields) {
      if (error) {
        logger.error('could not write to database err = ' + error);
        throw error;
      }
      // logger.debug('order written to db');
    });
  }

  // userId, requestId, orderTypeId, amount, price, currencyPair, loggedInExchangeIds, periodMinutes, maxSizePerTransaction, eventTimeStamp
  writeOrderEvent(orderTypeId, event) {

    if (Number(event.key) === Notifications.SuccessfullyLoggedInToExchange) // managing the loggen in excahnges , maybe we should move it to dbwrapper
    {
      let i = 0;
      let found = false;
      for (i = 0; i < this.loggedInExchanges.length; ++i)
      {
        if (this.loggedInExchanges[i] ===  exchangeIds[event.exchange])
        {
          found = true;
          break;
        }
      }
      if (found === false)
      {
        this.loggedInExchanges.push(exchangeIds[event.exchange]);
        this.loggedInExchangesStr = this.loggedInExchanges.join();
      }
    }

    event.loggedInExchangeIds = this.loggedInExchangesStr;



    const amount = event.amount ? event.amount : '0';
    const price = event.price ? event.price : '0';
    const currencyPair = event.currencyPair ? '"' + event.currencyPair + '"' : '""';
    const loggedInExchangeIds = event.loggedInExchangeIds ? '"' + event.loggedInExchangeIds + '"' : '""';
    const periodMinutes = event.periodMinutes ? event.periodMinutes : '0';
    const maxSizePerTransaction = event.maxSizePerTransaction ? event.maxSizePerTransaction : '0';

    this.connection.query('insert into userOrders VALUE (\''
    + event.userId +       '\',\''
    + event.requestId +    '\','
    + orderTypeId +        ','
    + amount +             ','
    + price +        ','
    + currencyPair + ','
    + loggedInExchangeIds + ','
    + periodMinutes + ','
    + maxSizePerTransaction + ',\''
    + event.eventTimeStamp +  '\');'

    , function (error, results, fields) {
      if (error) {
        logger.error('could not write to database err = ' + error);
        throw error;
      }
      // logger.debug('order written to db');
    });
  }
}

export default MysqlClient;

