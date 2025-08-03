import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language: 'en' | 'fr';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SharedNavbar, SharedFooter],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})
export class Chatbot implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  // Navbar configuration
  navbarConfig = {
    title: 'AI Assistant',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true
  };

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isTyping: boolean = false;
  currentLanguage: 'en' | 'fr' = 'en';

  // Static bot responses for demonstration
  private botResponses = {
    en: {
      greeting: "Hello! I'm ProConnect AI Assistant. I can help you find the perfect freelancers or projects. How can I assist you today?",
      projectHelp: "I can help you with project postings! What type of project are you looking to create? Web development, mobile app, design, or something else?",
      freelancerHelp: "Great! I can help you find talented freelancers. What skills are you looking for? For example: React, Node.js, UI/UX Design, etc.",
      skillsQuestion: "What specific technologies or skills do you need for your project?",
      budgetQuestion: "What's your budget range for this project?",
      timelineQuestion: "When do you need this project completed?",
      default: "I understand you're looking for help. Can you tell me more about your project needs or the type of freelancer you're seeking?",
      languageSwitch: "I've switched to English. How can I help you today?",
      thankYou: "You're welcome! Is there anything else I can help you with regarding your project or finding freelancers?"
    },
    fr: {
      greeting: "Bonjour ! Je suis l'Assistant IA ProConnect. Je peux vous aider à trouver les freelances parfaits ou des projets. Comment puis-je vous aider aujourd'hui ?",
      projectHelp: "Je peux vous aider avec les publications de projets ! Quel type de projet cherchez-vous à créer ? Développement web, application mobile, design, ou autre chose ?",
      freelancerHelp: "Parfait ! Je peux vous aider à trouver des freelances talentueux. Quelles compétences recherchez-vous ? Par exemple : React, Node.js, Design UI/UX, etc.",
      skillsQuestion: "Quelles technologies ou compétences spécifiques avez-vous besoin pour votre projet ?",
      budgetQuestion: "Quel est votre budget pour ce projet ?",
      timelineQuestion: "Quand avez-vous besoin que ce projet soit terminé ?",
      default: "Je comprends que vous cherchez de l'aide. Pouvez-vous me parler davantage de vos besoins de projet ou du type de freelance que vous recherchez ?",
      languageSwitch: "Je suis passé au français. Comment puis-je vous aider aujourd'hui ?",
      thankYou: "De rien ! Y a-t-il autre chose que je puisse vous aider concernant votre projet ou pour trouver des freelances ?"
    }
  };

  constructor(private translate: TranslateService) {
    this.currentLanguage = this.translate.currentLang as 'en' | 'fr' || 'en';
  }

  ngOnInit(): void {
    // Add initial greeting message
    this.addBotMessage(this.botResponses[this.currentLanguage].greeting);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (!this.currentMessage.trim()) return;

    // Add user message
    this.addUserMessage(this.currentMessage);
    const userMessage = this.currentMessage.toLowerCase();
    this.currentMessage = '';

    // Simulate typing
    this.isTyping = true;

    // Generate bot response after delay
    setTimeout(() => {
      this.isTyping = false;
      this.generateBotResponse(userMessage);
    }, 1500);
  }

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

  private addBotMessage(text: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: false,
      timestamp: new Date(),
      language: this.currentLanguage
    };
    this.messages.push(message);
  }

  private generateBotResponse(userMessage: string): void {
    const responses = this.botResponses[this.currentLanguage];
    let botResponse = responses.default;

    // Simple keyword matching for demonstration
    if (userMessage.includes('project') || userMessage.includes('projet')) {
      botResponse = responses.projectHelp;
    } else if (userMessage.includes('freelancer') || userMessage.includes('freelance')) {
      botResponse = responses.freelancerHelp;
    } else if (userMessage.includes('skill') || userMessage.includes('compétence') || userMessage.includes('technology') || userMessage.includes('technologie')) {
      botResponse = responses.skillsQuestion;
    } else if (userMessage.includes('budget') || userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('prix') || userMessage.includes('coût')) {
      botResponse = responses.budgetQuestion;
    } else if (userMessage.includes('timeline') || userMessage.includes('deadline') || userMessage.includes('délai') || userMessage.includes('quand')) {
      botResponse = responses.timelineQuestion;
    } else if (userMessage.includes('thank') || userMessage.includes('merci')) {
      botResponse = responses.thankYou;
    } else if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('bonjour') || userMessage.includes('salut')) {
      botResponse = responses.greeting;
    }

    this.addBotMessage(botResponse);
  }

  switchLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'en' ? 'fr' : 'en';
    this.translate.use(this.currentLanguage);
    
    // Add language switch message
    const responses = this.botResponses[this.currentLanguage];
    this.addBotMessage(responses.languageSwitch);
  }

  clearChat(): void {
    this.messages = [];
    this.addBotMessage(this.botResponses[this.currentLanguage].greeting);
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

  // Quick action methods
  sendQuickActionProject(): void {
    this.currentMessage = this.translate.instant('quickActionProject');
    this.sendMessage();
  }

  sendQuickActionFreelancer(): void {
    this.currentMessage = this.translate.instant('quickActionFreelancer');
    this.sendMessage();
  }

  sendQuickActionBudget(): void {
    this.currentMessage = this.translate.instant('quickActionBudget');
    this.sendMessage();
  }
}
