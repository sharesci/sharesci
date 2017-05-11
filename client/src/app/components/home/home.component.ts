import { Component } from '@angular/core';
import { ISearchResults } from '../../entities/search-results.interface.js';
import { SearchService } from '../../services/search.service.js';

@Component({
    moduleId: module.id,
    selector: 'ss-search',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.css']
})

export class HomeComponent {
    searchToken: string = '';
    logo: string = 'src/media/logo.jpg';

    constructor(private _searchService: SearchService){ }
}