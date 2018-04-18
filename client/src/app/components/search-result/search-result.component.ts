import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { IWSearchResults } from '../../models/datacontracts/wiki-results.interface';
import { IRelatedDocs } from '../../models/datacontracts/related-docs.interface';
import { SearchService } from '../../services/search.service';
import { RelatedDocService } from '../../services/related-doc.service';
import { PagerService } from '../../services/pager.service';
import { ArticleService } from '../../services/article.service';
import { SharedService } from '../../services/shared.service';
import { IArticle } from '../../models/datacontracts/article.interface';
import { Article } from '../../models/entities/article.entity';
import { saveAs } from 'file-saver'

@Component({
    selector: 'ss-search-result',
    templateUrl: './search-result.component.html',
    styleUrls: ['./search-result.component.css']
})

export class SearchResultComponent implements OnInit {
    search_results: ISearchResults = null;
    wiki_search_results: IWSearchResults = null;
    related_docs_results: IRelatedDocs = null;
    search_token = '';
    docid = '';
    pager: any = {};
    resultPerPage = 10;
    searchType = 'word2vec';
    articleUrl = 'http://sharesci.org/#/article/';

    constructor(private _pagerService: PagerService,
                private _searchService: SearchService,
                private _articleService: ArticleService,
                private _sharedService: SharedService, 
                private _route: ActivatedRoute,
                private _relatedDocService: RelatedDocService
                ) {

        _sharedService.searchType$
            .subscribe(searchType => {
                this.searchType = searchType;
            });

        _route.params
            .subscribe(params => {
                this.search_token = this._route.snapshot.params['term'];
                this._searchService.search(this.search_token, this.searchType)
                    .map(response => <ISearchResults>response)
                    .subscribe(
                        results => { this.showResults(results); this.setPage(1); },
                        error => console.log(error)
                    );
                this._searchService.wikiSearch(this.search_token, this.searchType)
                    .map(response => <ISearchResults>response)
                    .subscribe(
                        wikiresults => { this.showResults(wikiresults); },
                        error => console.log(error)
                    );
            });
    }

    ngOnInit() {
        this.search_token = this._route.snapshot.params['term'];
        this._searchService.search(this.search_token, this.searchType)
            .map (response => <ISearchResults>response)
            .subscribe (
                results => { this.showResults(results); this.setPage(1);},
                error => console.log(error)
            );
        this._searchService.wikiSearch(this.search_token, this.searchType)
            .map (response => <IWSearchResults>response)
            .subscribe (
                wikiresults => { this.wikiResults(wikiresults);},
                error => console.log(error)
            );
    }
    
    private getRelatedDocs(docid: string, offset: 0, maxResults: 10) {
        this._relatedDocService.getRelatedDocs(this.docid, offset, maxResults)
            .map(response => <IRelatedDocs>response)
            .subscribe(
            	results => { this.showResults(results); },
            	error => console.log(error)
            );
    }
    
    private showResults(search_results: ISearchResults) {
        search_results.results.forEach(obj => {
            obj['url'] = this.articleUrl + obj._id;
        });
        this.search_results = search_results;
    }

    private wikiResults(wiki_search_results: IWSearchResults) {
        this.wiki_search_results = wiki_search_results;
    }

    private pageClicked(page: number) {
        this.setPage(page);
        let maxResults = 0;

        if (this.resultPerPage * page > this.search_results.numResults) {
            maxResults = this.search_results.numResults % this.resultPerPage;
        }
        else {
            maxResults = 10;
        }
        this.search(this.pager.startIndex, maxResults);
    }

    private setPage(page: number) {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pager = this._pagerService.getPager(this.search_results.numResults, page, this.resultPerPage);
    }

    private search(offset: number, maxResults: number) {
        this._searchService.search(this.search_token, this.searchType, offset, maxResults)
            .map(response => <ISearchResults>response)
            .subscribe(
            	results => { this.showResults(results); },
            	error => console.log(error)
            );

        this._searchService.wikiSearch(this.search_token, this.searchType, offset, maxResults)
            .map(response => <IWSearchResults>response)
            .subscribe(
             wikiresults => { this.wikiResults(wikiresults); },
             error => console.log(error)
      );
    }

    private viewPdf(id: string, download: boolean, title?: string) {
        this._articleService.getArticle(id, true)
            .subscribe(
            results => {
                if (download) {
                    saveAs(results, title + ".pdf");
                    return;
                }
                var fileURL = URL.createObjectURL(results);
                window.open(fileURL);
            },
            error => console.log(error)
            );
    }
}