import { Routes } from '@angular/router';
import { SwitchboardComponent } from './switchboard/switchboard.component';

export const routes: Routes = [
  { path: '', component: SwitchboardComponent },
  { path: '**', redirectTo: '' },
];
