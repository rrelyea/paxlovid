import reportWebVitals from './reportWebVitals';
import Papa from 'papaparse';
import React from 'react';
import ReactDOM from 'react-dom'
import MapChart from "./MapChart";
import allStates from "./data/allstates.json";
import DoseViewer from './DoseViewer.js'
import * as constantsSite from './constants-site.js';
import * as constantsBranch from './constants-branch.js';
import './App.css';
import TrackVisibility from 'react-on-screen';

var stateFilter = null;
var countyFilter = null;
var adjacentCounties = null;
var countiesPerState = null;
var cityFilter = null;
var zipFilter = null;
var providerFilter = null;
var body = "";
var pageLocation = "";
var dataUpdated = null;
var baseUri = "https://raw.githubusercontent.com/rrelyea/covid-therapeutics/" + constantsBranch.branch + "/";
var dataDate = null;

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

function navigateTo(state, county) {
  const params = new URLSearchParams(window.location.search);
  if (state !== "< STATE >" && state !== "" && state !== null) { 
    params.set('state', state);
    countiesPerState = null;
  } else if (params.has('state')) {
    params.delete('state');
  }

  if (county !== "< county >" && county !== "" && county !== null) { 
    params.set('county', toTitleCase(county))
  } else if (params.has('county')) {
    params.delete('county');
  }
  
  if (params.has('city')) params.delete('city');
  if (params.has('zip')) params.delete('zip');
  if (params.has('provider')) params.delete('provider');

  var paramsString = params.toString();
  window.history.replaceState({}, null, paramsString.length === 0 ? `${window.location.pathname}` : `${window.location.pathname}?${params.toString()}`);
  renderPage();
}

function renderPage() {
  if (states === null || mabSites === null) {
    return;
  }

  if (states !== null && dataDate !== null && mabSites0315 === null) {
    load0315Providers();
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);

  stateFilter = urlParams.has('state') ? urlParams.get('state').toUpperCase() : null;
  countyFilter = urlParams.has('county') ? urlParams.get('county').toUpperCase() : null;
  if (stateFilter != null && countyFilter !== null) {
    adjacentCounties = null;
    Papa.parse(baseUri + "data/counties/adjacency/"+stateFilter+"/"+countyFilter.toLowerCase()+".csv", {
      download: true,
      complete: function(download) {
        adjacentCounties = download.data;
        var neighboringCounties = document.getElementById('neighboringCounties');
        while (neighboringCounties.lastChild) {
          neighboringCounties.lastChild.remove();
        }

        for (var i = 0; i < adjacentCounties.length; i++) {
          var a = document.createElement('a');
          var item = adjacentCounties[i];
          a.href = "?state=" + item[1] + "&county=" + item[0];
          a.innerText = toTitleCase(item[0]) + (item[1] !== stateFilter ? "(" + item[1] + ")" : "");
          if (i > 0) {
            var space = document.createTextNode(" ");
            neighboringCounties.appendChild(space);
          }
          neighboringCounties.appendChild(a);
        }

        if (adjacentCounties.length < 1) {
          var noneStr = document.createTextNode("None");
          neighboringCounties.appendChild(noneStr);
        }
      }
    });
  }

  if (stateFilter !== null && countiesPerState === null) {
    Papa.parse(baseUri + "data/counties/per-state/"+stateFilter+".csv", {
      download: true,
      complete: function(download) {
        countiesPerState = download.data;
        var chooseCounty = document.getElementById('chooseCounty');
        if (chooseCounty != null) {
          while (chooseCounty.lastElementChild) {
            chooseCounty.removeChild(chooseCounty.lastElementChild);
          }
          for (var i = 0; i < countiesPerState.length; i++) {
            var option = document.createElement('option');
            var item = countiesPerState[i];
            option.value = item[0].toUpperCase();
            option.innerText = item[0];
            chooseCounty.appendChild(option);
            if (countyFilter !== null && item[0].toUpperCase() === countyFilter.toUpperCase()) {
              chooseCounty.value = item[0].toUpperCase();
            }
          }
        }
      }
    });
  }

  cityFilter = urlParams.has('city') ? urlParams.get('city').toUpperCase() : null;
  zipFilter = urlParams.has('zip') ? urlParams.get('zip') : null;
  providerFilter = urlParams.has('provider') ? urlParams.get('provider').toUpperCase().replaceAll('-',' ') : null;
  pageLocation = window.location.hash;

  if (zipFilter !== null && providerFilter !== null) {
    document.title = constantsSite.site + " '" + toTitleCase(providerFilter) + "'";
  } else {
    if (stateFilter !== null && countyFilter !== null) document.title = stateFilter + "/" + toTitleCase(countyFilter) + " " + constantsSite.site + " Providers in " + toTitleCase(countyFilter) + " County, " + stateFilter
    else if (stateFilter !== null && cityFilter !== null) document.title = stateFilter + "/" + toTitleCase(cityFilter) + " " + constantsSite.site + " Providers in " + toTitleCase(cityFilter) + ", " + stateFilter;
    else if (stateFilter !== null) document.title = stateFilter + " " + constantsSite.site + " Providers in " + stateFilter;
    else if (providerFilter !== null) document.title = constantsSite.site + " '" + toTitleCase(providerFilter) + "'"
    else document.title = constantsSite.site + " Providers in USA";
  }
  var page = 
    <div>
      <div >
        <NavigationHeader />
        <div>
          <ProviderHeader />
          <HarvestInfo />
          <NeighboringCounties />
          <ExplainDosesAdmin />
          <StateDetails />
        </div>
        <MedicineNavigator />
        <Footer />
      </div>
    </div>
    
  ReactDOM.render(page, document.getElementById('root'));
}

function NavigationHeader() {
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
      navigateTo(state_code, null);  
    }
    else
    {
      navigateTo("< STATE >", null);
    }
  }

  const handleStateChange = (e) => {
    navigateTo(e.target.value, null);
  }

  const handleCountyChange = (e) => {
    navigateTo(stateFilter, e.target.value);
  }

  var linkToState = stateFilter !== null ? "?state=" + stateFilter : window.location.pathname.split("?")[0];
  return zipFilter === null || providerFilter === null ?
    <>
      <div className='centered'>
        <label className='chooseState' htmlFor='chooseState'>{constantsSite.site} providers in:
        </label> <select className='mediumFont' id='chooseState' value={stateFilter !== null ? stateFilter.toUpperCase() : ""} onChange={(e) => handleStateChange(e)}>
          {states.data.map((state,index) => 
            <option key={index} value={index > 0 ? state[3].trim(): "< STATE >"}>{index > 0 ? state[2].trim() + " (" + state[3].trim() + ")" : "< state >"}</option>
          )} 
        </select> { stateFilter !== null ? <> <select className='mediumFont' id='chooseCounty' onChange={(e) => handleCountyChange(e)}>
          </select> { countyFilter !== null ? <a href={linkToState}>(clear)</a> : false }
        </> : false
        }
      </div>
      { cityFilter !== null ? <div className='centered'>City: {toTitleCase(cityFilter)} <a href={linkToState}>(clear)</a> </div> : false }
      { providerFilter !== null ? <div className='centered'>Provider contains '{providerFilter}' <a href={linkToState}>(clear)</a> </div> : false }
      { zipFilter !== null ? <div className='centered'>Zip Code: {zipFilter} </div> : false }
      <div onClick={mapClick} className='mapDiv'>
        <MapChart id='mapChart' />
      </div>
    </>
  : false;
}

function ProviderHeader() {
  return providerFilter !== null & zipFilter !== null ? 
    <>
      <div className='centered'>{constantsSite.site} Provider: <b>{toTitleCase(providerFilter)}</b></div>
      <div>&nbsp;</div>
    </> : false;
}

function HarvestInfo() {
  return <div className='smallerCentered'>
    [Data harvested from <a href="https://healthdata.gov/Health/COVID-19-Public-Therapeutic-Locator/rxn6-qnx8">healthdata.gov</a>, which last updated: {dataUpdated}]
  </div>;
}

function NeighboringCounties() {
  return stateFilter !== null && countyFilter !== null ? <>
    <div className='smallerCentered'>&nbsp;</div>
    <div className='centered'>
      <span>Neighboring Counties: </span>
      <span id='neighboringCounties'></span>
    </div>
    </> : false ;
}

function Warning() {
  const oldProvidersClick = () => {
    var check = document.getElementById('showOldData');
    dataDate = check.checked ? "03-15" : null;
    renderPage();
  }
  return zipFilter !== null || cityFilter !== null || countyFilter !== null || stateFilter !== null || providerFilter !== null ?
        <div className={ dataDate !== null ? "centeredOrange" : "centeredYellow" }>
          <div className='tinyFont'>&nbsp;</div>
          <div>WARNING: On March 16th, HHS.gov removed many providers &amp; all allotted counts. <label >Peek back at the 3/15 data: <input type='checkbox' id='showOldData' onClick={oldProvidersClick} defaultChecked={dataDate === "03-15"} /></label></div>
        </div> : false;
}

function StateDetails() {
  return <>
    <div className='smallerCentered'>&nbsp;</div>
    { GetStateDetails(states.data, dataDate !== null ? mabSites0315.data : mabSites.data) }
  </>;
}

function ExplainDosesAdmin() {
  return <>
    { (stateFilter !== null || zipFilter !== null || providerFilter !== null || cityFilter != null || countyFilter !== null) && constantsSite.site === "Evusheld" ? 
    <>
    <div className='tinyFont'>&nbsp;</div>
    <div className='smallerCentered'>* - doses given to patients is calculated data, not published data. We've programmed a best guess. Contact me if it seems way off.</div>
    </>
    : false }
  </>;
}

function GetStateDetails(states, providers) {
  const Providers = states.map((state,index) => {
    return GetProviderDetails(state, index, providers);
  })
  return (stateFilter !== null || zipFilter !== null || providerFilter !== null || cityFilter != null || countyFilter !== null)
      ? <>
        <table className='providerTable'>
          <thead>
            <tr key='header'>
              <th>&nbsp;State - County - City&nbsp;</th>
              <th>Provider</th>
              <th>Doses</th>
            </tr>
          </thead>
          {Providers}
        </table>
      </>
    : false;
}

function GetProviderDetails(state, index, providers) {
  const updateTextArea = () =>  {
    var mailtoLink = document.getElementById("mailtoLink");
    var textArea = document.getElementById("textArea");
    body = textArea.value;
    var subject = "Info about: " + toTitleCase(providerFilter)+' ('+zipFilter + ')';
    var email="evusheld-data@relyeas.net" 

    let params = subject || body ? '?' : '';
    if (subject) params += `subject=${encodeURIComponent(subject)}`;
    if (body) params += `${subject ? '&' : ''}body=${encodeURIComponent(body)}`;
    mailtoLink.href= `mailto:${email}${params}`;
  }
  if (state[3].trim() === "") return null;

  var availableTotal = 0;
  var providerCountTotals = 0;
  var firstLink = 0;

  var state_code = state[3] !== null ? state[3].trim() : state[3];

  var lastCity = "";
  var lastCounty = "";
  var lastState = "";
  var lastCityStyle = null;
  var cityMarkup = null;
  var providerList = providers.map((provider, index) => {
    // ignore blank lines in provider file
    if (provider.length === 1) 
    {
      return false;
    }

    const provider_state = provider[5].trim();
    var provider_x = null;
    var county = provider[4] !== null ? provider[4].trim() : provider[4];
    var city = provider[3] !== null ? provider[3].trim() : provider[3];

    if (provider_state === state_code) { 
      if ((stateFilter === null || stateFilter === state_code) 
         && (zipFilter === null || zipFilter === provider[6].substring(0,5))
         && (countyFilter === null || countyFilter === county.toUpperCase())
         && (cityFilter === null || cityFilter === city.toUpperCase())
         ) {
          var providerUpper = provider[0].replaceAll('-',' ').toUpperCase();
          provider_x = toTitleCase(provider[0]);
          if (providerFilter === null || providerUpper.includes(providerFilter) ) {
            // use encodeURIComponent for "#"
            var linkToProvider = "?provider=" + encodeURIComponent(provider_x.replaceAll(' ', '-')) + "&zip=" + provider[6].substring(0,5);
            var linkToState = "?state=" + state_code;
            var zipCode = provider[6].substring(0,5);
            var linkToCounty = linkToState + "&county=" + county;
            var linkToCity = linkToState + "&city=" + city;
            var firstRowOfCity = lastCity !== toTitleCase(city) || lastCounty !== county || lastState !== state_code;
            if (firstRowOfCity) {
              lastCity = toTitleCase(city); 
              lastState = state_code;
              lastCounty = county;
              cityMarkup = 
              <div className='countyCity'>
                <a href={linkToState}>{state_code}</a><br/>
                <a href={linkToCounty}>{toTitleCase(county)}</a><br/>
                <a href={linkToCity}>{toTitleCase(city)}</a>
              </div>;
              lastCityStyle = lastCityStyle === "odd" ? "even" : "odd";
            } else {
              cityMarkup = null;
            }

            var availableColNum = dataDate !== null ? 12 : 9;
            var available = toNumber(provider[availableColNum]);

            var npiColNum = dataDate !== null ? 15 : 11;
            var npi = provider[npiColNum].trim() === "" ? "" : "NPI# " + parseInt(provider[npiColNum]);
            availableTotal += available === "--" ? 0 : parseInt(available);
            providerCountTotals += 1;

            var reportDateColNum = dataDate !== null ? 13 : 12;
            return <><tr key={index} className={lastCityStyle}>
              <td>
                {cityMarkup}
              </td>
              <td className='tdProvider'>
                <div className='mediumFont'><a href={linkToProvider}>{provider_x}</a></div>
                <div>{toTitleCase(provider[1])}</div>
                { zipFilter !== null && providerFilter !== null ? <div>{toTitleCase(provider[2])}</div> : false }
                { zipFilter !== null && providerFilter !== null ? <div>{provider[6]}</div> : false }
                { zipFilter !== null && providerFilter !== null ? <div>{npi}</div> : false }
                <div className='tinyFont'>&nbsp;</div>
              </td>
              <td className='tdChart'>
                { zipFilter !== null && providerFilter !== null ? (<>
                  <div><span className='doseCount'>{available}</span> <span className='doseLabel'> avail @{toDate(provider[reportDateColNum])}</span></div>
                  <div className='tinyFont'>&nbsp;</div>
                </>) :
                (
                <>
                <a href={linkToProvider}>
                  <TrackVisibility partialVisibility offset={1000}>
                    {({ isVisible }) => isVisible && 
                      <DoseViewer zipCode={zipCode} provider={providerUpper} mini='true' available={available} site={constantsSite.siteLower} dataDate={dataDate} />
                    }
                  </TrackVisibility>
                </a>
                </>
                )}
              </td>
            </tr>
            {zipFilter !== null && providerFilter !== null && pageLocation==="" ?
              <tr key={index} className={lastCityStyle}>
                <td colSpan='3'>
                  <DoseViewer zipCode={zipFilter} provider={providerUpper} site={constantsSite.siteLower} dataDate={dataDate} />
                </td>
              </tr>
              :false
            }
            {zipFilter !== null && providerFilter !== null && constantsSite.site === "Evusheld" ?
              <tr key={index} className={lastCityStyle}>
                <td colSpan='3'>
                  <br/>
                  <h3>Add Info about Provider to Help Others</h3>
                  <div>You can help others by adding information about this provider!</div>
                  <ol>
                    <li>Fill out answers to questions in the yellow area below. Don't include information you wouldn't want published.</li>
                    <li>(Don't change the question text, as a computer will read the answers.)</li>
                    <li>Once you fill out the info, press the "Send this info" link below, then review and send the email.</li>
                  </ol>
                  If step 3 fails, do these manual steps to send the data to me:
                  
                  <ol>
                    <li>Create an email to: evusheld-data@relyeas.net</li>
                    <li>Make the subject exactly the following: "{"Info about: " + toTitleCase(providerFilter)+' ('+zipFilter + ')"'}</li>
                    <li>Copy and Paste the questions/answers from the yellow area below to the body of the message</li>
                    <li>Send that message!</li>
                  </ol>
                  <div>
                    I will publish some of this info to the Evusheld community on this site, to help others. I will not share your name or email address.</div>
                <textarea onChange={()=>updateTextArea()} id='textArea' className='textArea' defaultValue={'Evusheld Site Url: ' + window.location + '\nProvider\'s main web page: \nProvider\'s evusheld web page: \nProvider main phone #: \nProvider phone # for Evusheld: \nProvider email for Evusheld: \nDid you get Evusheld dose here? \nProviders in network instructions: \nProvider out of network instructions: \nDid they require a prescription? \nAre you in a waiting list to get a dose here? \nInfo about different priority groups in wait list: \nInfo about who they will give Evusheld to: \nOther info that will help others: \n'}></textarea>
                <br/>
                <a id='mailtoLink' href="mailto:evusheld-info@relyeas.net">
                  Send this info
                </a>
                </td>
              </tr>
              :false
            }
            {zipFilter !== null && providerFilter !== null && pageLocation!=="" && constantsSite.site === "Evusheld" ?
              <tr key={index} className={lastCityStyle}>
                <td colSpan='3'>
                  <DoseViewer zipCode={zipFilter} provider={providerUpper} />
                </td>
              </tr>
              :false
            }
            </>
        }
      }
    }
    return null;
  });

  var header = state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
  <tr key={index}>
    <td className='infoLabels'>
      {state[2]} Health Dept:
    </td>
    <td className='stateInfo' colSpan='2'>
    <span>{state[7] !== "" ? <span>{firstLink++ === 0?"":"|"} <a href={'https://'+SwapKeyword(state[7], constantsSite.site)}>{"'" + constantsSite.site + "' search"}</a></span> : false }</span>
      <span>{state[8] !== ""? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+state[8]}>Covid Info</a></span> : false }</span>
      <span>{state[0] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={"https://"+state[0]}>{state[0]}</a></span> : false }</span>
      <span>{state[5] !== "" ? <span><span> | </span><a href={"mailto:"+state[5]}>{state[5]}</a></span> : ""}</span>  
      <span>{state[6] !== "" ? " | " + state[6] : ""}</span> 
      <span>{state[4] !== "" ? <span> | <a href={"https://twitter.com/"+state[4]}>{'@'+state[4]}</a></span> : false } </span> 
    </td>
  </tr>
  : false;

  // calculate population for state per 100k people.
  var pop100ks = state[11]/100000;
  var show100kStats = stateFilter !== null && countyFilter === null && cityFilter === null;
  var totals = state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
  <tr key={'totals'} className='totals'>
    <td className='infoLabels'>{cityFilter !== null ? toTitleCase(cityFilter):(countyFilter !== null? toTitleCase(countyFilter) + " County":(zipFilter!=null?"Zip":(stateFilter != null ? "State":"")))} Totals:</td>
    <td className='centered'>{providerCountTotals} providers</td>
    <td className='doseCount'>
      {'Available: ' + availableTotal + (show100kStats ? ' (' + (availableTotal / pop100ks).toFixed(1) +' /100k)' : "")}<br/>
    </td>
  </tr>
  : false;

  return <tbody>
       { stateFilter !== null && state_code === stateFilter ? header : false }
       { (stateFilter !== null && state_code===stateFilter) && (zipFilter !== null || countyFilter !== null || cityFilter !== null | stateFilter !== null) ? totals : false}
       { providerList }
       </tbody>
}

function MedicineNavigator() {
  return zipFilter === null && providerFilter === null ?
    <>
    <div className='smallerCentered'>&nbsp;</div>
    <div className='smallerCentered'>
        <b>Preventive Medicine:</b> <a href='https://vaccines.gov'>vaccine/boost</a>, <a href={'https://rrelyea.github.io/evusheld'+window.location.search}>evusheld</a> <b>Prevention:</b> <a href='https://www.cdc.gov/coronavirus/2019-ncov/testing/self-testing.html'>rapid tests (CDC)</a>, ventilation (<a href='https://www.epa.gov/coronavirus/ventilation-and-coronavirus-covid-19'>EPA</a>, <a href='https://www.cdc.gov/coronavirus/2019-ncov/community/ventilation.html'>CDC</a>), <a href='https://www.cdc.gov/coronavirus/2019-ncov/prevent-getting-sick/masks.html'>masking (CDC)</a> <b>Treatments:</b> <a href={'https://rrelyea.github.io/paxlovid'+window.location.search}>paxlovid</a>, <a href={'https://rrelyea.github.io/bebtelovimab'+window.location.search}>bebtelovimab</a>, <a href={'https://rrelyea.github.io/lagevrio'+window.location.search}>lagevrio</a>, <a href='https://covid-19-therapeutics-locator-dhhs.hub.arcgis.com/'>HHS Locator</a>
    </div>
    </>
    : false;
}

function Footer() {
  return <>
    <div className='smallerFont'>&nbsp;</div>
    <div className='smallerCentered'>
      <b>Why:</b> <a href='https://www.geekwire.com/2022/after-wife-got-cancer-microsoft-engineer-built-a-tool-to-locate-anti-covid-drug-for-immunocompromised/'>why I built this site</a> <b>Contact Info:</b> <a href='https://twitter.com/rrelyea'>twitter</a>, <a href='https://linktr.ee/rrelyea'>email/more</a> <b>Sponsor:</b> <a href='https://buymeacoffee.com/rrelyea'>buy me a coffee?</a>, <b>Programmers:</b> <a href={"https://github.com/rrelyea/"+constantsSite.site.toLowerCase()}>{'/'+ constantsSite.siteLower}</a>, <a href="https://github.com/rrelyea/covid-therapeutics">/covid-therapeutics</a>
    </div>
    <div className='smallerCentered'>&nbsp;</div>
  </>;
}
var mabSites0315 = null;
var mabSites = null;
var states = null;

function load0315Providers() {
  var providers0315 = baseUri + "data/therapeutics/2022-03-15-Snapshot/"+constantsSite.siteLower+"-data.csv"
  Papa.parse(providers0315, {
    download: true,
    complete: function(mabResults) {
      mabSites0315 = mabResults;
      renderPage();
    }
  });
}

function loadData() {
  var currentProviders = baseUri + "data/therapeutics/"+constantsSite.siteLower+"/"+constantsSite.siteLower+"-providers.csv"
  Papa.parse(currentProviders, {
    download: true,
    complete: function(mabResults) {
      mabSites = mabResults;
      renderPage();
    }
  });


  var currentTime = new Date();
  var urlSuffix = currentTime.getMinutes() + "-" + currentTime.getSeconds();
  Papa.parse(baseUri + "data/states/state-health-info.csv?"+urlSuffix, {
    download: true,
    complete: function(stateResults) {
      states = stateResults;
      renderPage();
    }
  });

  Papa.parse(baseUri + "data/therapeutics/process-dates.csv", {
    download: true,
    complete: function(lastProcessedData) {
      // parse date as UTC, but it is really eastern time, so add 5 hours to have correct UTC time.
      var dataUpdatedDate = new Date(lastProcessedData.data[0][0] + 'Z');
      dataUpdatedDate.setHours(dataUpdatedDate.getHours() + 5);

      // create string with local time/date
      dataUpdated = dataUpdatedDate.toLocaleString('en-US', {weekday: 'short', month: 'numeric', day:'numeric', hour:'numeric', minute:'numeric', timeZoneName: 'short' });
      renderPage();
    }
  });
}
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

function App() {
  loadData();
  return (
    <div className="App">
    </div>
  );
}

export default App;
