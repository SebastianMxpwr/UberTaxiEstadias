import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx'
import { LoadingController } from '@ionic/angular'




declare var google

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  public currentCenter: {}
  public map: any
  lat: string 
  lng: string
  zoom = 18
  actualCoordinates = []
  marker: any
  
  directionsService = new google.maps.DirectionsService()
  directionsDisplay = new google.maps.DirectionsRenderer()
  matrixServices = new google.maps.DistanceMatrixService()

  constructor(
    private geolocation: Geolocation, 
    private loading: LoadingController,) { }
    
    

   async loadMap(){
     const load = await this.loading.create()
     load.present()

     
      const rta = await this.geolocation.getCurrentPosition()
      this.currentCenter={
        lat: rta.coords.latitude,
        lng: rta.coords.longitude
      }
    

      const mapEle: HTMLElement = document.getElementById('map_canvas')
      this.map= new google.maps.Map(mapEle,{
      center: this.currentCenter,
      zoom: 18,
      disableDefaultUI: true,
      minZoom: this.zoom - 5,
      maxZoom: this.zoom + 3
    })

    this.marker = new google.maps.Marker({
      position: this.currentCenter,
      map:this.map,
      title: 'Tu estas aquí',
      animation: google.maps.Animation.DROP,
      icon: '../../assets/img/carro.png'
    })
    this.marker.setMap(this.map)
    this.directionsDisplay.setMap(this.map)
    load.dismiss()

  }

  actualPositionMarker(){
      if(!this.marker){
        this.marker = new google.maps.Marker({
          position: this.currentCenter,
          map:this.map,
          title: 'Tu estas aquí',
          animation: google.maps.Animation.DROP,
          icon: '../../assets/img/carro.png'
        })
      }else{
        this.map.panTo(this.currentCenter)
      }     
  }

  whatchPosition(){
    const watch = navigator.geolocation.watchPosition(position=>{
      this.currentCenter={
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      console.log(this.currentCenter);
    })
  }

  reloadMap(){
    if(!this.map){
      this.loadMap()
      this.actualPositionMarker()
    }else{
      console.log('gud'); 
    }
  }

  cleanMap(){
    this.directionsDisplay.setDirections({routes:[]})
  }

}
