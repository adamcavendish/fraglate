const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');

const Fraglate = require('../src/index');

var app = express();

//mongoose.connect('mongodb://localhost/fraglate');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(new cookieParser());

app.set('views', __dirname);
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

app.use(new Fraglate({}, function() {
    console.log('Fraglate init finished');
}).as_middleware());

app.get('/', (req, res) => {
    res.render('express-test.ejs', {
        data: [
            'life',
            'FGquote',
            'calc',
        ],
    });
});

app.post('/api/locale', (req, res) => {
    var locale = req.body.locale;
    res.cookie('locale', locale);
    res.json({'msg': 'success'});
});

var server = app.listen(3000, () => {
    console.log("Express is running on port 3000");
});
