import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { ArticleService } from '../../services/article.service'
import { IArticle } from '../../models/datacontracts/article.interface'
import { Article } from '../../models/entities/article.entity'
import { saveAs } from 'file-saver'
import { CommonModule } from '@angular/common';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { SearchService } from '../../services/search.service';
import { PagerService } from '../../services/pager.service';

@Component({
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.css']
})

export class ArticleComponent implements OnInit {
    search_results: ISearchResults = null;
    search_token = '';
    searchType = 'word2vec';
    pager: any = {};
    resultPerPage = 10;

    constructor(private _pagerService: PagerService,
                private _sharedService: SharedService, 
                private _route: ActivatedRoute,
                private _searchService: SearchService,
                private _articleService: ArticleService) { 

                    _route.params
                    .subscribe(params => {
                        this.search_token = this._route.snapshot.params['term'];
                        this._searchService.search(this.search_token, this.searchType)
                            .map(response => <ISearchResults>response)
                            .subscribe(
                                results => { this.showResults(results); this.setPage(1) },
                                error => console.log(error)
                            );
                        });

                

                    
                }

    article: Article = null

        

    ngOnInit() {
        this._articleService.getArticle(this._route.snapshot.params['id'], false)
            .map(response => <IArticle>response)
            .subscribe(
                results => this.showArticleData(results),
                error => console.log(error)
            );
            this.search_token = this._route.snapshot.params['term'];
            this._searchService.search(this.search_token, this.searchType)
                .map (response => <ISearchResults>response)
                .subscribe (
                    results => { this.showResults(results); this.setPage(1);},
                    error => console.log(error)
                );
    }

    showArticleData(articleWrapper: IArticle) {
        if (articleWrapper.errno == 0) {
            this.article = articleWrapper.articleJson;
        }
    }

    private showResults(search_results: ISearchResults) {
        this.search_results = search_results;
    }

    private search(offset: number, maxResults: number) {
        this._searchService.search(this.search_token, this.searchType, offset, maxResults)
            .map(response => <ISearchResults>response)
            .subscribe(
            results => { this.showResults(results); },
            error => console.log(error)
            );
    }

    private pageClicked(page: number) {
        this.setPage(page);
        let maxResults = 0;

        if (this.resultPerPage * page > this.search_results.numResults) {
            maxResults = this.search_results.numResults % this.resultPerPage
        }
        else {
            maxResults = 10
        }
        this.search(page, maxResults);
    }

    private setPage(page: number) {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pager = this._pagerService.getPager(this.search_results.numResults, page);
    }

    viewPdf(download: boolean) {
        this._articleService.getArticle(this.article._id, true)
            .subscribe(
            results => {
                if (download) {
                    saveAs(results, this.article.title + ".pdf");
                    return;
                }
                var fileURL = URL.createObjectURL(results);
                window.open(fileURL);
            },
            error => console.log(error)
            );
    }

}
