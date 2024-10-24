import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page2.component.html',
  styleUrls: ['./page2.component.css']
})
export class Page2Component implements OnInit {
  elasticResponse: any[] = [];
  sourceLinks: any[] = []; // All source links
  navigationLinks: string[] = []; // Links ending with .html
  extractionLinks: string[] = []; // Links ending with .pdf
  jobId: string = '';
  elasticResponseAccounts: any[] = [];
  accountSignatureMap: { [accountNumber: string]: string[] } = {}; // Dictionary of account numbers and an array of unique source signatures
  Object = Object;
  credentialId: string = '';
  organizationName: string = '';
  providerAlias: string = '';
  acquisitionTemplate: string = '';
  extractionStatus: string = '';
  statementCount: number = 0;
  startTimestamp: string = '';
  completedTimestamp: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('jobId') || '';
    this.credentialId = this.route.snapshot.paramMap.get('credentialId') || '';
    this.organizationName = this.route.snapshot.paramMap.get('organizationName') || '';
    this.providerAlias = this.route.snapshot.paramMap.get('providerAlias') || '';
    this.acquisitionTemplate = this.route.snapshot.paramMap.get('acquisitionTemplate') || '';
    this.extractionStatus = this.route.snapshot.paramMap.get('extractionStatus') || '';
    this.statementCount = parseInt(this.route.snapshot.paramMap.get('statementCount') || '0');
    this.startTimestamp = this.route.snapshot.paramMap.get('startTimestamp') || '';
    this.completedTimestamp = this.route.snapshot.paramMap.get('completedTimestamp') || '';
    this.queryElasticSearch();
  }
  
  queryElasticSearch(): void {
    const url = 'http://localhost:9200/_search'; 
  
    const query = {
      "_source": ["message"],
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "fileName.keyword": this.jobId
              }
            },
            {
              "match_phrase": {
                "message": "Source link"
              }
            }
          ]
        }
      },
      "size": 1000
    };
  
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  
    this.http.post(url, query, httpOptions).subscribe(
      (response: any) => {
        if (response && response.hits && response.hits.hits) {
          this.elasticResponse = response.hits.hits.map((hit: any) => hit._source.message);
  
          this.sourceLinks = this.elasticResponse
            .map((message: string) => {
              const parts = message.split('Source link:');
              return parts.length > 1 ? parts[1].trim() : ''; // Extract link after "Source link:"
            })
            .filter(link => link !== ''); // Remove empty strings
  
          this.navigationLinks = this.sourceLinks.filter(link => link.endsWith('.html'));
          this.extractionLinks = this.sourceLinks.filter(link => link.endsWith('.pdf'));
  
          console.log('Navigation Links:', this.navigationLinks);
          console.log('Extraction Links:', this.extractionLinks);
  
          // Call the second query after the first one completes
          this.queryAnotherField();
        }
      },
      error => {
        console.error('Error occurred while querying Elasticsearch:', error);
      }
    );
  }
  
  queryAnotherField(): void {
    const url = 'http://localhost:9200/_search'; 
    const accountNumberRegex = /a\.account_number\s*=\s*([\d\s-]+)/g; // Regex pattern to match account numbers
    const sourceSignatureRegex = /meta\.source_signature\s*=\s*([a-f0-9]+)/g; // Regex pattern to match source signatures
  
    const query = {
      "_source": ["message"],
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "fileName.keyword": this.jobId
              }
            },
            {
              "match_phrase": {
                "message": "[woot]"
              }
            }
          ]
        }
      },
      "size": 1000
    };
  
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  
    this.http.post(url, query, httpOptions).subscribe(
      (response: any) => {
        if (response && response.hits && response.hits.hits) {
          this.elasticResponseAccounts = response.hits.hits.map((hit: any) => hit._source.message);
          console.log(this.elasticResponseAccounts);
  
          // Create dictionary of account numbers as keys and array of unique source signatures as values
          this.elasticResponseAccounts.forEach((message: string) => {
            let accountNumberMatch;
            let sourceSignatureMatch;
  
            // Extract account number
            while ((accountNumberMatch = accountNumberRegex.exec(message)) !== null) {
              const accountNumber = accountNumberMatch[1].trim(); // Extract the account number
              
              // Initialize the array if the account number doesn't exist
              if (!this.accountSignatureMap[accountNumber]) {
                this.accountSignatureMap[accountNumber] = [];
              }
  
              // Extract corresponding source signature
              while ((sourceSignatureMatch = sourceSignatureRegex.exec(message)) !== null) {
                const sourceSignature = sourceSignatureMatch[1]; // Extract the source signature
  
                // Add the source signature only if it is not already in the array
                if (!this.accountSignatureMap[accountNumber].includes(sourceSignature)) {
                  this.accountSignatureMap[accountNumber].push(sourceSignature);
                }
              }
            }
          });
  
          console.log('Account Number to Source Signature Map:', this.accountSignatureMap); // Debugging output
          this.replaceSourceSignatureWithLinks();
        }
      },
      error => {
        console.error('Error occurred while querying Elasticsearch:', error);
      }
    );
  }
  replaceSourceSignatureWithLinks(): void {
    for (const accountNumber in this.accountSignatureMap) {
      const sourceSignatures = this.accountSignatureMap[accountNumber];
  
      // Iterate through the source signatures and replace each with matching extraction link
      this.accountSignatureMap[accountNumber] = sourceSignatures.map((signature: string) => {
        const matchingLink = this.extractionLinks.find(link => link.includes(signature));
  
        if (matchingLink) {
          console.log(`Replacing source signature "${signature}" with link: ${matchingLink}`);
          return matchingLink; // Replace the signature with the link
        } else {
          return signature; // If no matching link, keep the signature as is
        }
      });
    }
  
    console.log('Updated Account Number to Source Link Map:', this.accountSignatureMap); // Debugging output
  }
}