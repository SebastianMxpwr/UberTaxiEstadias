import { Component, OnInit} from '@angular/core'
import { MenuController } from '@ionic/angular' 
import { Router } from '@angular/router'
import { AuthService } from '../Services/auth.service'
import { GeolocationService } from '../Services/geolocation.service'
import { FireService } from '../Services/fire.service';
import { TravelsService } from '../Services/travels.service'
import { Travels } from '../Models/travels'
import { AlertController } from '@ionic/angular'


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
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
    public alert: AlertController,
    ) {}

    ngOnInit() {
      this.geo.loadMap()
      this.geo.actualPositionMarker()
      this.geo.whatchPosition()
    }
  
    getTravels(){
      this.fs.connectToTravel(true)
     }

     PosistionActualMarker(){
       this.geo.actualPositionMarker()
       this.geo.reloadMap()
     }

    logout() {
      this.auth.logout()
      this.router.navigate(['/'])

    }
    openFirst(){
      this.menu.open('first')
    }

    accept(data: Travels){
      this.fs.connectToTravel(false)
      this.fs.acceptAndUpdateTravel(data)
      this.tra.calculateRouteInitial(data)
      this.fs.getCurrentTravel(data.uid)
      this.data2 = data
    }

    cancelTravelPosibility(){
      this.fs.travelsData.length = 0
      this.geo.cleanMap()
 
    }

    async cancelTravelReady(){
      const alertController = await this.alert.create({
        cssClass: 'Alert-login-unsuccess',
        header: 'Cancelar Viaje',
        message: 'Estas seguro que quieres cancelar el viaje?',
        buttons: [
          {
            text:'No',
            role:'cancel'
          },
          {
            text:'Si', 
            handler:()=>{
              this.tra.status = null
              this.tra.CRI = false
              this.tra.CRD = false
              this.tra.endTravel = false
              this.tra.destinationI = ''
              this.tra.destinationD = ''
              this.geo.cleanMap()
            }
          }
        ]
      })
      await alertController.present()
    }
    comenzarTravel(){
      this.tra.calculateRouteDestination(this.data2)
      this.tra.CRD = false
    }

    terminarViaje(){
      this.tra.CRI = false
      this.tra.CRD = false
      this.tra.endTravel = false
      this.tra.status = null
      this.router.navigate(['/viaje-finalizado'])
      this.geo.cleanMap()
      this.sumRecaudador()
    }

    sumRecaudador(){      
      this.total += this.data2.cost
    }
}
