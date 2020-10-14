/* Map of GeoJSON data from airports_origin.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [37.8, -96],
        zoom: 3
    });

    //add OSM base tilelayer
    var osm = new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | <a href="https://www.transtats.bts.gov/Data_Elements.aspx">Bureau of Transportation Statistics</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

//Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/airports_origin.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            //call function to create slider
            createSequenceControls(map, attributes);
            //call function to create symbol resizing
            createResymbolizeControls(map, attributes);
        }
    });
};

//initial creation of attributes
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with year over year values
        if (attribute.indexOf("yy") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function calcPropRadius(attValue, scale = 60) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = scale;
    //area based on attribute value and scale factor
    var area = Math.abs(attValue) * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute, scale, color_positive = "green", color_negative = "red"){
    map.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties[attribute]){

            //access feature properties
            var props = layer.feature.properties;

            if (props[attribute] > 0) {
                layer.setStyle({fillColor : color_positive});               
            }; if (props[attribute] < 0) {
                layer.setStyle({fillColor : color_negative});
            };

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute], scale);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>Airport:</b> " + props.Airport + "</p>";
            popupContent += "<p><b>IATA Code:</b> " + props.IATA_Code + "</p>";
            popupContent += "<p><b>City:</b> " + props.City + "</p>";

            //add formatted attribute to panel content string
            var date = attribute.split("_")[0];
            popupContent += "<p><b>Year Over Year Change in  " + date + ":</b> " + Number(Math.round(props[attribute] + 'e3') + 'e-3').toString() + "%</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });

        layer.on({
            mouseover: function(){
            this.openPopup();
        },
            mouseout: function(){
            this.closePopup();
        },
            click: function(){
            $("#info-panel").html(popupContent);
        }
    });
        };
    });
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    //create marker options for positive values
    if (feature.properties[attribute] > 0){

        var options = {
            fillColor: "green",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
        };
    };    

    //create marker options for negative values
    if (feature.properties[attribute] < 0){

        var options = {
            fillColor: "red",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
        };
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Airport:</b> " + feature.properties.Airport + "</p>";
    popupContent += "<p><b>IATA Code:</b> " + feature.properties.IATA_Code + "</p>";
    popupContent += "<p><b>City:</b> " + feature.properties.City + "</p>";

    //add formatted attribute to popup content string
    var date = attribute.split("_")[0];
    popupContent += "<p><b>Year Over Year Change in  " + date + ":</b> " +  Number(Math.round(feature.properties[attribute] + 'e3') + 'e-3').toString() + "%</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    //event listeners to open popup on hover and fill panel on click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#info-panel").html(popupContent);
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//adds sequence controls
function createSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel-slider').append('<input class="range-slider" type="range">');

    //set slider attributes
    $('.range-slider').attr({
        max: 20,
        min: 0,
        value: 0,
        step: 1
    });

    //add skip buttons
    $('#panel-slider').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel-slider').append('<button class="skip" id="forward">Skip</button>');

    //add current attribute label
    $('#title-panel').html('Current View:<b> ' + attributes[0].split("_")[0] +'</b>');

    //stylize buttons
    $('#reverse').html('<i class="fas fa-backward"></i>');
    $('#forward').html('<i class="fas fa-forward"></i>');


    //input listener for slider
    $('.range-slider').on('input', function(){
        //get the new index value
        var index = $(this).val();
        console.log(index)
        $('#title-panel').html('Current View:<b> ' + attributes[index].split("_")[0] +'</b>');

        //Called in both skip button and slider event listener handlers
        //pass new attribute to update symbols
        updatePropSymbols(map, attributes[index], parseInt($('.rescaler-slider').val()));
    });

    //click listener for buttons
    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //if past the last attribute, wrap around to first attribute
            index = index > 20 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if past the first attribute, wrap around to last attribute
            index = index < 0 ? 20 : index;
        };
        $('#title-panel').html('Current View:<b> ' + attributes[index].split("_")[0] +'</b>');

        //update slider
        $('.range-slider').val(index);

        //Called in both skip button and slider event listener handlers
        //pass new attribute to update symbols
        updatePropSymbols(map, attributes[index], parseInt($('.rescaler-slider').val()));
    });
};

//add resymbolizing controls
function createResymbolizeControls(map, attributes){
    //create range input element (slider)
    $('#scale-slider').append('<input class="rescaler-slider" type="range">');

    //set slider attributes
    $('.rescaler-slider').attr({
        max: 400,
        min: 0,
        value: 60,
        step: 20
    });

    //add grow/shrink buttons
    $('#scale-slider').append('<button class="skip" id="shrink">Skrink</button>');
    $('#scale-slider').append('<button class="skip" id="grow">Grow</button>');

    //stylize grow/shrink buttons
    $('#shrink').html('<i class="fas fa-compress-arrows-alt"></i>');
    $('#grow').html('<i class="fas fa-expand-arrows-alt"></i>');


    //input listener for slider
    $('.rescaler-slider').on('input', function(){
        //get the new scale value
        var scale = $(this).val();
        console.log(scale);

        //Called in both skip button and slider event listener handlers
        //pass new scale to update symbols
        updatePropSymbols(map, attributes[$('.range-slider').val()], scale);
    });

    //click listener for buttons
    $('.skip').click(function(){
        //get the old scale value
        var scale = parseInt($('.rescaler-slider').val());

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'grow'){
            scale = scale + 20;
            //if past the last attribute, wrap around to first attribute
            scale = scale > 400 ? 0 : scale;
        } else if ($(this).attr('id') == 'shrink'){
            scale = scale - 20;
            //if past the first attribute, wrap around to last attribute
            scale = scale < 0 ? 400 : scale;
        };

        //update slider
        $('.rescaler-slider').val(scale);
        console.log(scale)

        //Called in both skip button and slider event listener handlers
        //pass new scale to update symbols
        updatePropSymbols(map, attributes[$('.range-slider').val()], scale);
    });
};

$(document).ready(createMap);