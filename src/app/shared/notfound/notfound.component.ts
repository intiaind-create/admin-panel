import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notfound-container">
      <div class="notfound-content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Page Not Found</h2>
        <p class="error-message">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <a routerLink="/dashboard" class="back-button">
          Go Back to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [`
    .notfound-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .notfound-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    }

    .error-code {
      font-size: 5rem;
      font-weight: 900;
      color: #667eea;
      margin: 0;
      line-height: 1;
    }

    .error-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0.5rem 0 1rem;
    }

    .error-message {
      color: #6b7280;
      margin-bottom: 2rem;
      font-size: 1rem;
    }

    .back-button {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: background 0.3s ease;
    }

    .back-button:hover {
      background: #5568d3;
    }
  `]
})
export class NotFoundComponent {}
