import { Component, OnInit,ViewChild, ElementRef} from '@angular/core'
import { MenuController } from '@ionic/angular' 
import { Router } from '@angular/router'
import { AuthService } from '../Services/auth.service'
import { GeolocationService } from '../Services/geolocation.service'
import { FireService } from '../Services/fire.service';
import { TravelsService } from '../Services/travels.service'
import { Travels } from '../Models/travels'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  data2
  total = 0
  isButtonVisible1 = true;

  constructor(
    private menu: MenuController, 
    public auth: AuthService, 
    private router:Router,
    public geo: GeolocationService,
    public fs: FireService,
    public tra: TravelsService,
    ) {}

    ngOnInit() {
      this.geo.whatchPosition()
      this.geo.loadMap()
    }
  
    getTravels(){
      this.fs.getAllTravels()
     }

     PosistionActualMarker(){
       this.geo.PosistionActualMarker()
     }

    logout() {
      this.auth.logout()
      this.router.navigate(['/'])

    }
    openFirst(){
      this.menu.open('first')
    }

    accept(data: Travels){
      // this.fs.acceptAndUpdateTravel(data2)
      this.tra.calculateRouteInitial(data)
      this.fs.getCurrentTravel(data.uid)
      this.data2 = data
      this.fs.travelsData.length = 0
    }

    cancelTravelPosibility(){
      this.fs.travelsData.length = 0 
    }

    cancelTravelReady(){
      this.tra.status = null
      this.tra.CRI = false
      this.tra.CRD = false
      this.tra.final = false
      this.tra.destinationI = ''
      this.tra.destinationD = ''
    }
    comenzarTravel(){
      this.tra.calculateRouteDestination(this.data2)
      this.tra.CRD = false
    }

    terminarViaje(){
      this.tra.CRI = false
      this.tra.CRD = false
      this.tra.final = false
      this.tra.status = null
      this.router.navigate(['/viaje-finalizado'])
      this.sumRecaudador()
    }

    sumRecaudador(){      
      this.total += this.data2.cost
    }
}
