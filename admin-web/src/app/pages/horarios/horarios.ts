import { Component } from '@angular/core';

//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [ Sidebar ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss',
})
export class Horarios {}
