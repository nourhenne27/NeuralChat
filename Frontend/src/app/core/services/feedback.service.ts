import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeedbackDto } from '../models/feedback';

@Injectable({ providedIn: 'root' })
export class FeedbackService {

  constructor(private http: HttpClient) {}

  submitFeedback(dto: FeedbackDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/feedback`,
      dto
    );
  }
}