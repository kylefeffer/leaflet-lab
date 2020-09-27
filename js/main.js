/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map

    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);



function jsAjax(){
    // Step 1: Create the request 
    var ajaxRequest = new XMLHttpRequest();

    //Step 2: Create an event handler to send received data to a callback function
    ajaxRequest.onreadystatechange = function(){
        if (ajaxRequest.readyState === 4){
            callback(ajaxRequest.response);
        };
    };

    //Step 3: Open the server connection
    ajaxRequest.open('GET', 'data/MegaCities.geojson', true);

    //Step 4: Set the response data type
    ajaxRequest.responseType = "json";

    //Step 5: Send the request
    ajaxRequest.send();
};

//define callback function
function callback(response){
    //tasks using the data go here
    console.log(response);
};

window.onload = jsAjax();
