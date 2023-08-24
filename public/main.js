// initialize Leaflet
var map = L.map("map").setView({ lon: 24.4391, lat: 60.05 }, 10);

// add the OpenStreetMap tiles
L.tileLayer("./tiles/{z}/{x}/{y}", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
}).addTo(map);

// show the scale bar on the lower left corner
L.control.scale({ metric: true }).addTo(map);
