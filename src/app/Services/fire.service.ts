import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { Travels } from '../Models/travels';
import { AlertController } from '@ionic/angular'
import { History } from '../Models/history'
import { TravelsService } from '../Services/travels.service'


@Injectable({
  providedIn: 'root'
})
export class FireService {

  userData
  currentTravelData 
  travelsData = []
  history = []
  info
  connect
  constructor(
    private afs: AngularFirestore, 
    private alert: AlertController, 
    private tra: TravelsService,
    ) {}
   
   async getCurrentUser(uid: string){
    this.userData = await this.afs.firestore.collection("users").doc(uid).get()
    
    
  }
  async getCurrentTravel(uid: string){
    this.currentTravelData = await this.afs.firestore.collection("travels").doc(uid).get()
    console.log(this.currentTravelData.data());
    
    
  }

  async getHistory(){ 
    this.afs.firestore.collection("history").where('uid_driver', '==', this.userData.data().uid )
    .get().then(async (querySnapshot)=>{
      querySnapshot.forEach((doc)=>{
        this.history.push({
          id: doc.id,
          data: doc.data()
        })
      })
      if(this.history.length == 0){
        const alert = await this.alert.create({
          cssClass: 'Alert-login-unsuccess',
          header: 'Sin viajes Hechos',
          message: 'Al parecer no hay viajes recientes',
          buttons: ['OK']
        })
        await alert.present()
      }else{
        console.log(this.history);
        
      }
    })
  }

   async connectToTravel(connection: boolean){
     if(connection == true){
      this.connect=this.afs.firestore.collection("travels").where("available", "==", true)
       .onSnapshot(async (querySnapshot)=>{
         this.travelsData = []
         querySnapshot.forEach((doc)=>{
           this.travelsData.push({
             uid: doc.id,
             data: doc.data()
           })
         })       
         if(this.travelsData.length == 0 && connection == true){
          const alert = await this.alert.create({
            cssClass: 'Alert-login-unsuccess',
            header: 'Sin viajes',
            message: 'Al parecer no hay viajes disponibles',
            buttons: ['OK']
          })
          await alert.present()
        }else{
          console.log(this.travelsData);
        } 
       })
     }else if(connection == false){
       this.connect()
       this.travelsData.length = 0
     }
   
    
  }


  acceptAndUpdateTravel(travel: Travels){
    const travelRef: AngularFirestoreDocument<Travels>= this.afs.doc(`travels/${travel.uid}`)
    const data: Travels={
      available: false,
    }
    return travelRef.set(data,{merge:true})
  }

   finishTravelAndUpdate(history: any, metodoPago){  
     const travelRef: AngularFirestoreDocument<History>= this.afs.doc(`history/${history.uid}`)
     const data: History={
      history_uid: history.uid,
      uid_driver: this.userData.data().uid,
      displayName_driver: this.userData.data().displayName,
      initial: {Lugar:this.tra.destinationI, Distancia: this.tra.distanceI, Tiempo: this.tra.durationI},
      destination: {Lugar: this.tra.destinationD, Distancia: this.tra.distanceD, Tiempo: this.tra.durationD},
      cost: history.cost,
      payment_method: metodoPago
    }
    console.log(data);
    return travelRef.set(data,{merge:false})
  }

  reciveInfo(info_viaje){
    this.info = info_viaje
  }
}
