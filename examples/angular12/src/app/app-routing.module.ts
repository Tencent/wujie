import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommunicationComponent } from './views/communication/communication.component';
import { DialogComponent } from './views/dialog/dialog.component';
import {HomeComponent} from './views/home/home.component';
import { LocationComponent } from './views/location/location.component';
import { StateComponent } from './views/state/state.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'dialog', component: DialogComponent },
  { path: 'location', component: LocationComponent },
  { path: 'contact', component: CommunicationComponent },
  { path: 'state', component: StateComponent },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
