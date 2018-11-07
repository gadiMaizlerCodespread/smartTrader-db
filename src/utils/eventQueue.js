import logger from 'logger';
import { NotificationsString, orderTypesStr }  from  'smart-trader-common';

import { Module } from './moduleInfo';

const kafka = require('kafka-node');
const MAX_RETRIES = 3;

const PARTITION = 0;

class EventQueue {
  constructor(config, handleMessageCb) {
    this.endpoint = config.endpoint;
    const topics = config.topics;

    const consumerGroupPrefix = Module.name;
    this.initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb);

  }

  initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb) {
    let retries = MAX_RETRIES;

    try {
      let options = { autoCommit: true,
        fetchMaxWaitMs: 1000,
        fetchMaxBytes: 1024 * 1024,
        host: this.endpoint,
        groupId: `${consumerGroupPrefix}-${topics.join('-')}`,
        sessionTimeout: 15000,
        protocol: ['roundrobin']
      };

      this.consumer = new kafka.ConsumerGroup(options, topics);

      this.consumer.on('error', function (err) {
        logger.error('Kafka experienced an error - %s', err);
      });

      this.consumer.on('message', function (message) {
        handleMessageCb(message);
      });
    }
    catch(err) {
      logger.error('Error on kafka consumer:' + err);
      if (retries > 0) {
        retries--;
        this.initConsumerGroup(consumerGroupPrefix, topics);
      }
    }
  }
}


export default EventQueue;