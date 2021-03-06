import { Injectable } from '@angular/core'
import { Http, Response, URLSearchParams } from '@angular/http'
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import 'rxjs/add/operator/map';

@Injectable()
export class RelatedDocService {

    private _relatedDocsUrl = this._config.apiUrl + '/related-docs?';

    constructor(private _http: Http, private _config: AppConfig) { }

    getRelatedDocs(docId: string, offset = 0, maxResult = 10, engine = 'mongo' ): Observable<any> {
        let queryString = new URLSearchParams();
        queryString.append('docid', docId);
        queryString.append('offset', offset.toString());
        queryString.append('maxResults', maxResult.toString());
        //queryString.append('engine', engine);

        return this._http.get(this._relatedDocsUrl + queryString.toString())
            .map((response: Response) => response.json());
    }

}
