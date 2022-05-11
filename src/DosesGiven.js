import React from 'react';
import Papa from 'papaparse';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    BarController,
  } from "chart.js";
import { Chart } from 'react-chartjs-2';

class DosesGiven extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dosesAdministeredTotal: 0,
            firstAdminDate: null,
            mounted: false,
            dosesGiven: [],
            dosesGivenData: null,
            chartData:
            {
              labels: [],
              datasets: [{
                data: [], 
                label: "Doses Given each Week",
                borderColor: '#3e95cd',
                backgroundColor: 'lightblue',
                fill: false,}]
            },
            chartOptions: 
            {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 10,
                                },
                            display: !(this.props.mini === 'true'),
                        }
                    }
                },
            }
        }
    }

      async componentWillUnmount () {
        this.state.mounted = false;
      }

      async componentDidMount () {

        this.state.mounted = true;
        ChartJS.register(BarController, CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);
      }
    getSundayFromWeekNum = (weekNum, year) => {
      const sunday = new Date(year, 0, (1 + (weekNum - 1) * 7));
      while (sunday.getDay() !== 0) {
        sunday.setDate(sunday.getDate() - 1);
      }
      return sunday;
    }
    getData() {

      if (this.props.dosesPerWeek != null) {
        var weeks = this.props.dosesPerWeek.split(',');
        this.state.chartData.labels = [];
        this.state.dosesGiven = [];
        for (var i = 0; i < weeks.length; i++) {
          var chunks = weeks[i].split(':');
          if (chunks[0] != "55") { // why is week 55 being generated in 5/2022?
            var eow = this.getSundayFromWeekNum(Number(chunks[0])-1,2022);
            this.state.chartData.labels[i] = eow.getMonth()+1 + "-" + eow.getDate();
            this.state.dosesGiven[i] = chunks[1];
          }
        }
        this.state.chartData.datasets = [{
          data: this.state.dosesGiven,
          label: "Doses Given Statewide each Week",
          borderColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
          backgroundColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
          fill: false,
        }];

      }
    }

    render() {
        this.getData();
        return (
        <>
          <div id='doses'>
              <Chart type='bar' id='chart' height='150' data={this.state.chartData} options={this.state.chartOptions} />
          </div>
        </>
        );
      }
}

export default DosesGiven;