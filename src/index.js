import reportWebVitals from './reportWebVitals';
import Papa from 'papaparse';
import React from 'react';
import ReactDOM from 'react-dom'
import MapChart from "./MapChart";
import allStates from "./data/allstates.json";

const styles = {
  countyCity: {
    fontSize: '14pt'
  },
  providerTable: {
    marginLeft: '10px',
    marginTop: '30px',
    marginBottom: '30px',
    margin: '0 auto',
  },
  doseCount: {
    fontSize: '14pt',
    verticalAlign: 'bottom'
  },
  doseLabel: {
    verticalAlign: 'top',
  },
  mediumFont: {
    fontSize: '14pt'
  },  
  smallerFont: {
    fontSize: '10pt'
  },
  tinyFont: {
    fontSize: '5pt'
  },  
  chooseState: {
    fontSize: '18pt'
  },
  mapDiv: {
    margin: '0 auto',
    height: '250px',
    width: '350px',
  },
  centered: {
    textAlign: 'center',
  },
  td: {
    verticalAlign: 'top',
    wordWrap: 'break-word',
  },
  // table color theme started with primary color of #f1ec90 and used https://material.io/design/color/the-color-system.html#tools-for-picking-colors
  th: {
    position: 'sticky',
    backgroundColor: '#9095f1',
    top: '0px',
    zIndex: 2,
    fontSize: '20px'
  },
  odd: {
    background: 'white',
  },
  even: {
    background: '#f1ec90',
  },
  stateInfo: {
    backgroundColor: '#f1bb90',
    textAlign: 'left',
    paddingLeft: '10px',
  },
  infoLabels: {
    backgroundColor: '#f1bb90',
    textAlign: 'right',
    paddingRight: '10px',
  },
  totals: {
    lineHeight: '60px',
    padding: '0 0',
    backgroundColor: '#f1bb90',
  },
}

var state_filter = "";

function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

function toNumber(str) {
  if (str.trim() === "") {
    return "--";
  }
  else
  {
    return parseFloat(str).toFixed(0);
  }
}

function GetStateDetails(states, providers) {
  const StateDetails = states.map((state,index) => {
    return GetProviderDetails(state, index, providers);
  })
  if (state_filter !== "")
  {
    return (
      <table style={styles.providerTable}>
        <thead>
        <tr>
          <th style={styles.th}>State / County / City</th>
          <th style={styles.th}>Provider / Address1 / Address2 / ZipCode</th>
          <th style={styles.th}>Available / Allotted</th>
        </tr>
        </thead>
        {StateDetails}
      </table>);
  }
  else
  {
    return <div></div>
  }
}

function toDate(str) {
  if (str.trim() === "") {
    return "--";
  }
  else
  {
    var dateString = (new Date(str)).toDateString();
    var dateLength = dateString.length;
    return dateString.substring(0, dateLength - 5);
  }
}

function SwapKeyword(url, keyword) {
  return url.replace("KEYWORD", keyword)
}

function GetProviderDetails(state, index, providers) {
  switch (state_filter) {
    case null:
    case "":
      return null
    case "ALL":
    case state[3].trim():
      break;
    default:
      return null;
  }

  if (state[3].trim() === "") return null;

  var lastCity = "";
  var lastCityStyle = null;
  var remainingState = 0;
  var orderedState = 0;
  var firstLink = 0;
  return <tbody>
             { state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
          <tr>
            <td style={styles.infoLabels}>
              {state[2]} Health Dept Links:
            </td>
            <td style={styles.stateInfo} colSpan='2'>
              <span>{state[7] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+SwapKeyword(state[7],'Paxlovid')}>'Paxlovid' search</a></span> : false }</span>
              <span>{state[8] !== ""? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+state[8]}>Covid Info</a></span> : false }</span>
              <span>{state[0] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={"https://"+state[0]}>{state[0]}</a></span> : false }</span>
              <span>{state[5] != "" ? <span><span> | </span><a href={"mailto:"+state[5]}>{state[5]}</a></span> : ""}</span>  
              <span>{state[6] != "" ? " | " + state[6] : ""}</span> 
              <span>{state[4] != "" ? <span> | <a href={"https://twitter.com/"+state[4]}>{'@'+state[4]}</a></span> : false } </span> 
            </td>
          </tr>
          : false
         }
       {
        providers.map((provider, index) => {
          // skip blank lines
          if (provider.length === 1) 
          {
            return false;
          }

          const provider_state = provider[5].trim();
          var countyCity = null;
          var provider_x = null;
          var state_code = state[3] !== null ? state[3].trim() : state[3];
          var county = provider[4] !== null ? provider[4].trim() : provider[4];
          var city = provider[3] !== null ? provider[3].trim() : provider[3];

          if (provider_state === state_code) {
            if (lastCity !== toTitleCase(city)) {
              lastCity = toTitleCase(city);
              countyCity = state_code + " / " + toTitleCase(county) + " / " + toTitleCase(city);
              lastCityStyle = lastCityStyle === styles.odd ? styles.even : styles.odd;
            }
            
            provider_x = toTitleCase(provider[0]);

            var remaining = toNumber(provider[12]);
            var ordered = toNumber(provider[11]);
            var npi = provider[15].trim() === "" ? "" : "NPI# " + parseInt(provider[15]);
            remainingState += remaining === "--" ? 0 : parseInt(remaining);
            orderedState += ordered === "--" ? 0 : parseInt(ordered);
            return   <tr key={state_code+"-"+index.toString()} style={lastCityStyle}>
                        <td style={styles.td}>
                          <div style={styles.countyCity}>{countyCity}</div>
                        </td>
                      <td style={styles.td}>
                        <div style={styles.mediumFont}>{provider_x}</div>
                        <div>{provider[1]}</div>
                        <div>{provider[2]}</div>
                        <div>{provider[6]}</div>
                        <div>{npi}</div>
                      </td>
                      <td style={styles.td}>
                        <div><span style={styles.doseCount}>{remaining}</span> <span style={styles.doseLabel}> avail @{toDate(provider[13])}</span></div>
                        <div><span style={styles.doseCount}>{ordered}</span> <span style={styles.doseLabel}> allotted @{toDate(provider[9])}</span></div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;Last delivery: {toDate(provider[10])}</div>
                        <div style={styles.tinyFont}>&nbsp;</div>
                      </td>
                      </tr>
          }

        }
       )}
         { state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
          <tr style={styles.totals}>
            <td style={styles.totals}>&nbsp;</td>
            <td style={styles.doseCount}>{state[2]} Totals:</td>
            <td style={styles.doseCount}>{remainingState + " / " + orderedState}</td>
          </tr>
          : false
         }
       </tbody>
}

function navigateToState(state) {
  const params = new URLSearchParams(window.location.search);
  params.set('state', state);
  window.history.replaceState({}, "Paxlovid (" + state + ")", `${window.location.pathname}?${params.toString()}`);
  renderPage(states, providerSites, dataUpdates);
}

function renderPage(states, providerSites, dataUpdates) {
  const handleChange = (e) => {
    navigateToState(e.target.value);
  }
  const mapClick = (e) => {
    var element = e.target;
    var state_code = null;
    if (element.tagName === "text")
    {
      state_code = element.innerHTML;
    }
    else if (element.tagName === "path")
    {
      var parent = element.parentElement;
      var index = Array.from(parent.children).indexOf(element);
      const cur = allStates.find(s => s.index === index);
      state_code = cur.id;
    }

    var chooseState = document.getElementById('chooseState');

    if (state_code !== null) {
      chooseState.value = state_code;
      navigateToState(state_code);  
    }
    else
    {
      chooseState.value = "ChooseState";
      navigateToState("");
    }
  }

  if (states != null && providerSites != null)
  {
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('state')) {
      state_filter = urlParams.get('state').toUpperCase();
    }

    var dataUpdated = new Date(dataUpdates.data[0][0]);
    var dataUpdatedLocalString = dataUpdated.toLocaleString('en-US', { weekday: 'short', month: 'numeric', day:'numeric', hour:'numeric', minute:'numeric', timeZoneName: 'short' });

    var page = 
      <div>
        <div style={styles.centered}>
          <label style={styles.chooseState} htmlFor='chooseState'>Paxlovid order/inventory info for:&nbsp;</label>
          <select style={styles.mediumFont} id='chooseState' value={state_filter !== null ? state_filter.toUpperCase() : ""} onChange={(e) => handleChange(e)}>
            <option value="ChooseState">Choose State</option>
            {states.data.map((state,index) => 
              <option key={index} value={index > 0 ? state[3].trim(): "ALL"}>{index > 0 ? state[2].trim() + " (" + state[3].trim() + ")" : "All States & Territories"}</option>
            )} 
          </select>
          <div style={styles.smallerFont}>
            [Data harvested from <a href="https://healthdata.gov/Health/COVID-19-Public-Therapeutic-Locator/rxn6-qnx8">healthdata.gov</a>, which last updated: {dataUpdatedLocalString}]
          </div>
          <div onClick={mapClick} style={styles.mapDiv}>
            <MapChart id='mapChart' />
          </div>
          
          <div style={styles.smallerFont}>
            (or view same data in <a href="https://covid-19-therapeutics-locator-dhhs.hub.arcgis.com/">a searchable map (HHS)</a>, <a href="https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/paxlovid-data.csv">CSV File</a>, or <a href="https://healthdata.gov/Health/COVID-19-Public-Therapeutic-Locator/rxn6-qnx8/data">healthdata.gov</a>)
          </div>
          <div style={styles.smallerFont}>&nbsp;</div>
          <div>
              { 
                GetStateDetails(states.data, providerSites.data)
              }
          </div>
          <div style={styles.smallerFont}>&nbsp;</div>
          <div style={styles.smallerFont}>
            Contact: <a href="https://twitter.com/rrelyea">@rrelyea</a> or <a href="mailto:rob@relyeas.net">rob@relyeas.net</a> | 
            Github repo for <a href="https://github.com/rrelyea/paxlovid">this site</a> and <a href="https://github.com/rrelyea/evusheld-locations-history">data fetching</a> |
            Prevention locator: vaccine &amp; <a href="https://rrelyea.github.io/evusheld">evusheld</a> |
            Treatment locator: <a href="https://rrelyea.github.io/sotrovimab">sotrovimab</a>
          </div>
        </div>
      </div>
      
    ReactDOM.render(page, document.getElementById('root'));
  }
}

var providerSites = null;
Papa.parse("https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/paxlovid-data.csv", {
  download: true,
  complete: function(providerResults) {
    providerSites = providerResults;
    renderPage(states, providerSites, dataUpdates);
  }
});

var states = null;

var currentTime = new Date();
var urlSuffix = currentTime.getMinutes() + "-" + currentTime.getSeconds();
Papa.parse("https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/state-health-departments.csv?"+urlSuffix, {
  download: true,
  complete: function(stateResults) {
    states = stateResults;
    renderPage(states, providerSites, dataUpdates);
  }
});

var dataUpdates = null;
Papa.parse("https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/data/paxlovid-data-updates.log", {
  download: true,
  complete: function(updates) {
    dataUpdates = updates;
    renderPage(states, providerSites, dataUpdates);
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
