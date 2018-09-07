namespace WebSharper.Google.Maps.Tests

open WebSharper

[<JavaScript>]
module SamplesInternals =

    open WebSharper.JavaScript
    open WebSharper.Google.Maps
    open WebSharper.Html.Client
    open WebSharper.JQuery

    let Sample name buildMap =
        Div [
            H1 [Text name]
            Div [Attr.Style "padding-bottom:20px; width:500px; height:300px;"]
            |>! OnAfterRender (fun mapElement ->
                let center = new LatLng(37.4419, -122.1419)
                let options = new MapOptions(center, 8)
                let map = new Google.Maps.Map(mapElement.Body, options)
                buildMap map)
        ]

    let SimpleMap() =
        Sample "Simple map" <| fun (map: Map) ->
            let latLng = new LatLng(-34.397, 150.644)
            let options = new MapOptions(latLng, 8)
            map.SetOptions options

    let PanTo() =
        Sample "Pan after timeout" <| fun map ->
            let center = new LatLng(37.4419, -122.1419)
            let options = new MapOptions(center, 8)
            map.SetOptions options
            let move () = map.PanTo(new LatLng(37.4569, -122.1569))
            JS.SetTimeout move 5000 |> ignore

    let RandomMarkers() =
        Sample "Random markers" <| fun map ->
            Event.AddListener(map, "bounds_changed", fun _ ->
                // bounds is only available in the "bounds_changed" event.
                let bounds = map.GetBounds()
                let sw = bounds.GetSouthWest()
                let ne = bounds.GetNorthEast()
                let lngSpan = ne.Lng() - sw.Lng()
                let latSpan = ne.Lat() - sw.Lat()
                let rnd = Math.Random
                for i in 1 .. 10 do
                    let point = new LatLng(sw.Lat() + (latSpan * rnd()),
                                           sw.Lng() + (lngSpan * rnd()))
                    let markerOptions = new MarkerOptions(point)
                    markerOptions.Map <- map
                    new Marker(markerOptions) |> ignore
            ) |> ignore

    let InfoWindow() =
        Sample "Info window" <| fun map ->
            let center = map.GetCenter()
            let helloWorldElement = Span [Text "Hello World"]
            let iwOptions = new InfoWindowOptions()
            iwOptions.Content <- Union1Of2 helloWorldElement.Body
            iwOptions.Position <- center
            let iw = new InfoWindow(iwOptions)
            iw.Open(map)

    let Controls() =
        Sample "Hide default controls" <| fun map ->
            let center = new LatLng(37.4419, -122.1419)
            let options = new MapOptions(center, 8)
            options.DisableDefaultUI <- true
            let ncOptions = new NavigationControlOptions()
            ncOptions.Style <- NavigationControlStyle.ZOOM_PAN
//            options.NavigationControlOptions <- ncOptions
//            options.NavigationControl <- true
            map.SetOptions options

    let SimpleDirections() =
        Sample "Simple directions" <| fun map ->
            let directionsService = new DirectionsService()
            let directionsDisplay = new DirectionsRenderer();
            map.SetCenter(new LatLng(41.850033, -87.6500523))
            map.SetZoom 7
            map.SetMapTypeId MapTypeId.ROADMAP
            let a = DirectionsRendererOptions()
            directionsDisplay.SetMap(map)
            let mapDiv = map.GetDiv()
            let dirPanel = Div [ Attr.Name "directionsDiv"]
            let j = JQuery.Of(mapDiv)
            j.After(dirPanel.Dom).Ignore
            directionsDisplay.SetPanel dirPanel.Dom
            let calcRoute () =
                let start = "chicago, il"
                let destination  = "st louis, mo"
                let request = new DirectionsRequest(start, destination, TravelMode.DRIVING)
                directionsService.Route(request, fun (result, status) ->
                    if status = DirectionsStatus.OK then
                        directionsDisplay.SetDirections result)
            calcRoute ()

    let DirectionsWithWaypoints() =
        Sample "Directions with waypoints" <| fun map ->
            let directionsService = new DirectionsService()
            let directionsDisplay = new DirectionsRenderer();
            map.SetCenter(new LatLng(41.850033, -87.6500523))
            map.SetZoom 7
            map.SetMapTypeId MapTypeId.ROADMAP
            let a = DirectionsRendererOptions()
            directionsDisplay.SetMap(map)
            let mapDiv = map.GetDiv()
            let dirPanel = Div [Attr.Name "directionsDiv"]
            let j = JQuery.Of mapDiv
            j.After(dirPanel.Dom).Ignore
            directionsDisplay.SetPanel dirPanel.Dom
            let calcRoute () =
                let start = "chicago, il"
                let destination  = "st louis, mo"

                let request = new DirectionsRequest(start, destination, TravelMode.DRIVING)
                let waypoints =
                    [|"champaign, il"
                      "decatur, il"  |]
                    |> Array.map (fun x ->
                                    let wp = new DirectionsWaypoint()
                                    wp.Location <- Location(x)
                                    wp)

                request.Waypoints <- waypoints
                directionsService.Route(request, fun (result, status) ->
                    if status = DirectionsStatus.OK then
                        directionsDisplay.SetDirections result)
            calcRoute ()

    let SimplePolygon() =
        Sample "Simple polygon" <| fun map ->
            map.SetCenter(new LatLng(37.4419, -122.1419))
            map.SetZoom(13)
            let polygon = new Polygon()
            let coords = [| new LatLng(37.4419, -122.1419)
                            new LatLng(37.4519, -122.1519)
                            new LatLng(37.4419, -122.1319)
                            new LatLng(37.4419, -122.1419) |]
            polygon.SetPath coords
            polygon.SetMap map

    let PrimitiveEvent () =
        Sample "Simple event handler" <| fun map ->
            Event.AddListener(map, "click", fun _ ->
                JS.Alert "Map Clicked!"
            )
            |> ignore

    let SimplePolyline() =
        Sample "Simple polyline" <| fun map ->
            let coords = [| new LatLng(37.4419, -122.1419)
                            new LatLng(37.5419, -122.2419)|]
            let polylineOptions = new PolylineOptions()
            polylineOptions.StrokeColor <- "#ff0000"
            polylineOptions.Path <- coords
            polylineOptions.Map <- map
            new Polyline(polylineOptions)
            |> ignore

    [<SPAEntryPoint>]
    let Samples () =
        (Div [
            H1 [Text "Google Maps Samples"]
            SimpleMap ()
            PanTo ()
            RandomMarkers ()
            InfoWindow ()
            Controls ()
            SimpleDirections ()
            DirectionsWithWaypoints ()
            SimplePolygon ()
            PrimitiveEvent ()
            SimplePolyline ()
        ]).AppendTo "main"
