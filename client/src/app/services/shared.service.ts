import { Injectable } from '@angular/core'
import { Observable } from 'rxjs';
import { Subject }    from 'rxjs/Subject';
import { ISearchResults } from '../models/datacontracts/search-results.interface'

@Injectable()
export class SharedService {
    
    constructor() { }

    private isUserLoggedInSource = new Subject<boolean>();

    isUserLoggedIn$ = this.isUserLoggedInSource.asObservable();

    setLoginStatus(isUserLoggedIn: boolean) {
        this.isUserLoggedInSource.next(isUserLoggedIn);
    }
}