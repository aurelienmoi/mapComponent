import { Component, OnInit, OnDestroy } from '@angular/core';
import { TopToolbarComponent } from './../../components/top-toolbar/top-toolbar.component';
import { PopoverController, ModalController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as mapboxgl from 'mapbox-gl';
import '../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'
import { map } from 'rxjs/operators';
import Supercluster from 'supercluster';
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Router } from '@angular/router';

import { MessagingPage } from 'src/app/members/messaging/messaging.page';
import { SequenceAst } from '@angular/animations/browser/src/dsl/animation_ast';

let baseURL = "";
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
  geolocate: any;
  wantsToMark: boolean;
  userId: any;
  userPseudo: any;
  placeName : string;
  constructor(
    private http: HttpClient,
    private geolocation2: Geolocation,
    private router: Router,
    private popover: PopoverController,
    public modalController: ModalController,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit() {
    this.ionicGeolocation();
    //this.postCoordinates();
    this.getCustomCoordinates();
  }

  ionViewDidEnter() {
    this.buildMap();
  }

  ionViewDidLeave() {
    this.map.remove();
  }

  async presentPopover(ev: any) {
    const popover = await this.popover.create({
      component: TopToolbarComponent,
      cssClass: 'popoverClass',
      event: ev
    });
    return await popover.present();
  }

  ionicGeolocation() {
    this.geolocation2.getCurrentPosition().then((resp) => {
      console.log(resp)
      // resp.coords.latitude
      // resp.coords.longitude
    }).catch((error) => {
      console.log('Error getting location', error);
    });

    let watch = this.geolocation2.watchPosition();
    watch.subscribe((data) => {
      // data can be a set of coordinates, or an error (if an error occurred).
      // data.coords.latitude
      // data.coords.longitude
    });
  }

  getCustomCoordinates() {
    this.http.get(`${baseURL}/chatApp/getCoordinates`).subscribe(
      (res: any) => {
        console.log(res.object1);
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
      this.geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', (event) => {


      class MyCustomControl {
        container: any;
        map: any;
        onAdd(map) {
          this.map = map;
          this.container = document.createElement('ion-button');
          this.container.className = 'my-custom-control';
          this.container.innerHTML = '<ion-icon name="pin"></ion-icon>&nbsp;Bitmoji'
          this.container.setAttribute("color", "dark");
          this.container.setAttribute("style", "position:absolute; bottom:94px; right:40px;");
          this.container.setAttribute("size", "small");
          this.container.setAttribute("id", "myCustomId");
          return this.container;
        }
        onRemove() {
          this.container.parentNode.removeChild(this.container);
          this.map = undefined;
        }
      }

      const myCustomControl = new MyCustomControl();

      this.map.addControl(myCustomControl);
      document.getElementById("myCustomId").addEventListener("click", () => {
        this.markFunction();
        this.map.removeControl(myCustomControl);
      });



      //  this.geolocate.trigger();
      /*   this.geolocate.on('geolocate',  () =>  {
           var userlocation2 = this.geolocate._lastKnownPosition.coords;
           var userlocation= [this.geolocate._lastKnownPosition.coords.latitude, this.geolocate._lastKnownPosition.coords.longitude];
          // this.postCoordinates(userlocation)
           console.log("geolocalisation en cours" , userlocation); })*/


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
          'circle-color': '#5f8394',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      this.map.on('click', 'unclustered-point', (e) => {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;
        var clusterId = e.features[0].properties.cluster_id;
        this.userId = e.features[0].properties.userId;
        this.userPseudo = e.features[0].properties.pseudo;
        console.log(this.userId);
        console.log(this.userPseudo);


        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        this.getPlaceName(coordinates).subscribe((res: any) => {
          console.log(res.features[0].place_name);
          this.placeName= res.features[0].place_name;
          if(this.placeName = res.features[0].place_name) {
        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<p style="color:grey;">${this.userPseudo},${this.placeName}</p><ion-button id='myBtn1' color="dark">Profil</ion-button><ion-button id='myBtn' fill="clear" color="dark">Messages</ion-button>`)//`<a class="verticalAlign" [routerLink]="['/contactDashboard',receiverId]">`
        .addTo(this.map);
         this.createListener();
        }
        });



      });







    });


  }
  createListener() {
    document.getElementById("myBtn1").addEventListener("click", () => {
      this.router.navigate(['/contactDashboard', this.userId])
    });

    document.getElementById("myBtn").addEventListener("click", () => {
      this.presentModalMessaging(this.userId)
    });
  }

  async presentModalMessaging(userId) {
    const modal = await this.modalController.create({
      component: MessagingPage,
      componentProps: {
        user_id: userId
      }
    });
    return await modal.present();
  }

  markFunction() {
    this.wantsToMark = true;
    console.log("normalement c'est true putain", this.wantsToMark)
    this.map.once('click', (event) => {
      // console.log(event.lngLat);

      var marker = new mapboxgl.Marker()
        .setLngLat(event.lngLat)
        .addTo(this.map);

      //add modal or whatever to confirm the marker choice THEN TRIGGER THE postCoordinates(event.lngLat) 
      alert("confirmer le choix du marker");
      console.log(event.lngLat.lng);
      let coordinatesToPost = [event.lngLat.lng, event.lngLat.lat]
      this.postCoordinates(coordinatesToPost);
    })
  }
  postCoordinates(userCoordinates) {

    let data = {
      coordinates: userCoordinates
    }
    this.http.post(`${baseURL}/chatApp/putCoordinates`, data).subscribe(
      (res: any) => {
        console.log(res);
      }

    );

  }
  goBack() {
    console.log("wantstobackoff")
  }

  getPlaceName(coordinates) {
    return this.http.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates}.json?types=place&access_token=${environment.mapbox.accessToken}`)


    
  }
  /*
  ngOnDestroy() { 
    console.log("IM LEAVING MAP BOYS")
    this.map.remove();
  }
*/

}
