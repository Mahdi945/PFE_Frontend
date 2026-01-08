import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root', // ✅ This makes it globally available
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
    return this.http.post(environment.chatbotUrl, { message });
  }
}
