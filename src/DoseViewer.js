import React from 'react';
import Papa from 'papaparse';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    LineController,
  } from "chart.js";
import { Chart } from 'react-chartjs-2';
import * as constantsBranch from './constants-branch.js';
import * as constantsSite from './constants-site.js';

class DoseViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dosesAdministeredTotal: 0,
            firstAdminDate: null,
            mounted: false,
            availableData: [],
            noReportsData: [],
            doseInfo: null,
            chartData:
            {
              labels: [],
              datasets: [{
                data: [], 
                label: "Doses Available (in stock)",
                borderColor: '#3e95cd',
                backgroundColor: 'lightblue',
                fill: false,}]
            },
            chartOptions: 
            {
                responsive: true,
                maintainAspectRatio: true,
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

    msInDay = 24 * 60 * 60 * 1000;
    
    baseUrl = "https://raw.githubusercontent.com/rrelyea/covid-therapeutics/" + constantsBranch.branch + "/data/therapeutics/" + this.props.site + "/dose-history-by-zip/";

    async toCsv(uri) {
      return new Promise((resolve, reject) => {
        Papa.parse(uri, {
          download: true,
          complete (results, file) {
            resolve(results.data)
          },
          error (error, file) {
            resolve(null)
          }
        })
      })
    }

    async loadDoseInfo() {
      var doseInfo = await this.toCsv(this.baseUrl + this.props.zipCode + ".csv");
      if (this.state.mounted) {
        this.setState({doseInfo: doseInfo})
      }
    }

    GetDate(date,start=0,len=5) {
      if (date === null || date === undefined || date === "" || date === "NLP") return null;
      return date.substring(start,start+len);
    }
    
    GetDoses(dose) {
      if (dose === null || dose === undefined || dose === "" || dose === "NLP") return null;
      return dose;
    }

      async componentWillUnmount () {
        this.state.mounted = false;
      }

      async componentDidMount () {
        this.state.mounted = true;
        ChartJS.register(LineController, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
        await this.loadDoseInfo();
        
        if (this.state.doseInfo != null) {
          var j = 0;
          this.state.chartData.labels[j] = "";
          this.state.availableData[j] = 0;
          this.state.noReportsData[j] = 0;
          j = j + 1;
        
          var lastReportDate;
          var lastPopDataDate;
          var lastFullReportDate;
          var lastAvailable;
          var dosesAdministered;
          for (var i = 0; i < this.state.doseInfo.length; i++) {
              var provider = this.state.doseInfo[i][2] !== undefined ? this.state.doseInfo[i][2].replaceAll('-', ' ') : null;
              var reportDate = this.GetDate(this.state.doseInfo[i][0], 5);
              var fullReportDate = this.GetDate(this.state.doseInfo[i][0], 0, 10);
              var popDataDate = this.GetDate(this.state.doseInfo[i][7], 0, 10);
              var available = this.GetDoses(this.state.doseInfo[i][6]);

              if (provider != null && provider.toUpperCase() === this.props.provider.toUpperCase() && reportDate !== null) {
                if (reportDate !== lastReportDate || available !== lastAvailable) {
                  var dayDiff = this.getDays(new Date(lastReportDate), new Date(reportDate));
                  dosesAdministered = lastAvailable - available;
                  if (dosesAdministered > 0 && dosesAdministered < 24 && available !== null) {
                    this.state.dosesAdministeredTotal += dosesAdministered;
                    if (this.state.firstAdminDate === null) {
                      this.state.firstAdminDate = lastFullReportDate;
                    }
                  }
                  else if (dosesAdministered < 0)
                  {
                    if (dosesAdministered < -12) {
                      var boxes = Math.ceil(Math.abs(dosesAdministered) / 24);
                      var administeredToday = (boxes * 24) + dosesAdministered;
                      this.state.dosesAdministeredTotal += administeredToday;
                      if (administeredToday > 0 && this.state.firstAdminDate === null) {
                        this.state.firstAdminDate = lastFullReportDate;
                      }
                    } 
                  }

                  this.state.chartData.labels[j] = reportDate;
                  if (lastPopDataDate !== popDataDate) {
                    this.state.availableData[j] = available;
                  } else {
                    this.state.noReportsData[j] = available;
                  }

                  j = j + 1;
                  lastReportDate = reportDate;
                  lastPopDataDate = popDataDate;
                  lastFullReportDate = fullReportDate;
                  lastAvailable = available;
                }
              }
          }

          this.props.shotsGiven.AddDoses(this.state.dosesAdministeredTotal);
          this.state.chartData.datasets = [{
            data: this.state.availableData,
            label: this.props.mini !== 'true' ? "Doses Reported (in stock)" : "Doses",
            borderColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
            backgroundColor: this.props.dataDate !== null ? '#ffa500' : '#00DD00',
            fill: false,
          },
          {
            data: this.state.noReportsData,
            label: this.props.mini !== 'true' ? "No Updates" : "No Updates",
            borderColor: this.props.dataDate !== null ? '#616161' : '#616161',
            pointRadius: '0',
            backgroundColor: this.props.dataDate !== null ? '#616161' : '#616161',
            fill: false,
          }];
          if (this.state.mounted) {
            this.setState({chartData:this.state.chartData});
          }
        }
      }


    getDoses () {
        return this.state.doseInfo[3][2];
    }
    getDays(day1, day2) {
      day1.setHours(0,0,0,0);
      day2.setHours(0,0,0,0);
      return (+day2 - +day1)/this.msInDay
    }
    render() {
        var dayDiff = this.getDays(new Date(this.state.firstAdminDate), new Date());

        return (
        <>
          <div id='doses'>
            <Chart type='line' id='chart' height='100' data={this.state.chartData} options={this.state.chartOptions} />
            <div> 
                {this.props.available} doses available as of {this.props.popUpdate}
            </div>
            {constantsSite.site === "Evusheld" ? 
            <>
              <div>
                Gives about {(this.state.dosesAdministeredTotal/dayDiff*7).toFixed(0)} doses a week.
              </div>
              <div title={this.state.dosesAdministeredTotal + " " + (this.state.dosesAdministeredTotal === 0 ? "doses ever given to patients" : "doses->patients since " + this.state.firstAdminDate)}>
                Has given {this.state.dosesAdministeredTotal} doses total.*
              </div>
            </>
            : false }
          </div>
          { this.props.mini !== 'true' ? 
          <div><br/><a href={this.baseUrl + this.props.zipCode + ".csv"}>raw inventory data ({this.props.zipCode+".csv"})</a></div>
           : false}
        </>
        );
      }
}

export default DoseViewer;