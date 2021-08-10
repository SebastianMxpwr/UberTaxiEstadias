import { Component, OnInit } from '@angular/core';
import { FireService } from '../Services/fire.service';
import { TravelsService} from '../Services/travels.service'


@Component({
  selector: 'app-viaje-finalizado',
  templateUrl: './viaje-finalizado.page.html',
  styleUrls: ['./viaje-finalizado.page.scss'],
})
export class ViajeFinalizadoPage implements OnInit {

  travelData = {}
  metodoPago: string

  constructor(public fs: FireService, public tra: TravelsService) {
    this.metodoPago = "Efectivo"
   }
  ngOnInit() {
  }

  checkPaymentMethod($event){
    this.metodoPago = $event.detail.value
    console.log(this.metodoPago);  
  }


  finishTravel(){
    this.travelData = this.fs.currentTravelData.data()
    this.fs.finishTravelAndUpdate(this.travelData, this.metodoPago)
    this.tra.destinationD = ''
    this.tra.destinationI = ''
    if(this.metodoPago === "Efectivo"){
      console.log('efectivo');
    }else{
      console.log('tarjeta');
      
    }
  }

}
