
class EventQueue {
  constructor({ endpoint, topics, kafka, logger, moduleInfo , maxRetries },handleMessageCb) {
    this.endpoint = endpoint;
    topics;
    this.kafka = kafka;
    this.logger = logger;
    const consumerGroupPrefix = moduleInfo.name;
    this.maxRetries = maxRetries;
    this.initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb);
  }

  initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb) {
    let retries =  this.maxRetries;

    try {
      let options = { autoCommit: true,
        fetchMaxWaitMs: 1000,
        fetchMaxBytes: 1024 * 1024,
        host: this.endpoint,
        groupId: `${consumerGroupPrefix}-${topics.join('-')}`,
        sessionTimeout: 15000,
        protocol: ['roundrobin']
      };

      this.consumer = new this.kafka.ConsumerGroup(options, topics);

      this.consumer.on('error', function (err) {
        this.logger.error('Kafka experienced an error - %s', err);
      });

      this.consumer.on('message', function (message) {
        handleMessageCb(message);
      });
    }
    catch(err) {
      this.logger.error('Error on kafka consumer:' + err);
      if (retries > 0) {
        retries--;
        this.initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb);
      }
      else{
        this.logger.error('cant connect, stop retrying');
      }
    }
  }
}


export default EventQueue;