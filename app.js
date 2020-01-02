///////////////////////////////////
//            DATA               //
///////////////////////////////////
let chartOptions = {
  theme: "light2",
  animationEnabled: true,
  zoomEnabled: true,
  zoomType: "xy",
  axisX: {
    gridThickness: 1,
    interval: 10,
    intervalType: "minute",
    valueFormatString: "HH:mm",
    labelAngle: 45,
    labelFontSize: 15,
  },
  axisY: {
    title: "Temperature",
    interlacedColor: "#F0F0F0",

  },
  legend: {
    cursor: "pointer",
    itemclick: function (e) {
      if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }

      e.chart.render();
    }
  },
  toolTip: {
    contentFormatter: function (e) {
      var content = "";
      for (var i = 0; i < e.entries.length; i++) {
        content = e.entries[i].dataPoint.indexLabel ?
          e.entries[i].dataPoint.indexLabel + ' @ ' + CanvasJS.formatDate(e.entries[i].dataPoint.x, "HH:mm:ss")
          : e.entries[i].dataPoint.y + '°C @ ' + CanvasJS.formatDate(e.entries[i].dataPoint.x, "HH:mm:ss");
      }
      return content;
    }
  },
  data: null
}

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (evt) => {
      resolve(evt.target.result);
    };
    reader.onerror = reject;
  })
}

///////////////////////////////////
//            APPLICATION        //
///////////////////////////////////
const vuetifyOptions = { }
Vue.use(Vuetify)
var app = new Vue({
  el: '#app',
  vuetify: new Vuetify(vuetifyOptions),
  data: {
    chartRendered: false,
    chartData: [],
    files: [],
    colors: [
      { color: '#4661EE'},
      { color: '#EC5657'},
      { color: '#1BCDD1'},
      { color: '#D1CBDC'},
      { color: '#CBD1DC'}
    ]
  },
  methods: {
    renderChart: async function () {
      await this.processFiles(this.files);
      this.chartRendered = true;
      chartOptions.data = this.chartData;
      var chart = new CanvasJS.Chart("chartContainer", chartOptions);
      chart.render();
    },
    processFiles: async function (files) {
      files = files.sort((a, b) => a.name.localeCompare(b.name));
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        await this.prepareFile(file);
      }
    },
    prepareFile: async function(file) {
      let text = await readFileAsync(file);
      const isActionLogFile = file.name === 'action.log';
      const lines = text.split(/\r?\n/)
      let color = 'black';
      let formatedData = [];
      //Format Data
      for (let i = 0; i < lines.length; i++) {
        let rawData = lines[i].split(',');
        let date = new Date(rawData[0]);
        if (rawData.length === 2) {
          let dataToAdd = { x: date };
          //y value change if we are reading action.log file
          if (isActionLogFile) {
            dataToAdd.y = i % 2 === 0 ? 100 : 90;
            dataToAdd.indexLabel = rawData[1].replace("Start Step", "");
            dataToAdd.markerColor = 'darkred';
            dataToAdd.markerType = "cross";
          } else {
            const value = parseFloat(rawData[1])
            dataToAdd.y = value < 0 ? null : value;
            color = this.colors[(parseInt(file.name.split('_')[1]) - 1) % this.colors.length].color
          }
          //add formated data
          if (isActionLogFile) {
            formatedData = formatedData.concat([{ x: date, y: 0, }, dataToAdd, { x: date, y: null, }]);
          } else {
            formatedData.push(dataToAdd);
          }
        }
      }
      //Add data to chart
      this.chartData.push({
        type: 'line',
        dataPoints: formatedData,
        lineDashType: file.name.indexOf('kettle') >= 0 ? "dash" : "solid",
        name: file.name.replace('.log', ''),
        lineColor: color,
        color: color,
        showInLegend: !isActionLogFile,
        legendText: file.name.replace('.log', ''),
        xValueType: "dateTime"
      });
    }
  }
})