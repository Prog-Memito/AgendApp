// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { getAnalytics } from "firebase/analytics";

// Firebase Standalone Providers
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

const firebaseConfig = {

  apiKey: "AIzaSyCqnMoXAQ3JQrc-Pm31eC4WcY_hGzy8SyM",

  authDomain: "agendapp-4f6a0.firebaseapp.com",

  projectId: "agendapp-4f6a0",

  storageBucket: "agendapp-4f6a0.firebasestorage.app",

  messagingSenderId: "348244160042",

  appId: "1:348244160042:web:9f34c13ae346465a859d53",

  measurementId: "G-QBDD77SQPR"

};


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(), // Necesario para conectar con tu DB SQL
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
});