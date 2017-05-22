import { Component } from '@angular/core';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { SearchService } from '../../services/search.service';

@Component({
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent {
    searchToken: string = '';
    logo: string = 'assets/logo.jpg';

    constructor(private _searchService: SearchService){ }
}