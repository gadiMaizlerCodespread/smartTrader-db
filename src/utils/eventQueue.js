import logger from 'logger';
import { Notifications, NotificationsString }  from  './notifications';
import { orderTypesStr } from './orderTypes';
import MysqlClient from './mysqlClient';
import exchangeIds from './exchangeIds';

const kafka = require('kafka-node');

// globals - configurable
const ORDERS_TOPIC = 'orders';
const NOTIFICATIONS_TOPIC = 'notifications';

const PORT = '2181';
const URL = 'localhost';

let PARTITION = 0;

class EventQueue {
  constructor() {

    //  order  producer initialization
    const client1 = new kafka.Client(URL + ':' + PORT);
    const client2 = new kafka.Client(URL + ':' + PORT);
    // notification client
    // let notificationClient = new kafka.Client('localhost:2182');
    const notificationsTopic = [{ topic: NOTIFICATIONS_TOPIC, partition: PARTITION }];
    const ordersTopic = [{ topic: ORDERS_TOPIC, partition: PARTITION }];

    const options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };
    this.notificationsConsumer = new kafka.Consumer(client1, notificationsTopic, options);
    this.ordersConsumer =          new kafka.Consumer(client2, ordersTopic, options);

    this.offset1 = new kafka.Offset(client1);
    this.offset2 = new kafka.Offset(client2);


    const mysqlClient = new MysqlClient();

    this.notificationsConsumer.on('error', function (err) {
      logger.error('Kafka experienced an error - ' + err);
    });

    this.notificationsConsumer.on('offsetOutOfRange', function (topic) {
      topic.maxNum = 2;
      this.offset1.fetch([topic], function (err, offsets) {
        if (err) {
          return console.error(err);
        }
        const min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
        this.notificationsConsumer.setOffset(topic.topic, topic.partition, min);
      });
    });

    this.ordersConsumer.on('error', function (err) {
      logger.error('Kafka experienced an error - ' + err);
    });

    this.ordersConsumer.on('offsetOutOfRange', function (topic) {
      topic.maxNum = 2;
      this.offset2.fetch([topic], function (err, offsets) {
        if (err) {
          return console.error(err);
        }
        const min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
        this.ordersConsumer.setOffset(topic.topic, topic.partition, min);
      });
    });

    this.notificationsConsumer.on('message', function (message) {
      console.log('NOTIFICATION key = ' + message.key);
      console.log('NOTIFICATION type - ' + NotificationsString[message.key] + ' value  = ' + message.value);
      const value = JSON.parse(message.value);
      mysqlClient.writeNotificationEvent(message.key, value);
    });

    this.ordersConsumer.on('message', function (message) {
      console.log('ORDERS type - ' + orderTypesStr[message.key] + ' value  = ' + message.value);
      const value = JSON.parse(message.value);
      mysqlClient.writeOrderEvent(message.key, value);
    });
  }
}


export default EventQueue;