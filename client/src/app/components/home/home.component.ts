import { Component } from '@angular/core';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { SharedService } from '../../services/shared.service';
import { UserRecService } from '../../services/user-rec.service';

@Component({
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent {
    searchToken: string = '';
    logo: string = 'assets/logo_clean.png';
    searchEngine: string;
	userRec: ISearchResults;
	isUserLoggedIn: boolean = false;

    constructor(private _sharedService: SharedService, private _userRecService: UserRecService){
		this.searchEngine = 'word2vec';
		this.userRec = JSON.parse(localStorage.getItem("userRec"));
		this.isUserLoggedIn = this._sharedService.isUserLoggedIn;
		
        _sharedService.searchType$
            .subscribe(searchEngine => this.searchEngineCallBack(searchEngine));
        
		_sharedService.isUserLoggedIn$
            .subscribe(loginStatus => this.loginStatusCallBack(loginStatus));
	 }

	
    ngOnInit() {
		if (this.isUserLoggedIn && this.userRec == null) {
			var userId = localStorage.getItem("currentUser");
			this._userRecService.getUserRec(userId, this.searchEngine)
				.map (response => <ISearchResults>response)
				.subscribe (
					results => { this.getUserRecCallBack(results) },
					error => console.log(error)
				);
		}
    }

	private searchEngineCallBack(engine: string) {	
    	this.searchEngine = engine;
		this.userRec = null;
	}

	private loginStatusCallBack(loginStatus: boolean) {
		this.isUserLoggedIn = loginStatus;	
		if(!loginStatus) {
			this.userRec = null;	
		}
	}

    private getUserRecCallBack(userRec: ISearchResults) {
        this.userRec = userRec;
    }
}
