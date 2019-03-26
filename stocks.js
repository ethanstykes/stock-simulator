
ctxs = []
for (var i = 1; i<=12; i++){
    ctxs[i-1] = document.getElementById('myChart'+i).getContext('2d');
}

xhttp = new XMLHttpRequest()
xhttp.onreadystatechange = function () {
    if (xhttp.readyState === 4 && xhttp.status === 200) {

        stockprices = JSON.parse(xhttp.responseText)

        // Labels should be Date objects
        var date = new Date()
        month = date.getMonth() + 1
        year = date.getFullYear()
        minutes = date.getMinutes()
        hours = date.getHours()
        date = date.getDate()

        stockSymbols = Object.keys(stockprices)

        for (symbol in stockSymbols) {

            labels = []
            for (i = 0; i < stockprices[stockSymbols[symbol]].length; i++) {
                labels.push(new Date(year, month, date, hours, minutes - i, 0))
            }
            if (stockprices[stockSymbols[symbol]][0] > stockprices[stockSymbols[symbol]][99]) {
                borderColor = '#29bc66';
                console.log("1")
            } else {
                borderColor = '#f21f1f';
                console.log("2")
            }

            console.log(stockprices)

            const data = {
                labels: labels,
                datasets: [{
                    fill: false,
                    label: stockSymbols[symbol],
                    data: stockprices[stockSymbols[symbol]],
                    borderColor: borderColor,
                    backgroundColor: borderColor,
                    lineTension: 0,
                }]
            }
            const options = {
                type: 'line',
                data: data,
                options: {
                    fill: false,
                    responsive: true,
                    scales: {
                        xAxes: [{
                            type: 'time',
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "Time",
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: false,
                            },
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "Closing Price ($)",
                            }
                        }]
                    }
                }
            }
            var chart = new Chart(ctxs[symbol], options);
        }
    }
}
xhttp.open("GET", "http://localhost:3501/getprices", true);
xhttp.send();