import { Notifications, exchangeIds }  from  'smart-trader-common';


class MysqlClient {
  constructor({ connection, logger }) {
    this.loggedInExchanges = {};
    this.loggedInExchangesStr = '';
    this.connection = connection;
    this.logger = logger;
  }
  writeNotificationEvent(notificationTypeId, event) {

    const exchanges = event.exchanges ? event.exchanges : null;
    const exchangeOrderId = event.exchangeOrderId ? `"${event.exchangeOrderId}"`  : null;
    const size = event.size                   ? ('\'%f\'',event.size) : null;
    const price = event.price                     ? ('\'%f\'',event.price) : null;
    const ask = event.ask                         ? ('\'%f\'',event.ask) : null;
    const bid = event.bid                         ? ('\'%f\'',event.bid) : null;
    const currencyFrom = event.currencyFrom       ? ('\'%f\'',event.currencyFrom) : null;
    const currencyTo = event.currencyTo           ? ('\'%f\'',event.currencyTo) : null;
    const errorCode = event.errorCode             ? ('\'%d\'',event.errorCode) : null;
    const errorMessage =  event.errorMessage      ?   `"${event.errorMessage}"` : null;
    const sendingModule = event.sendingModule     ?  `"${event.sendingModule}"` : null;
    const actionType    = event.actionType        ?  `"${event.actionType}"` : null;

    let usedExchanges = '';
    if (exchanges) {
      let i = 0;
      for (i = 0; i < exchanges.length; i++ ) {
        usedExchanges += exchangeIds[exchanges[i]] + ',';
      }
      usedExchanges = usedExchanges.substring(0, usedExchanges.length - 1);
    }
    else {
      usedExchanges = null;
    }

    this.connection.query(`insert into orderNotifications VALUE (
                          '${event.requestId}',${exchangeOrderId},'${notificationTypeId}'
                          ,${size},${price},'${usedExchanges}',${ask}
                          ,${bid},${currencyFrom},${currencyTo},${errorCode}
                          ,${errorMessage},'${event.eventTimeStamp}',${sendingModule},${actionType});`
    , function (error, results, fields) {
      if (error) {
        this.logger.error('could not write to database err = %s', error);
        throw error;
      }
      this.logger.debug('order written to db');
    });
  }

  // userId, requestId, orderTypeId, size, price, currencyPair, loggedInExchangeIds, periodMinutes, maxSizePerTransaction, eventTimeStamp
  writeOrderEvent(orderTypeId, event) {




    const size = event.size ? ('\'%f\'',event.size) : null;
    const price = event.price ? ('\'%f\'',event.price) : null;
    const currencyPair = event.currencyPair ? `"${event.currencyPair}"` : null;
    const exchanges = event.exchanges ? event.exchanges : null;
    const durationMinutes = event.durationMinutes ? ('\'%d\'',event.durationMinutes) : null;
    const maxOrderSize = event.maxOrderSize ?  ('\'%d\'', event.maxOrderSize)  : null;

    let usedExchanges = '';
    if (exchanges) {
      let i = 0;
      for (i = 0; i < exchanges.length; i++ ) {
        usedExchanges += exchangeIds[exchanges[i]] + ',';
      }
      usedExchanges = usedExchanges.substring(0, usedExchanges.length - 1);
    }
    else {
      usedExchanges = null;
    }

    this.connection.query(`insert into userOrders VALUE (
                          '${event.userId}','${event.requestId}'
                          ,'${orderTypeId}',${size},
                          ${price},${currencyPair},'${usedExchanges}',
                          ${durationMinutes},${maxOrderSize},'${event.eventTimeStamp}');`

    , function (error, results, fields) {
      if (error) {
        this.logger.error('could not write to database err = %s', error);
        throw error;
      }
      this.logger.debug('order written to db');
    });
  }
  manageLoggedInExchanges(event) {

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
  }
}


export default MysqlClient;

