import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth.service'
import { AlertController } from '@ionic/angular'
import { FireService } from '../Services/fire.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(public authSer: AuthService, private router:Router, public alert: AlertController, public fs:FireService) { }

  ngOnInit() {
  }

  async Onlogin(email, password) {
    try {
      const user = await this.authSer.logIn(email.value, password.value)
      if(user){
        const alertController = await this.alert.create({
          cssClass: 'Alert-login-success',
          header: 'Hecho',
          message: 'El logeo fue exitoso',
          buttons: ['OK']
        })
        await alertController.present()
        this.router.navigate(['/home'])
      } 
      else if(!user){
        const alertController = await this.alert.create({
          cssClass: 'Alert-login-unsuccess',
          header: 'ID o contraseña incorrecto',
          message: 'El usuario no se encontro',
          buttons: ['OK']
        })
        await alertController.present()
      } 
    } catch (error) {
      const alertController = await this.alert.create({
        header: 'Error',
        message: 'Ocurrio un error..pus que haces',
        buttons: ['OK']
      })
      await alertController.present()
    }
  }

}