
class EventQueue {
  constructor({ endpoint, topics, kafka, logger, moduleInfo , maxRetries, queryAnsTopic, moment }, handleMessageCb) {
    this.endpoint = endpoint;
    this.queryAnsTopic = queryAnsTopic;
    this.kafka = kafka;
    this.moment = moment;
    this.logger = logger;
    const consumerGroupPrefix = moduleInfo.name;
    this.maxRetries = maxRetries;
    this.initConsumerGroup(consumerGroupPrefix, topics, handleMessageCb);
    this.initProducer(kafka, logger);
  }


  initProducer() {
    this.client = new this.kafka.Client(this.endpoint);
    this.producer = new this.kafka.Producer(this.client);

    this.producer.on('ready', function () {
      this.client.refreshMetadata([this.queryAnsTopic], (err) => {
        if (err) {
          this.logger.warn('Error refreshing kafka metadata %s', err);
        }
      });
    }.bind(this));

    this.producer.on('error', function (err) {
      this.error(err);
    });
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


  sendQueryAnswer(type, id, message) {
    const timestamp =  this.moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let ans = { data : message,eventTimeStamp: timestamp, requestId: id  };
    // console.log('sendQueryAnswer, id = ' + id);
    // message['requestId'] = id;
    let keyedMessage = new this.kafka.KeyedMessage(type, JSON.stringify(ans));
    this.producer.send([{ topic: this.queryAnsTopic, partition: 0, messages: [keyedMessage] }], function (err, result) {
      if (err) {
        this.logger.error(err);
      }
      else {
        this.logger.debug('%o', result);
      }
    }.bind(this));
  }
}


export default EventQueue;