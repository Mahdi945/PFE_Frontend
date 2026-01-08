import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  showChat = false;
  userMessage = '';
  messages: { sender: string; text: string }[] = [];

  constructor(private chatService: ChatService) {}

  toggleChat() {
    this.showChat = !this.showChat;
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const msg = this.userMessage;
    this.messages.push({ sender: 'You', text: msg });
    this.userMessage = '';

    this.chatService.sendMessage(msg).subscribe(res => {
      this.messages.push({ sender: 'Assistant', text: res.response });
    });
  }
}
