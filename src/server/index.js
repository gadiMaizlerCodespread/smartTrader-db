import createError from 'http-errors';
import express from 'express';
import indexRouter from 'index';
import EventQueue from 'eventQueue';
import logger from 'logger';

class Server {
  constructor(confParams) {
    this.eventQueue = new EventQueue(confParams);
    this.server = express();
    this.server.use(express.json());

    this.server.use('/', indexRouter);
    // server.use('/users', usersRouter);

    // catch 404 and forward to error handler
    this.server.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    this.server.use(function(err, req, res, next) {
      // set locals, only providing error in development
      logger.error(err.message);
      res.locals.message = err.message;
      res.locals.error = server.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.end(err.message);
    });
  }

  getServer() {
    return this.server;
  }


}



export default Server;


