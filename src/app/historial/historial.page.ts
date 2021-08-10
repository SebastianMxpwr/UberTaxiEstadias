import { Component, OnInit } from '@angular/core';
import { FireService } from '../Services/fire.service';


@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  historial = []
  constructor(public fs: FireService) {this.historial = this.fs.history}

  
  ngOnInit() {
    this.fs.getHistory()
  }
  restartHistory(){
    this.fs.history.length = 0
  }

  sendInfo(viaje){
    this.fs.reciveInfo(viaje)
  }

}
