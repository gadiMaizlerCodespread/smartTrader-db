import { Notifications, exchangeIds, actionTypes }  from  'smart-trader-common';


class MysqlClient {
  constructor({ connection, logger, moment, queryTypes }) {
    this.loggedInExchanges = {};
    this.loggedInExchangesStr = '';
    this.connection = connection;
    this.logger = logger;
    this.moment = moment;
    this.queryTypes = queryTypes;
    this.exchangeDic = {};

    this.connection.query('select * from exchanges', function (error, results, fields) {
      for (const exchange of results) {
        this.exchangeDic[exchange.exchangeId] = exchange.exchangeType;
      }
    }.bind(this));
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
    }.bind(this));
  }

  // userId, requestId, orderTypeId, size, price, currencyPair, loggedInExchangeIds, periodMinutes, maxSizePerTransaction, eventTimeStamp
  writeOrderEvent(orderTypeId, event) {

    const size = event.size ? ('\'%f\'',event.size) : null;
    const price = event.price ? ('\'%f\'',event.price) : null;
    const assetPair = event.assetPair ? `"${event.assetPair}"` : null;
    const exchanges = event.exchanges ? event.exchanges : null;
    const durationMinutes = event.durationMinutes ? ('\'%d\'',event.durationMinutes) : null;
    const maxOrderSize = event.maxOrderSize ?  ('\'%d\'', event.maxOrderSize)  : null;
    const userId       = event.userId ?  `"${event.userId}"` : null;


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
                          ${userId},'${event.account}','${event.requestId}'
                          ,'${orderTypeId}',${size},
                          ${price},${assetPair},'${usedExchanges}',
                          ${durationMinutes},${maxOrderSize},'${event.eventTimeStamp}', ${actionTypes[event.actionType]});`

    , function (error, results, fields) {
      if (error) {
        this.logger.error('could not write to database err = %s', error);
        throw error;
      }
      this.logger.debug('order written to db');
    }.bind(this));
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

  query(filters, type, id, cb) {

    const startDate = this.moment(filters.startDate).format('YYYY-MM-DD HH:mm:ss');
    const endDate = this.moment(filters.endDate).format('YYYY-MM-DD HH:mm:ss');

    const accountFilter = (filters.accountName) ?  'and ( accountName = \'' +  filters.accountName + '\')' : '';
    const detailed = filters.detailed ? true : false;

    let size = '';
    if (filters.size) {
      size = 'limit ' + filters.size;
      if (filters.index) {
        size += ',' + (filters.index * filters.size);
      }
    }

    if (type === this.queryTypes.listTrades) {
      this.queryListTrades({ startDate, endDate, accountFilter, size, id, detailed , cb });
    }
    else if(type === this.queryTypes.listOrders) {
      this.queryListOrders({ startDate, endDate, accountFilter, size, id , cb });
    }

  }

  sendNotificationsQueryAndFillAns(listToFill, orderAns, detailed, cb) {
    this.connection.query(`select * from orderNotifications where requestId = '${orderAns.requestId}';`, function (error, results, fields) {
      let objToFill = {};
      objToFill['account'] = orderAns.accountName;
      objToFill['startTime'] = orderAns.eventTimeStamp;
      objToFill['tradeOrderId'] = orderAns.requestId;
      objToFill['requestedSize'] = orderAns.size;
      objToFill['requestedPrice'] = orderAns.price;

      if (results[results.length - 1].notificationTypeId === Notifications.Finished) {
        objToFill['status'] = 'Done';
        objToFill['executionSize'] = results[results.length - 1].size;
        objToFill['executedTargetSize'] = results[results.length - 1].size * results[results.length - 1].price;

      }
      else  {
        objToFill['status'] = 'In-Progress';
        let size = 0;
        let price = 0;
        for (const notification of results) {
          if (notification.notificationTypeId === Notifications.Update) {
            size += notification.size;
            price += notification.price * notification.size;
          }
        }
        objToFill['executionSize'] = size;
        objToFill['executedTargetSize']  = price;
      }
      if (detailed) {
        for (const notification of results) {
          if (notification.notificationTypeId === Notifications.Update) {
            if (!objToFill.exchangeOrders) {
              objToFill['exchangeOrders'] = [];
            }
            let notificationData = {};
            this.fillNotificationDetails(notificationData, notification);

            objToFill['exchangeOrders'].push(notificationData);
          }
        }

      }
      let startTs = new Date(orderAns.eventTimeStamp);
      let lastTs =  new Date(results[results.length - 1].eventTimeStamp);
      objToFill['elapsedTimeMinutes']  =  (lastTs.getTime() - startTs.getTime()) / 60000   ;

      listToFill.push(objToFill);
      cb();
    }.bind(this));
  }

  queryListTrades({ startDate, endDate, accountFilter, size, id,detailed , cb }) {
    this.connection.query(`select * from userOrders where (eventTimeStamp between '${startDate}' and '${endDate}') ${accountFilter} ${size};`
      , function (error, orderResults, fields) {
        if (error) {
          this.logger.error('could not write to database err = %s', error);
          throw error;
        }

        let itemsProcessed = 0;
        let answer = [];
        for (let item of orderResults) {

          this.sendNotificationsQueryAndFillAns(answer, item, detailed, () => {
            itemsProcessed++;
            if (itemsProcessed === orderResults.length) {
              cb(this.queryTypes.ListTrades , id, answer);
            }

          });
        }
      }.bind(this));
  }

  fillNotificationDetails(target, notification) {

    target['exchange'] = this.exchangeDic[notification.exchangeIds];
    target['size'] = notification.size;
    target['price'] = notification.price;
    target['exchangeOrderId'] = notification.exchangeOrderId;
    target['orderTime'] = notification.eventTimeStamp;
    target['currencyFromAvailable'] = notification.currencyFrom;
    target['currencyToAvailable'] = notification.currencyTo;
    target['ask'] = notification.ask;
    target['bid'] = notification.bid;
  }
  queryListOrders({ startDate, endDate, accountFilter, size, id , cb }) {
    let arrayOfOrders = [];
    this.connection.query(`select * from userOrders where (eventTimeStamp between '${startDate}' and '${endDate}') ${accountFilter} ${size};`
      , function (error, orderResults, fields) {

        let orders = {};
        for (const order of orderResults) {
          arrayOfOrders.push('\'' + order.requestId + '\'');
          orders[order.requestId] = order;
        }

        accountFilter = 'and requestId in (' + arrayOfOrders.join() + ')';

        this.connection.query(`select * from orderNotifications where (eventTimeStamp between '${startDate}' and '${endDate}') ${accountFilter} ${size};`
          , function (error, notificationResults, fields) {
            let answer = [];
            for (const notification of notificationResults) {
              if (notification.notificationTypeId === Notifications.Update) {
                const order = orders[notification.requestId];
                let answerItem = {};


                this.fillNotificationDetails(answerItem, notification);
                answerItem['status'] = 'Finished'; // when more statuses will be avalable , it will be shown;
                answerItem['account'] = order.account;
                answerItem['actionType'] = order.actionType;
                answerItem['assetPair'] = order.currencyPair;
                answer.push(answerItem);
              }
            }
            cb(this.queryTypes.ListOrders , id, answer);
          }.bind(this));
      }.bind(this));
  }
}


export default MysqlClient;

