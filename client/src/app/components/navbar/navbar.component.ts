import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service'
import { SearchService } from '../../services/search.service';
import { SharedService } from '../../services/shared.service';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

@Component({
    selector: 'ss-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})

export class NavbarComponent {
    ishome: boolean = false;
    hideLoginBtn: boolean = false;
    searchToken: string = '';
    user: string = '';
    searchTypes: string[] = ['Word2vec', 'Paragraph Vector', 'TF-IDF', 'Augmented TF-IDF'];
    selectedSearchType = this.searchTypes[0];

    constructor(private _authenticationService: AuthenticationService,
                private _router: Router,
                private _searchService: SearchService, 
                private _sharedService: SharedService) {

        _sharedService.isUserLoggedIn$
            .subscribe(isUserLoggedIn => this.setUser(isUserLoggedIn));
            
        _router.events
            .filter(event => event instanceof NavigationStart)
            .subscribe((event:NavigationStart) => {
                this.toggleSearchBox(event.url);
        });
        
        this.user = localStorage.getItem("currentUser") || "";
        this.hideLoginBtn = !!this.user;
        this._sharedService.setSearchType(this.selectedSearchType);
    }

    setUser(isUserLoggedIn: boolean) {
        this.hideLoginBtn = isUserLoggedIn;
        this.user = localStorage.getItem("currentUser") || "";
    }

    toggleSearchBox(currenturl: string){
        if(currenturl == "/home" || currenturl == "/"){
            this.ishome = true;
        }
        else{
            this.ishome = false;
        }
    }

    toggleLoginBtn() {
        if(this.user) {
            this.hideLoginBtn = true;
        }
        else {
            this.user = "";
            this.hideLoginBtn = false;
        }
    }

    logout() {
        this._authenticationService.logout()
            .subscribe(null, null, () => {
                localStorage.removeItem('currentUser');
                this._sharedService.setLoginStatus(false);
        })
    }

    onChange() {
        this._sharedService.setSearchType(this.selectedSearchType);
    }
}