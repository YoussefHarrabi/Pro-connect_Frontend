import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'client' | 'freelancer';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  isRead: boolean;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

@Component({
  selector: 'app-workspace-chat',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './workspace-chat.html',
  styleUrls: ['./workspace-chat.scss']
})
export class WorkspaceChatComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() currentUserRole: 'client' | 'freelancer' = 'client';
  @Output() messageSent = new EventEmitter<Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messageForm: FormGroup;
  isTyping = false;
  selectedFiles: File[] = [];

  constructor(private fb: FormBuilder) {
    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      const newMessage = {
        sender: this.currentUserRole === 'client' ? 'John Smith' : 'Sarah Johnson',
        senderRole: this.currentUserRole,
        content: this.messageForm.value.content,
        attachments: this.selectedFiles.map(file => ({
          id: 'file-' + Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadedBy: this.currentUserRole === 'client' ? 'John Smith' : 'Sarah Johnson',
          uploadedAt: new Date()
        }))
      };

      this.messageSent.emit(newMessage);
      this.messageForm.reset();
      this.selectedFiles = [];
    }
  }

  handleEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.senderRole === this.currentUserRole;
  }

  shouldShowDateSeparator(currentMessage: ChatMessage, previousMessage: ChatMessage | null): boolean {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    } else if (fileType === 'application/pdf') {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
      return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
    } else {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }
}
