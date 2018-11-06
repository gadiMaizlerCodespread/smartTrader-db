import mysql from 'mysql';
import logger from 'logger';
import { Notifications, exchangeIds }  from  'smart-trader-common';


class MysqlClient {
  constructor(config) {
    this.loggedInExchanges = {};
    this.loggedInExchangesStr = '';

    this.connection = mysql.createConnection({
      host     : config.mysqlHost,
      user     : config.mysqlUser,
      password : config.mysqlPassword,
      database : config.mysqlSchemaName
    });
    this.connection.connect();
  }

  writeNotificationEvent(notificationTypeId, event) {

    const exchangeOrderId = event.exchangeOrderId ? `"${event.exchangeOrderId}"`  : null;
    const amount = event.amount                   ? ('\'%f\'',event.amount) : null;
    const price = event.price                     ? ('\'%f\'',event.price) : null;
    const ask = event.ask                         ? ('\'%f\'',event.ask) : null;
    const bid = event.bid                         ? ('\'%f\'',event.bid) : null;
    const currencyFrom = event.currencyFrom       ? ('\'%f\'',event.currencyFrom) : null;
    const currencyTo = event.currencyTo           ? ('\'%f\'',event.currencyTo) : null;
    const errorCode = event.errorCode             ? ('\'%d\'',event.errorCode) : null;
    const errorMessage =  event.errorMessage      ?   `"${event.errorMessage}"` : null;
    const sendingModule = event.sendingModule     ?  `"${event.sendingModule}"` : null;


    this.connection.query(`insert into orderNotifications VALUE (
                          '${event.requestId}',${exchangeOrderId},'${notificationTypeId}'
                          ,${amount},${price},'${exchangeIds[event.exchange]}',${ask}
                          ,${bid},${currencyFrom},${currencyTo},${errorCode}
                          ,${errorMessage},'${event.eventTimeStamp}',${sendingModule});`
    , function (error, results, fields) {
      if (error) {
        logger.error('could not write to database err = %s', error);
        throw error;
      }
      logger.debug('order written to db');
    });
  }

  // userId, requestId, orderTypeId, amount, price, currencyPair, loggedInExchangeIds, periodMinutes, maxSizePerTransaction, eventTimeStamp
  writeOrderEvent(orderTypeId, event) {

    if (Number(event.key) === Notifications.SuccessfullyLoggedInToExchange) // managing the logged in exchanges , maybe we should move it to dbwrapper
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



    const amount = event.amount ? ('\'%f\'',event.amount) : null;
    const price = event.price ? ('\'%f\'',event.price) : null;
    const currencyPair = event.currencyPair ? `"${event.currencyPair}"` : null;
    const loggedInExchangeIds = event.loggedInExchangeIds ? `"${event.loggedInExchangeIds}"` : null;
    const periodMinutes = event.periodMinutes ? ('\'%d\'',event.periodMinutes) : null;
    const maxSizePerTransaction = event.maxSizePerTransaction ?  ('\'%d\'', event.maxSizePerTransaction)  : null;

    this.connection.query(`insert into userOrders VALUE (
                          '${event.userId}','${event.requestId}'
                          ,'${orderTypeId}',${amount},
                          ${price},${currencyPair},${loggedInExchangeIds},
                          ${periodMinutes},${maxSizePerTransaction},'${event.eventTimeStamp}');`

    , function (error, results, fields) {
      if (error) {
        logger.error('could not write to database err = %s', error);
        throw error;
      }
      logger.debug('order written to db');
    });
  }
}

export default MysqlClient;

