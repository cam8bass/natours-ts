
export const displatMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2FtZWk4aHQiLCJhIjoiY2xrMmVpdHVrMGRpdDNlbXFpcDF6dzdtYiJ9.Y1qbVeyvLeLogjFXG2MXJA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/camei8ht/clk2er37k00f101pefd7kd2oc',
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      elment: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup

    new mapboxgl.Popup({
      offset: 60
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 120,
      left: 100,
      right: 100
    }
  });
};
