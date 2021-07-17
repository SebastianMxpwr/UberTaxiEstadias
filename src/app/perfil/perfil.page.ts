import { Component, OnInit } from '@angular/core';
import { AuthService } from '../Services/auth.service'
import { FireService } from '../Services/fire.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  constructor(public auth: AuthService, public fs:FireService) { }

  ngOnInit() {
  }

}
