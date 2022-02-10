import React from "react";
import { geoCentroid } from "d3-geo";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation
} from "react-simple-maps";

import allStates from "./data/allstates.json";

const stateStyle = {
  default: {
      outline: 'none',
      fill: '#DDD',
  },
  hover: {
      outline: 'none',
      fill: 'lightgreen',
  },
  pressed: {
      outline: 'none',
      fill: 'greenyellow',
  }
}
const styles = {
  text: {
    pointerEvents: 'none',
  }
}

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const offsets = {
  VT: [50, -8],
  NH: [34, 2],
  MA: [30, -1],
  RI: [28, 2],
  CT: [35, 10],
  NJ: [34, 1],
  DE: [33, 0],
  MD: [47, 10],
  DC: [49, 21]
};

const MapChart = () => {
  return (
    <ComposableMap projection="geoAlbersUsa">
      <Geographies geography={geoUrl} id="mapGeographies">
        {({ geographies }) => (
          <>
            {geographies.map(geo => {
            return (
              <Geography
                key={geo.rsmKey}
                stroke="#FFF"
                geography={geo}
                style={stateStyle}
              />
            )
            }
            )}
            {geographies.map(geo => {
              const centroid = geoCentroid(geo);
              const cur = allStates.find(s => s.val === geo.id);
              return (
                <g key={geo.rsmKey + "-name"}>
                  {cur &&
                    centroid[0] > -160 &&
                    centroid[0] < -67 &&
                    (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                      <Marker coordinates={centroid}>
                        <text y="2" fontSize={14} textAnchor="middle" style={styles.text}>
                          {cur.id}
                        </text>
                      </Marker>
                    ) : (
                      <Annotation
                        subject={centroid}
                        dx={offsets[cur.id][0]}
                        dy={offsets[cur.id][1]}
                      >
                        <text x={4} fontSize={14} alignmentBaseline="middle" style={styles.text}>
                          {cur.id}
                        </text>
                      </Annotation>
                    ))}
                </g>
              );
            })}
          </>
        )}
      </Geographies>
    </ComposableMap>
  );
};

export default MapChart;
