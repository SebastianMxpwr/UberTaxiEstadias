import { Component, OnInit } from '@angular/core';
import { FireService } from '../Services/fire.service';


@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  constructor(public fs: FireService) { }

  ngOnInit() {
    this.fs.getAllHistory()
  }
  hiddenFunction(){
    this.fs.history.length = 0
  }

}
