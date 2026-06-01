import { Component } from '@angular/core';

//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [ Sidebar ],
  templateUrl: './citas.html',
  styleUrl: './citas.scss',
})
export class Citas {}
