import React, { useMemo, useState } from 'react';
import * as turf from '@turf/turf';
import { assignZoneTags } from '../services/zoneTagging';

// Helper to create polygon feature from coordinates
const makePoly = (coords, id, name) =>
  turf.polygon([coords], { id, name });

// Helper to create point feature from coordinates
const makePoint = (coords, id, name) =>
  turf.point(coords, { id, name });

// Helper to format feature for display
const pretty = (feature) => ({
  id: feature.properties?.id,
  name: feature.properties?.name,
  zoneType: feature.properties?.zoneType || null,
  subType: feature.properties?.subType || null,
  // Optional: show area or centroid for debugging
  centroid: feature.properties.zoneType
    ? turf.centroid(feature).geometry.coordinates
    : null
});

const mockData = {
  gateNode: makePoint([106.775, 10.766], 'gate-1', 'Main Gate'),
  buildings: [
    makePoly(
      [
        [106.77495, 10.76605],
        [106.77515, 10.76605],
        [106.77515, 10.76585],
        [106.77495, 10.76585],
        [106.77495, 10.76605]
      ],
      'bldg-near-gate',
      'Gate Warehouse'
    ),
    makePoly(
      [
        [106.7784, 10.7683],
        [106.77875, 10.7683],
        [106.77875, 10.76795],
        [106.7784, 10.76795],
        [106.7784, 10.7683]
      ],
      'bldg-far',
      'Far Storage'
    )
  ],
  zones: [
    makePoly(
      [
        [106.77498, 10.76602],
        [106.77518, 10.76602],
        [106.77518, 10.76582],
        [106.77498, 10.76582],
        [106.77498, 10.76602]
      ],
      'zone-covered',
      'Covered Yard'
    ),
    makePoly(
      [
        [106.77502, 10.76615],
        [106.77522, 10.76615],
        [106.77522, 10.76595],
        [106.77502, 10.76595],
        [106.77502, 10.76615]
      ],
      'zone-customs',
      'Customs Yard'
    ),
    makePoly(
      [
        [106.77895, 10.7692],
        [106.77925, 10.7692],
        [106.77925, 10.7689],
        [106.77895, 10.7689],
        [106.77895, 10.7692]
      ],
      'zone-dangerous',
      'Isolated Yard'
    ),
    makePoly(
      [
        [106.7761, 10.7671],
        [106.77635, 10.7671],
        [106.77635, 10.76685],
        [106.7761, 10.76685],
        [106.7761, 10.7671]
      ],
      'zone-open',
      'Open Yard'
    )
  ]
};

function TaggingTest() {
  const [result, setResult] = useState(null);

  const inputJson = useMemo(() => ({
    gateNode: pretty(mockData.gateNode),
    buildings: mockData.buildings.map(pretty),
    zones: mockData.zones.map(pretty)
  }), []);

  const run = () => {
    const tagged = assignZoneTags(
      mockData.zones,
      mockData.buildings,
      mockData.gateNode
    );
    setResult(tagged.map(pretty));
    console.log('Tagged zones:', result);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      background: '#0b1326',
      color: '#e5eefc',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px 1fr',
        gap: '16px',
        alignItems: 'start'
      }}>
        <section style={{
          background: '#131b2e',
          border: '1px solid #2d3449',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: '18px'
          }}>Input</h2>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>{JSON.stringify(inputJson, null, 2)}</pre>
        </section>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <button
            type="button"
            onClick={run}
            style={{
              padding: '12px 16px',
              border: '1px solid #4d8eff',
              background: '#1d4ed8',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
            }}
          >
            Run Heuristic Tagging
          </button>
        </div>

        <section style={{
          background: '#131b2e',
          border: '1px solid #2d3449',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: '18px'
          }}>Output</h2>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
            {result ? JSON.stringify(result, null, 2) : 'Click the button to run tagging.'}
          </pre>
        </section>
      </div>
    </div>
  );
}

export default TaggingTest;