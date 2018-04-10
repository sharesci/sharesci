import { Injectable } from '@angular/core'
import { Observable } from 'rxjs';
import { Subject }    from 'rxjs/Subject';
import { ISearchResults } from '../models/datacontracts/search-results.interface'

@Injectable()
export class SharedService {

    isUserLoggedIn = false; 
    
    constructor() {
		var userId: string = localStorage.getItem("currentUser");
		if (userId) {
			this.isUserLoggedIn = true;
		}
    }

    private isUserLoggedInSource = new Subject<boolean>();
    private searchTypeChangedSource = new Subject<string>();

    isUserLoggedIn$ = this.isUserLoggedInSource.asObservable();
    searchType$ = this.searchTypeChangedSource.asObservable();

    setLoginStatus(isUserLoggedIn: boolean) {
		this.isUserLoggedIn = isUserLoggedIn;
        this.isUserLoggedInSource.next(isUserLoggedIn);
    }

    setSearchType(searchType: string) {
        this.searchTypeChangedSource.next(searchType);
    }
}
