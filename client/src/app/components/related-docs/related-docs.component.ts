import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IRelatedDocs } from '../../models/datacontracts/related-docs.interface';
import { RelatedDocService } from '../../services/related-doc.service';
import { PagerService } from '../../services/pager.service';
import { ArticleService } from '../../services/article.service';
import { SharedService } from '../../services/shared.service';
import { IArticle } from '../../models/datacontracts/article.interface';
import { Article } from '../../models/entities/article.entity';
import { saveAs } from 'file-saver'

@Component({
    selector: 'ss-search-result',
    templateUrl: './related-docs.component.html',
    styleUrls: ['./related-docs.component.css']
})

export class RelatedDocsComponent implements OnInit {
    related_docs_results: IRelatedDocs = null;
    docid = '';
    pager: any = {};
    resultPerPage = 10;
    searchType = 'word2vec';
    articleUrl = 'http://sharesci.org/#/article/';

    constructor(private _pagerService: PagerService,
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
                this.docid = this._route.snapshot.params['docid'];
                this._relatedDocService.getRelatedDocs(this.docid)
                    .map(response => <IRelatedDocs>response)
                    .subscribe(
                        results => { this.showResults(results); this.setPage(1); },
                        error => console.log(error)
                    );
            });
    }

    ngOnInit() {
        this.docid = this._route.snapshot.params['docid'];
        this._relatedDocService.getRelatedDocs(this.docid)
            .map (response => <IRelatedDocs>response)
            .subscribe (
                results => { this.showResults(results); this.setPage(1);},
                error => console.log(error)
            );
    }

    private showResults(related_docs: IRelatedDocs) {
        related_docs.results.forEach(obj => {
            obj['url'] = this.articleUrl + obj._id;
        });

        this.related_docs_results = related_docs;
    }

    private pageClicked(page: number) {
        this.setPage(page);
        let maxResults = 0;

        if (this.resultPerPage * page > this.related_docs_results.numResults) {
            maxResults = this.related_docs_results.numResults % this.resultPerPage;
        }
        else {
            maxResults = 10;
        }
        this.getRelatedDocs(this.pager.startIndex, maxResults);
    }

    private setPage(page: number) {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pager = this._pagerService.getPager(this.related_docs_results.numResults, page, this.resultPerPage);
    }

    private getRelatedDocs(offset: number, maxResults: number) {
        this._relatedDocService.getRelatedDocs(this.docid, offset, maxResults)
            .map(response => <IRelatedDocs>response)
            .subscribe(
                results => { this.showResults(results); },
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