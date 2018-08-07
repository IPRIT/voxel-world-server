import express from 'express';
import morgan from 'morgan';

let app = express();

app.use( morgan('tiny') );
app.enable( 'trust proxy' );

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status( 404 ).end( 'Not found' );
  next();
});

// error handlers

// development error handler
// will print stacktrace
if (process.env.NODE_ENV === 'development') {
  app.use((err, req, res, next) => {
    res.status( err.status || 500 );
    console.error( err );
    res.end();
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status( err.status || 500 );
  res.end();
});

export default app;