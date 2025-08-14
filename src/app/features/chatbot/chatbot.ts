import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedNavbar } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';
import { 
  AiAssistantService, 
  AiChatMessage, 
  ConversationSession 
} from '../../shared/services/ai-assistant.service';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language: 'en' | 'fr';
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SharedNavbar, SharedFooter],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})
export class Chatbot implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private readonly CURRENT_UTC_TIME = new Date('2025-08-14T00:32:37Z');

  // Navbar configuration
  navbarConfig = {
    title: 'AI Assistant',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true
  };

  // Chat state
  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isTyping: boolean = false;
  currentLanguage: 'en' | 'fr' = 'en';
  
  // AI Assistant state
  currentConversation: ConversationSession | null = null;
  aiServiceAvailable: boolean = false;
  aiServiceMessage: string = '';
  isAiLoading: boolean = false;
  hasAiError: boolean = false;
  canGenerateDocument: boolean = false;

  // Enhanced quick actions
  private quickActions = {
    en: {
      project: "I want to post a new project and need help defining the requirements.",
      freelancer: "I'm looking for a freelancer with specific skills for my project.",
      budget: "I need help estimating the budget for my project.",
      timeline: "How long should my project take to complete?",
      technology: "What technology stack should I use for my project?",
      document: "I'm ready to generate the project requirements document."
    },
    fr: {
      project: "Je veux publier un nouveau projet et j'ai besoin d'aide pour définir les exigences.",
      freelancer: "Je recherche un freelance avec des compétences spécifiques pour mon projet.",
      budget: "J'ai besoin d'aide pour estimer le budget de mon projet.",
      timeline: "Combien de temps mon projet devrait-il prendre pour être terminé ?",
      technology: "Quelle pile technologique devrais-je utiliser pour mon projet ?",
      document: "Je suis prêt à générer le document d'exigences du projet."
    }
  };

  constructor(
    private translate: TranslateService,
    private aiAssistantService: AiAssistantService
  ) {
    this.currentLanguage = this.translate.currentLang as 'en' | 'fr' || 'en';
    console.log('🤖 Chatbot initialized at:', this.CURRENT_UTC_TIME.toISOString());
  }

  ngOnInit(): void {
    console.log('🚀 Chatbot ngOnInit - Checking AI Assistant availability');
    
    // Check AI service availability
    const serviceStatus = this.aiAssistantService.getServiceStatus();
    this.aiServiceAvailable = serviceStatus.available;
    this.aiServiceMessage = serviceStatus.message;
    
    console.log('🤖 AI Service Status:', serviceStatus);

    if (this.aiServiceAvailable) {
      this.initializeAiAssistant();
    } else {
      this.initializeFallbackMode();
    }

    // Subscribe to AI loading state
    this.aiAssistantService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isAiLoading = loading;
        this.isTyping = loading;
      });

    // Subscribe to conversation changes
    this.aiAssistantService.currentConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversation => {
        this.currentConversation = conversation;
        this.updateMessagesFromConversation(conversation);
        this.updateDocumentGenerationButton();
      });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAiAssistant(): void {
    console.log('🤖 Initializing AI Assistant');
    
    // Start new conversation or load existing one
    const existingConversation = this.currentConversation;
    if (!existingConversation) {
      this.aiAssistantService.startNewConversation('Project Requirements Discussion');
    }

    // Add welcome message if no existing conversation
    if (!existingConversation || existingConversation.messages.length === 0) {
      this.addSystemMessage(
        this.currentLanguage === 'en' 
          ? "Hello! I'm your Pro-Connect AI Assistant. I'll help you define your project requirements step by step. What kind of project are you planning?"
          : "Bonjour ! Je suis votre Assistant IA Pro-Connect. Je vais vous aider à définir les exigences de votre projet étape par étape. Quel type de projet planifiez-vous ?"
      );
    }
  }

  private initializeFallbackMode(): void {
    console.log('⚠️ AI Assistant not available, using fallback mode');
    
    this.addSystemMessage(
      this.currentLanguage === 'en'
        ? `AI Assistant is currently unavailable. ${this.aiServiceMessage}`
        : `L'Assistant IA n'est pas disponible actuellement. ${this.aiServiceMessage}`
    );
  }

  private updateMessagesFromConversation(conversation: ConversationSession | null): void {
    if (!conversation) return;

    // Convert AI messages to chat messages
    this.messages = conversation.messages.map(msg => ({
      id: msg.id || Date.now().toString(),
      text: msg.content,
      isUser: msg.role === 'user',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      language: this.currentLanguage
    }));
  }

  private updateDocumentGenerationButton(): void {
    if (!this.currentConversation) {
      this.canGenerateDocument = false;
      return;
    }

    // Enable document generation if conversation has enough content
    const messageCount = this.currentConversation.messages.length;
    const hasUserMessages = this.currentConversation.messages.some(msg => msg.role === 'user');
    
    this.canGenerateDocument = messageCount >= 4 && hasUserMessages && !this.currentConversation.isComplete;
  }

  sendMessage(): void {
    const messageContent = this.currentMessage.trim();
    if (!messageContent) return;

    console.log('💬 Sending message:', messageContent);

    // Validate message
    const validation = this.aiAssistantService.validateMessage(messageContent);
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid message');
      return;
    }

    // Add user message to display immediately
    this.addUserMessage(messageContent);
    this.currentMessage = '';

    if (this.aiServiceAvailable) {
      // Send to AI Assistant
      this.aiAssistantService.sendMessage(messageContent, this.currentConversation?.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ AI response received');
            this.hasAiError = false;
            // Message will be added automatically via conversation subscription
          },
          error: (error) => {
            console.error('❌ Error sending message to AI:', error);
            this.hasAiError = true;
            this.addSystemMessage(
              this.currentLanguage === 'en'
                ? `Sorry, I encountered an error: ${error}. Please try again.`
                : `Désolé, j'ai rencontré une erreur : ${error}. Veuillez réessayer.`
            );
          }
        });
    } else {
      // Fallback to simple responses
      this.generateFallbackResponse(messageContent);
    }
  }

  private generateFallbackResponse(userMessage: string): void {
    this.isTyping = true;
    
    setTimeout(() => {
      this.isTyping = false;
      
      const message = userMessage.toLowerCase();
      let response = this.currentLanguage === 'en' 
        ? "I understand you need help, but the AI assistant is currently unavailable. Please try again later or contact support."
        : "Je comprends que vous avez besoin d'aide, mais l'assistant IA n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter le support.";

      // Simple keyword matching
      if (message.includes('project') || message.includes('projet')) {
        response = this.currentLanguage === 'en'
          ? "For project posting, please visit the 'Post Project' section in the main menu."
          : "Pour publier un projet, veuillez visiter la section 'Publier un projet' dans le menu principal.";
      } else if (message.includes('freelancer') || message.includes('freelance')) {
        response = this.currentLanguage === 'en'
          ? "To find freelancers, please browse our talent directory in the main application."
          : "Pour trouver des freelances, veuillez parcourir notre répertoire de talents dans l'application principale.";
      }

      this.addSystemMessage(response);
    }, 1000);
  }

  generateDocument(): void {
    if (!this.canGenerateDocument || !this.currentConversation) return;

    console.log('📄 Generating project requirements document');

    this.aiAssistantService.generateDocument(this.currentConversation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (document) => {
          console.log('✅ Document generated successfully');
          this.showDocumentModal(document);
        },
        error: (error) => {
          console.error('❌ Error generating document:', error);
          this.showError(
            this.currentLanguage === 'en'
              ? `Failed to generate document: ${error}`
              : `Échec de la génération du document : ${error}`
          );
        }
      });
  }

  private showDocumentModal(documentContent: string): void {
    // Create and show modal with generated document
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-semibold">Project Requirements Document</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <div class="prose max-w-none">${this.markdownToHtml(documentContent)}</div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button onclick="navigator.clipboard.writeText(\`${documentContent.replace(/`/g, '\\`')}\`)" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Copy Markdown
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4">$2</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  switchLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'en' ? 'fr' : 'en';
    this.translate.use(this.currentLanguage);
    
    this.addSystemMessage(
      this.currentLanguage === 'en'
        ? "I've switched to English. How can I continue helping you with your project?"
        : "Je suis passé au français. Comment puis-je continuer à vous aider avec votre projet ?"
    );
  }

  clearChat(): void {
    console.log('🧹 Clearing chat conversation');
    
    if (this.aiServiceAvailable && this.currentConversation) {
      // Start new conversation
      this.aiAssistantService.startNewConversation('New Project Discussion');
    } else {
      // Clear local messages
      this.messages = [];
      this.initializeFallbackMode();
    }
  }

  // Enhanced quick action methods
  sendQuickActionProject(): void {
    const message = this.quickActions[this.currentLanguage].project;
    this.currentMessage = message;
    this.sendMessage();
  }

  sendQuickActionFreelancer(): void {
    const message = this.quickActions[this.currentLanguage].freelancer;
    this.currentMessage = message;
    this.sendMessage();
  }

  sendQuickActionBudget(): void {
    const message = this.quickActions[this.currentLanguage].budget;
    this.currentMessage = message;
    this.sendMessage();
  }

  sendQuickActionTimeline(): void {
    const message = this.quickActions[this.currentLanguage].timeline;
    this.currentMessage = message;
    this.sendMessage();
  }

  sendQuickActionTechnology(): void {
    const message = this.quickActions[this.currentLanguage].technology;
    this.currentMessage = message;
    this.sendMessage();
  }

  // Utility methods
  private addUserMessage(text: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
      language: this.currentLanguage
    };
    this.messages.push(message);
  }

  private addSystemMessage(text: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: false,
      timestamp: new Date(),
      language: this.currentLanguage
    };
    this.messages.push(message);
  }

  private showError(message: string): void {
    console.error('💥 Chatbot Error:', message);
    this.addSystemMessage(
      this.currentLanguage === 'en'
        ? `Error: ${message}`
        : `Erreur : ${message}`
    );
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Getters for template
  get statusMessage(): string {
    if (this.hasAiError) {
      return this.currentLanguage === 'en' 
        ? 'AI Assistant encountered an error' 
        : 'L\'Assistant IA a rencontré une erreur';
    }
    
    if (!this.aiServiceAvailable) {
      return this.aiServiceMessage;
    }
    
    if (this.isAiLoading) {
      return this.currentLanguage === 'en' 
        ? 'AI is thinking...' 
        : 'L\'IA réfléchit...';
    }
    
    return this.currentLanguage === 'en' 
      ? 'AI Assistant is ready' 
      : 'Assistant IA est prêt';
  }

  get showGenerateButton(): boolean {
    return this.aiServiceAvailable && this.canGenerateDocument && !this.currentConversation?.isComplete;
  }
}