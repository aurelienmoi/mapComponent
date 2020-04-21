import { Component, OnInit } from '@angular/core';

import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as mapboxgl from 'mapbox-gl';
import '../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'
import { map } from 'rxjs/operators';
import Supercluster from 'supercluster';

let baseURL = "http://localhost:8080"; 
@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {

  map: mapboxgl.Map;
  style = 'mapbox://styles/sheepbild/ck4ypwvod3t241cqlza366zmc';
  lng = 46.1390432;
  lat = 2.434848;
  data: any;
  customData: any;
  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {

  //this.postCoordinates();
    this.getCustomCoordinates();

  }

  ionViewDidEnter() {
    this.buildMap();
  }


  getCustomCoordinates() {
    this.http.get(`${baseURL}/chatApp/getCoordinates`).subscribe(
      (res: any) => {
        //console.log(res.object1);
        this.data = res.object1;
      

      }

    );
  }


  buildMap() {
    (mapboxgl as typeof mapboxgl).accessToken = environment.mapbox.accessToken;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      center: [this.lat, this.lng],
      zoom: 4,
    });

    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', (event) => {

      //console.log("loaded map successfully");

      this.map.addSource('customPoint', {
        type: 'geojson',
        data: this.data,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)

      });

      this.map.addLayer({
        id: 'customPoint',
        type: 'circle',
        source: 'customPoint',
        filter: ['has', 'point_count'],
        paint: {
          // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
          // with three steps to implement three types of circles:
          //   * Blue, 20px circles when point count is less than 100
          //   * Yellow, 30px circles when point count is between 100 and 750
          //   * Pink, 40px circles when point count is greater than or equal to 750
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      this.map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'customPoint',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      this.map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'customPoint',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });



  postCoordinates() {

    let data = {
      coordinates: [12, 12]
    }
    this.http.post(`${baseURL}/chatApp/putCoordinates`, data).subscribe(
      (res: any) => {
        console.log(res);
      }

    );

  }

}
