import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../services/components/loader.service';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {
    loading = false;

    constructor(private loaderService: LoaderService) { }

    ngOnInit() {
        this.loaderService.loading$.subscribe(loading => {
            this.loading = loading;
            
            const contentElement = document.querySelector('.content');
            
            if (contentElement) {
                if (loading) {
                    (contentElement as HTMLElement).style.overflow = 'hidden';
                } else {
                    (contentElement as HTMLElement).style.overflow = '';
                }
            }
        });
    }
}