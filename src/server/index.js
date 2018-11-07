import createError from 'http-errors';
import express from 'express';
import indexRouter from 'index';
import EventQueue from 'eventQueue';
import logger from 'logger';
import MysqlClient from 'mysqlClient';

class Server {
  constructor(confParams) {

    this.confParams = confParams;

    this.mysqlClient = new MysqlClient(confParams);
    this.eventQueue = new EventQueue({ endpoint: `${confParams.kafkaZookeeperUrl}:${confParams.kafkaZookeeperPort}`,
      topics: [confParams.notificationsTopic, confParams.ordersTopic]
    }, this.handleMessage.bind(this));
    this.server = express();
    this.server.use(express.json());

    this.server.use('/', indexRouter);

    // catch 404 and forward to error handler
    this.server.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    this.server.use(function(err, req, res, next) {
      // set locals, only providing error in development
      logger.error('error occurred %o', err.message);
      res.locals.message = err.message;
      res.locals.error = this.server.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.end(err.message);
    });
  }

  getServer() {
    return this.server;
  }

  handleMessage(message) {
    const value = JSON.parse(message.value);
    if (message.topic ===  this.confParams.notificationsTopic) {
      this.mysqlClient.writeNotificationEvent(message.key, value);

    }
    else if (message.topic === this.confParams.ordersTopic) {
      this.mysqlClient.writeOrderEvent(message.key, value);
    }
    else {
      logger.error('unknown topic %s', message.topic);
    }
  }


}



export default Server;


