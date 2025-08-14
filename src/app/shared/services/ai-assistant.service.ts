// src/app/shared/services/ai-assistant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

// ============= AI ASSISTANT INTERFACES =============

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  id?: string;
}

export interface AiChatRequest {
  conversationHistory: AiChatMessage[];
}

export interface AiChatResponse {
  role: 'assistant';
  content: string;
}

export interface AiDocumentResponse {
  document: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: AiChatMessage[];
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
}

// ============= AI ASSISTANT SERVICE =============

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly API_URL = 'http://localhost:8081/api/ai-assistant';
  private readonly TOKEN_KEY = 'auth-token';
  private readonly STORAGE_KEY = 'ai-conversations';
  
  // ✅ Current time for consistent logging
  private readonly CURRENT_UTC_TIME = new Date('2025-08-14T00:29:17Z');
  
  // ✅ Conversation state management
  private currentConversationSubject = new BehaviorSubject<ConversationSession | null>(null);
  public currentConversation$ = this.currentConversationSubject.asObservable();
  
  private conversationsSubject = new BehaviorSubject<ConversationSession[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🤖 AiAssistantService initialized at:', this.CURRENT_UTC_TIME.toISOString());
    this.loadConversationsFromStorage();
  }

  // ============= CHAT METHODS =============

  /**
   * Send message to AI assistant and get response
   */
  sendMessage(message: string, conversationId?: string): Observable<AiChatMessage> {
    console.log('💬 AiAssistantService: Sending message to AI assistant');
    
    const currentConversation = this.getCurrentConversation(conversationId);
    
    // Add user message to conversation
    const userMessage: AiChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };
    
    const updatedMessages = [...currentConversation.messages, userMessage];
    this.updateConversation(currentConversation.id, { messages: updatedMessages });
    
    // Prepare request
    const request: AiChatRequest = {
      conversationHistory: updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };

    this.isLoadingSubject.next(true);

    return this.http.post<AiChatResponse>(`${this.API_URL}/chat`, request, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ AI assistant response received');
        
        // Add AI response to conversation
        const aiMessage: AiChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          id: this.generateMessageId()
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        this.updateConversation(currentConversation.id, { 
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        });
      }),
      catchError(error => {
        console.error('❌ Error sending message to AI assistant:', error);
        this.isLoadingSubject.next(false);
        return throwError(() => this.handleError(error));
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Generate final project requirements document
   */
  generateDocument(conversationId?: string): Observable<string> {
    console.log('📄 AiAssistantService: Generating project requirements document');
    
    const conversation = this.getCurrentConversation(conversationId);
    
    if (!conversation.messages.length) {
      return throwError(() => 'No conversation history available for document generation');
    }

    const request: AiChatRequest = {
      conversationHistory: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };

    this.isLoadingSubject.next(true);

    return this.http.post<AiDocumentResponse>(`${this.API_URL}/generate-document`, request, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Project requirements document generated successfully');
        
        // Mark conversation as complete
        this.updateConversation(conversation.id, { 
          isComplete: true,
          updatedAt: new Date().toISOString()
        });
      }),
      catchError(error => {
        console.error('❌ Error generating document:', error);
        this.isLoadingSubject.next(false);
        return throwError(() => this.handleError(error));
      }),
      tap(() => this.isLoadingSubject.next(false)),
      // Extract document content from response
      map(response => response.document)
    );
  }

  // ============= CONVERSATION MANAGEMENT =============

  /**
   * Start a new conversation session
   */
  startNewConversation(title?: string): ConversationSession {
    console.log('🆕 Starting new AI conversation session');
    
    const conversation: ConversationSession = {
      id: this.generateConversationId(),
      title: title || `Project Discussion ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isComplete: false
    };

    const conversations = this.conversationsSubject.value;
    const updatedConversations = [conversation, ...conversations];
    
    this.conversationsSubject.next(updatedConversations);
    this.currentConversationSubject.next(conversation);
    this.saveConversationsToStorage();
    
    console.log('✅ New conversation created:', conversation.id);
    return conversation;
  }

  /**
   * Load existing conversation
   */
  loadConversation(conversationId: string): ConversationSession | null {
    console.log('📂 Loading conversation:', conversationId);
    
    const conversations = this.conversationsSubject.value;
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      this.currentConversationSubject.next(conversation);
      console.log('✅ Conversation loaded:', conversationId);
      return conversation;
    }
    
    console.warn('⚠️ Conversation not found:', conversationId);
    return null;
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId: string): void {
    console.log('🗑️ Deleting conversation:', conversationId);
    
    const conversations = this.conversationsSubject.value;
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    
    this.conversationsSubject.next(updatedConversations);
    
    // If current conversation is deleted, clear it
    const currentConversation = this.currentConversationSubject.value;
    if (currentConversation?.id === conversationId) {
      this.currentConversationSubject.next(null);
    }
    
    this.saveConversationsToStorage();
    console.log('✅ Conversation deleted:', conversationId);
  }

  /**
   * Update conversation details
   */
  updateConversation(conversationId: string, updates: Partial<ConversationSession>): void {
    const conversations = this.conversationsSubject.value;
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex >= 0) {
      const updatedConversation = { ...conversations[conversationIndex], ...updates };
      conversations[conversationIndex] = updatedConversation;
      
      this.conversationsSubject.next([...conversations]);
      
      // Update current conversation if it's the one being updated
      const currentConversation = this.currentConversationSubject.value;
      if (currentConversation?.id === conversationId) {
        this.currentConversationSubject.next(updatedConversation);
      }
      
      this.saveConversationsToStorage();
    }
  }

  /**
   * Get current active conversation or create new one
   */
  getCurrentConversation(conversationId?: string): ConversationSession {
    if (conversationId) {
      const conversation = this.loadConversation(conversationId);
      if (conversation) return conversation;
    }
    
    const currentConversation = this.currentConversationSubject.value;
    if (currentConversation) return currentConversation;
    
    return this.startNewConversation();
  }

  /**
   * Get all conversations
   */
  getAllConversations(): Observable<ConversationSession[]> {
    return this.conversations$;
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    console.log('🧹 Clearing all AI conversations');
    
    this.conversationsSubject.next([]);
    this.currentConversationSubject.next(null);
    this.clearStoredConversations();
    
    console.log('✅ All conversations cleared');
  }

  // ============= UTILITY METHODS =============

  /**
   * Check if user has CLIENT role (required for AI assistant)
   */
canUseAiAssistant(): boolean {
  const token = this.getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const username = payload.sub || payload.username;
    
    console.log('🔍 AI Access Check for:', username);
    console.log('📋 JWT Payload:', payload);
    
    // ✅ Check multiple ways to find CLIENT role
    const checkClientRole = () => {
      // Method 1: Check roles array
      if (payload.roles && Array.isArray(payload.roles)) {
        const hasRole = payload.roles.some((role: string) => 
          role.includes('CLIENT') || role.includes('client')
        );
        if (hasRole) {
          console.log('✅ CLIENT role found in roles array');
          return true;
        }
      }
      
      // Method 2: Check authorities array
      if (payload.authorities && Array.isArray(payload.authorities)) {
        interface Authority {
            authority: string;
        }

        // In the method, replace the selection with:
                        const hasAuth = payload.authorities.some((auth: string | Authority) => 
                            (typeof auth === 'string' && auth.includes('CLIENT')) ||
                            (typeof auth === 'object' && auth.authority && auth.authority.includes('CLIENT'))
                        );
        if (hasAuth) {
          console.log('✅ CLIENT role found in authorities array');
          return true;
        }
      }
      
      // Method 3: For development - allow specific usernames
      if (username === 'Jozef' || username === 'client' || username === 'testclient') {
        console.log('✅ CLIENT access granted for development user:', username);
        return true;
      }
      
      return false;
    };
    
    const hasAccess = checkClientRole();
    console.log('🎯 Final AI Assistant access result:', hasAccess);
    return hasAccess;
    
  } catch (error) {
    console.warn('⚠️ Token parsing error for AI Assistant:', error);
    return false;
  }
}
  /**
   * Get conversation summary for display
   */
  getConversationSummary(conversation: ConversationSession): string {
    if (!conversation.messages.length) return 'No messages yet';
    
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 50 
        ? firstUserMessage.content.substring(0, 50) + '...'
        : firstUserMessage.content;
    }
    
    return 'New conversation';
  }

  /**
   * Format conversation for export
   */
  exportConversation(conversationId: string): string {
    const conversation = this.conversationsSubject.value.find(c => c.id === conversationId);
    if (!conversation) return '';

    const header = `# ${conversation.title}\n\n`;
    const meta = `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
    const messages = conversation.messages.map(msg => 
      `**${msg.role === 'user' ? 'You' : 'AI Assistant'}:** ${msg.content}`
    ).join('\n\n');

    return header + meta + '\n\n---\n\n' + messages;
  }

  /**
   * Validate message content
   */
  validateMessage(content: string): { valid: boolean; error?: string } {
    if (!content || !content.trim()) {
      return { valid: false, error: 'Message cannot be empty' };
    }
    
    if (content.length > 5000) {
      return { valid: false, error: 'Message is too long (max 5000 characters)' };
    }
    
    return { valid: true };
  }

  /**
   * Get AI assistant status
   */
  getServiceStatus(): { available: boolean; message: string } {
    const hasAccess = this.canUseAiAssistant();
    const hasConnection = !!this.getToken();
    
    if (!hasConnection) {
      return { available: false, message: 'Please log in to use the AI assistant' };
    }
    
    if (!hasAccess) {
      return { available: false, message: 'AI assistant is only available for clients' };
    }
    
    return { available: true, message: 'AI assistant is ready to help' };
  }

  // ============= PRIVATE HELPER METHODS =============

  private generateConversationId(): string {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError(error: any): string {
    console.error('🚨 AiAssistantService Error:', error);
    
    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.status === 403) {
      return 'AI assistant is only available for clients. Please upgrade your account.';
    }
    
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (error.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.error?.message) {
      return error.error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // ============= LOCAL STORAGE METHODS =============

  private saveConversationsToStorage(): void {
    try {
      const conversations = this.conversationsSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.warn('⚠️ Could not save conversations to storage:', error);
    }
  }

  private loadConversationsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const conversations: ConversationSession[] = JSON.parse(stored);
        this.conversationsSubject.next(conversations);
        console.log('📂 Loaded', conversations.length, 'conversations from storage');
      }
    } catch (error) {
      console.warn('⚠️ Could not load conversations from storage:', error);
    }
  }

  private clearStoredConversations(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Could not clear stored conversations:', error);
    }
  }

  // ============= DEBUG METHODS =============

  /**
   * Get service info for debugging
   */
  getServiceInfo(): any {
    return {
      serviceName: 'AiAssistantService',
      apiUrl: this.API_URL,
      hasToken: !!this.getToken(),
      canUseAi: this.canUseAiAssistant(),
      conversationCount: this.conversationsSubject.value.length,
      currentConversation: this.currentConversationSubject.value?.id || null,
      isLoading: this.isLoadingSubject.value,
      timestamp: this.CURRENT_UTC_TIME.toISOString()
    };
  }

  /**
   * Log service status
   */
  logServiceStatus(): void {
    const info = this.getServiceInfo();
    console.log('🤖 AiAssistantService Status:', info);
  }
}