import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@/layout/service/layout.service';
import { AppBreadcrumb } from '../app.breadcrumb';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, AppBreadcrumb],
    templateUrl: 'app.topbar.component.html'
})
export class AppTopbar {
    @ViewChild('menubutton') menuButton!: ElementRef;

    constructor(public layoutService: LayoutService) {}

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onProfileButtonClick() {
        this.layoutService.showProfileSidebar();
    }
}   