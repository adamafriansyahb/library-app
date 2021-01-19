if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');
const authorRouter = require('./routes/authors');

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', (error) => {
  console.log(error);
});
db.once('open', () => {
  console.log("connected to mongodb");
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false, limit: '10mb'}));

app.use('/', indexRouter);
app.use('/authors', authorRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log('server is running...');
});
