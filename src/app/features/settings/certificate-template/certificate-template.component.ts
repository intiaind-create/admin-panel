import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { CertificateService } from '../services/certificate.service';
import { CertificateTemplate } from '../types/certificate.types';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-certificate-template',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, FileUploadModule, ToastModule],
    providers: [MessageService],
    templateUrl: './certificate-template.component.html'
})
export class CertificateTemplateComponent {
    
    currentTemplate$: Observable<CertificateTemplate | null>;
    showPreview = false;
    previewUrl: SafeResourceUrl | null = null;

    constructor(
        private certificateService: CertificateService,
        private messageService: MessageService,
        private sanitizer: DomSanitizer
    ) {
        this.currentTemplate$ = this.certificateService.getCurrentTemplate();
    }

    // This method is now triggered when a file is SELECTED
    onSelect(event: { files: File[] }) {
        const file = event.files[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                // Read the file as a Base64 data URL and sanitize it
                this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
                this.showPreview = true;
            };
            reader.readAsDataURL(file);
        } else {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Invalid File', 
                detail: 'Please select a PDF file.' 
            });
        }
    }

    // This method would be called by a new "Confirm Upload" button
    confirmUpload() {
        // Here you would take the selected file and send it to your service
        console.log('Confirming upload...');
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'New template has been saved.' 
        });
        this.closePreview();
    }

    closePreview() {
        this.showPreview = false;
        this.previewUrl = null;
    }
}