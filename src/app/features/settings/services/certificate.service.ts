// src/app/features/settings/services/certificate.service.ts

import { Injectable } from '@angular/core';
import { CertificateTemplate } from '../types/certificate.types';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CertificateService {

    // Use a BehaviorSubject to hold the state of the current template
    private _currentTemplate = new BehaviorSubject<CertificateTemplate | null>(null);
    currentTemplate$ = this._currentTemplate.asObservable();

    constructor() {
        // Initialize with some mock data for the current template
        this._currentTemplate.next({
            id: 'cert-main-01',
            fileName: 'Apollo_Completion_Certificate_v1.pdf',
            uploadDate: new Date().toISOString(),
            fileUrl: '/path/to/mock/certificate.pdf'
        });
    }

    getCurrentTemplate(): Observable<CertificateTemplate | null> {
        return this.currentTemplate$;
    }

    // Simulates uploading a new file and replacing the old one
    uploadNewTemplate(file: File): Promise<CertificateTemplate> {
        const newTemplate: CertificateTemplate = {
            id: 'cert-main-01', // ID is constant since we're replacing
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            fileUrl: URL.createObjectURL(file) // Create a temporary local URL for preview
        };

        this._currentTemplate.next(newTemplate);
        console.log('Uploaded new certificate template:', newTemplate);
        return Promise.resolve(newTemplate);
    }
}