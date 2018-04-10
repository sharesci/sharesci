import { Injectable } from '@angular/core'
import { Http, Response, URLSearchParams } from '@angular/http'
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import 'rxjs/add/operator/map';

@Injectable()
export class UserRecService {
    
    constructor(private _http: Http, private _config: AppConfig) { }

    private _userRecUrl = this._config.apiUrl + '/userRecommendations?';
    //private _userRecUrl = 'http://137.148.142.215/api/v1/userRecommendations?';

    getUserRec(userId: string, engine: string, offset = 0, maxResult = 5): Observable<any> {
        let queryString = new URLSearchParams();
        queryString.append('userid', userId);
        queryString.append('offset', offset.toString());
        queryString.append('maxResults', maxResult.toString());
        queryString.append('engine', engine);    

        let observ = this._http.get(this._userRecUrl + queryString.toString())
            .map((response: Response) => response.json());

        observ.subscribe(
            data => {
                if (data.errno == "0") {
					localStorage.setItem("userRec", JSON.stringify(data));
                }
            },
            error => console.log(error)
        )
        return observ;
    }

}
