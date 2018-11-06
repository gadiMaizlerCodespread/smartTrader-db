import logger from 'logger';
import { NotificationsString, orderTypesStr }  from  'smart-trader-common';
import MysqlClient from './mysqlClient';

const kafka = require('kafka-node');


const PARTITION = 0;

class EventQueue {
  constructor(config) {

    //  order  producer initialization
    const client1 = new kafka.Client(config.kafkaZookeeperUrl + ':' + config.kafkaZookeeperPort);
    const client2 = new kafka.Client(config.kafkaZookeeperUrl + ':' + config.kafkaZookeeperPort);
    // notification client
    // let notificationClient = new kafka.Client('localhost:2182');
    const notificationsTopic = [{ topic: config.notificationsTopic, partition: PARTITION }];
    const ordersTopic = [{ topic: config.ordersTopic, partition: PARTITION }];

    const options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };
    this.notificationsConsumer = new kafka.Consumer(client1, notificationsTopic, options);
    this.ordersConsumer =          new kafka.Consumer(client2, ordersTopic, options);

    this.offset1 = new kafka.Offset(client1);
    this.offset2 = new kafka.Offset(client2);


    const mysqlClient = new MysqlClient(config);

    this.notificationsConsumer.on('error', function (err) {
      logger.error('Kafka experienced an error - %s', err);
    });

    this.ordersConsumer.on('error', function (err) {
      logger.error('Kafka experienced an error - %s', err);
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