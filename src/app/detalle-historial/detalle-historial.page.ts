import { Component, OnInit } from '@angular/core';
import { FireService } from '../Services/fire.service';

@Component({
  selector: 'app-detalle-historial',
  templateUrl: './detalle-historial.page.html',
  styleUrls: ['./detalle-historial.page.scss'],
})
export class DetalleHistorialPage implements OnInit {
  
  info_procesed
  constructor(public fs: FireService) { }
  
  ngOnInit() {
    this.transformInfo()
  }

  transformInfo(){
    this.info_procesed = this.fs.info
  }

}
