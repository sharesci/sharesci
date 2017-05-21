import { Injectable } from '@angular/core'
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http'
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config.js';
import { User } from '../models/entities/user.entity.js';
import 'rxjs/add/operator/map';

@Injectable()
export class AccountService {

    constructor(private _http: Http, private _config: AppConfig) { }

    create(user: User): Observable<any> {
        let data = new URLSearchParams();

        data.append('username', user.username);
        data.append('password', user.password);
        data.append('firstname', user.firstname);
        data.append('lastname', user.lastname);
        data.append('institution', user.institution);
        data.append('self_bio', user.self_bio);        

        return this._http.post(`${this._config.apiUrl}/users`, data)
            .map((response: Response) => response.json());
    }

    getUserInfo(username: string): Observable<any> {

        return this._http.get(`${this._config.apiUrl}/users/${username}`)
            .map((response: Response) => response.json());
    }

    updateUserInfo(user: User): Observable<any> {
        let data = new URLSearchParams();
        data.append('firstname', user.firstname);
        data.append('lastname', user.lastname);
        data.append('self_bio', user.self_bio);
        data.append('institution', user.institution);

        return this._http.post(`${this._config.apiUrl}/user`, data)
            .map((response: Response) => { return response.json(); })
    }

    getUserEmail(username: string) {

        return this._http.get(`${this._config.apiUrl}/users/${username}/emails`)
            .map((response: Response) => response.json());
    }

    addUserEmail(username: string, email: string): Observable<any> {
        let data = new URLSearchParams();
        data.append('email', email);        

        return this._http.post(`${this._config.apiUrl}/user/emails`, data)
            .map((response: Response) => { return response.json(); })
    }

    deleteUserEmail(username: string, email: string): Observable<any> {
        let data = new URLSearchParams();
        data.append('email', email);

        return this._http.delete(`${this._config.apiUrl}/user/emails`, new RequestOptions({body: data}))
            .map((response: Response) => { return response.json(); });
    }

    updateUserPassword(username: string, curPassword: string, newPassword: string): Observable<any> {
        let data = new URLSearchParams();
        data.append('curPassword', curPassword);
        data.append('newPassword', newPassword);

        return this._http.post(`${this._config.apiUrl}/user/password`, data)
            .map((response: Response) => { return response.json(); })
    }
}
