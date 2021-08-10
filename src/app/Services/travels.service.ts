import { Injectable } from '@angular/core';
import { GeolocationService } from '../Services/geolocation.service'
import { Travels } from '../Models/travels';

declare var google

@Injectable({
  providedIn: 'root'
})
export class TravelsService {

  directionsDisplay 
  directionsService
  matrixServices
  coordinates =[]
  status: any
  durationD: string
  durationI: string
  distanceD: string
  distanceI: string
  destinationD: string
  destinationI: string
  CRI = false
  CRD = false
  endTravel = false
  constructor(private geo:GeolocationService) { 
    this.directionsDisplay = this.geo.directionsDisplay
    this.directionsService = this.geo.directionsService
    this.matrixServices = this.geo.matrixServices
  }

  calculateRouteInitial(data: Travels){
    this.directionsService.route({
      origin: this.geo.currentCenter,
      destination: data.initial,
      travelMode: 'DRIVING',
    }, (response, status)  => {
      this.status = status
      if (this.status === google.maps.DirectionsStatus.OK) {
        this.directionsDisplay.setDirections(response);
        this.CRI = true
        this.CRD = true
      } else {
        alert('Could not display directions due to: ' + status);
      }
    })
    this.calculateDistanceInitial(data)
    }

    calculateRouteDestination(data: Travels ){
        this.directionsService.route({
          origin: this.geo.currentCenter,
          destination: data.destino,
          travelMode: 'DRIVING',
        }, (response, status)  => {
          this.status = status
          if (this.status === google.maps.DirectionsStatus.OK) {
            this.directionsDisplay.setDirections(response);
            this.endTravel = true
          } else {
            alert('Could not display directions due to: ' + status);
          }
        })  
        this.calculateDistanceDestination(data) 
    }
    
     calculateDistanceInitial(data: Travels){
      this.matrixServices.getDistanceMatrix({
        origins:[this.geo.currentCenter], // necesitan ser un array
        destinations:[data.initial],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response,status)=>{
        if(status = "OK"){
          this.distanceI = response.rows[0].elements[0].distance.text
          this.durationI = response.rows[0].elements[0].duration.text
          this.destinationI = response.destinationAddresses 
        }else{
          console.log("error");
        }
      })     
    }

    calculateDistanceDestination(data: Travels){
      this.matrixServices.getDistanceMatrix({
        origins:[this.geo.currentCenter],
        destinations:[data.destino],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response,status)=>{
        if(status = "OK"){
          this.distanceD= response.rows[0].elements[0].distance.text
          this.durationD= response.rows[0].elements[0].duration.text 
          this.destinationD = response.destinationAddresses
        }else{
          console.log("error");
        }
      })     
    }

    
    
}