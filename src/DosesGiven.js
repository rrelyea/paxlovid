import React from 'react';
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
import * as constantsSite from './constants-site.js';


class DosesGiven extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dosesAdministeredTotal: 0,
            firstAdminDate: null,
            mounted: false,
            dosesGiven: [],
            dosesGivenData: null,
            stateDosesGiven: null,
            chartData:
            {
              labels: [],
              datasets: [{
                data: [], 
                borderColor: '#3e95cd',
                backgroundColor: 'lightblue',
                fill: false,}]
            },
            chartOptions: 
            {
                responsive: false,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 10,
                                }
                        }
                    }
                },
                plugins: { legend: { display: false }, }
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
      if (this.props.dosesGivenPerWeek != null) {
        var dosesPerWeek = null;
        this.state.stateDosesGiven = null;
        for (var i = 0; i < this.props.dosesGivenPerWeek.length; i++) {
            if (this.props.stateCode !== null && this.props.stateCode === this.props.dosesGivenPerWeek[i][0]) {
              this.state.stateDosesGiven = this.props.dosesGivenPerWeek[i][1];
              dosesPerWeek = this.props.dosesGivenPerWeek[i][2];
              break;
            }
        }

        this.state.chartData.labels = [];
        this.state.dosesGiven = [];
        if (dosesPerWeek !== null) {
          var weeks = dosesPerWeek.split(',');
          for (var j = 0; j < weeks.length; j++) {
            var chunks = weeks[j].split(':');
            if (chunks[0] !== "55") { // why is week 55 being generated in 5/2022?
              var eow = this.getSundayFromWeekNum(Number(chunks[0])-1,2022);
              this.state.chartData.labels[j] = eow.getMonth()+1 + "-" + eow.getDate();
              this.state.dosesGiven[j] = chunks[1];
            }
          }
        }
        this.state.chartData.datasets = [{
          data: this.state.dosesGiven,
          borderColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
          backgroundColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
          fill: false,
        }];
      }
    }

    render() {
        this.getData();
        var totals = this.props.totals;
        return (
        <>
          <div id='doses'>
              <div className='b'>{this.props.stateCode} Doses Given to Patients</div>
              <div>- Total: ~{this.state.stateDosesGiven !== null ? Number(this.state.stateDosesGiven).toLocaleString('en-US') : 0}</div>

              { constantsSite.siteLower !== "evusheld" ?
                <div className='lm10'>- per 100k: {this.state.stateDosesGiven !== null ? Number(this.state.stateDosesGiven / totals.pop100Ks).toFixed(0).toLocaleString('en-US') : 0}</div> :
                false }
              <div>- Weekly:</div>
              <Chart type='bar' id='chart' height='150' width='300' data={this.state.chartData} options={this.state.chartOptions} />

              { constantsSite.siteLower === "evusheld" ?
              <>
                <div className='b'>Immunocompromised</div>
                <div>- Adults: ~{this.state.stateDosesGiven !== null ? (Number(totals.icAdults).toLocaleString('en-US')) : 0}</div>
                <div>- % Protected: {this.state.stateDosesGiven !== null ? (Number(this.state.stateDosesGiven)/ Number(totals.icAdults) * 100).toFixed(1) + "%" : 0}</div>
              </>
              : false }
          </div>
        </>
        );
      }
}

export default DosesGiven;