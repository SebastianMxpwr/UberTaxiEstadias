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

  public userData
  public travelData
  public travelsData = []
  public history = []
  constructor(private afs: AngularFirestore, private alert: AlertController, private tra: TravelsService ) {
  }
   
   async getCurrentUser(uid: string){
    this.userData = await this.afs.firestore.collection("users").doc(uid).get()
    
    
  }
  async getCurrentTravel(uid: string){
    this.travelData = await this.afs.firestore.collection("travels").doc(uid).get()
    console.log(this.travelData.data());
    
    
  }

  async getAllHistory(){ 
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

   async getAllTravels(){
     this.afs.firestore.collection("travels").where("available", "==", true)
     .get().then(async (querySnapshot)=>{
       querySnapshot.forEach((doc)=>{
         this.travelsData.push({
           uid: doc.id,
           data: doc.data()
         })
       })       
       if(this.travelsData.length == 0){
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
  }


  acceptAndUpdateTravel(travel: Travels){
    const travelRef: AngularFirestoreDocument<Travels>= this.afs.doc(`travels/${travel.uid}`)
    const data: Travels={
      available: false,
    }
    return travelRef.set(data,{merge:true})
  }

   finishTravelAndUpdate(history: any){  
     const travelRef: AngularFirestoreDocument<History>= this.afs.doc(`history/${history.uid}`)
     const data: History={
      uid: history.uid,
      uid_driver: this.userData.data().uid,
      displayName_driver: this.userData.data().displayName,
      initial: this.tra.destinationI,
      destino: this.tra.destinationD,
      distance: history.distance,
      cost: history.cost,
    }
    console.log(data);
    return travelRef.set(data,{merge:true})
  }
}
