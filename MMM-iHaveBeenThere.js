Module.register('MMM-iHaveBeenThere', {
  defaults: {
    title: 'My Holidays',
    AnimationEnabled: true,  // enable / disable the plane animation
    pauseDuration: 3.0,      // plane at point time in s
    animationDuration: 10.0, // plane in air duration in s, raspberry pi A, B, B+ is really slow and lags in the anmation. On Modell 2 & 3 one may set on 2.5s.
    displayDesc: true,       // display the names of destinations
    zoomLevel: 4.5,          // central europe
    zoomLongitude: -2,       // central europe
    zoomLatitude: 46,        // central europe

    home_lat: 48.1548256,
    home_lon: 11.4017537,
    home_desc: 'München',

    away_lat: [
      48.8588377,
      51.5285582,
      44.3569914,
      41.0049822,
    ],
    away_lon: [
      2.2775175,
      -0.2416802,
      24.6273942,
      28.7319992,
    ],
    away_desc: [
      'Paris 1999',
      'London 2005',
      'Bukarest 2010',
      'Istanbul 2010',
    ],

    trip: [
      false,
      false,
      false,
      true,
    ],

    colorCountries: '#BDBDBD',
    colorCountryBorders: '#000000',
    colorTargetPoints: '#FFFFFF',
    colorPlane: '#FF0000',
    colorPlaneLine: '#FFFFFF',
    colorLegendBorder: '#FFFFFF',
    colorLegendFont: '#FFFFFF',
    colorTitleFont: '#FFFFFF',
  },

  // Define required scripts.
  getScripts() {
    return [
      'https://cdn.amcharts.com/lib/5/index.js',
      'https://cdn.amcharts.com/lib/5/map.js',
      'https://cdn.amcharts.com/lib/5/geodata/worldLow.js',
      'https://cdn.amcharts.com/lib/5/themes/Animated.js',
    ]
  },

  // Override dom generator.
  getDom() {
    const wrapper = document.createElement('div')

    wrapper.style.width = '100%'
    wrapper.style.height = '700px'
    wrapper.id = 'MapDiv'

    return wrapper
  },

  // function to create the legend and its items
  createLegend() {
    const legend = {
      fontSize: 13,
      width: 300,
      backgroundAlpha: 0.0,
      borderColor: this.config.colorLegendBorder,
      borderAlpha: 1,
      top: 100,
      left: 15,
      horizontalGap: 10,
      useMarkerColorForLabels: true,
      data: [],
    }

    for (let i = 0; i < this.arrayLength; i++) {
      const LegendItem = {
        title: this.config.away_desc[i],
        markerType: 'none',
        color: this.config.colorLegendFont,
      }

      legend.data.push(LegendItem)
    }

    return legend
  },

  // creates the lat coordinates
  createLinesLat() {
    const lat = []
    for (let i = 0; i < this.arrayLength; i++) {
      if (this.config.trip[i] === true && i > 0) {
        lat.push(this.config.away_lat[i - 1])
      }
      else {
        lat.push(this.config.home_lat)
      }
      lat.push(this.config.away_lat[i])
    }
    return lat
  },

  // creates the lon coordinates
  createLinesLon() {
    const lon = []
    for (let i = 0; i < this.arrayLength; i++) {
      if (this.config.trip[i] === true && i > 0) {
        lon.push(this.config.away_lon[i - 1])
      }
      else {
        lon.push(this.config.home_lon)
      }
      lon.push(this.config.away_lon[i])
    }
    return lon
  },

  // creates all lines of the map
  createLines() {
    const lines = [
      {
        id: 'Plane',
        arc: -0.85,
        alpha: 0.3,
        latitudes: this.createLinesLat(),
        longitudes: this.createLinesLon(),
      },
      {
        id: 'GroundShadow',
        alpha: 0,
        color: '#000000',
        latitudes: this.createLinesLat(),
        longitudes: this.createLinesLon(),
      },
    ]
    return lines
  },

  // creates all images of the map
  createImages() {
    const images = []
    // add home image
    const home = {
      svgPath: this.targetSVG,
      title: this.config.home_desc,
      // label: "zu Hause",
      color: this.config.colorTargetPoints,
      labelColor: this.config.colorTargetPoints,
      latitude: this.config.home_lat,
      longitude: this.config.home_lon,
    }
    images.push(home)

    // add destination images
    for (let i = 0; i < this.arrayLength; i++) {
      const dest = {
        svgPath: this.targetSVG,
        title: this.config.away_desc[i],
        // label: "zu Hause",
        color: this.config.colorTargetPoints,
        labelColor: this.config.colorTargetPoints,
        latitude: this.config.away_lat[i],
        longitude: this.config.away_lon[i],
      }
      images.push(dest)
    }

    // plane shadow
    if (this.config.AnimationEnabled === true) {
      const planeShadow = {
        svgPath: this.planeSVG,
        positionOnLine: 0,
        color: this.config.colorPlane,
        alpha: 0.4,
        animateAlongLine: true,
        lineId: 'GroundShadow',
        flipDirection: true,
        loop: true,
        scale: 0.03,
        positionScale: 1.3,
      }
      images.push(planeShadow)

      // plane in the air
      const plane = {
        svgPath: this.planeSVG,
        positionOnLine: 0,
        color: this.config.colorPlane,
        alpha: 0.8,
        animateAlongLine: true,
        lineId: 'Plane',
        flipDirection: true,
        loop: true,
        scale: 0.03,
        positionScale: 1.8,
      }
      images.push(plane)
    }
    return images
  },

  start() {
    this.updateDom()
    setTimeout(() => {
      this.drawMap()
    }, 2000) // delay for painting the map. 300ms needed for pi b+
  },

  // eslint-disable-next-line max-lines-per-function
  drawMap() {
    /*
     * calc min number from away_lat and away_lon
     * later we only take as much elements as the smallest array contains in order not
     * to get a array access violation
     */
    this.arrayLength = Math.min(
      this.config.away_lat.length,
      this.config.away_lon.length,
    )

    /*
     * if we are displaying the descriptions, include it in minimum size calculations
     * this removes the need to include the descriptions if you aren't showing them
     */
    if (this.config.displayDesc) {
      this.arrayLength = Math.min(
        this.config.away_desc.length,
        this.arrayLength,
      )
    }

    // setting plant and target svg's
    this.targetSVG
      = 'M9,0C4.029,0,0,4.029,0,9s4.029,9,9,9s9-4.029,9-9S13.971,0,9,0z M9,15.93 c-3.83,0-6.93-3.1-6.93-6.93S5.17,2.07,9,2.07s6.93,3.1,6.93,6.93S12.83,15.93,9,15.93 M12.5,9c0,1.933-1.567,3.5-3.5,3.5S5.5,10.933,5.5,9S7.067,5.5,9,5.5 S12.5,7.067,12.5,9z'
    this.planeSVG
      = 'm2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47'

    // Create root element
    const root = am5.Root.new('MapDiv')

    /*
     * Set themes
     * https://www.amcharts.com/docs/v5/concepts/themes/
     */
    root.setThemes([am5themes_Animated.new(root)])

    /*
     * Create the map chart
     * https://www.amcharts.com/docs/v5/charts/map-chart/
     */
    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'rotateX',
        panY: 'translateY',
        projection: am5map.geoMercator(),
        homeGeoPoint: { latitude: 2, longitude: 2 },
      }),
    )

    const cont = chart.children.push(
      am5.Container.new(root, {
        layout: root.horizontalLayout,
        x: 20,
        y: 40,
      }),
    )

    // chart.set("zoomControl", am5map.ZoomControl.new(root, {}));

    am5map.ZoomControl.new(root, {
      homeButtonEnabled: false,
      panControlEnabled: false,
      zoomControlEnabled: false,
    })

    // Add labels and controls
    cont.children.push(
      am5.Label.new(root, {
        centerY: am5.p50,
        text: 'Map',
      }),
    )

    cont.children.push(
      am5.Label.new(root, {
        centerY: am5.p50,
        text: 'Globe',
      }),
    )

    /*
     * Create series for background fill
     * https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
     */
    const backgroundSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {}),
    )
    backgroundSeries.mapPolygons.template.setAll({
      fill: root.interfaceColors.get('alternativeBackground'),
      fillOpacity: 0,
      strokeOpacity: 0,
    })

    /*
     * Add background polygon
     * https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
     */
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180),
    })

    /*
     * Create main polygon series for countries
     * https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
     */
    chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
      }),
    )

    /*
     * Create line series for trajectory lines
     * https://www.amcharts.com/docs/v5/charts/map-chart/map-line-series/
     */
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}))
    lineSeries.mapLines.template.setAll({
      stroke: root.interfaceColors.get('alternativeBackground'),
      strokeOpacity: 0.3,
    })

    /*
     * Create point series for markers
     * https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
     */
    const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))

    pointSeries.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 7,
        tooltipText: 'Drag me!',
        cursorOverStyle: 'pointer',
        tooltipY: 0,
        fill: am5.color(0xffba00),
        stroke: root.interfaceColors.get('background'),
        strokeWidth: 2,
        draggable: true,
      })

      circle.events.on('dragged', (event) => {
        const { dataItem } = event.target
        const geoPoint = chart.invert({ x: circle.x(), y: circle.y() })

        dataItem.setAll({
          longitude: geoPoint.longitude,
          latitude: geoPoint.latitude,
        })
      })

      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })

    const paris = addCity({ latitude: 48.8567, longitude: 2.351 }, 'Paris')
    const toronto = addCity(
      { latitude: 43.8163, longitude: -79.4287 },
      'Toronto',
    )
    const la = addCity({ latitude: 34.3, longitude: -118.15 }, 'Los Angeles')
    const havana = addCity({ latitude: 23, longitude: -82 }, 'Havana')

    const lineDataItem = lineSeries.pushDataItem({
      pointsToConnect: [paris, toronto, la, havana],
    })

    const planeSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))

    const plane = am5.Graphics.new(root, {
      svgPath:
        'm2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47',
      scale: 0.06,
      centerY: am5.p50,
      centerX: am5.p50,
      fill: am5.color(0x000000),
    })

    planeSeries.bullets.push(() => {
      const container = am5.Container.new(root, {})
      container.children.push(plane)
      return am5.Bullet.new(root, { sprite: container })
    })

    const planeDataItem = planeSeries.pushDataItem({
      lineDataItem,
      positionOnLine: 0,
      autoRotate: true,
    })
    planeDataItem.dataContext = {}

    planeDataItem.animate({
      key: 'positionOnLine',
      to: 1,
      duration: 10000,
      loops: Infinity,
      easing: am5.ease.yoyo(am5.ease.linear),
    })

    planeDataItem.on('positionOnLine', (value) => {
      if (planeDataItem.dataContext.prevPosition < value) {
        plane.set('rotation', 0)
      }

      if (planeDataItem.dataContext.prevPosition > value) {
        plane.set('rotation', -180)
      }
      planeDataItem.dataContext.prevPosition = value
    })

    function addCity(coords, title) {
      return pointSeries.pushDataItem({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: title,
      })
    }

    // Make stuff animate on load
    chart.appear(1000, 100)

    /*
     *
     *{
     *  type: "map",
     *  zoomControl: {
     *    homeButtonEnabled: false,
     *    panControlEnabled: false,
     *    zoomControlEnabled: false
     *  },
     *  dataProvider: {
     *    map: "worldLow",
     *    zoomLevel: this.config.zoomLevel,
     *    zoomLongitude: this.config.zoomLongitude,
     *    zoomLatitude: this.config.zoomLatitude,
     *    lines: MyLines,
     *    images: MyImages
     *  },
     *  areasSettings: {
     *    // color of countries
     *    unlistedAreasColor: this.config.colorCountries,
     *    unlistedAreasAlpha: 0.5,
     *    // color of country border lines
     *    unlistedAreasOutlineColor: this.config.colorCountryBorders
     *  },
     *
     *  imagesSettings: {
     *    // color of the points on the map
     *    color: this.config.colorTargetPionts,
     *    selectedColor: "#585869",
     *    pauseDuration: this.config.pauseDuration,
     *    animationDuration: this.config.animationDuration,
     *    adjustAnimationSpeed: false
     *  },
     *
     *  linesSettings: {
     *    color: this.config.colorPlaneLine,
     *    alpha: 0.4
     *  }
     *}
     *));
     *
     * // add legend to map
     *if (this.config.displayDesc) {
     *MyMap.addLegend(this.createLegend());
     *}
     * // add title
     *MyMap.addTitle(
     *this.config.title,
     *25,
     *this.config.colorTitleFont,
     *1.0,
     *true
     *);
     */
  },
})
