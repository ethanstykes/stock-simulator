var table = document.getElementById("t00");

xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        stocks = JSON.parse(xhttp.responseText)
        symbols = Object.keys(stocks)
        console.log(stocks)
        for (var i in symbols) {
            var row = table.insertRow(1);
            for (var j = 0; j < 6; j++) {
                var cell1 = row.insertCell(j);
                cell1.innerHTML = stocks[symbols[i]][j];
            }
        }
    }
}
var formdata = {
    username: getCookie("username")
}
console.log(getCookie("username"))
xhttp.open("POST", "/stock-portfolio", true);
xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhttp.send(JSON.stringify(formdata));

var accoutValue = document.getElementById("account-value")
var buyingPower = document.getElementById("buying-power")
var cash = document.getElementById("cash")

xhttp2 = new XMLHttpRequest();
xhttp2.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        accountInfo = JSON.parse(xhttp2.responseText)
        console.log(accountInfo)
        accoutValue.innerHTML = "Account Value: $" + accountInfo["accountValue"]
        buyingPower.innerHTML = "Buying Power: $" + accountInfo["buyingPower"]
        cash.innerHTML = "Cash: $" + accountInfo["cash"]
    }
}
xhttp2.open("POST", "http://localhost:3500/account-info", true);
xhttp2.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhttp2.send(JSON.stringify(formdata));