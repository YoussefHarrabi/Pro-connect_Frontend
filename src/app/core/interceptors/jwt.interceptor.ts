import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    console.log('🔍 JWT Interceptor: Processing request to', request.url);
    
    const token = this.authService.getToken();
    console.log('🔑 JWT Interceptor: Token from AuthService:', token ? 'Found' : 'Not found');
    
    if (token) {
      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ JWT Interceptor: Added Authorization header');
      console.log('📤 Request headers:', clonedRequest.headers.keys());
      
      return next.handle(clonedRequest);
    } else {
      console.log('⚠️ JWT Interceptor: No token found, proceeding without Authorization header');
      return next.handle(request);
    }
  }
}