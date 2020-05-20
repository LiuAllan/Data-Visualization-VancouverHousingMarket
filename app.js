// Created by:
// Allan Liu
// Himmat Tiwana

var svgWidth = 400, svgHeight = 300, barPadding = 2, scale=svgHeight;
var dataglobal;
var worldglobal;
var yearglobal = "2001";
var dimensionglobal = "pop";
var max = 62030; //legend initial max value - population is always first
var min = 6995;
var l_color = "#0f4c75";

var medians2k16 = {
  pop: 30195,
  price: 1370949,
  rent : 1302
};

//d3.csv("../data/simpledat.csv", parser, accessor)
d3.csv("./data/realdata.csv", real_parser, accessor)
//d3.csv("../data/realdata.csv", real_parser, priceaccessor)

var tooltip = d3.select("#vanmap").append('div')
  .attr("class", "hidden tooltip");



function parser(d){

    return {
      area: d.area,
      pop: parseInt(d.pop.replace(",","")),
      potatoes: +d.potatoes
    };
}

function real_parser(d){
    // console.log(d);
    return {
      area: d.area,
      pop2001: +d.TotalPop2001,
      price2001: +d.AverageValueofDwelling2001,
	  rent2001: +d.AverageRent2001,
      pop2006: +d.TotalPop2006,
      price2006: +d.AverageValueofDwelling2006,
	  rent2006: +d.AverageRent2006,
      pop2016: +d.TotalPop2016,
      price2016: +d.AverageValueofDwelling2016,
	  rent2016: +d.AverageRent2016,
    owners2001: +d.Owneroccupied2001,
    tenants2001: +d.Tenantoccupied2001,
    owners2006: +d.Owneroccupied2006,
    tenants2006: +d.Tenantoccupied2006,
    owners2016: +d.Owneroccupied2016,
    tenants2016: +d.Tenantoccupied2016,
    };
}



function accessor(error,data){
      if(error){
        console.log(error);
      }else{
        d3.json("./data/van-noestdt.json", map)
        function map(err, world)
        {
          if(err){
            console.log(err)
          }else{
            dataglobal = data;
            worldglobal = world;
            plotmap();

          }
        }
    }
}

function plotbars(data){
  var barWidth = svgWidth/data.length;

  var svg = d3.select('#vanbars')
     .append("svg")
     .attr("width", svgWidth)
     .attr("height", svgHeight);

  var groups = svg.selectAll("g")
      .data(data)
      .enter()
      .append("g");

  groups.append("rect")
      .attr("x", (d,i) => i*(barWidth))
      .attr("y", d => svgHeight - ((d.pop -6000)/38000)*svgHeight)
      .attr("height", function(d) {
          return ((d.pop -6000)/38000)*svgHeight;
      })
      .attr("width", barWidth-barPadding);

  groups.append("text")
      .text(d => d.area)
      .attr('x',(d,i) => i*(barWidth))
      .attr('y', 50)
      .attr("transform", d => "rotate(0)");
}

// Changes color depending on the dimension selected
function change_color()
{
  switch(dimensionglobal){
      case "rent":
        return "#670F75";
        break;
      case "price":
        return "#12750F";
        break;
      default:
        return "#0f4c75";
  }
}

function tooltip_string()
{
  switch(dimensionglobal){
        case "rent":
          return "<b>Average Rent: $</b>";
          break;
        case "price":
          return "<b>Market Value: $</b>";
          break;
        default:
          return "<b>Population: </b>";
    }
}
const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function plotmap(){
  d3.selectAll("svg").remove();
  legend(min, max, l_color);
  console.log("drawing map for " + dimensionglobal + yearglobal );
  var dim = dimensionglobal+yearglobal;
  let dimension_data = dataglobal.map(d => d[dim]);
  let dim_data = dimension_data.slice(0,-2);//removes values for entire city/area of vancouver
  var dim_max = Math.max(...dim_data);
  console.log("dim max is "+dim_max);
  var dim_min = Math.min(...dimension_data);
  var dim_range = dim_max - dim_min;
  var dim_median = median(dimension_data);
  console.log("dim min is "+dim_min);
  console.log("dim median is "+dim_median);

  let renterdim = "tenants" + yearglobal;
  let ownerdim = "owners" + yearglobal;

  var renters = dataglobal.map(d => d[renterdim])
  var owners = dataglobal.map(d => d[ownerdim])

  var dim_2k16_diff = medians2k16[dimensionglobal] - dim_median;
  // console.log("dim diff from 2k16 is "+dim_2k16_diff);
  // console.log("dim range is "+dim_range);


  var width = 900,height = 600;

  var mapsvg = d3.select( "#vanmap" )
    .append( "svg" )
    .attr("id","areas")
    .attr( "width", width )
    .attr( "height", height );

  // Projection
  var projection = d3.geoMercator().fitExtent([[10, 10], [800 - 10, 600 - 10]], worldglobal)

  var geoPath = d3.geoPath()
    .projection(projection);

  var areas = mapsvg.append("g")
    .selectAll("path")
    .data(worldglobal.features)
    .enter()
    .append("path")
    .attr( "d", geoPath )
    .attr("class",d=>d.properties.name)
    .attr('fill', change_color)
    .attr('fill-opacity',set_opacity)
    .on("mousemove", draw_tooltip)
	.on("mouseout", () =>	{tooltip.classed("hidden", true); });

  function draw_tooltip(d)
  {
    var mouse = d3.mouse(mapsvg.node()).map( d => parseInt(d) )
    tooltip.classed("hidden", false)
      .attr("style", "left: " + (mouse[0] + 50) + "px; top:" + (mouse[1] + 180) + "px")
      .html(d.properties.name + "<br/>" + tooltip_string() + get_value(d) + "<br/>");

    residents = get_renters_owners(d);

    // console.log("renters here"+residents.renters);
	// console.log("owners here"+residents.owners);
	
    var graphic = tooltip.append("svg")
         .attr("width", 400)
         .attr("height", 70)

    var g1 = graphic
         .append("g");
    var g2 = graphic
              .append("g");

         g1.append("rect")
         .attr("height", 50)
         .attr("width", calculate_renter_percent(d) +"%")
         .attr("fill","red");

         g1.append("text").text("Renters " + calculate_renter_percent(d) +"%")
           .attr('y',70);

         g2.append("rect")
         .attr("height", 50)
         .attr("width", calculate_owner_percent(d) +"%")
         .attr("x", calculate_renter_percent(d) +"%")
         .attr("fill","blue");

         g2.append("text").text("Owners " + calculate_owner_percent(d) +"%")
             .attr('y',70)
             .attr('x',300);


  }

  function get_renters_owners(d){
    for ( let i = 0; i < 22; i++){
      var dataset1 = dataglobal[i].area.replace("-", " ")
      var dataset2 = d.properties.name.replace("-"," ")
        if((dataset1) == (dataset2)){
            return {
              renters: renters[i],
              owners: owners[i]
            }
        }
    }
  }

  function get_value(d){
    for ( let i = 0; i < 22; i++){
      var dataset1 = dataglobal[i].area.replace("-", " ")
      var dataset2 = d.properties.name.replace("-"," ")
        if((dataset1) == (dataset2)){
            value = dimension_data[i]
            return value
        }
    }
  }
  
  function calculate_owner_percent(d)
  {
	  var total = residents.owners + residents.renters
	  var owners = (residents.owners / total) * 100
	  return Number((owners).toFixed(1))
  }
  
    function calculate_renter_percent(d)
  {
	  var total = residents.owners + residents.renters
	  var renters = (residents.renters / total) * 100
	  return Number((renters).toFixed(1))
  }

    function set_opacity(d){
        for ( let i = 0; i < 22; i++){
            var dataset1 = dataglobal[i].area.replace("-", " ")
      		var dataset2 = d.properties.name.replace("-"," ")

            if(dataset1 == dataset2){
				//console.log(dim_range);
				return "" +(0.5  + ((((dimension_data[i]-(dim_median+ (dim_2k16_diff/2)))/dim_range))))
            }else if(i == 21){
				return "0";
            }
        }
    }
}


// Options for dropdown
var listOptions = ["Population", "Market Value", "Rent"]

// Init button
var dropdownButton = d3.select("#dropdown")
	.append("select")

// Add options to button
dropdownButton // Add a button
  .selectAll('Options')
 	.data(listOptions)
  .enter()
	.append('option')
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; }) // value returned is one of the items in the list

 // Listens for the change
 dropdownButton.on("change", function(d)
 {
	var selectedOption = d3.select(this).property("value")
	updateMap(selectedOption)
	// console.log(selectedOption)
 })

function updateMap(updatOption)
{
 if (updatOption.localeCompare("Market Value") == 0)
 {
	dimensionglobal = "price"
	plotmap();

	// clear the old legend and pass different parameters
	d3.select("#legend").html("")
	max = 3247312
	min = 198301
	l_color = "#12750F"
	legend(min, max, l_color)
 }
 else if (updatOption.localeCompare("Population") == 0){
	dimensionglobal = "pop"
	plotmap();
	d3.select("#legend").html("")
	max = 62030
	min = 6995
	l_color = "#0f4c75"
	legend(min, max, l_color)
 }
 else if (updatOption.localeCompare("Rent") == 0) {
	dimensionglobal = "rent"
	plotmap();
	d3.select("#legend").html("")
	max = 1824
	min = 421
	l_color = "#670F75"
	legend(min, max, l_color)
 }
}

 // Sliders
// d3.select("#mySlider").on("change", function(d)
// {
	// selectedValue = this.value //recovers slider value
	// // console.log(selectedValue)
	// changeYear(selectedValue)
	// plotmap();
// })

function changeYear(year)
{
	if (year == 2001)
	{
		document.getElementById("h2").innerHTML = "2001";
		console.log("Chose year 2001")
		yearglobal = "2001";
	}
	else if (year == 2006)
	{
		document.getElementById("h2").innerHTML = "2006";
		console.log("Chose year 2006")
		yearglobal = "2006";
	}
	else {
		document.getElementById("h2").innerHTML = "2016";
		console.log("Chose year 2016")
		yearglobal = "2016";
	}
	plotmap();
}

// Legend
function legend(min, max, l_color) {
	var colorScale = d3.scaleLinear()
		// .domain([0,	10,	15,	20, 25, 100])
		.domain([min, max])
		.range(['#E28672','#A9FCAA']);
	  // append a defs (for definition) element to your SVG
	var svgLegend = d3.select('#legend').append('svg')
		.attr("width",600);
	var defs = svgLegend.append('defs');

		// append a linearGradient element to the defs and give it a unique id
	var linearGradient = defs.append('linearGradient')
		.attr('id', 'linear-gradient');

	// horizontal gradient
	linearGradient
	  .attr("x1", "0%")
	  .attr("y1", "0%")
	  .attr("x2", "100%")
	  .attr("y2", "0%");

	// append multiple color stops by using D3's data/enter step
	linearGradient.selectAll("stop")
	  .data([
		{offset: "0%", color: "whitesmoke"},
		// {offset: "10%", color: "#EC93AB"},
		// {offset: "15%", color: "#CEB1DE"},
		// {offset: "20%", color: "#95D3F0"},
		// {offset: "25%", color: "#77EDD9"},
		{offset: "100%", color: l_color}
	  ])
	  .enter().append("stop")
	  .attr("offset", function(d) {
		return d.offset;
	  })
	  .attr("stop-color", function(d) {
		return d.color;
	  });

	// append title
	svgLegend.append("text")
	  .attr("class", "legendTitle")
	  .attr("x", 10)
	  .attr("y", 20)
	  .attr("font-weight", "bold")
	  .style("text-anchor", "left")
	  .text("Legend");

	// draw the rectangle and fill with gradient
	svgLegend.append("rect")
	  .attr("x", 10)
	  .attr("y", 30)
	  .attr("width", 400)
	  .attr("height", 15)
	  .style("fill", "url(#linear-gradient)");

	//create tick marks
	var xLeg = d3.scaleLinear()
	  .domain([min, max])
	  .range([17, 409]); //width of the bar

	var axisLegend = d3.axisBottom(xLeg)
	  .tickValues(colorScale.domain())

	svgLegend
	  .attr("class", "axis")
	  .append("g")
	  .attr("transform", "translate(0, 40)")
	  .call(axisLegend)
	  .select(".domain").remove(); //removes the stroke path on the legend
}
