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
    searchType: string;
	userRec: ISearchResults;
	isUserLoggedIn: boolean = false;
	searchTypes: string[] = ['Word2vec', 'Paragraph Vector', 'TF-IDF', 'Augmented TF-IDF'];
    selectedSearchType = this.searchTypes[0];

    constructor(private _sharedService: SharedService, private _userRecService: UserRecService){
		this.userRec = JSON.parse(localStorage.getItem("userRec"));
		this.isUserLoggedIn = this._sharedService.isUserLoggedIn;
		this._sharedService.setSearchType(this.selectedSearchType);
		this.searchType = this._sharedService.searchType;
		
        _sharedService.searchType$
            .subscribe(searchType => this.searchTypeCallBack(searchType));
        
		_sharedService.isUserLoggedIn$
            .subscribe(loginStatus => this.loginStatusCallBack(loginStatus));
	 }

	
    ngOnInit() {
		if (this.isUserLoggedIn && this.userRec == null) {
			var userId = localStorage.getItem("currentUser");
			this._userRecService.getUserRec(userId, this.searchType)
				.map (response => <ISearchResults>response)
				.subscribe (
					results => { this.getUserRecCallBack(results) },
					error => console.log(error)
				);
		}
    }

	private searchTypeCallBack(engine: string) {	
    	this.searchType = engine;
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

    onChange() {
        this._sharedService.setSearchType(this.selectedSearchType);
    }
}
