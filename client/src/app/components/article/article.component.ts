import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { ArticleService } from '../../services/article.service'
import { IArticle } from '../../models/datacontracts/article.interface'
import { Article } from '../../models/entities/article.entity'
import { IComments } from '../../models/datacontracts/comments.interface'
import { Comment } from '../../models/entities/comment.entity'
import { saveAs } from 'file-saver'
import { CommonModule } from '@angular/common';
import { ISearchResults } from '../../models/datacontracts/search-results.interface';
import { RelatedDocService } from '../../services/related-doc.service';
import { PagerService } from '../../services/pager.service';
import { CommentsService } from '../../services/comments.service';


@Component({
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.css']
})

export class ArticleComponent implements OnInit {

    related_docs: ISearchResults = null;
    docId = '';
    maxResults = 5;
    article: Article = null;
    articleComments: IComments = null;
    comment: string = '';
    user: string = '';
    error = '';

    constructor(private _sharedService: SharedService, 
                private _route: ActivatedRoute,
                private _relatedDocService: RelatedDocService,
                private _articleService: ArticleService,
                private _commentsService: CommentsService) {
        
        this.user = localStorage.getItem("currentUser") || "";

    }

    ngOnInit() {
        this.docId = this._route.snapshot.params['id'];

        this._articleService.getArticle(this.docId, false)
            .map(response => <IArticle>response)
            .subscribe(
                results => this.showArticleData(results),
                error => console.log(error)
            );
        
        this._relatedDocService.getRelatedDocs(this.docId, this.maxResults)
            .map (response => <ISearchResults>response)
            .subscribe (
                results => { this.showRelatedDocs(results);},
                error => console.log(error)
            );
        
        this._commentsService.getComments(this.docId)
            .map (response => <IComments>response)
            .subscribe (
                results => { this.showComments(results); },
                error => { console.log(error); }
            );
    }

    showArticleData(articleWrapper: IArticle) {
        if (articleWrapper.errno == 0) {
            this.article = articleWrapper.articleJson;
        }
    }

    showComments(commentsResults: IComments) {
        if (commentsResults.errno == 0) {
            this.articleComments = commentsResults;
        }
    }

    updateComments(newComment) {
        this.articleComments.results.unshift(newComment.results);
    }

    postComment() {
        if (this.user) {
            this._commentsService.postComment(this.user, this.comment, this.docId)
            .subscribe(
                results => { this.updateComments(results); },
                error => { console.log(error); }
            );
        } else {
            this.error = "You must be logged in to post comments.";
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
