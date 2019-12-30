var app = new Vue({
  el: '#app',
  data: {
    chartRendered: false,
    data: []
  },
  methods: {
    renderChart: async function () {

      this.chartRendered = true;
      console.log('data:', this.data)
      var chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2", // "light1", "light2", "dark1", "dark2"
        animationEnabled: true,
        zoomEnabled: true,
        zoomType: "xy",
        axisX: {
          gridThickness: 1,
          interval: 15,
          intervalType: "minute",
          valueFormatString: "HH:mm",
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
              content = e.entries[i].dataPoint.y + '°C @ ' + CanvasJS.formatDate(e.entries[i].dataPoint.x, "HH:mm:ss");
            }
            return content;
          }
        },
        data: this.data
      });
      chart.render();
    },
    processFile: function () {
      console.log('selected a file');
      for (let i = 0; i < this.$refs.myFiles.files.length; i++) {
        let file = this.$refs.myFiles.files[i];
        this.prepareFile(file);
      }
    },
    prepareFile(file) {
      console.log('processing file', file)
      let reader = new FileReader();
      let params = null;
      switch (file.name) {
        case 'kettle_1.log': params = { name: 'kettle_1', color: '#4661EE', solid: false }; break;
        case 'kettle_2.log': params = { name: 'kettle_1', color: '#EC5657', solid: false }; break;
        case 'kettle_3.log': params = { name: 'kettle_1', color: '#1BCDD1', solid: false }; break;
        case 'sensor_1.log': params = { name: 'sensor_1', color: '#4661EE', solid: true }; break;
        case 'sensor_2.log': params = { name: 'sensor_2', color: '#EC5657', solid: true }; break;
        case 'sensor_3.log': params = { name: 'sensor_3', color: '#1BCDD1', solid: true }; break;
      }
      if (params) {
        reader.readAsText(file, "UTF-8");
        reader.onload = evt => {
          let text = evt.target.result;

          //Process text
          let data = text.split(/\r?\n/)
          let formatedData = [];
          for (let i = 0; i < data.length; i++) {
            let rawData = data[i].split(',');
            if (rawData.length === 2) {
              const date = new Date(rawData[0])
              const value = parseFloat(rawData[1])
              formatedData.push({
                x: date,
                y: value < 0 ? 0 : value
              });
            }
          }
          //add dataset
          console.log('push data to array')
          this.data.push({
            type: 'line',
            dataPoints: formatedData,
            lineDashType: params.solid ? "solid" : "dash",
            name: params.name,
            lineColor: params.color,
            color: params.color,
            showInLegend: true,
            legendText: params.name,
            xValueType: "dateTime"
          });
        }
        reader.onerror = evt => {
          console.error(evt);
        }
      }
      console.log('end of file processing')
    }
  }
})