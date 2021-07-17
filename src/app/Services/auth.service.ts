import { Injectable } from '@angular/core';
import {Users} from '../Models/users'
import { AngularFireAuth } from '@angular/fire/auth'
import { FireService } from '../Services/fire.service'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user$: Observable<Users>

 
  constructor(public afAuth: AngularFireAuth, public afs:AngularFirestore, public fs: FireService) {
    this.user$ =this.afAuth.authState.pipe(
      switchMap((user)=>{
        if(user){
          return this.afs.doc<Users>(`users/${user.uid}`).valueChanges()
        }
        return of (null)
      })
    )
   }

   async logIn(email: string, password: string):Promise<Users> {
     try {
       const {user} = await this.afAuth.signInWithEmailAndPassword(email,password)
         this.updateUserData(user)
         this.fs.getCurrentUser(user.uid)
         return user
     } catch (error) {
       console.log(error);
       
     }
   }

   private updateUserData(user: Users){
     const userRef: AngularFirestoreDocument<Users> = this.afs.doc(`users/${user.uid}`)
      const data:Users={
        uid: user.uid,
        email: user.email,
      }
      return userRef.set(data,{merge:true})
   }

   logout() {
     this.user$= null
   }
}

