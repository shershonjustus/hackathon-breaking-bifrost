import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';  
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page1',
  standalone: true,
  imports: [HttpClientModule, FormsModule, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './page1.component.html',
  styleUrl: './page1.component.css'
})
export class Page1Component implements OnInit{
  username: string = '';
  password: string = '';
  env: string = 'dev';
  jobId: string = '';
  token: string = '';

  constructor(private http: HttpClient, private router: Router) {
    
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('access_token') || '';
  }

  authenticate() {
    let envSuffix = this.getEnvSuffix();
    if (envSuffix === '.dev') {
      envSuffix = '-int';
    }
    const authUrl = `https://auth${envSuffix}.urjanet.net/api/login`;
    const body = {
      username: this.username,
      password: this.password
    };

    this.http.post<any>(authUrl, body).subscribe(response => {
      this.token = response.token;
      localStorage.setItem('access_token', response.token);
      console.log('Authentication successful, token received!');
      console.log(window.location.pathname)
      this.ngOnInit();
      window.location.reload();
    }, error => {
      console.error('Authentication failed', error);
    });
  }

  fetchBifrostData() {
    if (!this.token) {
      console.error('No authentication token available.');
      return;
    }

    let envSuffix = this.getEnvSuffix();
    if (envSuffix !== '.dev') {
      envSuffix = '-api' + envSuffix;
    }
    const odinUrl = `https://odin${envSuffix}.urjanet.net/api/private/v1/jobs/${this.jobId}`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>(odinUrl, { headers }).subscribe(response => {
      const bifrostUrl = response.bifrostLogsUrl;
      if (bifrostUrl) {
        this.downloadBifrostLogs(bifrostUrl, headers, response);
      } else {
        console.error('Bifrost URL not found in response');
      }
    }, error => {
      console.error('Failed to fetch job data', error);
    });
  }

  downloadBifrostLogs(bifrostUrl: string, headers: HttpHeaders, details: any) {
    this.http.get(bifrostUrl, { headers, responseType: 'text' }).subscribe(data => {
      const blob = new Blob([data], { type: 'text/plain' });
      saveAs(blob, `${this.jobId}.txt`); //Save to the file path
      console.log(`Logs saved for jobId: ${this.jobId}`);
      this.router.navigate(['/page2', { jobId: this.jobId,credentialId: details.credentialId,
        organizationName: details.organizationName,
        providerAlias: details.providerAlias,
        acquisitionTemplate: details.acquisitionTemplate,
        extractionStatus: details.extractionStatus,
        statementCount: details.statementCount,
        startTimestamp: details.startTimestamp,
        completedTimestamp: details.completedTimestamp }]);  // Navigate to the success page
    }, error => {
      console.error('Failed to download Bifrost logs', error);
    });
  }

  getEnvSuffix(): string {
    if (this.env === 'dev') {
      return '.dev';
    } else if (this.env === 'uat') {
      return '-uat';
    } else {
      return '';
    }
  }

  logOut(): void{
    this.token = '';
    localStorage.removeItem('access_token');
  }
}
