var express = require("express");
var request = require("request");

const getPrices = function(symbols, callback){
    i = 0
    function next() {
        const symbol = symbols[i++];
        //console.log("1",symbol)
        if (!symbol) {
            return callback(null, prices);
        }
        return apiCall(prices, symbol, (err, data) => {
                       prices = data;
                       next();
                       });
    }
    next();
}

const apiCall = function (prices, symbol, callback){
    
    apikey = (Math.random()*9.223372e+18).toString(16)
    var options = { method: 'GET',
    url: 'https://www.alphavantage.co/query',
    qs:
        { function: 'TIME_SERIES_INTRADAY',
        symbol: symbol,
        interval: '1min',
            apikey: apikey },
    };
    
    request(options, function (error, response, body) {
            if (error) throw new Error(error);
            
            //console.log(JSON.parse(body))
            body = JSON.parse(body)
            time_series = body['Time Series (1min)']
            keys = Object.keys(time_series);
            for (key in keys){
            prices[symbol][key]=parseFloat(time_series[keys[key]]['4. close'])
            }
            //console.log(prices)
            callback(null, prices);
            });
}

prices = {
    "AAPL":[],
    "NKE":[],
    "DIS":[],
    "AMZN":[],
    "KO":[],
    "SBUX":[],
    "WMT":[],
    "NFLX":[],
    "TSLA":[],
    "FB":[],
    "PG":[],
    "MCD":[]
}

var app =express();

// Add headers
app.use(function (req, res, next) {
        
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3500');
        
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        
        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);
        
        // Pass to next layer of middleware
        next();
        });

app.get('/refresh1' , function(req,res){
        symbols = ["AAPL", "NKE", "DIS", "AMZN", "KO"]
        getPrices(symbols, (err, data) => {
                  //console.log(data);
                  prices = data
                  res.end(JSON.stringify(data))
                  });
        });
app.get('/refresh2' , function(req,res){
        symbols = ["SBUX","WMT","NFLX","TSLA","FB"]
        getPrices(symbols, (err, data) => {
                  //console.log(data);
                  prices = data
                  res.end(JSON.stringify(data))
                  });
        });
app.get('/refresh3' , function(req,res){
        symbols = ["PG","MCD"]
        getPrices(symbols, (err, data) => {
                  //console.log(data);
                  prices = data
                  res.end(JSON.stringify(data))
                  });
        });
app.get('/getprices' , function(req,res){
        res.end(JSON.stringify(prices))
        });
app.listen(3501);

