import { Injectable } from '@angular/core'
import { Http, Response, URLSearchParams, ResponseContentType } from '@angular/http'
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import 'rxjs/add/operator/map';

@Injectable()
export class CommentsService {

    constructor(private _http: Http, private _config: AppConfig) { }

    getComments(id: string): Observable<any> {
        return this._http.get(`${this._config.apiUrl}/articles/${id}/comments`)
            .map((response: Response) => response.json());
    }

    getUserComments(username: string): Observable<any> {
        return this._http.get(`${this._config.apiUrl}/users/${username}/comments`)
            .map((response: Response) => response.json());
    }

    postComment(username: string, comment: string, id: string): Observable<any> {
        let data = new URLSearchParams();
        data.append('username', username);
        data.append('comment', comment);
        data.append('articleId', id);

        return this._http.post(`${this._config.apiUrl}/articles/${id}/comments`, data)
            .map((response: Response) => { return response.json(); })
    }
}