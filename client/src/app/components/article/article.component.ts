import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { ArticleService } from '../../services/article.service'
import { IArticle } from '../../models/datacontracts/article.interface'
import { Article } from '../../models/entities/article.entity'
import { saveAs } from 'file-saver'
import { CommonModule } from '@angular/common';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { RelatedDocService } from '../../services/related-doc.service';
import { PagerService } from '../../services/pager.service';


@Component({
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.css']
})

export class ArticleComponent implements OnInit {
    related_docs: ISearchResults = null;
    docId = '';
    article: Article = null;

    constructor(private _sharedService: SharedService, 
                private _route: ActivatedRoute,
                private _relatedDocService: RelatedDocService,
                private _articleService: ArticleService) { 

                }

    ngOnInit() {
        this.docId = this._route.snapshot.params['id'];

        this._articleService.getArticle(this.docId, false)
            .map(response => <IArticle>response)
            .subscribe(
                results => this.showArticleData(results),
                error => console.log(error)
            );

        this._relatedDocService.getRelatedDocs(this.docId)
            .map (response => <ISearchResults>response)
            .subscribe (
                results => { this.showRelatedDocs(results);},
                error => console.log(error)
            );
    }

    showArticleData(articleWrapper: IArticle) {
        if (articleWrapper.errno == 0) {
            this.article = articleWrapper.articleJson;
        }
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

    private showRelatedDocs(related_docs: ISearchResults) {
        this.related_docs = related_docs;
    }

}
