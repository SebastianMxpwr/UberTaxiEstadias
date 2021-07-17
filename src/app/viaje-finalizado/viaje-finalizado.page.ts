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
  constructor(public fs: FireService, public tra: TravelsService) { }
  ngOnInit() {
  }

  finishTravel(){
    this.travelData = this.fs.travelData.data()
    this.fs.finishTravelAndUpdate(this.travelData)
    this.tra.destinationD = ''
    this.tra.destinationI = ''
   
  }

}
