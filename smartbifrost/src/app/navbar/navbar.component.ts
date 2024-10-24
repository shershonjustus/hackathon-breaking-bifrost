import { HttpClient, HttpClientModule} from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';  
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [HttpClientModule, FormsModule, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  token: string = '';

  constructor(private http: HttpClient, private router: Router) {
    
  }

  ngOnInit(): void {
    this.token=localStorage.getItem('access_token') || '';
  }

  logOut(): void{
    console.log("Hi");
    localStorage.removeItem('access_token');
    this.ngOnInit();
    window.location.reload();
  }
}
