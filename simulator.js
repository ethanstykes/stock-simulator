var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
var mysql = require('mysql');

var con = mysql.createConnection({
        host: "localhost",
        user: "user",
        password: "password",
        database: "mysql",
        socketPath: "/tmp/mysql.sock"
});

con.connect(function (err) {
        if (err) throw err;

        const getAccountInfo = function (username, callback) {
                sql = "select* from investoraccount where username='" + username + "'"
                con.query(sql, function (err, result) {
                        if (err) throw err;
                        //console.log(result)
                        callback(null, result)
                });
        }

        const runSQL = function (sql, callback) {
                con.query(sql, function (err, result) {
                        if (err) throw err;
                        callback(null, result)
                })
        }

        app.use(bodyParser.json()); // to support JSON-encoded bodies
        app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
                extended: true
        }));

        app.post('/stock-portfolio', function (req, res) {

                //console.log(req.body.username)
                username = req.body.username
                sql = "select* from portfolio where username='" + username + "'"
                con.query(sql, function (err, result) {
                        if (err) throw err;

                        const updatePrices = function (i, callback) {

                                //console.log("result",result)

                                stockSymbol = result[i]["stockSymbol"]

                                console.log(stockSymbol)


                                getAccountInfo(username, (err, data) => {
                                        if (err) throw err;

                                        console.log("account data:", data)

                                        accountValue = data[0].accountValue
                                        buyingPower = data[0].buyingPower
                                        cash = data[0].cash

                                        var options = {
                                                method: 'GET',
                                                url: 'http://localhost:3501/getprices'
                                        };

                                        request(options, function (error, response, body) {
                                                if (error) throw new Error(error);

                                                stockPrice = JSON.parse(body)[stockSymbol][0];

                                                console.log("stockPrice:", stockPrice)

                                                sql = 'select* from portfolio where username="' + (username) + '" and stockSymbol="' + (stockSymbol) + '"';
                                                runSQL(sql, (err, data) => {
                                                        if (err) throw new Error(err);

                                                        qty = parseFloat(data[0].amount)
                                                        purchasePrice = parseFloat(data[0].purchasePrice)
                                                        totalValue = parseFloat(data[0].totalValue)
                                                        totalGain_Loss = parseFloat(data[0].totalGain_Loss)

                                                        console.log("purchasePrice:", purchasePrice)

                                                        totalGain_Loss_new = qty * stockPrice - qty * purchasePrice

                                                        accountValue_new = accountValue - totalGain_Loss + totalGain_Loss_new

                                                        buyingPower_new = (accountValue + cash) / 2

                                                        sql = 'update portfolio set amount=' + (qty) + ',purchasePrice=' + purchasePrice + ',currentPrice=' + stockPrice + ',totalValue=' + (qty * stockPrice) + ',totalGain_Loss=' + (totalGain_Loss_new) + ' where username="' + username + '" and stockSymbol="' + stockSymbol + '"';

                                                        runSQL(sql, (err, data) => {
                                                                if (err) throw new Error(err);

                                                                console.log("\nupdate portfolio:", data)

                                                                sql = 'update investoraccount set accountValue=' + (accountValue_new) + ',cash=' + (cash) + ',buyingPower=' + (buyingPower_new) + ' where username="' + (username) + '"';
                                                                runSQL(sql, (err, data) => {
                                                                        if (err) throw new Error(err);
                                                                        console.log("\nupdate investoraccount:", data)
                                                                        callback(null, i)
                                                                });

                                                        });
                                                });
                                        });
                                });
                        } //run recursion 

                        const updateStocks = function (i, callback) {

                                if (i < result.length) {
                                        updatePrices(i, (err, data) => {
                                                if (err) throw err;

                                                i++;
                                                console.log("i:", i)
                                                updateStocks(i, (err, data) => {
                                                        callback(null)
                                                });
                                        })
                                } else {
                                        console.log("final callback");
                                        callback(null)
                                }
                        }

                        i = 0;
                        updateStocks(i, (err, data) => {

                                if (err) throw new Error(err);

                                console.log("all stock values updated")

                                stocks = {}
                                //console.log(result[0].stockSymbol)
                                for (var i = 0; i < result.length; i++) {
                                        stocks[result[i].stockSymbol] = [result[i].stockSymbol, result[i].amount, result[i].purchasePrice, result[i].currentPrice, result[i].totalValue, result[i].totalGain_Loss]
                                }
                                console.log(JSON.stringify(stocks))
                                res.end(JSON.stringify(stocks))

                        });

                });
        });
        app.post('/account-info', function (req, res) {
                console.log("user: ", req.body.username)
                username = req.body.username
                getAccountInfo(username, (err, data) => {
                        if (err) throw err;
                        accountInfo = {
                                accountValue: data[0].accountValue,
                                buyingPower: data[0].buyingPower,
                                cash: data[0].cash
                        }
                        //console.log(JSON.parse(stocks))
                        res.end(JSON.stringify(accountInfo))
                });
        });

        app.post('/new-trade', function (req, res) {

                console.log("starting new trade..")

                console.log(req.body)

                stockSymbol = req.body.stock
                qty = req.body.qty
                username = req.body.username
                mode = req.body.mode

                getAccountInfo(username, (err, data) => {
                        var accountValue = data[0].accountValue
                        var cash = data[0].cash
                        var buyingPower = data[0].buyingPower

                        var options = {
                                method: 'GET',
                                url: 'http://localhost:3501/getprices'
                        };

                        request(options, function (error, response, body) {
                                if (error) throw new Error(error);

                                stockPrice = JSON.parse(body)[stockSymbol][0];
                                totalPrice = stockPrice * qty

                                if (mode == "buy") {
                                        if (totalPrice > buyingPower || buyingPower < 0) {
                                                res.end("no-balance");
                                        } else if (totalPrice > accountValue / 2) {
                                                res.end("too-high");
                                        } else {

                                                sql = 'select* from portfolio where username="' + (username) + '" and stockSymbol="' + (stockSymbol) + '"';
                                                runSQL(sql, (err, data) => {

                                                        if (err) throw new Error(err);

                                                        flag = -1;

                                                        if (data.length > 0) {

                                                                flag = 0;

                                                                current_qty = parseFloat(data[0].amount)
                                                                purchasePrice = parseFloat(data[0].purchasePrice)
                                                                totalValue = parseFloat(data[0].totalValue)
                                                                totalGain_Loss = parseFloat(data[0].totalGain_Loss)
                                                                new_qty = current_qty + qty


                                                                purchasePrice_new = (purchasePrice * current_qty + stockPrice * qty) / new_qty
                                                                totalGain_Loss_new = new_qty * stockPrice - new_qty * purchasePrice_new

                                                                //console.log(purchasePrice_new, totalGain_Loss_new, new_qty, stockPrice)

                                                                sql = 'update portfolio set amount=' + (new_qty) + ',purchasePrice=' + purchasePrice_new + ',currentPrice=' + stockPrice + ',totalValue=' + (new_qty * stockPrice) + ',totalGain_Loss=' + (totalGain_Loss_new) + ' where username="' + username + '" and stockSymbol="' + stockSymbol + '"';

                                                        } else {
                                                                purchasePrice = stockPrice * qty
                                                                sql = 'insert into portfolio values("' + username + '","' + stockSymbol + '",' + (qty) + ',' + (stockPrice) + ',' + (stockPrice) + ',' + (purchasePrice) + ',' + (0) + ')';
                                                        }

                                                        runSQL(sql, (err, data) => {
                                                                if (err) throw new Error(err);

                                                                if (flag == 0) {
                                                                        cash -= totalPrice
                                                                        accountValue += totalGain_Loss_new - totalGain_Loss
                                                                        buyingPower = (accountValue + cash) / 2
                                                                        sql = 'update investoraccount set accountValue=' + (accountValue) + ',cash=' + (cash) + ',buyingPower=' + (buyingPower) + ' where username="' + (username) + '"';
                                                                        runSQL(sql, (err, data) => {
                                                                                if (err) throw new Error(err);
                                                                                res.end("success")
                                                                        });
                                                                } else {
                                                                        cash -= totalPrice
                                                                        buyingPower = (accountValue + cash) / 2
                                                                        sql = 'update investoraccount set cash=' + (cash) + ', buyingPower =' + (buyingPower) + ' where username ="' + (username) + '"';
                                                                        runSQL(sql, (err, data) => {
                                                                                if (err) throw new Error(err);
                                                                                res.end("success")
                                                                        });
                                                                }
                                                        });

                                                });
                                        }
                                } else if (mode == "sell") {
                                        sql = 'select* from portfolio where username="' + (username) + '" and stockSymbol="' + (stockSymbol) + '"';
                                        runSQL(sql, (err, data) => {
                                                if (err) throw new Error(err);

                                                flag2 = 0

                                                if (data.length > 0) {

                                                        current_qty = parseFloat(data[0].amount)
                                                        purchasePrice = parseFloat(data[0].purchasePrice)
                                                        totalValue = parseFloat(data[0].totalValue)
                                                        totalGain_Loss = parseFloat(data[0].totalGain_Loss)
                                                        new_qty = current_qty - qty

                                                        purchasePrice_new = purchasePrice
                                                        totalGain_Loss_new = new_qty * stockPrice - new_qty * purchasePrice_new

                                                        sql = 'update portfolio set amount=' + (new_qty) + ',purchasePrice=' + purchasePrice_new + ',currentPrice=' + stockPrice + ',totalValue=' + (new_qty * stockPrice) + ',totalGain_Loss=' + (totalGain_Loss_new) + ' where username="' + username + '" and stockSymbol="' + stockSymbol + '"';

                                                        if (new_qty == 0) {
                                                                sql = 'delete from portfolio where username="' + username + '" and stockSymbol="' + stockSymbol + '"';
                                                        }

                                                        if (new_qty < 0) {
                                                                res.end("not-enough-stocks")
                                                                sql = 'select* from portfolio' //decoy query
                                                                flag2 = -1
                                                        }

                                                } else {
                                                        res.end("no-stocks")
                                                }

                                                runSQL(sql, (err, data) => {
                                                        if (err) throw new Error(err);

                                                        if (flag2 == 0) {
                                                                cash += totalPrice
                                                                accountValue = accountValue
                                                                buyingPower = (accountValue + cash) / 2
                                                                sql = 'update investoraccount set accountValue=' + (accountValue) + ',cash=' + (cash) + ',buyingPower=' + (buyingPower) + ' where username="' + (username) + '"';
                                                                runSQL(sql, (err, data) => {
                                                                        if (err) throw new Error(err);
                                                                        res.end("success")
                                                                });
                                                        }
                                                });


                                        });
                                }

                        });
                });
        });

}); //conn.connect

app.get('/home', function (req, res) {
        res.sendFile(__dirname + '/index.html')
});
app.get('/signup', function (req, res) {
        res.sendFile(__dirname + '/signup.html')
})
app.get('/login', function (req, res) {
        res.sendFile(__dirname + '/login.html')
});
app.get('/stocks', function (req, res) {
        res.sendFile(__dirname + '/stocks.html')
});
app.get('/portfolio', function (req, res) {
        res.sendFile(__dirname + '/portfolio.html')
});
app.get('/trade', function (req, res) {
        res.sendFile(__dirname + '/trade.html')
});
app.get('/test', function (req, res) {
        res.sendFile(__dirname + '/test.html')
});


app.get('/stocksjs', function (req, res) {
        res.sendFile(__dirname + '/stocks.js')
});
app.get('/portfoliojs', function (req, res) {
        res.sendFile(__dirname + '/portfolio.js')
});

app.get('/chartjs', function (req, res) {
        res.sendFile(__dirname + '/node_modules/chart.js/dist/Chart.js')
});
app.get('/slickjs', function (req, res) {
        res.sendFile(__dirname + '/js/slick.js')
});
app.get('/waypointsjs', function (req, res) {
        res.sendFile(__dirname + '/js/waypoints.js')
});
app.get('/jquerycounterupjs', function (req, res) {
        res.sendFile(__dirname + '/js/jquery\.counterup.js')
});
app.get('/jquerymixitupjs', function (req, res) {
        res.sendFile(__dirname + '/js/jquery\.mixitup.js')
});
app.get('/jqueryfancyboxpackjs', function (req, res) {
        res.sendFile(__dirname + '/js/jquery\.fancybox\.pack.js')
});
app.get('/customjs', function (req, res) {
        res.sendFile(__dirname + '/js/custom.js')
});
app.get('/jqueryminjs', function (req, res) {
        res.sendFile(__dirname + '/js/jquery\.min.js')
});
app.get('/bootstrapjs', function (req, res) {
        res.sendFile(__dirname + '/js/bootstrap.js')
});


app.get('/css', function (req, res) {
        res.sendFile(__dirname + '/css/h.css')
});
app.get('/style', function (req, res) {
        res.sendFile(__dirname + '/css/style.css')
});
app.get('/default-theme', function (req, res) {
        res.sendFile(__dirname + '/css/theme-color/default-theme.css')
});
app.get('/fancybox', function (req, res) {
        res.sendFile(__dirname + '/css/jquery\.fancybox.css')
});
app.get('/slick', function (req, res) {
        res.sendFile(__dirname + '/css/slick.css')
});
app.get('/bootstrap', function (req, res) {
        res.sendFile(__dirname + '/css/bootstrap.css')
});
app.get('/font-awesome', function (req, res) {
        res.sendFile(__dirname + '/css/font-awesome.css')
});
app.get('/table-style', function (req, res) {
        res.sendFile(__dirname + '/css/table-style.css')
});


app.get('/favicon', function (req, res) {
        res.sendFile(__dirname + '/img/favicon.ico')
});


app.get('/stockimage', function (req, res) {
        res.sendFile(__dirname + '/images/stocks.jpg')
});


app.listen(3500);