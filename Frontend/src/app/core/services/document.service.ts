
import { Injectable }                      from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable }                       from 'rxjs';
import { environment }                      from '../../../environments/environment';
import { DocumentDto, IndexDocumentResponse } from '../models/document';

export type UserRole = 'Admin' | 'Manager' | 'User';

@Injectable({ providedIn: 'root' })
export class DocumentService {

  private readonly base = `${environment.apiUrl}/Document`;

  constructor(private http: HttpClient) {}


  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(this.base);
  }

  uploadDocument(
    file: File,
    roleRequired: UserRole = 'User'
  ): Observable<HttpEvent<IndexDocumentResponse>> {

    const formData = new FormData();
    formData.append('File', file); 

    const req = new HttpRequest<FormData>(
      'POST',
      `${this.base}/upload?roleRequired=${roleRequired}`,
      formData,
      {
        reportProgress: true,
        responseType:   'json'
      }
    );

    return this.http.request<IndexDocumentResponse>(req);
  }


  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}