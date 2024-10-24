import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ElasticSearchService {
  private elasticUrl = 'http://localhost:9200/_search';

  constructor(private http: HttpClient) {}

  queryElasticSearch(jobId: string): Observable<any> {
    const query = {
      "_source": ["message"],
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "fileName.keyword": jobId
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

    return this.http.post(this.elasticUrl, query, httpOptions);
  }
}